// The written report (engine prompts/snapshot_report.md) as headings and
// paragraphs. The model often puts a heading's paragraph on the very next
// line, so a heading ends at its own line, not at a blank one.

export type ReportBlock = { kind: 'heading' | 'para'; text: string }

export function reportBlocks(text: string): ReportBlock[] {
  const out: ReportBlock[] = []
  for (const block of text.split(/\n{2,}/)) {
    let rest = block.trim()
    const heading = rest.match(/^#{1,3}\s+(.*)(?:\n|$)/)
    if (heading) {
      out.push({ kind: 'heading', text: heading[1].trim() })
      rest = rest.slice(heading[0].length).trim()
    }
    if (rest) out.push({ kind: 'para', text: rest })
  }
  return out
}
