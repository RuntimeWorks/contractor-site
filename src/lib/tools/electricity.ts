// What an appliance costs to run. kWh = watts × hours a day × days ÷ 1,000; cost = kWh × price. Starting price: the
// US average residential price in August 2026, 18.16 cents per kWh (EIA, Electric Power Monthly, Table 5.6.A,
// eia.gov/electricity/monthly/epm_table_grapher.php?t=epmt_5_6_a, read 2026-11-11). Your bill shows your own price.

import { show } from "../units"
import { fail, num, type ToolSpec } from "../tool"

export const EIA_US_RESIDENTIAL_CENTS = 18.16

export const electricity: ToolSpec = {
  id: "power",
  heading: "Work out the cost",
  fields: [
    { kind: "number", id: "watts", label: "Power (watts)", value: "1500", hint: "On the label. A space heater is often 1,500 W." },
    { kind: "number", id: "hours", label: "Hours used per day", value: "4" },
    { kind: "number", id: "days", label: "Days", value: "30", whole: true },
    { kind: "number", id: "price", label: "Price (cents per kWh)", value: "18.16", hint: "US average, August 2026 (EIA). Your bill has yours." },
  ],
  explain: (v) => {
    const w = num(v, "watts"), h = num(v, "hours"), d = num(v, "days"), p = num(v, "price")
    if (w === null || h === null || d === null || p === null) return fail("Enter the watts, hours, days and price as numbers.")
    if (h > 24) return fail("A day has 24 hours; enter 24 or fewer.")
    const kwh = (w * h * d) / 1000
    const cost = (kwh * p) / 100
    return {
      ok: true,
      headline: `$${show(cost, 2)} for ${show(d, 0)} days.`,
      extra: `${show(kwh, 2)} kWh; $${show(d ? cost / d : 0, 2)} a day.`,
      lines: [
        `Energy = ${show(w, 0)} W × ${show(h, 2)} h × ${show(d, 0)} days ÷ 1,000 = ${show(kwh, 2)} kWh.`,
        `Cost = ${show(kwh, 2)} kWh × ${show(p, 2)}¢ = $${show(cost, 2)}.`,
      ],
    }
  },
}
