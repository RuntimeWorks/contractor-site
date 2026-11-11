// Stairs from the total rise. The number of risers is the total rise divided by the tallest riser allowed, rounded up;
// every riser is then the same height, and there is one tread fewer than risers (the top step is the floor).
// Limits checked: International Residential Code 2021, R311.7.5.1 (riser height not more than 7¾ in) and R311.7.5.2
// (tread depth not less than 10 in), read 2026-11-11 in the City of Boise's IRC handout
// (cityofboise.org/media/14405/437-treads-risers_march-2022.pdf). Local codes can differ.

import { show } from "../units"
import { fail, inches, len, type ToolSpec } from "../tool"

export const IRC_MAX_RISER_IN = 7.75
export const IRC_MIN_TREAD_IN = 10

export const stairs: ToolSpec = {
  id: "stairs",
  heading: "Work out the steps",
  fields: [
    { kind: "length", id: "rise", label: "Total rise, floor to floor", value: "108", unit: "in", hint: "Finished floor below to finished floor above." },
    { kind: "length", id: "maxriser", label: "Tallest riser allowed", value: "7.75", unit: "in", hint: "7¾ in is the IRC limit; use your local code." },
    { kind: "length", id: "tread", label: "Tread depth", value: "10", unit: "in", hint: "At least 10 in under the IRC." },
  ],
  explain: (v) => {
    const r = len(v, "rise"), m = len(v, "maxriser"), t = len(v, "tread")
    if (!r || !m || !t) return fail("Enter the total rise, the tallest riser and the tread depth as numbers.")
    const rise = inches(r), maxR = inches(m), tread = inches(t)
    if (rise <= 0 || maxR <= 0 || tread <= 0) return fail("Enter measurements greater than zero.")
    const risers = Math.ceil(rise / maxR - 1e-9)
    const h = rise / risers
    const treads = risers - 1
    const run = treads * tread
    const stringer = Math.hypot(rise, run)
    const angle = (Math.atan2(h, tread) * 180) / Math.PI
    const ok = h <= IRC_MAX_RISER_IN + 1e-9 && tread >= IRC_MIN_TREAD_IN - 1e-9
    return {
      ok: true,
      headline: `${risers} risers of ${show(h, 3)} in and ${treads} treads.`,
      extra: `Total run ${show(run, 2)} in (${show(run / 12, 2)} ft). Stringer about ${show(stringer, 1)} in (${show(stringer / 12, 2)} ft) at ${show(angle, 1)}°.`,
      lines: [
        `Risers = ${show(rise, 3)} in ÷ ${show(maxR, 3)} in = ${show(rise / maxR, 3)}, rounded up to ${risers}.`,
        `Each riser = ${show(rise, 3)} in ÷ ${risers} = ${show(h, 3)} in. Treads = ${risers} − 1 = ${treads}.`,
        `Run = ${treads} × ${show(tread, 3)} in = ${show(run, 2)} in. Stringer = √(${show(rise, 2)}² + ${show(run, 2)}²) = ${show(stringer, 1)} in.`,
        ok ? `Within the IRC limits: riser ${show(h, 3)} in ≤ 7.75 in and tread ${show(tread, 3)} in ≥ 10 in.` : `Outside the IRC limits (riser ≤ 7.75 in, tread ≥ 10 in): check your local code before you cut.`,
      ],
    }
  },
}
