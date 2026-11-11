// Bulk materials (gravel, crushed stone, sand, topsoil, mulch) by the cubic yard: area × depth, then weight where a
// published density exists, and bags where the material is sold in bags.
//
// Sources:
// - Loose weights per cubic yard are Caterpillar's "Common materials loose & bank table" (cat.com, "Material Density
//   Tables to Help Estimate Earthwork Volumes", published 2021-09-01, read 2026-11-11). Loose, because delivered
//   material is loose. Caterpillar's own caveat, shown on the page: weight varies with moisture, grain size and
//   compaction, and tests are needed for exact figures.
// - 1 short ton = 2,000 lb (NIST Handbook 44, Appendix C). Units in ./units.ts.
// - Mulch has no weight here: Caterpillar's table has no mulch row, and bags of mulch are sold by the volume printed
//   on them, so the page asks for that volume.

import { CUBIC_FEET_PER_CUBIC_YARD, CUBIC_METERS_PER_CUBIC_FOOT, show, toFeet, unitLabel, type LengthUnit } from "./units"

export interface Length { value: number; unit: LengthUnit }

export const materials = {
  "gravel-mixed": { label: "Gravel, dry, ¼ to 2 in", poundsPerCubicYard: 2850 },
  gravel: { label: "Gravel, dry", poundsPerCubicYard: 2550 },
  "crushed-stone": { label: "Crushed stone", poundsPerCubicYard: 2700 },
  "sand-dry": { label: "Sand, dry and loose", poundsPerCubicYard: 2400 },
  "sand-damp": { label: "Sand, damp", poundsPerCubicYard: 2850 },
  topsoil: { label: "Topsoil", poundsPerCubicYard: 1600 },
  mulch: { label: "Mulch", poundsPerCubicYard: null },
  other: { label: "Something else (no weight)", poundsPerCubicYard: null },
} as const

export type Material = keyof typeof materials
export const POUNDS_PER_SHORT_TON = 2000

export interface MaterialInput {
  material: Material
  /** True when the length and width fields are both empty, so the area comes from `squareFeet`. */
  useArea: boolean
  /** Length and width (null when a field doesn't hold a number of zero or more). */
  length: Length | null
  width: Length | null
  squareFeet: number | null
  depth: Length | null
  /** Cubic feet in one bag, as printed on it; null for no bag count. */
  bagCubicFeet: number | null
}

export type MaterialAnswer =
  | { ok: false; message: string }
  | { ok: true; headline: string; rows: [string, string][]; lines: string[] }

export const explainMaterial = (i: MaterialInput): MaterialAnswer => {
  const useArea = i.useArea
  const sq = useArea ? i.squareFeet : i.length && i.width ? toFeet(i.length.value, i.length.unit) * toFeet(i.width.value, i.width.unit) : null
  if (sq === null) return { ok: false, message: useArea ? "Enter the area in square feet, or a length and a width." : "Enter both a length and a width, as numbers of zero or more." }
  if (i.depth === null) return { ok: false, message: "Enter the depth as a number of zero or more." }
  const cubicFeet = sq * toFeet(i.depth.value, i.depth.unit)
  if (cubicFeet === 0) return { ok: false, message: "Enter measurements greater than zero." }
  const yd = cubicFeet / CUBIC_FEET_PER_CUBIC_YARD
  const m = materials[i.material]
  const rows: [string, string][] = [["Cubic yards", show(yd)], ["Cubic feet", show(cubicFeet)], ["Cubic meters", show(cubicFeet * CUBIC_METERS_PER_CUBIC_FOOT)]]
  const area = useArea ? `${show(sq)} ft²` : `${show(i.length!.value, 3)} ${unitLabel(i.length!.unit)} × ${show(i.width!.value, 3)} ${unitLabel(i.width!.unit)} = ${show(sq)} ft²`
  const lines = [`Area: ${area}. Volume = area × depth (${show(i.depth.value, 3)} ${unitLabel(i.depth.unit)}) = ${show(cubicFeet)} ft³ = ${show(yd)} yd³ (÷ 27).`]
  if (m.poundsPerCubicYard) {
    const pounds = yd * m.poundsPerCubicYard
    rows.push(["Weight", `${show(pounds / POUNDS_PER_SHORT_TON)} tons (${show(pounds, 0)} lb)`])
    lines.push(`Weight = ${show(yd)} yd³ × ${show(m.poundsPerCubicYard, 0)} lb per yd³ (${m.label.toLowerCase()}, loose, Caterpillar) = ${show(pounds, 0)} lb = ${show(pounds / POUNDS_PER_SHORT_TON)} short tons (÷ 2,000).`)
  }
  if (i.bagCubicFeet !== null && i.bagCubicFeet > 0) {
    const bags = Math.ceil(cubicFeet / i.bagCubicFeet - 1e-9)
    rows.push([`Bags of ${show(i.bagCubicFeet, 2)} ft³`, show(bags, 0)])
    lines.push(`Bags = ${show(cubicFeet)} ft³ ÷ ${show(i.bagCubicFeet, 2)} ft³ a bag = ${show(cubicFeet / i.bagCubicFeet)}, rounded up to ${show(bags, 0)}.`)
  }
  return { ok: true, headline: `${show(yd)} cubic yards${m.poundsPerCubicYard ? `, about ${show((yd * m.poundsPerCubicYard) / POUNDS_PER_SHORT_TON)} tons` : ""}.`, rows, lines }
}
