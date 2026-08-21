// Curated per-chart accent colors. Validated as a set (dataviz skill):
// each passes CVD-separation + contrast against the fixed gold goal-line
// color and the white card surface, in this adjacency order. Not a free
// color picker on purpose — an arbitrary hex could fail those checks.
export const CHART_COLORS = [
  { name: 'Green', hex: '#1f7a3d' },
  { name: 'Red', hex: '#c0392b' },
  { name: 'Blue', hex: '#2a78d6' },
  { name: 'Pink', hex: '#e0568c' },
  { name: 'Purple', hex: '#7c3aed' },
] as const;

export const DEFAULT_CHART_COLOR = CHART_COLORS[0].hex;

export function isValidChartColor(hex: string | null | undefined): boolean {
  if (!hex) return false;
  return CHART_COLORS.some(c => c.hex.toLowerCase() === hex.toLowerCase());
}
