// Paint for a room. Area = walls (perimeter × height), plus the ceiling if chosen, less openings; gallons = area ×
// coats ÷ coverage per gallon. Coverage: Sherwin-Williams' paint calculator FAQ, "A gallon of paint typically covers
// about 350-400 square feet" (sherwin-williams.com/en-us/color/color-tools/paint-calculator, read 2026-11-11);
// the low end, 350, is the starting value, and the can's label wins.

import { show } from "../units"
import { fail, feet, len, num, pick, type ToolSpec } from "../tool"

export const SW_COVERAGE_LOW = 350

export const paint: ToolSpec = {
  id: "paint",
  heading: "Work out the paint",
  fields: [
    { kind: "length", id: "length", label: "Room length", value: "14", unit: "ft" },
    { kind: "length", id: "width", label: "Room width", value: "12", unit: "ft" },
    { kind: "length", id: "height", label: "Wall height", value: "8", unit: "ft" },
    { kind: "select", id: "ceiling", label: "Paint the ceiling too", value: "no", options: [{ value: "no", label: "No, walls only" }, { value: "yes", label: "Yes, same paint" }] },
    { kind: "number", id: "openings", label: "Doors and windows to leave out (sq ft)", value: "21", hint: "A 3 ft × 7 ft door is 21 sq ft." },
    { kind: "number", id: "coats", label: "Coats", value: "2", whole: true },
    { kind: "number", id: "coverage", label: "Coverage per gallon (sq ft)", value: "350", hint: "Sherwin-Williams: about 350 to 400. Use your can's label." },
  ],
  explain: (v) => {
    const l = len(v, "length"), w = len(v, "width"), h = len(v, "height"), open = num(v, "openings") ?? 0, coats = num(v, "coats"), cov = num(v, "coverage")
    if (!l || !w || !h) return fail("Enter the room's length, width and height as numbers.")
    if (!coats || !Number.isInteger(coats)) return fail("Enter the number of coats as a whole number, 1 or more.")
    if (!cov || cov <= 0) return fail("Enter the coverage per gallon, more than zero.")
    const L = feet(l), W = feet(w), H = feet(h)
    const area = 2 * (L + W) * H + (pick(v, "ceiling") === "yes" ? L * W : 0) - open
    if (area <= 0) return fail("The openings are larger than the walls; check the numbers.")
    const gal = (area * coats) / cov
    return {
      ok: true,
      headline: `${show(gal, 2)} gallons: buy ${Math.ceil(gal - 1e-9)}.`,
      extra: `${show(area, 1)} sq ft, ${coats} coat${coats === 1 ? "" : "s"}.`,
      lines: [
        `Area = 2 × (${show(L, 2)} + ${show(W, 2)}) × ${show(H, 2)}${pick(v, "ceiling") === "yes" ? ` + ${show(L * W, 1)} ceiling` : ""} − ${show(open, 1)} = ${show(area, 1)} sq ft.`,
        `Gallons = ${show(area, 1)} × ${coats} ÷ ${show(cov)} = ${show(gal, 2)}.`,
      ],
    }
  },
}
