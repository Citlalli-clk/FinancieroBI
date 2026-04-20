export function roundByFirstDecimal(value: number): number {
  if (!Number.isFinite(value)) return 0
  return value >= 0 ? Math.floor(value + 0.5) : Math.ceil(value - 0.5)
}
