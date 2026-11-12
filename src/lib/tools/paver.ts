// Pavers for a patio, walk or driveway, with the base and bedding sand under them. Each paver with its joint covers
// (length + joint) × (width + joint); pavers = area ÷ that, rounded up. The base and sand are area × depth. Depths
// follow CMHA (the Concrete Masonry & Hardscapes Association, which absorbed ICPI) PAV-TEC-002, Construction of
// Interlocking Concrete Pavements: a compacted base of at least 4 in for sidewalks, patios and pedestrian areas and
// 6 in for residential driveways on well-drained soil, thicker in colder climates or on wet or weak soil; bedding
// sand screeded to a nominal 1 in, uncompacted.

import { show } from "../units"
import { fail, feet, inches, len, num, type ToolSpec } from "../tool"

export const paver: ToolSpec = {
  id: "paver",
  heading: "Work out the pavers",
  fields: [
    { kind: "length", id: "length", label: "Area length", value: "12", unit: "ft" },
    { kind: "length", id: "width", label: "Area width", value: "10", unit: "ft" },
    { kind: "length", id: "pl", label: "Paver length", value: "8", unit: "in" },
    { kind: "length", id: "pw", label: "Paver width", value: "4", unit: "in" },
    { kind: "length", id: "joint", label: "Joint", value: "0", unit: "in", hint: "0 counts the paver faces alone, which errs toward more pavers." },
    { kind: "number", id: "waste", label: "Extra for cuts and breakage (%)", value: "0", hint: "Your own allowance." },
    { kind: "length", id: "base", label: "Base depth, compacted", value: "4", unit: "in", hint: "CMHA minimums on well-drained soil: 4 in for patios and walks, 6 in for driveways; more in cold climates or on wet soil." },
    { kind: "length", id: "sand", label: "Bedding sand depth", value: "1", unit: "in", hint: "CMHA: screeded to a nominal 1 in." },
  ],
  explain: (v) => {
    const l = len(v, "length"), w = len(v, "width"), pl = len(v, "pl"), pw = len(v, "pw"), j = len(v, "joint"), b = len(v, "base"), s = len(v, "sand"), x = num(v, "waste")
    if (!l || !w || !pl || !pw || !j || !b || !s) return fail("Enter the area, the paver size, the joint and the depths as numbers.")
    const area = feet(l) * feet(w)
    if (area <= 0 || inches(pl) <= 0 || inches(pw) <= 0) return fail("Enter an area and a paver size greater than zero.")
    if (inches(j) < 0 || inches(b) < 0 || inches(s) < 0 || (x ?? 0) < 0) return fail("Use a joint, depths and extra of zero or more.")
    const each = ((inches(pl) + inches(j)) * (inches(pw) + inches(j))) / 144
    const withExtra = area * (1 + (x ?? 0) / 100), need = withExtra / each, pavers = Math.ceil(need - 1e-9)
    const baseFt3 = area * (inches(b) / 12), sandFt3 = area * (inches(s) / 12)
    return {
      ok: true,
      headline: `${show(pavers, 0)} pavers.`,
      extra: `Base ${show(baseFt3 / 27, 2)} cu yd compacted (${show(inches(b), 2)} in); bedding sand ${show(sandFt3 / 27, 2)} cu yd (${show(inches(s), 2)} in). Area ${show(area, 2)} sq ft.`,
      lines: [
        `Area = ${show(feet(l), 2)} ft × ${show(feet(w), 2)} ft = ${show(area, 2)} sq ft${x ? `, ${show(withExtra, 2)} with ${show(x)}% extra` : ""}.`,
        `Each paver with its joint = (${show(inches(pl), 3)} + ${show(inches(j), 3)}) × (${show(inches(pw), 3)} + ${show(inches(j), 3)}) in = ${show(each, 4)} sq ft, about ${show(1 / each, 2)} pavers a square foot.`,
        `Pavers = ${show(withExtra, 2)} ÷ ${show(each, 4)} = ${show(need, 2)}, rounded up to ${show(pavers, 0)}.`,
        `Base = ${show(area, 2)} sq ft × ${show(inches(b), 2)} in ÷ 12 = ${show(baseFt3, 2)} cu ft = ${show(baseFt3 / 27, 2)} cu yd once compacted. Loose gravel settles when compacted, so order more than this; your supplier can say how much for their stone.`,
        `Bedding sand = ${show(area, 2)} sq ft × ${show(inches(s), 2)} in ÷ 12 = ${show(sandFt3, 2)} cu ft = ${show(sandFt3 / 27, 2)} cu yd, concrete sand (ASTM C33), not masonry sand or stone dust.`,
      ],
    }
  },
}
