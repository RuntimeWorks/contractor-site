// How much concrete a pour needs, in cubic feet, cubic yards, cubic meters and bags.
//
// Sources, each beside the number it gives:
// - Volume is plain geometry: a slab, footing or wall is length × width × thickness; a round column or post hole is
//   π × radius² × depth; a round slab with a hollow (a tube or ring) is π × (outer radius² − inner radius²) × height.
// - Bag yields are QUIKRETE® Concrete Mix (No. 1101) as printed on its data sheet: 40 lb ≈ 0.30 ft³, 50 lb ≈ 0.375 ft³,
//   60 lb ≈ 0.45 ft³, 80 lb ≈ 0.60 ft³, 90 lb ≈ 0.675 ft³ (quikrete.com/pdfs/data_sheet-concrete mix 1101.pdf, read
//   2026-11-11). Other brands and mixes yield differently; the page says so.
// - The extra to order: NRMCA, Concrete in Practice 8, "Discrepancies in Yield": include an allowance of 4 to 10
//   percent over plan dimensions for waste, over-excavation and other causes (nrmca.org/wp-content/uploads/2021/01/08pr.pdf).
// - Bags are whole: the count is rounded up, so a pour never comes up short by a part of a bag.

import { CUBIC_FEET_PER_CUBIC_YARD, CUBIC_METERS_PER_CUBIC_FOOT, show, toFeet, unitLabel, type LengthUnit } from "./units"

export type Shape = "slab" | "column" | "tube"

export interface Length { value: number; unit: LengthUnit }

export type Pour =
  | { shape: "slab"; length: Length; width: Length; thickness: Length; quantity: number }
  | { shape: "column"; diameter: Length; depth: Length; quantity: number }
  | { shape: "tube"; outer: Length; inner: Length; height: Length; quantity: number }

export const bags = [
  { pounds: 40, cubicFeet: 0.3 },
  { pounds: 50, cubicFeet: 0.375 },
  { pounds: 60, cubicFeet: 0.45 },
  { pounds: 80, cubicFeet: 0.6 },
  { pounds: 90, cubicFeet: 0.675 },
] as const

/** NRMCA CIP 8: 4 to 10 percent. */
export const ALLOWANCE_MIN = 4
export const ALLOWANCE_MAX = 10
export const ALLOWANCE_DEFAULT = 5

const ft = (l: Length) => toFeet(l.value, l.unit)

/** One pour's volume in cubic feet, or a reason it can't be worked out. */
export const pourCubicFeet = (p: Pour): number | "inner" => {
  if (p.shape === "slab") return ft(p.length) * ft(p.width) * ft(p.thickness) * p.quantity
  if (p.shape === "column") return Math.PI * (ft(p.diameter) / 2) ** 2 * ft(p.depth) * p.quantity
  const R = ft(p.outer) / 2, r = ft(p.inner) / 2
  if (r >= R) return "inner"
  return Math.PI * (R * R - r * r) * ft(p.height) * p.quantity
}

export interface Order {
  /** As drawn, before the allowance. */
  plan: { cubicFeet: number; cubicYards: number; cubicMeters: number }
  /** With the allowance added: what to order. */
  order: { cubicFeet: number; cubicYards: number; cubicMeters: number }
  allowancePercent: number
  bags: { pounds: number; cubicFeet: number; count: number; totalPounds: number }[]
}

const volumes = (cubicFeet: number) => ({ cubicFeet, cubicYards: cubicFeet / CUBIC_FEET_PER_CUBIC_YARD, cubicMeters: cubicFeet * CUBIC_METERS_PER_CUBIC_FOOT })

/** Whole bags for a volume. A tiny tolerance keeps exact multiples (e.g. 0.6 ft³ in 80 lb bags) from rounding up. */
export const bagCount = (cubicFeet: number, perBag: number) => Math.ceil(cubicFeet / perBag - 1e-9)

export const order = (cubicFeet: number, allowancePercent: number): Order => {
  const withAllowance = cubicFeet * (1 + allowancePercent / 100)
  return {
    plan: volumes(cubicFeet),
    order: volumes(withAllowance),
    allowancePercent,
    bags: bags.map((b) => {
      const count = bagCount(withAllowance, b.cubicFeet)
      return { ...b, count, totalPounds: count * b.pounds }
    }),
  }
}

// ---- What the page says. One function builds the words for both the server-rendered first answer and every update
// in the browser, so the page never changes height on load (layout shift gate) and both always agree.


export interface ConcreteInput {
  shape: Shape
  /** In the order the shape uses: slab length, width, thickness; column diameter, depth; tube outer, inner, height. */
  lengths: (Length | null)[]
  quantity: number | null
  allowance: number | null
}

export type ConcreteAnswer =
  | { ok: false; message: string }
  | { ok: true; headline: string; plan: string; bags: { pounds: number; count: string; weight: string }[]; lines: string[] }

const shapeNames: Record<Shape, string> = { slab: "slab", column: "column", tube: "round slab or tube" }

export const explain = (input: ConcreteInput): ConcreteAnswer => {
  const { shape, lengths, quantity: qty, allowance: allow } = input
  if (lengths.some((l) => l === null)) return { ok: false, message: "Enter each measurement as a number of zero or more." }
  if (qty === null || qty < 1 || !Number.isInteger(qty)) return { ok: false, message: "Enter how many as a whole number, 1 or more." }
  if (allow === null || allow > 100) return { ok: false, message: "Enter the extra to order as a percent, for example 5." }
  const [a, b, c] = lengths as Length[]
  const pour: Pour = shape === "slab" ? { shape, length: a, width: b, thickness: c, quantity: qty }
    : shape === "column" ? { shape, diameter: a, depth: b, quantity: qty }
    : { shape, outer: a, inner: b, height: c, quantity: qty }
  const v = pourCubicFeet(pour)
  if (v === "inner") return { ok: false, message: "The inner diameter must be smaller than the outer diameter." }
  if (v === 0) return { ok: false, message: "Enter measurements greater than zero." }
  const o = order(v, allow)
  const each = qty > 1 ? ` × ${qty}` : ""
  const d = (lengths as Length[]).map((l) => `${show(l.value, 3)} ${unitLabel(l.unit)}`)
  const formula = shape === "slab"
    ? `Volume = length × width × thickness${each} = ${d.join(" × ")}${each} = ${show(o.plan.cubicFeet)} ft³.`
    : shape === "column"
    ? `Volume = π × (diameter ÷ 2)² × depth${each}, with diameter ${d[0]} and depth ${d[1]} = ${show(o.plan.cubicFeet)} ft³.`
    : `Volume = π × ((outer ÷ 2)² − (inner ÷ 2)²) × height${each}, with outer ${d[0]}, inner ${d[1]} and height ${d[2]} = ${show(o.plan.cubicFeet)} ft³.`
  const eighty = o.bags.find((x) => x.pounds === 80)!
  return {
    ok: true,
    headline: `Order ${show(o.order.cubicYards)} cubic yards (${show(o.order.cubicFeet)} ft³, ${show(o.order.cubicMeters)} m³).`,
    plan: allow > 0
      ? `That is ${show(o.plan.cubicYards)} yd³ as measured, plus ${show(allow, 1)}% extra.${allow < ALLOWANCE_MIN || allow > ALLOWANCE_MAX ? ` That extra is outside the ${ALLOWANCE_MIN}–${ALLOWANCE_MAX}% the ready-mix industry advises.` : ""}`
      : "No extra added: you may run short if the ground is uneven.",
    bags: o.bags.map((x) => ({ pounds: x.pounds, count: show(x.count, 0), weight: `${show(x.totalPounds, 0)} lb` })),
    lines: [
      `Your ${shapeNames[shape]}: ${formula}`,
      `Cubic yards = cubic feet ÷ 27 = ${show(o.plan.cubicFeet)} ÷ 27 = ${show(o.plan.cubicYards)} yd³; with ${show(allow, 1)}% extra, ${show(o.order.cubicYards)} yd³.`,
      `Bags = volume to order ÷ one bag’s yield, rounded up to whole bags: for 80 lb bags, ${show(o.order.cubicFeet)} ÷ 0.60 = ${show(o.order.cubicFeet / 0.6)}, so ${show(eighty.count, 0)} bags.`,
    ],
  }
}

/** The fields each shape uses, in order, with the defaults the page starts from. */
export const shapeFields: Record<Shape, string[]> = { slab: ["length", "width", "thickness"], column: ["diameter", "depth"], tube: ["outer", "inner", "height"] }
