// Tiles for a floor or wall. Each tile with its grout joint covers (tile length + joint) × (tile width + joint);
// tiles = area ÷ that, rounded up. The extra for cuts and breakage is the user's own figure. Plain geometry.

import { show } from "../units"
import { fail, feet, inches, len, num, type ToolSpec } from "../tool"

export const tile: ToolSpec = {
  id: "tile",
  heading: "Work out the tiles",
  fields: [
    { kind: "length", id: "length", label: "Area length", value: "12", unit: "ft" },
    { kind: "length", id: "width", label: "Area width", value: "10", unit: "ft" },
    { kind: "length", id: "tl", label: "Tile length", value: "12", unit: "in" },
    { kind: "length", id: "tw", label: "Tile width", value: "12", unit: "in" },
    { kind: "length", id: "joint", label: "Grout joint", value: "0.125", unit: "in", hint: "⅛ in is 0.125." },
    { kind: "number", id: "waste", label: "Extra for cuts and breakage (%)", value: "0", hint: "Your own allowance." },
    { kind: "number", id: "box", label: "Tiles per box, optional", value: "", whole: true },
  ],
  explain: (v) => {
    const l = len(v, "length"), w = len(v, "width"), tl = len(v, "tl"), tw = len(v, "tw"), j = len(v, "joint"), x = num(v, "waste"), box = num(v, "box")
    if (!l || !w || !tl || !tw || !j) return fail("Enter the area, the tile size and the joint as numbers.")
    const area = feet(l) * feet(w)
    const each = ((inches(tl) + inches(j)) * (inches(tw) + inches(j))) / 144
    if (area <= 0 || inches(tl) <= 0 || inches(tw) <= 0) return fail("Enter measurements greater than zero.")
    const need = (area * (1 + (x ?? 0) / 100)) / each
    const tiles = Math.ceil(need - 1e-9)
    const boxes = box && box > 0 ? Math.ceil(tiles / box - 1e-9) : null
    return {
      ok: true,
      headline: `${show(tiles, 0)} tiles${boxes ? ` (${boxes} boxes of ${show(box!, 0)})` : ""}.`,
      extra: `Area ${show(area, 2)} sq ft.`,
      lines: [
        `Area = ${show(feet(l), 2)} ft × ${show(feet(w), 2)} ft = ${show(area, 2)} sq ft${x ? `, ${show(area * (1 + x / 100), 2)} with ${show(x)}% extra` : ""}.`,
        `Each tile with its joint = (${show(inches(tl), 3)} + ${show(inches(j), 3)}) × (${show(inches(tw), 3)} + ${show(inches(j), 3)}) in = ${show(each, 4)} sq ft.`,
        `Tiles = ${show(area * (1 + (x ?? 0) / 100), 2)} ÷ ${show(each, 4)} = ${show(need, 2)}, rounded up to ${show(tiles, 0)}.`,
      ],
    }
  },
}
