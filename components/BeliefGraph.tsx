'use client'

import { useEffect, useRef } from 'react'
import useSWR from 'swr'
import type { Domain, InferenceResponse, QueryRequest, GraphNode, GraphEdge } from '@/lib/types'
import { fetchInferenceQuery } from '@/lib/api'
import { MOCK } from '@/lib/mockData'

type MockKey = keyof typeof MOCK
function mockFor(domain: Domain) {
  return (MOCK as Record<string, typeof MOCK[MockKey] | undefined>)[domain]
}

const POLL = 30_000

// D3 augmented node type
interface SimNode extends GraphNode {
  x?: number
  y?: number
  vx?: number
  vy?: number
  fx?: number | null
  fy?: number | null
}

// D3 augmented link type
interface SimLink {
  source: SimNode | string
  target: SimNode | string
  probability: number
  status: string
}

// ── Colours matching the HTML reference ─────────────────────────────────────

const C = {
  green:       '#00ff41',
  greenDim:    '#7fff8f',
  greenDark:   '#009922',
  greenFaint:  '#004a15',
  amber:       '#ffb300',
  redDim:      '#991500',
  border:      '#007722',
  borderFaint: '#00441a',
  bg:          '#000000',
  textDim:     '#7fff8f',
}

function nodeStroke(status: GraphNode['status']): string {
  switch (status) {
    case 'target':    return C.green
    case 'established': return C.border
    case 'exploring': return C.amber
    case 'weak':      return C.borderFaint
  }
}

function nodeFill(_status: GraphNode['status']): string {
  return C.bg
}

function nodeTextColor(status: GraphNode['status']): string {
  switch (status) {
    case 'target':    return C.green
    case 'established': return C.greenDim
    case 'exploring': return C.amber
    case 'weak':      return C.greenFaint
  }
}

function edgeStroke(status: string): string {
  if (status === 'strong')  return C.greenDim
  if (status === 'explore') return C.amber
  return C.borderFaint
}

function edgeWidth(status: string): number {
  if (status === 'strong')  return 1.5
  if (status === 'explore') return 1
  return 1
}

function edgeDash(status: string): string {
  if (status === 'explore') return '5,4'
  if (status === 'weak')    return '3,5'
  return ''
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  domain: Domain
  /** Target variable for the inference query. Defaults to 'price_up'. */
  targetVariable?: string
}

export default function BeliefGraph({ domain, targetVariable = 'price_up' }: Props) {
  // Use mock candidate id when available; undefined for domains without mocks
  // (e.g. 'mr') — the API accepts candidate_id as optional.
  const dominantId = mockFor(domain)?.status.dominant_hypothesis.candidate_id

  const req: QueryRequest = {
    domain,
    target_variable: targetVariable,
    candidate_id: dominantId,
    aggregation: 'weighted_avg',
  }

  const { data, error } = useSWR<InferenceResponse>(
    ['inference-query', req],
    fetchInferenceQuery,
    { refreshInterval: POLL, revalidateOnFocus: false },
  )

  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !data) return

    // Lazy-load d3 only on client
    let cancelled = false

    async function render() {
      const d3 = await import('d3')
      if (cancelled || !svgRef.current || !data) return

      const el = svgRef.current
      const W = el.clientWidth  || 520
      const H = el.clientHeight || 300

      const svg = d3.select(el)
      svg.selectAll('*').remove()

      // ── Defs: arrowhead markers ──────────────────────────────────────────
      const defs = svg.append('defs')

      const markers: { id: string; color: string }[] = [
        { id: 'arr-strong',  color: C.greenDim },
        { id: 'arr-explore', color: C.amber },
        { id: 'arr-weak',    color: C.borderFaint },
      ]

      for (const m of markers) {
        defs.append('marker')
          .attr('id', m.id)
          .attr('markerWidth', 6)
          .attr('markerHeight', 6)
          .attr('refX', 5)
          .attr('refY', 3)
          .attr('orient', 'auto')
          .append('path')
          .attr('d', 'M0,0 L6,3 L0,6 Z')
          .attr('fill', m.color)
          .attr('opacity', 0.8)
      }

      // Glow filter for target node
      const filt = defs.append('filter').attr('id', 'glow-target')
      filt.append('feGaussianBlur').attr('stdDeviation', 2).attr('result', 'b')
      const merge = filt.append('feMerge')
      merge.append('feMergeNode').attr('in', 'b')
      merge.append('feMergeNode').attr('in', 'SourceGraphic')

      // ── Prepare simulation data (deep-clone to avoid mutating SWR cache) ──
      const nodes: SimNode[] = data.nodes.map(n => ({ ...n }))
      const nodeById = new Map(nodes.map(n => [n.id, n]))

      const links: SimLink[] = data.edges.map(e => ({
        source: nodeById.get(e.source) ?? e.source,
        target: nodeById.get(e.target) ?? e.target,
        probability: e.probability,
        status: e.status,
      }))

      // ── Force simulation ──────────────────────────────────────────────────
      const manyNodes = data.nodes.length >= 7
      const sim = d3.forceSimulation<SimNode>(nodes)
        .force('link',
          d3.forceLink<SimNode, SimLink>(links)
            .id(d => d.id)
            .distance(manyNodes ? 100 : 130)
            .strength(0.7)
        )
        .force('charge', d3.forceManyBody<SimNode>().strength(manyNodes ? -220 : -320))
        .force('center', d3.forceCenter(W / 2, H / 2))
        .force('collision', d3.forceCollide<SimNode>(manyNodes ? 40 : 52))
        .alphaDecay(0.04)

      // ── Edge group ───────────────────────────────────────────────────────
      const linkG = svg.append('g').attr('class', 'links')

      const linkLines = linkG.selectAll('line')
        .data(links)
        .enter()
        .append('line')
        .attr('stroke', d => edgeStroke(d.status))
        .attr('stroke-width', d => edgeWidth(d.status))
        .attr('stroke-dasharray', d => edgeDash(d.status))
        .attr('marker-end', d => {
          if (d.status === 'strong')  return 'url(#arr-strong)'
          if (d.status === 'explore') return 'url(#arr-explore)'
          return 'url(#arr-weak)'
        })
        .attr('opacity', d => d.status === 'weak' ? 0.5 : 0.85)

      // Edge probability labels
      const linkLabels = svg.append('g').attr('class', 'link-labels')
        .selectAll('text')
        .data(links)
        .enter()
        .append('text')
        .attr('font-family', 'Share Tech Mono, monospace')
        .attr('font-size', 9)
        .attr('fill', d => {
          if (d.status === 'strong')  return C.textDim
          if (d.status === 'explore') return C.amber
          return C.borderFaint
        })
        .text(d => d.probability.toFixed(2))

      // ── Node group ───────────────────────────────────────────────────────
      const nodeG = svg.append('g').attr('class', 'nodes')

      const nodeGroups = nodeG.selectAll<SVGGElement, SimNode>('g')
        .data(nodes)
        .enter()
        .append('g')
        .attr('filter', d => d.status === 'target' ? 'url(#glow-target)' : null)

      // Shrink nodes slightly when there are many (e.g. 8 for MR domain)
      const NW = data.nodes.length >= 7 ? 58 : 76
      const NH = data.nodes.length >= 7 ? 32 : 40

      nodeGroups.append('rect')
        .attr('x', -NW / 2)
        .attr('y', -NH / 2)
        .attr('width', NW)
        .attr('height', NH)
        .attr('fill', d => d.status === 'target' ? '#001505' : nodeFill(d.status))
        .attr('stroke', d => nodeStroke(d.status))
        .attr('stroke-width', d => d.status === 'target' ? 1.5 : 1)
        .attr('stroke-dasharray', d => d.status === 'exploring' ? '4,3' : null)

      // Label line 1: node id / label
      nodeGroups.append('text')
        .attr('y', d => (d.observation || d.probability != null) ? -7 : 4)
        .attr('text-anchor', 'middle')
        .attr('font-family', 'Share Tech Mono, monospace')
        .attr('font-size', 9)
        .attr('fill', d => nodeTextColor(d.status))
        .text(d => d.label)

      // Label line 2: observation or probability
      nodeGroups.append('text')
        .attr('y', 9)
        .attr('text-anchor', 'middle')
        .attr('font-family', d => d.status === 'target' ? 'VT323, monospace' : 'Share Tech Mono, monospace')
        .attr('font-size', d => d.status === 'target' ? 22 : 8)
        .attr('fill', d => nodeTextColor(d.status))
        .text(d => {
          if (d.status === 'target' && d.probability != null) return d.probability.toFixed(2)
          if (d.observation) return d.observation
          if (d.probability != null && d.status !== 'target') return `p=${d.probability.toFixed(2)}`
          if (d.status === 'exploring') return 'exploring'
          return ''
        })

      // ── Legend ───────────────────────────────────────────────────────────
      const legendY = H - 16
      const legendItems = [
        { x: 20,  color: C.greenDim, dash: '',    label: 'established' },
        { x: 110, color: C.amber,    dash: '4,3', label: 'exploring' },
        { x: 196, color: C.borderFaint, dash: '3,4', label: 'weak' },
      ]

      for (const li of legendItems) {
        svg.append('line')
          .attr('x1', li.x).attr('y1', legendY)
          .attr('x2', li.x + 22).attr('y2', legendY)
          .attr('stroke', li.color)
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', li.dash)

        svg.append('text')
          .attr('x', li.x + 26).attr('y', legendY + 3)
          .attr('font-family', 'Share Tech Mono, monospace')
          .attr('font-size', 8)
          .attr('fill', C.borderFaint)
          .text(li.label)
      }

      // ── Tick ─────────────────────────────────────────────────────────────
      sim.on('tick', () => {
        // Clamp to SVG bounds
        nodes.forEach(n => {
          n.x = Math.max(NW / 2 + 4, Math.min(W - NW / 2 - 4, n.x ?? W / 2))
          n.y = Math.max(NH / 2 + 4, Math.min(H - 24, n.y ?? H / 2))
        })

        linkLines
          .attr('x1', d => (d.source as SimNode).x ?? 0)
          .attr('y1', d => (d.source as SimNode).y ?? 0)
          .attr('x2', d => (d.target as SimNode).x ?? 0)
          .attr('y2', d => (d.target as SimNode).y ?? 0)

        linkLabels
          .attr('x', d => {
            const sx = (d.source as SimNode).x ?? 0
            const tx = (d.target as SimNode).x ?? 0
            return (sx + tx) / 2
          })
          .attr('y', d => {
            const sy = (d.source as SimNode).y ?? 0
            const ty = (d.target as SimNode).y ?? 0
            return (sy + ty) / 2 - 4
          })

        nodeGroups.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`)
      })

      // Stop sim after it settles (saves CPU)
      sim.on('end', () => sim.stop())
    }

    render()

    return () => {
      cancelled = true
    }
  }, [data, domain])

  const label = error
    ? 'active_belief_graph · API ERROR'
    : data
      ? `active_belief_graph · ${data.candidate_id}`
      : 'active_belief_graph · loading…'

  return (
    <div className="panel belief-graph-panel">
      <div
        className="panel-label"
        style={error ? { color: 'var(--red)' } : undefined}
      >
        {label}
      </div>
      {error && (
        <div style={{ color: 'var(--red-dim)', fontSize: 10, padding: '8px 0 4px' }}>
          {String(error.message ?? '/v1/inference/query unreachable')}
        </div>
      )}
      <div className="graph-canvas">
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox="0 0 520 300"
          preserveAspectRatio="xMidYMid meet"
        />
      </div>
    </div>
  )
}
