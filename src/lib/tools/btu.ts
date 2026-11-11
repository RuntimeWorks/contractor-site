// Room air conditioner size, from ENERGY STAR's sizing chart (energystar.gov/products/room_air_conditioners, read
// 2026-11-11): capacity by floor area, "calculated based on an 8-foot ceiling", then: if the room is very sunny,
// increase capacity by 10 percent; if more than two people regularly occupy the room, add 600 BTUs for each
// additional person; if the unit is used in a kitchen, increase capacity by 4,000 BTUs.

import { show } from "../units"
import { fail, feet, len, num, pick, type ToolSpec } from "../tool"

/** [area from (sq ft), area up to (sq ft), BTU per hour] */
export const ENERGY_STAR_CHART: [number, number, number][] = [
  [100, 150, 5000], [150, 250, 6000], [250, 300, 7000], [300, 350, 8000], [350, 400, 9000], [400, 450, 10000],
  [450, 550, 12000], [550, 700, 14000], [700, 1000, 18000], [1000, 1200, 21000], [1200, 1400, 23000],
  [1400, 1500, 24000], [1500, 2000, 30000], [2000, 2500, 34000],
]

export const chartBtu = (sqft: number) => ENERGY_STAR_CHART.find(([a, b]) => sqft >= a && sqft < b)?.[2] ?? (sqft === 2500 ? 34000 : null)

export const btu: ToolSpec = {
  id: "btu",
  heading: "Work out the size",
  fields: [
    { kind: "length", id: "length", label: "Room length", value: "15", unit: "ft" },
    { kind: "length", id: "width", label: "Room width", value: "12", unit: "ft" },
    { kind: "select", id: "sun", label: "Sun", value: "normal", options: [{ value: "normal", label: "Not especially sunny" }, { value: "sunny", label: "Very sunny" }] },
    { kind: "number", id: "people", label: "People usually in the room", value: "2", whole: true },
    { kind: "select", id: "kitchen", label: "Used in a kitchen", value: "no", options: [{ value: "no", label: "No" }, { value: "yes", label: "Yes" }] },
  ],
  explain: (v) => {
    const l = len(v, "length"), w = len(v, "width"), people = num(v, "people")
    if (!l || !w) return fail("Enter the room's length and width as numbers.")
    if (people === null || !Number.isInteger(people)) return fail("Enter the number of people as a whole number.")
    const sqft = feet(l) * feet(w)
    const base = chartBtu(sqft)
    if (base === null) return fail(`${show(sqft, 0)} sq ft is outside ENERGY STAR's chart, which covers 100 to 2,500 sq ft.`)
    const sunny = pick(v, "sun") === "sunny" ? base * 0.1 : 0
    const extraPeople = Math.max(0, people - 2) * 600
    const kitchen = pick(v, "kitchen") === "yes" ? 4000 : 0
    const total = base + sunny + extraPeople + kitchen
    const lines = [`${show(feet(l), 2)} ft × ${show(feet(w), 2)} ft = ${show(sqft, 0)} sq ft: ENERGY STAR's chart gives ${show(base, 0)} BTU per hour.`]
    if (sunny) lines.push(`Very sunny: plus 10% = plus ${show(sunny, 0)} BTU.`)
    if (extraPeople) lines.push(`${people - 2} more than two people × 600 = plus ${show(extraPeople, 0)} BTU.`)
    if (kitchen) lines.push(`Kitchen: plus 4,000 BTU.`)
    lines.push(`The chart assumes an 8-foot ceiling.`)
    return { ok: true, headline: `About ${show(total, 0)} BTU per hour.`, extra: null, lines }
  },
}
