// Rebar for a rectangular slab grid. Bars each way: (span − 2 × edge distance) ÷ spacing, rounded down, plus one;
// each bar runs the other span less the two edge distances. No laps or bends are counted. Weights per foot are
// ASTM A615 nominal weights (#3 0.376, #4 0.668, #5 1.043, #6 1.502, #7 2.044, #8 2.670, #10 4.303, #11 5.313 lb/ft;
// ASTM A615 chart, ckcog.com/wp-content/uploads/Rebar-Sizing.pdf, matching southernrebar.com; read 2026-11-11).

import { show } from "../units"
import { fail, feet, inches, len, pick, type ToolSpec } from "../tool"

export const A615_LB_PER_FT: Record<string, number> = { "3": 0.376, "4": 0.668, "5": 1.043, "6": 1.502, "7": 2.044, "8": 2.67, "10": 4.303, "11": 5.313 }

export const rebar: ToolSpec = {
  id: "rebar",
  heading: "Work out the bars",
  fields: [
    { kind: "length", id: "length", label: "Slab length", value: "20", unit: "ft" },
    { kind: "length", id: "width", label: "Slab width", value: "10", unit: "ft" },
    { kind: "length", id: "spacing", label: "Bar spacing (center to center)", value: "12", unit: "in" },
    { kind: "length", id: "edge", label: "Edge to first bar", value: "3", unit: "in", hint: "Use the cover your plans call for." },
    { kind: "select", id: "size", label: "Bar size", value: "4", options: Object.keys(A615_LB_PER_FT).map((k) => ({ value: k, label: `#${k} (${A615_LB_PER_FT[k]} lb/ft)` })) },
    { kind: "select", id: "stock", label: "Stock length", value: "20", options: [{ value: "20", label: "20 ft" }, { value: "40", label: "40 ft" }] },
  ],
  explain: (v) => {
    const l = len(v, "length"), w = len(v, "width"), s = len(v, "spacing"), e = len(v, "edge")
    if (!l || !w || !s || !e) return fail("Enter every length as a number.")
    const L = feet(l), W = feet(w), S = feet(s), E = feet(e)
    if (S <= 0 || L - 2 * E <= 0 || W - 2 * E <= 0) return fail("The slab must be longer and wider than twice the edge distance, and the spacing more than zero.")
    const alongL = Math.floor((W - 2 * E) / S + 1e-9) + 1
    const alongW = Math.floor((L - 2 * E) / S + 1e-9) + 1
    const total = alongL * (L - 2 * E) + alongW * (W - 2 * E)
    const lbft = A615_LB_PER_FT[pick(v, "size")]
    const stock = Number(pick(v, "stock"))
    return {
      ok: true,
      headline: `${show(total, 0)} ft of #${pick(v, "size")} bar, ${show(total * lbft, 0)} lb.`,
      extra: `At least ${Math.ceil(total / stock - 1e-9)} bars of ${stock} ft, before laps and cutting waste.`,
      lines: [
        `Bars running the length: (${show(W, 2)} ft − 2 × ${show(inches(e), 2)} in) ÷ ${show(inches(s), 2)} in, rounded down, plus 1 = ${alongL}, each ${show(L - 2 * E, 2)} ft.`,
        `Bars running the width: (${show(L, 2)} ft − 2 × ${show(inches(e), 2)} in) ÷ ${show(inches(s), 2)} in, rounded down, plus 1 = ${alongW}, each ${show(W - 2 * E, 2)} ft.`,
        `Total = ${show(total, 1)} ft × ${lbft} lb/ft (ASTM A615) = ${show(total * lbft, 1)} lb.`,
      ],
    }
  },
}
