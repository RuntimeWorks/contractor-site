// Known answers for the calculators built on src/lib/tool.ts, worked by hand from the rules and sources in each
// tool's file under src/lib/tools/.
import { describe, expect, it } from "vitest"
import { registry } from "../src/lib/registry"
import { startValues, type Values } from "../src/lib/tool"
import { pitchFactor } from "../src/lib/tools/roofpitch"
import { chartBtu } from "../src/lib/tools/btu"
import { GALLONS_PER_CUBIC_FOOT } from "../src/lib/tools/pool"

const run = (id: string, over: Values = {}) => {
  const spec = registry[id]
  const a = spec.explain({ ...startValues(spec.fields), ...over })
  if (!a.ok) throw new Error(a.message)
  return a
}
const L = (value: number, unit: "ft" | "in" | "yd" | "m" | "cm" = "ft") => ({ value, unit })

describe("every calculator", () => {
  it("answers its own starting values", () => {
    for (const spec of Object.values(registry)) expect(spec.explain(startValues(spec.fields)).ok, spec.id).toBe(true)
  })
  it("refuses blank fields instead of showing a wrong number", () => {
    for (const spec of Object.values(registry)) {
      const blank = Object.fromEntries(spec.fields.filter((f) => f.kind !== "select").map((f) => [f.id, null]))
      expect(spec.explain({ ...startValues(spec.fields), ...blank }).ok, spec.id).toBe(false)
    }
  })
})

describe("stairs", () => {
  it("108 in of rise at 7¾ in risers is 14 risers of 7.714 in and 13 treads, 130 in of run", () => {
    const a = run("stairs")
    expect(a.headline).toBe("14 risers of 7.714 in and 13 treads.")
    expect(a.extra).toContain("Total run 130 in")
    expect(a.lines[3]).toContain("Within the IRC limits")
  })
  it("flags a tread under 10 in", () => {
    expect(run("stairs", { tread: L(9, "in") }).lines[3]).toContain("Outside the IRC limits")
  })
})

describe("roof pitch and roofing", () => {
  it("6 in 12 is 26.57° with a multiplier of 1.1180", () => {
    expect(pitchFactor(6)).toBeCloseTo(Math.sqrt(1.25), 12)
    expect(run("pitch").headline).toBe("6 in 12 pitch, 26.57°.")
  })
  it("a 50 × 30 ft footprint at 6 in 12 is 1,677 sq ft: 16.77 squares, 51 bundles at 3 per square", () => {
    const a = run("roofing")
    expect(a.headline).toBe("16.77 squares: 51 bundles.")
  })
  it("adds the waste the user enters", () => {
    expect(run("roofing", { waste: 10 }).headline).toBe("18.45 squares: 56 bundles.")
  })
})

describe("pool", () => {
  it("a US gallon is 231 in³, so a cubic foot is 7.4805 gallons", () => {
    expect(GALLONS_PER_CUBIC_FOOT).toBeCloseTo(7.48052, 5)
  })
  it("32 × 16 ft, 3.5 to 6 ft deep, is 2,432 ft³ or 18,193 gallons", () => {
    expect(run("pool").headline).toBe("18,193 US gallons.")
  })
  it("a round pool 24 ft across, 4 ft deep, is π × 144 × 4 = 1,809.6 ft³", () => {
    const a = run("pool", { shape: "round", length: L(24), shallow: L(4), deep: L(4) })
    expect(a.extra).toContain("1,809.6 cubic feet")
  })
})

describe("fence", () => {
  it("100 ft at 8 ft spacing: 13 sections, 14 posts, 26 rails; 12.89 ft³ of concrete, 22 bags of 80 lb", () => {
    const a = run("fence")
    expect(a.headline).toBe("14 posts, 13 sections, 26 rails.")
    expect(a.extra).toContain("22 bags of 80 lb")
    expect(a.extra).toContain("35 of 50 lb")
  })
})

describe("tile", () => {
  it("12 × 10 ft with 12 in tiles and ⅛ in joints is 118 tiles", () => {
    expect(run("tile").headline).toBe("118 tiles.")
    expect(run("tile", { box: 15 }).headline).toBe("118 tiles (8 boxes of 15).")
  })
})

describe("drywall and paint", () => {
  it("a 14 × 12 ft room, 8 ft walls, less a 21 sq ft door, is 395 sq ft: 13 sheets of 4 × 8", () => {
    expect(run("drywall").headline).toBe("13 sheets of 4 × 8 ft.")
  })
  it("the same room, two coats at 350 sq ft a gallon, is 2.26 gallons", () => {
    expect(run("paint").headline).toBe("2.26 gallons: buy 3.")
  })
})

describe("btu", () => {
  it("follows ENERGY STAR's chart at its edges", () => {
    expect(chartBtu(149.9)).toBe(5000)
    expect(chartBtu(150)).toBe(6000)
    expect(chartBtu(2500)).toBe(34000)
    expect(chartBtu(99)).toBeNull()
  })
  it("15 × 12 ft is 180 sq ft: 6,000 BTU; very sunny, four people and a kitchen add 600, 1,200 and 4,000", () => {
    expect(run("btu").headline).toBe("About 6,000 BTU per hour.")
    expect(run("btu", { sun: "sunny", people: 4, kitchen: "yes" }).headline).toBe("About 11,800 BTU per hour.")
  })
})

describe("rebar", () => {
  it("a 20 × 10 ft slab at 12 in with 3 in edges is 385 ft of #4, 257 lb", () => {
    expect(run("rebar").headline).toBe("385 ft of #4 bar, 257 lb.")
  })
})

describe("electricity", () => {
  it("1,500 W for 4 h a day for 30 days is 180 kWh, $32.69 at 18.16¢", () => {
    expect(run("power").headline).toBe("$32.69 for 30 days.")
  })
})

describe("masonry, paving, flooring, siding, decks and walls", () => {
  it("a 40 × 4 ft wall is 160 sq ft × 1.125 = 180 blocks (NCMA nominal 8 × 16 in face)", () => {
    expect(run("block").headline).toBe("180 blocks of 8 × 8 × 16 in.")
  })
  it("modular brick with ⅜ in joints is 6.86 a sq ft: a 30 × 8 ft wall less 21 sq ft is 1,502 bricks", () => {
    // 219 sq ft × 144 ÷ 21 = 1,501.7.
    const a = run("brick")
    expect(a.headline).toBe("1,502 bricks.")
    expect(a.extra).toContain("6.86 bricks per sq ft")
  })
  it("50 × 12 ft at 3 in and 145 lb/ft³ is 150 ft³, 10.88 tons", () => {
    expect(run("asphalt").headline).toBe("10.88 tons of asphalt.")
  })
  it("flooring, siding, decks and walls", () => {
    expect(run("floor").headline).toBe("9 boxes.")
    // walls 160 × 9 = 1,440; gables 2 × 30 × 7 ÷ 2 = 210; less 180 = 1,470 sq ft = 14.7 squares.
    expect(run("siding").headline).toBe("14.7 squares of siding.")
    // 144 in ÷ 5.625 = 25.6 → 26 rows of one 16 ft board; joists 192 ÷ 16 + 1 = 13.
    expect(run("deck").headline).toBe("26 boards of 16 ft and 13 joists.")
    // 360 ÷ 12 = 30 a course; 24 ÷ 4 = 6 + 1 buried = 7 courses; 30 caps.
    expect(run("wall").headline).toBe("210 blocks and 30 caps.")
  })
})

// ---------- OSHA incidence rates ----------
import { rate } from "../src/lib/tools/safety"

describe("OSHA incidence rates", () => {
  it("matches the BLS worked example: 7 cases over 400,000 hours is 3.5, 3 serious cases 1.5", () => {
    expect(rate(7, 400_000)).toBe(3.5)
    expect(rate(3, 400_000)).toBe(1.5)
  })
  it("adds columns H, I and J for TRIR and H, I for DART", () => {
    const a = run("osha", { h: 2, i: 1, j: 4, hours: 400000 })
    expect(a.headline).toBe("Total recordable case rate (TRIR) 3.50.")
    expect(a.extra).toBe("DART rate 1.50; days-away rate 1.00. All per 100 full-time workers.")
  })
  it("warns that small firms' rates swing", () => {
    expect(run("osha", { hours: 50000 }).lines[2]).toMatch(/one case moves the rate/)
  })
})
