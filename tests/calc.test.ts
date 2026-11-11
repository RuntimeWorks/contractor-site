// Known answers, worked by hand from the formulas and sources named in src/lib/concrete.ts and src/lib/area.ts.
import { describe, expect, it } from "vitest"
import { bagCount, explain, order, pourCubicFeet } from "../src/lib/concrete"
import { area, explainArea, partSquareFeet, total } from "../src/lib/area"
import { readNumber, toFeet } from "../src/lib/units"

const L = (value: number, unit: "ft" | "in" | "yd" | "m" | "cm" = "ft") => ({ value, unit })

describe("units", () => {
  it("converts exactly", () => {
    expect(toFeet(12, "in")).toBeCloseTo(1, 12)
    expect(toFeet(1, "yd")).toBeCloseTo(3, 12)
    expect(toFeet(0.3048, "m")).toBeCloseTo(1, 12)
    expect(toFeet(30.48, "cm")).toBeCloseTo(1, 12)
  })
  it("reads numbers the way people type them", () => {
    expect(readNumber(" 1,250.5 ")).toBe(1250.5)
    expect(readNumber("")).toBeNull()
    expect(readNumber("-3")).toBeNull()
    expect(readNumber("abc")).toBeNull()
  })
})

describe("concrete", () => {
  it("a 10 × 10 ft slab, 4 in thick, is 33.33 ft³ or 1.23 yd³", () => {
    const v = pourCubicFeet({ shape: "slab", length: L(10), width: L(10), thickness: L(4, "in"), quantity: 1 }) as number
    expect(v).toBeCloseTo(100 / 3, 9)
    expect(order(v, 0).plan.cubicYards).toBeCloseTo(1.2346, 4)
  })
  it("a 12 in round column 10 ft deep is π × 0.5² × 10 = 7.854 ft³", () => {
    expect(pourCubicFeet({ shape: "column", diameter: L(12, "in"), depth: L(10), quantity: 1 })).toBeCloseTo(7.85398, 4)
  })
  it("a tube is the outer circle less the inner one, and an inner bigger than the outer is refused", () => {
    expect(pourCubicFeet({ shape: "tube", outer: L(2), inner: L(1), height: L(1), quantity: 1 })).toBeCloseTo(Math.PI * 0.75, 9)
    expect(pourCubicFeet({ shape: "tube", outer: L(1), inner: L(2), height: L(1), quantity: 1 })).toBe("inner")
  })
  it("quantity multiplies", () => {
    expect(pourCubicFeet({ shape: "slab", length: L(2), width: L(2), thickness: L(1), quantity: 3 })).toBeCloseTo(12, 9)
  })
  it("bags round up, and exact multiples do not", () => {
    expect(bagCount(0.6, 0.6)).toBe(1)
    expect(bagCount(1.2, 0.6)).toBe(2)
    expect(bagCount(1.21, 0.6)).toBe(3)
    // 33.33 ft³ in 80 lb bags (0.60 ft³ each, Quikrete data sheet) is 55.6, so 56 bags.
    expect(order(100 / 3, 0).bags.find((b) => b.pounds === 80)!.count).toBe(56)
  })
  it("the allowance is added before bags are counted", () => {
    const o = order(100 / 3, 10)
    expect(o.order.cubicFeet).toBeCloseTo(36.6667, 4)
    expect(o.bags.find((b) => b.pounds === 80)!.count).toBe(62) // 36.67 / 0.6 = 61.1
    expect(o.bags.find((b) => b.pounds === 60)!.totalPounds).toBe(82 * 60) // 36.67 / 0.45 = 81.5
  })
  it("cubic meters use the exact foot", () => {
    expect(order(1, 0).plan.cubicMeters).toBeCloseTo(0.028316846592, 12)
  })
})

describe("area", () => {
  it("a 12 × 10 ft room is 120 ft², 13.33 yd², 11.148 m²", () => {
    const a = area(partSquareFeet({ shape: "rectangle", length: L(12), width: L(10), quantity: 1 }))
    expect(a.squareFeet).toBeCloseTo(120, 9)
    expect(a.squareYards).toBeCloseTo(13.3333, 4)
    expect(a.squareMeters).toBeCloseTo(11.14836, 5)
  })
  it("circle, triangle and trapezoid", () => {
    expect(partSquareFeet({ shape: "circle", diameter: L(10), quantity: 1 })).toBeCloseTo(78.5398, 4)
    expect(partSquareFeet({ shape: "triangle", base: L(6), height: L(4), quantity: 1 })).toBeCloseTo(12, 9)
    expect(partSquareFeet({ shape: "trapezoid", sideA: L(4), sideB: L(6), height: L(3), quantity: 1 })).toBeCloseTo(15, 9)
  })
  it("one acre is 43,560 ft²", () => {
    expect(area(43560).acres).toBeCloseTo(1, 12)
  })
  it("cut-outs are taken away, and more cut-out than floor is refused", () => {
    const room = { shape: "rectangle" as const, length: L(20), width: L(10), quantity: 1 }
    const island = { shape: "rectangle" as const, length: L(4), width: L(2), quantity: 1, subtract: true }
    expect(total([room, island])).toBeCloseTo(192, 9)
    expect(total([{ ...island, subtract: false }, { ...room, subtract: true }])).toBe("negative")
  })
})

describe("what the pages say", () => {
  it("concrete: the starting slab, in words", () => {
    const a = explain({ shape: "slab", lengths: [L(10), L(10), L(4, "in")], quantity: 1, allowance: 5 })
    if (!a.ok) throw new Error(a.message)
    expect(a.headline).toBe("Order 1.3 cubic yards (35 ft³, 0.99 m³).")
    expect(a.bags.find((b) => b.pounds === 80)).toEqual({ pounds: 80, count: "59", weight: "4,720 lb" })
    expect(a.lines[0]).toBe("Your slab: Volume = length × width × thickness = 10 feet × 10 feet × 4 inches = 33.33 ft³.")
  })
  it("concrete: bad input gets a plain message, not a number", () => {
    expect(explain({ shape: "slab", lengths: [null, L(1), L(1)], quantity: 1, allowance: 5 })).toEqual({ ok: false, message: "Enter each measurement as a number of zero or more." })
    expect(explain({ shape: "slab", lengths: [L(1), L(1), L(1)], quantity: 1.5, allowance: 5 }).ok).toBe(false)
    expect(explain({ shape: "tube", lengths: [L(1), L(2), L(1)], quantity: 1, allowance: 5 })).toEqual({ ok: false, message: "The inner diameter must be smaller than the outer diameter." })
    expect(explain({ shape: "slab", lengths: [L(0), L(1), L(1)], quantity: 1, allowance: 5 })).toEqual({ ok: false, message: "Enter measurements greater than zero." })
  })
  it("concrete: an extra outside 4-10% is flagged", () => {
    const a = explain({ shape: "slab", lengths: [L(1), L(1), L(1)], quantity: 1, allowance: 20 })
    expect(a.ok && a.plan.includes("outside the 4–10%")).toBe(true)
  })
  it("area: the starting room, with extra and a price", () => {
    const a = explainArea([{ shape: "rectangle", lengths: [L(12), L(10)], quantity: 1, subtract: false }], 10, 3.5)
    if (!a.ok) throw new Error(a.message)
    expect(a.headline).toBe("132 square feet, including 10% extra.")
    expect(a.cost).toBe("At $3.5 per square foot: $462.")
    expect(a.rows[2]).toEqual(["Square meters", "12.26"])
  })
  it("area: names the part with the problem", () => {
    expect(explainArea([{ shape: "rectangle", lengths: [L(1), L(1)], quantity: 1, subtract: false }, { shape: "circle", lengths: [null], quantity: 1, subtract: false }], 0, null)).toEqual({ ok: false, message: "Part 2: enter each measurement as a number of zero or more." })
  })
})

import { explainMaterial } from "../src/lib/materials"
import { boardFeet, explainBoards } from "../src/lib/boardfeet"

describe("materials and lumber", () => {
  it("gravel: 10 × 10 ft, 4 in deep is 1.23 yd³; at 2,850 lb a yard (Caterpillar, loose), 1.76 tons", () => {
    const a = explainMaterial({ material: "gravel-mixed", useArea: false, length: L(10), width: L(10), squareFeet: null, depth: L(4, "in"), bagCubicFeet: null })
    if (!a.ok) throw new Error(a.message)
    expect(a.headline).toBe("1.23 cubic yards, about 1.76 tons.")
  })
  it("mulch by area and bags: 200 ft² at 3 in is 50 ft³, 25 bags of 2 ft³, no weight", () => {
    const a = explainMaterial({ material: "mulch", useArea: true, length: null, width: null, squareFeet: 200, depth: L(3, "in"), bagCubicFeet: 2 })
    if (!a.ok) throw new Error(a.message)
    expect(a.headline).toBe("1.85 cubic yards.")
    expect(a.rows.find((r) => r[0].startsWith("Bags"))?.[1]).toBe("25")
    expect(a.rows.some((r) => r[0] === "Weight")).toBe(false)
  })
  it("materials: a half-typed length is named, not read as zero", () => {
    expect(explainMaterial({ material: "topsoil", useArea: false, length: null, width: L(3), squareFeet: null, depth: L(4, "in"), bagCubicFeet: null })).toEqual({ ok: false, message: "Enter both a length and a width, as numbers of zero or more." })
  })
  it("board feet: a 2 × 6 × 8 ft is 8 board feet; 1 × 12 × 1 ft is 1", () => {
    expect(boardFeet(L(2, "in"), L(6, "in"), L(8), 1)).toBeCloseTo(8, 9)
    expect(boardFeet(L(1, "in"), L(12, "in"), L(1), 1)).toBeCloseTo(1, 9)
    const a = explainBoards(L(2, "in"), L(4, "in"), L(10), 25, 1.2)
    if (!a.ok) throw new Error(a.message)
    expect(a.headline).toBe("166.67 board feet.")
    expect(a.cost).toBe("At $1.2 per board foot: $200.")
  })
})
