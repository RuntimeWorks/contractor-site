// Masonry, paving, flooring, siding and decks.
// Concrete block: a standard unit is nominally 8 × 8 × 16 in, specified 7⅝ × 7⅝ × 15⅝ in so that with a ⅜ in mortar
// joint it fills 8 × 16 in of wall (NCMA TEK 2-1B, Typical Sizes and Shapes of Concrete Masonry Units). So one block
// covers 128 in² and a square foot takes 144 ÷ 128 = 1.125 blocks.
// Brick: a modular brick is 3⅝ × 2¼ × 7⅝ in (Brick Industry Association, Technical Note 10, Dimensioning and
// Estimating Brick Masonry; Glen-Gery, Brick Sizes); with ⅜ in joints each covers (7⅝ + ⅜) × (2¼ + ⅜) = 21 in², so a
// square foot takes 6.86 bricks, Glen-Gery's figure. Both are minimums before waste.
// Asphalt: compacted hot mix asphalt about 145 lb/ft³, the Asphalt Institute MS-4 figure as cited by paving
// estimators (calcsummit.com and others, read 2026-11-11); the plant's own figure wins, so it is an input.
// Deck boards: a nominal 6 in board is 5½ in wide dressed (American Softwood Lumber Standard, NIST PS 20-20).
// Flooring, siding and retaining walls: area or length arithmetic; waste is the user's own figure.

import { fail, feet, inches, len, num, pick, plural, type ToolSpec } from "../tool"
import { show, SQUARE_FEET_PER_SQUARE_YARD } from "../units"

export const BLOCK_FACE_IN2 = 8 * 16
export const SHORT_TON_LB = 2000

export const block: ToolSpec = {
  id: "block",
  heading: "Work out the blocks",
  fields: [
    { kind: "length", id: "length", label: "Wall length", value: "40", unit: "ft" },
    { kind: "length", id: "height", label: "Wall height", value: "4", unit: "ft" },
    { kind: "number", id: "open", label: "Openings to leave out (sq ft)", value: "0" },
    { kind: "number", id: "waste", label: "Extra for breakage and cuts (%)", value: "0", hint: "Your own allowance." },
  ],
  explain: (v) => {
    const l = len(v, "length"), h = len(v, "height"), open = num(v, "open") ?? 0, waste = num(v, "waste") ?? 0
    if (!l || !h) return fail("Enter the wall's length and height.")
    const area = feet(l) * feet(h) - open
    if (area <= 0) return fail("The openings are larger than the wall.")
    const need = (area * 144) / BLOCK_FACE_IN2 * (1 + waste / 100)
    const courses = Math.ceil(inches(h) / 8 - 1e-9)
    return {
      ok: true,
      headline: `${Math.ceil(need - 1e-9)} blocks of 8 × 8 × 16 in.`,
      extra: `${show(area, 1)} sq ft of wall, about ${courses} courses high.`,
      lines: [`Each block with its ⅜ in joint covers 8 × 16 in = 128 in², so a square foot takes 144 ÷ 128 = 1.125 blocks.`, `${show(area, 1)} sq ft × 1.125${waste ? ` × ${1 + waste / 100}` : ""} = ${show(need, 1)}, rounded up.`],
    }
  },
}

export const brick: ToolSpec = {
  id: "brick",
  heading: "Work out the bricks",
  fields: [
    { kind: "length", id: "length", label: "Wall length", value: "30", unit: "ft" },
    { kind: "length", id: "height", label: "Wall height", value: "8", unit: "ft" },
    { kind: "number", id: "open", label: "Openings to leave out (sq ft)", value: "21" },
    { kind: "length", id: "bl", label: "Brick length", value: "7.625", unit: "in", hint: "A modular brick is 7⅝ × 2¼ in." },
    { kind: "length", id: "bh", label: "Brick height", value: "2.25", unit: "in" },
    { kind: "length", id: "joint", label: "Mortar joint", value: "0.375", unit: "in" },
    { kind: "number", id: "waste", label: "Extra for breakage and cuts (%)", value: "0" },
  ],
  explain: (v) => {
    const l = len(v, "length"), h = len(v, "height"), bl = len(v, "bl"), bh = len(v, "bh"), j = len(v, "joint"), open = num(v, "open") ?? 0, waste = num(v, "waste") ?? 0
    if (!l || !h || !bl || !bh || !j) return fail("Enter the wall, brick and joint sizes.")
    const area = feet(l) * feet(h) - open
    if (area <= 0) return fail("The openings are larger than the wall.")
    const face = (inches(bl) + inches(j)) * (inches(bh) + inches(j))
    if (face <= 0) return fail("Enter brick sizes greater than zero.")
    const per = 144 / face
    const need = area * per * (1 + waste / 100)
    return {
      ok: true,
      headline: `${show(Math.ceil(need - 1e-9), 0)} bricks.`,
      extra: `${show(per, 2)} bricks per sq ft over ${show(area, 1)} sq ft.`,
      lines: [`Each brick with its joint covers (${show(inches(bl), 3)} + ${show(inches(j), 3)}) × (${show(inches(bh), 3)} + ${show(inches(j), 3)}) = ${show(face, 2)} in²; 144 ÷ ${show(face, 2)} = ${show(per, 2)} per sq ft.`, `${show(area, 1)} sq ft × ${show(per, 2)}${waste ? ` × ${1 + waste / 100}` : ""} = ${show(need, 1)}, rounded up. A minimum before waste.`],
    }
  },
}

export const asphalt: ToolSpec = {
  id: "asphalt",
  heading: "Work out the asphalt",
  fields: [
    { kind: "length", id: "length", label: "Length", value: "50", unit: "ft" },
    { kind: "length", id: "width", label: "Width", value: "12", unit: "ft" },
    { kind: "length", id: "depth", label: "Compacted thickness", value: "3", unit: "in" },
    { kind: "number", id: "density", label: "Density (lb per cubic foot)", value: "145", hint: "145 is the usual figure for compacted hot mix; ask your plant." },
  ],
  explain: (v) => {
    const l = len(v, "length"), w = len(v, "width"), d = len(v, "depth"), dens = num(v, "density")
    if (!l || !w || !d || !dens) return fail("Enter the area, thickness and density.")
    const cf = feet(l) * feet(w) * feet(d)
    const tons = (cf * dens) / SHORT_TON_LB
    return {
      ok: true,
      headline: `${show(tons, 2)} tons of asphalt.`,
      extra: `${show(cf / 27, 2)} cubic yards, ${show(feet(l) * feet(w) / SQUARE_FEET_PER_SQUARE_YARD, 1)} square yards at ${show(inches(d), 2)} in.`,
      lines: [`Volume = ${show(feet(l), 2)} × ${show(feet(w), 2)} × ${show(feet(d), 3)} ft = ${show(cf, 1)} ft³.`, `Weight = ${show(cf, 1)} × ${show(dens)} lb ÷ 2,000 = ${show(tons, 2)} short tons.`],
    }
  },
}

export const flooring: ToolSpec = {
  id: "floor",
  heading: "Work out the flooring",
  fields: [
    { kind: "length", id: "length", label: "Room length", value: "15", unit: "ft" },
    { kind: "length", id: "width", label: "Room width", value: "12", unit: "ft" },
    { kind: "number", id: "box", label: "Square feet per box", value: "20", hint: "Printed on the box." },
    { kind: "number", id: "waste", label: "Extra for cuts (%)", value: "0", hint: "Your own allowance; diagonal layouts use more." },
  ],
  explain: (v) => {
    const l = len(v, "length"), w = len(v, "width"), box = num(v, "box"), waste = num(v, "waste") ?? 0
    if (!l || !w || !box) return fail("Enter the room size and the square feet per box.")
    const area = feet(l) * feet(w)
    const buy = area * (1 + waste / 100)
    const boxes = Math.ceil(buy / box - 1e-9)
    return { ok: true, headline: `${boxes} boxes.`, extra: `${show(area, 1)} sq ft${waste ? `, ${show(buy, 1)} with ${waste}% extra` : ""}; ${show(boxes * box, 1)} sq ft in the boxes.`, lines: [`Area = ${show(feet(l), 2)} × ${show(feet(w), 2)} = ${show(area, 1)} sq ft. Boxes = ${show(buy, 1)} ÷ ${show(box)}, rounded up = ${boxes}.`] }
  },
}

export const siding: ToolSpec = {
  id: "siding",
  heading: "Work out the siding",
  fields: [
    { kind: "length", id: "perimeter", label: "Distance around the house", value: "160", unit: "ft" },
    { kind: "length", id: "height", label: "Wall height to the eaves", value: "9", unit: "ft" },
    { kind: "length", id: "gwidth", label: "Gable width (0 if none)", value: "30", unit: "ft" },
    { kind: "length", id: "gheight", label: "Gable height", value: "7", unit: "ft" },
    { kind: "number", id: "gables", label: "Number of gables", value: "2", whole: true },
    { kind: "number", id: "open", label: "Doors and windows to leave out (sq ft)", value: "180" },
    { kind: "number", id: "waste", label: "Extra for cuts (%)", value: "0" },
  ],
  explain: (v) => {
    const p = len(v, "perimeter"), h = len(v, "height"), gw = len(v, "gwidth"), gh = len(v, "gheight"), g = num(v, "gables") ?? 0, open = num(v, "open") ?? 0, waste = num(v, "waste") ?? 0
    if (!p || !h) return fail("Enter the distance around the house and the wall height.")
    const walls = feet(p) * feet(h)
    const gables = gw && gh ? (feet(gw) * feet(gh)) / 2 * g : 0
    const area = walls + gables - open
    if (area <= 0) return fail("The openings are larger than the walls.")
    const buy = area * (1 + waste / 100)
    return { ok: true, headline: `${show(buy / 100, 2)} squares of siding.`, extra: `${show(area, 0)} sq ft to cover${waste ? `, ${show(buy, 0)} with ${waste}% extra` : ""}.`, lines: [`Walls = ${show(feet(p), 1)} × ${show(feet(h), 2)} = ${show(walls, 0)} sq ft. Gables = ${g} × ${show(gw ? feet(gw) : 0, 1)} × ${show(gh ? feet(gh) : 0, 1)} ÷ 2 = ${show(gables, 0)} sq ft.`, `Less ${show(open, 0)} sq ft of openings = ${show(area, 0)} sq ft. A square is 100 sq ft.`] }
  },
}

export const deck: ToolSpec = {
  id: "deck",
  heading: "Work out deck boards and joists",
  fields: [
    { kind: "length", id: "length", label: "Deck length (the way the boards run)", value: "16", unit: "ft" },
    { kind: "length", id: "width", label: "Deck width (the way the joists run)", value: "12", unit: "ft" },
    { kind: "length", id: "bw", label: "Board width", value: "5.5", unit: "in", hint: "A nominal 6 in board is 5½ in." },
    { kind: "length", id: "gap", label: "Gap between boards", value: "0.125", unit: "in" },
    { kind: "select", id: "stock", label: "Board length", value: "16", options: ["8", "10", "12", "14", "16", "20"].map((x) => ({ value: x, label: `${x} ft` })) },
    { kind: "length", id: "oc", label: "Joist spacing (center to center)", value: "16", unit: "in", hint: "Use the spacing your decking and plans call for." },
  ],
  explain: (v) => {
    const L = len(v, "length"), W = len(v, "width"), bw = len(v, "bw"), gap = len(v, "gap"), oc = len(v, "oc"), stock = Number(pick(v, "stock"))
    if (!L || !W || !bw || !gap || !oc) return fail("Enter every size as a number.")
    const rows = Math.ceil(inches(W) / (inches(bw) + inches(gap)) - 1e-9)
    const perRow = Math.ceil(feet(L) / stock - 1e-9)
    const joists = Math.floor(inches(L) / inches(oc) + 1e-9) + 1
    return {
      ok: true,
      headline: `${rows * perRow} boards of ${stock} ft and ${joists} joists.`,
      extra: `${plural(rows, "row")} of boards, ${perRow} per row; joists ${show(feet(W), 2)} ft long.`,
      lines: [`Rows = ${show(inches(W), 2)} in ÷ (${show(inches(bw), 3)} + ${show(inches(gap), 3)}) in, rounded up = ${rows}. Boards per row = ${show(feet(L), 2)} ÷ ${stock} ft, rounded up = ${perRow}.`, `Joists = ${show(inches(L), 1)} in ÷ ${show(inches(oc), 1)} in, rounded down, plus 1 = ${joists}. Rim joists, beams and posts are not counted.`],
    }
  },
}

export const retaining: ToolSpec = {
  id: "wall",
  heading: "Work out retaining wall blocks",
  fields: [
    { kind: "length", id: "length", label: "Wall length", value: "30", unit: "ft" },
    { kind: "length", id: "height", label: "Wall height above grade", value: "2", unit: "ft" },
    { kind: "length", id: "bl", label: "Block face length", value: "12", unit: "in", hint: "From the block's product sheet." },
    { kind: "length", id: "bh", label: "Block face height", value: "4", unit: "in" },
    { kind: "length", id: "cap", label: "Cap length (0 for no caps)", value: "12", unit: "in" },
    { kind: "number", id: "buried", label: "Courses below grade", value: "1", whole: true, hint: "The maker's instructions say how many to bury." },
  ],
  explain: (v) => {
    const l = len(v, "length"), h = len(v, "height"), bl = len(v, "bl"), bh = len(v, "bh"), cap = len(v, "cap"), buried = num(v, "buried") ?? 0
    if (!l || !h || !bl || !bh) return fail("Enter the wall and block sizes.")
    if (inches(bl) <= 0 || inches(bh) <= 0) return fail("Enter block sizes greater than zero.")
    const perCourse = Math.ceil(inches(l) / inches(bl) - 1e-9)
    const courses = Math.ceil(inches(h) / inches(bh) - 1e-9) + buried
    const caps = cap && inches(cap) > 0 ? Math.ceil(inches(l) / inches(cap) - 1e-9) : 0
    return {
      ok: true,
      headline: `${perCourse * courses} blocks${caps ? ` and ${caps} caps` : ""}.`,
      extra: `${courses} courses of ${perCourse}, ${buried} of them below grade.`,
      lines: [`Per course = ${show(inches(l), 1)} in ÷ ${show(inches(bl), 2)} in, rounded up = ${perCourse}. Courses = ${show(inches(h), 1)} ÷ ${show(inches(bh), 2)}, rounded up, plus ${buried} buried = ${courses}.`, "Taller walls, and walls near slopes, driveways or buildings, may need an engineer's design: check the block maker's limits and local code."],
    }
  },
}
