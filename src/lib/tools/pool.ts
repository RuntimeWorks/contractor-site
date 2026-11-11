// Pool water volume. Volume = surface area × average depth, where the average depth is (shallow + deep) ÷ 2 for a
// pool with an even slope. Rectangle: length × width; round: π × (diameter ÷ 2)²; oval: π × (length ÷ 2) × (width ÷ 2)
// (an ellipse). Gallons: a US gallon is exactly 231 cubic inches (NIST Handbook 44, Appendix C), so a cubic foot
// (1,728 in³) is 1,728 ÷ 231 = 7.4805 gallons. Liters: 1 ft³ = 0.028316846592 m³ exactly (1 ft = 0.3048 m).

import { CUBIC_METERS_PER_CUBIC_FOOT, show } from "../units"
import { fail, feet, len, pick, type ToolSpec } from "../tool"

export const GALLONS_PER_CUBIC_FOOT = 1728 / 231

export const pool: ToolSpec = {
  id: "pool",
  heading: "Work out the water",
  fields: [
    { kind: "select", id: "shape", label: "Shape", value: "rect", options: [{ value: "rect", label: "Rectangle" }, { value: "round", label: "Round" }, { value: "oval", label: "Oval" }] },
    { kind: "length", id: "length", label: "Length (or diameter if round)", value: "32", unit: "ft" },
    { kind: "length", id: "width", label: "Width (not used if round)", value: "16", unit: "ft" },
    { kind: "length", id: "shallow", label: "Shallow end depth", value: "3.5", unit: "ft" },
    { kind: "length", id: "deep", label: "Deep end depth", value: "6", unit: "ft", hint: "Same as shallow for a flat bottom." },
  ],
  explain: (v) => {
    const shape = pick(v, "shape"), l = len(v, "length"), w = len(v, "width"), s = len(v, "shallow"), d = len(v, "deep")
    if (!l || !s || !d || (shape !== "round" && !w)) return fail("Enter the size and both depths as numbers.")
    const L = feet(l), W = w ? feet(w) : 0
    const avg = (feet(s) + feet(d)) / 2
    const area = shape === "round" ? Math.PI * (L / 2) ** 2 : shape === "oval" ? Math.PI * (L / 2) * (W / 2) : L * W
    if (area <= 0 || avg <= 0) return fail("Enter measurements greater than zero.")
    const cf = area * avg
    const gal = cf * GALLONS_PER_CUBIC_FOOT
    const areaWords = shape === "round" ? `π × (${show(L, 2)} ÷ 2)²` : shape === "oval" ? `π × (${show(L, 2)} ÷ 2) × (${show(W, 2)} ÷ 2)` : `${show(L, 2)} × ${show(W, 2)}`
    return {
      ok: true,
      headline: `${show(gal, 0)} US gallons.`,
      extra: `${show(cf * CUBIC_METERS_PER_CUBIC_FOOT * 1000, 0)} liters, ${show(cf, 1)} cubic feet.`,
      lines: [
        `Surface = ${areaWords} = ${show(area, 2)} sq ft. Average depth = (${show(feet(s), 2)} + ${show(feet(d), 2)}) ÷ 2 = ${show(avg, 2)} ft.`,
        `Volume = ${show(area, 2)} × ${show(avg, 2)} = ${show(cf, 2)} cubic feet.`,
        `Gallons = ${show(cf, 2)} × 7.4805 (1,728 in³ ÷ 231 in³ per gallon) = ${show(gal, 0)}.`,
      ],
    }
  },
}
