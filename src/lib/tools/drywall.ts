// Drywall for a room. Wall area = perimeter × height, plus the ceiling if chosen, less openings. Sheets = area ÷ sheet
// area, rounded up. Sheet sizes: USG Sheetrock panels are 48 in wide in 8 to 12 ft lengths (usg.com product page;
// the USG installation guide J371 tabulates 4×8, 4×10 and 4×12 panels; read 2026-11-11). Joint tape: USG's guide
// lists 296 ft of joint tape for 800 sq ft of panels, about 0.37 ft per sq ft.

import { show } from "../units"
import { fail, feet, len, num, pick, type ToolSpec } from "../tool"

export const TAPE_FT_PER_SQFT = 296 / 800

export const drywall: ToolSpec = {
  id: "drywall",
  heading: "Work out the sheets",
  fields: [
    { kind: "length", id: "length", label: "Room length", value: "14", unit: "ft" },
    { kind: "length", id: "width", label: "Room width", value: "12", unit: "ft" },
    { kind: "length", id: "height", label: "Wall height", value: "8", unit: "ft" },
    { kind: "select", id: "ceiling", label: "Include the ceiling", value: "no", options: [{ value: "no", label: "No, walls only" }, { value: "yes", label: "Yes" }] },
    { kind: "number", id: "openings", label: "Doors and windows to leave out (sq ft)", value: "21", hint: "A 3 ft × 7 ft door is 21 sq ft." },
    { kind: "select", id: "sheet", label: "Sheet size", value: "32", options: [{ value: "32", label: "4 × 8 ft (32 sq ft)" }, { value: "40", label: "4 × 10 ft (40 sq ft)" }, { value: "48", label: "4 × 12 ft (48 sq ft)" }] },
  ],
  explain: (v) => {
    const l = len(v, "length"), w = len(v, "width"), h = len(v, "height"), open = num(v, "openings") ?? 0, sheet = Number(pick(v, "sheet"))
    if (!l || !w || !h) return fail("Enter the room's length, width and height as numbers.")
    const L = feet(l), W = feet(w), H = feet(h)
    const walls = 2 * (L + W) * H
    const ceiling = pick(v, "ceiling") === "yes" ? L * W : 0
    const area = walls + ceiling - open
    if (area <= 0) return fail("The openings are larger than the walls; check the numbers.")
    const sheets = Math.ceil(area / sheet - 1e-9)
    return {
      ok: true,
      headline: `${sheets} sheets of ${sheet === 32 ? "4 × 8" : sheet === 40 ? "4 × 10" : "4 × 12"} ft.`,
      extra: `${show(area, 1)} sq ft to cover; about ${show(area * TAPE_FT_PER_SQFT, 0)} ft of joint tape.`,
      lines: [
        `Walls = 2 × (${show(L, 2)} + ${show(W, 2)}) × ${show(H, 2)} = ${show(walls, 1)} sq ft${ceiling ? `; ceiling = ${show(L, 2)} × ${show(W, 2)} = ${show(ceiling, 1)} sq ft` : ""}.`,
        `Less ${show(open, 1)} sq ft of openings = ${show(area, 1)} sq ft. Sheets = ${show(area, 1)} ÷ ${sheet} = ${show(area / sheet, 2)}, rounded up to ${sheets}.`,
        `Joint tape ≈ ${show(area, 1)} × 0.37 ft (USG: 296 ft per 800 sq ft) = ${show(area * TAPE_FT_PER_SQFT, 0)} ft.`,
      ],
    }
  },
}
