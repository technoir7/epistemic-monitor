'use client'

import { useEffect, useRef } from 'react'
import useSWR from 'swr'
import type { Domain, CandidatesResponse, InferenceResponse, QueryRequest, GraphNode } from '@/lib/types'
import { fetchCandidates, fetchInferenceQuery } from '@/lib/api'
import { hypothesisShortLabel, isLagged, shortId, variableLabel } from '@/lib/labels'

const POLL = 30_000

// Layout runs in viewBox units; the browser scales the result to the panel.
// Measuring the element instead put phones' layout in the wrong space.
const W = 520
const H = 300
const LEGEND_Y = H - 16
// Lowest a node's bottom edge may sit, leaving the legend row clear.
const NODE_FLOOR = LEGEND_Y - 12

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

// ── Colours (SVG attributes cannot read the CSS tokens in globals.css) ────────

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

// Share Tech Mono is monospaced: about 0.6em per character.
function boxWidth(label: string, fontSize: number, min: number): number {
  return Math.max(min, Math.ceil(label.length * fontSize * 0.6) + 10)
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
  // No candidate_id: the engine then answers for the current dominant one.
  const req: QueryRequest = {
    domain,
    target_variable: targetVariable,
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
    let stopSim: (() => void) | undefined

    async function render() {
      const d3 = await import('d3')
      if (cancelled || !svgRef.current || !data) return

      const svg = d3.select(svgRef.current)
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
      // A domain may hold each signal's value last period ("X_prev"). Those
      // only matter where they explain something; unlinked, they double the
      // graph with noise.
      const linked = new Set(data.edges.flatMap(e => [e.source, e.target]))
      const nodes: SimNode[] = data.nodes
        .filter(n => !isLagged(n.label) || linked.has(n.id))
        .map(n => ({ ...n, label: variableLabel(n.label) }))
      const nodeById = new Map(nodes.map(n => [n.id, n]))

      const links: SimLink[] = data.edges.map(e => ({
        source: nodeById.get(e.source) ?? e.source,
        target: nodeById.get(e.target) ?? e.target,
        probability: e.probability,
        status: e.status,
      }))

      // ── Force simulation ──────────────────────────────────────────────────
      const manyNodes = nodes.length >= 7
      // Shrink nodes slightly when there are many (e.g. 8 for MR domain)
      const NH = manyNodes ? 32 : 40
      // The target carries a 22px number under its label, so it gets room for both.
      const height = (n: SimNode) => n.status === 'target' ? NH + 16 : NH
      const width = (n: SimNode) => boxWidth(n.label, 9, manyNodes ? 58 : 76)
      const sim = d3.forceSimulation<SimNode>(nodes)
        .force('link',
          d3.forceLink<SimNode, SimLink>(links)
            .id(d => d.id)
            .distance(manyNodes ? 100 : 130)
            .strength(0.7)
        )
        .force('charge', d3.forceManyBody<SimNode>().strength(manyNodes ? -220 : -320))
        .force('center', d3.forceCenter(W / 2, NODE_FLOOR / 2))
        // The canvas is wide and short; without a pull toward the middle row
        // the charge piles nodes along the top and bottom edges.
        .force('y', d3.forceY<SimNode>(NODE_FLOOR / 2).strength(0.08))
        .force('collision', d3.forceCollide<SimNode>(n => Math.max(width(n) / 2, manyNodes ? 40 : 52) + 4))
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

      // ── Node group ───────────────────────────────────────────────────────
      const nodeG = svg.append('g').attr('class', 'nodes')

      const nodeGroups = nodeG.selectAll<SVGGElement, SimNode>('g')
        .data(nodes)
        .enter()
        .append('g')
        .attr('filter', d => d.status === 'target' ? 'url(#glow-target)' : null)

      nodeGroups.append('rect')
        .attr('x', d => -width(d) / 2)
        .attr('y', d => -height(d) / 2)
        .attr('width', width)
        .attr('height', height)
        .attr('fill', d => d.status === 'target' ? '#001505' : nodeFill(d.status))
        .attr('stroke', d => nodeStroke(d.status))
        .attr('stroke-width', d => d.status === 'target' ? 1.5 : 1)
        .attr('stroke-dasharray', d => d.status === 'exploring' ? '4,3' : null)

      const secondLine = (d: SimNode): string => {
        if (d.status === 'target' && d.probability != null) return d.probability.toFixed(2)
        if (d.observation) return d.observation
        if (d.probability != null) return `p=${d.probability.toFixed(2)}`
        if (d.status === 'exploring') return 'exploring'
        return ''
      }
      const isTargetValue = (d: SimNode) => d.status === 'target' && d.probability != null

      // Line 1: the variable. Centred alone, raised when a second line follows.
      nodeGroups.append('text')
        .attr('y', d => isTargetValue(d) ? -10 : secondLine(d) ? -4 : 3)
        .attr('text-anchor', 'middle')
        .attr('font-family', 'Share Tech Mono, monospace')
        .attr('font-size', 9)
        .attr('fill', d => nodeTextColor(d.status))
        .text(d => d.label)

      // Line 2: observation, probability, or "exploring"
      nodeGroups.append('text')
        .attr('y', d => isTargetValue(d) ? 15 : 8)
        .attr('text-anchor', 'middle')
        .attr('font-family', d => isTargetValue(d) ? 'VT323, monospace' : 'Share Tech Mono, monospace')
        .attr('font-size', d => isTargetValue(d) ? 22 : 8)
        .attr('fill', d => nodeTextColor(d.status))
        .text(secondLine)

      // Edge probabilities go above the nodes, outlined in black, so a node
      // or a crossing edge never hides one.
      const linkLabels = svg.append('g').attr('class', 'link-labels')
        .selectAll('text')
        .data(links)
        .enter()
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('font-family', 'Share Tech Mono, monospace')
        .attr('font-size', 9)
        .attr('fill', d => {
          if (d.status === 'strong')  return C.textDim
          if (d.status === 'explore') return C.amber
          return C.borderFaint
        })
        .attr('stroke', C.bg)
        .attr('stroke-width', 3)
        .attr('stroke-linejoin', 'round')
        .attr('paint-order', 'stroke')
        .text(d => d.probability.toFixed(2))

      // ── Legend ───────────────────────────────────────────────────────────
      const legendY = LEGEND_Y
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
      const clamp = () => nodes.forEach(n => {
        n.x = Math.max(width(n) / 2 + 4, Math.min(W - width(n) / 2 - 4, n.x ?? W / 2))
        n.y = Math.max(height(n) / 2 + 4, Math.min(NODE_FLOOR - height(n) / 2, n.y ?? H / 2))
      })

      sim.on('tick', () => {
        // forceCollide treats boxes as circles and the clamp piles nodes
        // against the edges, so wide boxes still overlap; push apart any
        // pair that does, along the axis where they overlap least.
        clamp()
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i], b = nodes[j]
            const dx = (b.x ?? 0) - (a.x ?? 0), dy = (b.y ?? 0) - (a.y ?? 0)
            const ox = (width(a) + width(b)) / 2 + 6 - Math.abs(dx)
            const oy = (height(a) + height(b)) / 2 + 6 - Math.abs(dy)
            if (ox <= 0 || oy <= 0) continue
            const sy = dy < 0 ? -1 : 1
            // Against a top or bottom edge only a sideways push can stick.
            const yBlocked =
              (a.y ?? 0) - sy * oy / 2 < height(a) / 2 + 4 ||
              (b.y ?? 0) + sy * oy / 2 > NODE_FLOOR - height(b) / 2 ||
              (a.y ?? 0) - sy * oy / 2 > NODE_FLOOR - height(a) / 2 ||
              (b.y ?? 0) + sy * oy / 2 < height(b) / 2 + 4
            if (ox < oy || yBlocked) {
              const sx = dx < 0 ? -1 : 1
              a.x = (a.x ?? 0) - sx * ox / 2
              b.x = (b.x ?? 0) + sx * ox / 2
            } else {
              a.y = (a.y ?? 0) - sy * oy / 2
              b.y = (b.y ?? 0) + sy * oy / 2
            }
          }
        }
        clamp()

        linkLines
          .attr('x1', d => (d.source as SimNode).x ?? 0)
          .attr('y1', d => (d.source as SimNode).y ?? 0)
          .attr('x2', d => edgeEnd(d)[0])
          .attr('y2', d => edgeEnd(d)[1])

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

      // Stop the arrow at the target's border; at its centre the box hides it.
      function edgeEnd(d: SimLink): [number, number] {
        const s = d.source as SimNode
        const t = d.target as SimNode
        const tx = t.x ?? 0, ty = t.y ?? 0
        const dx = tx - (s.x ?? 0), dy = ty - (s.y ?? 0)
        const scale = Math.min(
          (width(t) / 2 + 2) / (Math.abs(dx) || 1e-9),
          (height(t) / 2 + 2) / (Math.abs(dy) || 1e-9),
        )
        return scale >= 1 ? [tx, ty] : [tx - dx * scale, ty - dy * scale]
      }

      stopSim = () => sim.stop()
    }

    render()

    // A poll re-renders into the same SVG; the old simulation must not keep ticking.
    return () => {
      cancelled = true
      stopSim?.()
    }
  }, [data, domain])

  // Same key as OntologyPopulation, so this reuses its request.
  const { data: candidates } = useSWR<CandidatesResponse>(
    ['candidates', domain],
    fetchCandidates,
    { refreshInterval: POLL, revalidateOnFocus: false },
  )
  const graphName = data && candidates?.candidates.find(c => c.id === data.candidate_id)?.name

  const label = error
    ? 'active_belief_graph · API ERROR'
    : data
      ? `active_belief_graph · ${graphName ? hypothesisShortLabel(graphName) : shortId(data.candidate_id)}`
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
