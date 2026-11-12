// OSHA incidence rates from the OSHA 300 log: rate = cases × 200,000 ÷ hours worked by all employees, where 200,000
// hours is 100 full-time workers at 40 hours a week for 50 weeks (U.S. Bureau of Labor Statistics, "How To Compute
// Your Firm's Incidence Rate for Safety Management", read 2026-11-11, with its worked example: 7 cases and 400,000
// hours give 3.5). Total recordable cases are columns H + I + J of the 300 log; DART cases (days away, restricted or
// transferred) are H + I; days-away cases are H. For comparison, BLS Table 1 for 2024 (published 2026-01-22): private
// industry 2.3 total recordable cases, 1.4 DART and 0.8 days away per 100 full-time workers; construction 2.2, 1.3, 0.9.
import { fail, num, type ToolSpec } from "../tool"

export const BASE_HOURS = 200_000
export const rate = (cases: number, hours: number) => (cases * BASE_HOURS) / hours
export const BENCH_2024 = { private: { trc: 2.3, dart: 1.4, away: 0.8 }, construction: { trc: 2.2, dart: 1.3, away: 0.9 } }

export const incidenceRate: ToolSpec = {
  id: "osha",
  heading: "Work out OSHA incidence rates",
  fields: [
    { kind: "number", id: "h", label: "Cases with days away from work (column H)", value: "2", whole: true },
    { kind: "number", id: "i", label: "Cases with job transfer or restriction (column I)", value: "1", whole: true },
    { kind: "number", id: "j", label: "Other recordable cases (column J)", value: "4", whole: true },
    { kind: "number", id: "hours", label: "Hours worked by all employees in the year", value: "400000", hint: "From payroll or the OSHA 300A summary. Leave out paid time off." },
  ],
  explain: (v) => {
    const h = num(v, "h"), i = num(v, "i"), j = num(v, "j"), hours = num(v, "hours")
    if (h === null || i === null || j === null) return fail("Enter each count of cases, 0 where there are none.")
    if (hours === null || hours === 0) return fail("Enter the hours worked by all employees, more than 0.")
    const trc = rate(h + i + j, hours), dart = rate(h + i, hours), away = rate(h, hours)
    const f = (x: number) => x.toFixed(2)
    const b = BENCH_2024
    return {
      ok: true,
      headline: `Total recordable case rate (TRIR) ${f(trc)}.`,
      extra: `DART rate ${f(dart)}; days-away rate ${f(away)}. All per 100 full-time workers.`,
      lines: [
        `TRIR = (${h} + ${i} + ${j}) × 200,000 ÷ ${hours.toLocaleString("en-US")} = ${f(trc)}. DART uses columns H + I: ${h + i} cases.`,
        `For comparison, in 2024 private industry averaged ${b.private.trc} (DART ${b.private.dart}) and construction ${b.construction.trc} (DART ${b.construction.dart}), per BLS.`,
        hours < 200_000 ? "With under 200,000 hours, about 100 full-time workers, one case moves the rate a lot: compare several years." : "Rates are per 100 full-time workers, so firms of different sizes can be compared.",
      ],
    }
  },
}
