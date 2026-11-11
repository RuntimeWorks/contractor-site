// Board feet of lumber. A board foot is the volume of a board 1 inch thick, 12 inches wide and 1 foot long, which is
// 144 cubic inches (NIST Handbook 130, Uniform Regulation for the Method of Sale of Commodities, section 2.12, Lumber).
// So board feet = thickness (in) × width (in) × length (ft) ÷ 12, for each piece.

import { show, toFeet, type LengthUnit } from "./units"

export interface Length { value: number; unit: LengthUnit }

export const CUBIC_INCHES_PER_BOARD_FOOT = 144

export type BoardAnswer =
  | { ok: false; message: string }
  | { ok: true; headline: string; cost: string | null; lines: string[] }

const inches = (l: Length) => toFeet(l.value, l.unit) * 12

export const boardFeet = (thickness: Length, width: Length, length: Length, pieces: number) =>
  (inches(thickness) * inches(width) * inches(length) * pieces) / CUBIC_INCHES_PER_BOARD_FOOT

export const explainBoards = (t: Length | null, w: Length | null, l: Length | null, pieces: number | null, price: number | null): BoardAnswer => {
  if (!t || !w || !l) return { ok: false, message: "Enter the thickness, width and length as numbers of zero or more." }
  if (pieces === null || pieces < 1 || !Number.isInteger(pieces)) return { ok: false, message: "Enter how many pieces as a whole number, 1 or more." }
  const bf = boardFeet(t, w, l, pieces)
  if (bf === 0) return { ok: false, message: "Enter measurements greater than zero." }
  const one = boardFeet(t, w, l, 1)
  const lines = [
    `One piece = ${show(inches(t), 3)} in × ${show(inches(w), 3)} in × ${show(inches(l) / 12, 3)} ft ÷ 12 = ${show(one, 3)} board feet.`,
    pieces > 1 ? `${show(pieces, 0)} pieces × ${show(one, 3)} = ${show(bf, 3)} board feet.` : `A board foot is 1 in × 12 in × 1 ft, or 144 cubic inches.`,
  ]
  return {
    ok: true,
    headline: `${show(bf, 2)} board feet.`,
    cost: price !== null && price > 0 ? `At $${show(price)} per board foot: $${show(bf * price)}.` : null,
    lines,
  }
}
