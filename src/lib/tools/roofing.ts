// Shingles for a roof of one pitch. Every face of a roof of uniform pitch is tilted the same, so the sloped area is
// the plan area (footprint with the overhangs) times the pitch multiplier √(1 + (rise ÷ 12)²) (see roofpitch.ts).
// A roofing square is 100 sq ft. Bundles: GAF Timberline HDZ, the maker's spec sheet "Bundles/Square: 3"
// (gaf.com, timberline-hdz-shingles-spec-sheet-resgn467hdz.pdf, read 2026-11-11); other shingles differ, so the
// bundles per square is an input. Waste for cuts, starter and ridge is the user's own figure.

import { show } from "../units"
import { pitchFactor } from "./roofpitch"
import { fail, feet, len, num, type ToolSpec } from "../tool"

export const SQUARE_FT = 100
export const GAF_HDZ_BUNDLES_PER_SQUARE = 3

export const roofing: ToolSpec = {
  id: "roofing",
  heading: "Work out the shingles",
  fields: [
    { kind: "length", id: "length", label: "Footprint length, with overhangs", value: "50", unit: "ft" },
    { kind: "length", id: "width", label: "Footprint width, with overhangs", value: "30", unit: "ft" },
    { kind: "number", id: "pitch", label: "Pitch (inches of rise per 12)", value: "6" },
    { kind: "number", id: "bundles", label: "Bundles per square", value: "3", hint: "3 for GAF Timberline HDZ; check your shingle's wrapper." },
    { kind: "number", id: "waste", label: "Extra for waste (%)", value: "0", hint: "Your own allowance for cuts, starter and ridge." },
  ],
  explain: (v) => {
    const l = len(v, "length"), w = len(v, "width"), p = num(v, "pitch"), b = num(v, "bundles"), x = num(v, "waste")
    if (!l || !w || p === null) return fail("Enter the footprint and the pitch as numbers.")
    if (!b || b <= 0) return fail("Enter the bundles per square, more than zero.")
    const plan = feet(l) * feet(w)
    if (plan <= 0) return fail("Enter a footprint greater than zero.")
    const k = pitchFactor(p)
    const slope = plan * k
    const withWaste = slope * (1 + (x ?? 0) / 100)
    const squares = withWaste / SQUARE_FT
    const bundles = Math.ceil(squares * b - 1e-9)
    return {
      ok: true,
      headline: `${show(squares, 2)} squares: ${bundles} bundles.`,
      extra: `Roof area ${show(slope, 0)} sq ft${x ? `, ${show(withWaste, 0)} sq ft with ${show(x)}% extra` : ""}.`,
      lines: [
        `Plan area = ${show(feet(l), 2)} ft × ${show(feet(w), 2)} ft = ${show(plan, 1)} sq ft.`,
        `Roof area = ${show(plan, 1)} × ${show(k, 4)} (a ${show(p, 2)} in 12 pitch) = ${show(slope, 1)} sq ft.`,
        `Squares = ${show(withWaste, 1)} ÷ 100 = ${show(squares, 2)}. Bundles = ${show(squares, 2)} × ${show(b)}, rounded up = ${bundles}.`,
      ],
    }
  },
}
