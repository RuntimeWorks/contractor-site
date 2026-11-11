// Square footage of floors, lots and walls: the area of each part, added (or taken away for a cut-out), in square
// feet, square yards, square meters and acres. Plain geometry: rectangle = length × width; circle = π × radius²;
// triangle = base × height ÷ 2; trapezoid = (side a + side b) ÷ 2 × height. Conversions in ./units.ts (NIST).

import { SQUARE_FEET_PER_ACRE, SQUARE_FEET_PER_SQUARE_YARD, SQUARE_METERS_PER_SQUARE_FOOT, show, toFeet, type LengthUnit } from "./units"

export interface Length { value: number; unit: LengthUnit }

export type Part = (
  | { shape: "rectangle"; length: Length; width: Length }
  | { shape: "circle"; diameter: Length }
  | { shape: "triangle"; base: Length; height: Length }
  | { shape: "trapezoid"; sideA: Length; sideB: Length; height: Length }
) & { quantity: number; subtract?: boolean }

const ft = (l: Length) => toFeet(l.value, l.unit)

/** One part's area in square feet, before it is added or taken away. */
export const partSquareFeet = (p: Part): number => {
  const one =
    p.shape === "rectangle" ? ft(p.length) * ft(p.width)
    : p.shape === "circle" ? Math.PI * (ft(p.diameter) / 2) ** 2
    : p.shape === "triangle" ? (ft(p.base) * ft(p.height)) / 2
    : ((ft(p.sideA) + ft(p.sideB)) / 2) * ft(p.height)
  return one * p.quantity
}

export interface Area { squareFeet: number; squareYards: number; squareMeters: number; acres: number }

export const area = (squareFeet: number): Area => ({
  squareFeet,
  squareYards: squareFeet / SQUARE_FEET_PER_SQUARE_YARD,
  squareMeters: squareFeet * SQUARE_METERS_PER_SQUARE_FOOT,
  acres: squareFeet / SQUARE_FEET_PER_ACRE,
})

/** The parts added together, cut-outs taken away. A total below zero means the cut-outs are bigger than the parts. */
export const total = (parts: Part[]): number | "negative" => {
  const t = parts.reduce((s, p) => s + (p.subtract ? -1 : 1) * partSquareFeet(p), 0)
  return t < -1e-9 ? "negative" : Math.max(0, t)
}

// ---- What the page says: one function for the server-rendered first answer and every update in the browser, so
// the two always agree and the page doesn't change height on load.

export type RawPart = { shape: Part["shape"]; lengths: (Length | null)[]; quantity: number | null; subtract: boolean }

export type AreaAnswer =
  | { ok: false; message: string }
  | { ok: true; headline: string; rows: [string, string][]; cost: string | null; lines: string[] }

/** The fields each shape uses, in order. */
export const partFields: Record<Part["shape"], string[]> = { rectangle: ["length", "width"], circle: ["diameter"], triangle: ["base", "theight"], trapezoid: ["sideA", "sideB", "zheight"] }

const how: Record<Part["shape"], string> = { rectangle: "length × width", circle: "π × (diameter ÷ 2)²", triangle: "base × height ÷ 2", trapezoid: "(side a + side b) ÷ 2 × height" }

export const explainArea = (raw: RawPart[], extra: number | null, price: number | null): AreaAnswer => {
  const parts: Part[] = []
  const lines: string[] = []
  for (const [i, r] of raw.entries()) {
    if (r.lengths.some((l) => l === null)) return { ok: false, message: `Part ${i + 1}: enter each measurement as a number of zero or more.` }
    const qty = r.quantity
    if (qty === null || qty < 1 || !Number.isInteger(qty)) return { ok: false, message: `Part ${i + 1}: enter how many as a whole number, 1 or more.` }
    const [a, b, c] = r.lengths as Length[]
    const s = r.shape
    const part: Part = s === "rectangle" ? { shape: s, length: a, width: b, quantity: qty, subtract: r.subtract }
      : s === "circle" ? { shape: s, diameter: a, quantity: qty, subtract: r.subtract }
      : s === "triangle" ? { shape: s, base: a, height: b, quantity: qty, subtract: r.subtract }
      : { shape: s, sideA: a, sideB: b, height: c, quantity: qty, subtract: r.subtract }
    parts.push(part)
    lines.push(`Part ${i + 1}, ${s}: ${how[s]}${qty > 1 ? ` × ${qty}` : ""} = ${show(partSquareFeet(part))} ft²${r.subtract ? ", taken away" : ""}.`)
  }
  const t = total(parts)
  if (t === "negative") return { ok: false, message: "The cut-outs are bigger than the parts: check which parts are ticked to take away." }
  if (extra === null || extra > 100) return { ok: false, message: "Enter the extra as a percent, for example 10, or 0 for none." }
  const withExtra = t * (1 + extra / 100)
  const a = area(withExtra)
  if (extra > 0) lines.push(`Total ${show(t)} ft² + ${show(extra, 1)}% = ${show(withExtra)} ft².`)
  lines.push("Square yards = square feet ÷ 9; square meters = square feet × 0.09290304; acres = square feet ÷ 43,560.")
  return {
    ok: true,
    headline: `${show(a.squareFeet)} square feet${extra > 0 ? `, including ${show(extra, 1)}% extra` : ""}.`,
    rows: [["Square feet", show(a.squareFeet)], ["Square yards", show(a.squareYards)], ["Square meters", show(a.squareMeters)], ["Acres", show(a.acres, 4)]],
    cost: price !== null && price > 0 ? `At $${show(price)} per square foot: $${show(withExtra * price)}.` : null,
    lines,
  }
}
