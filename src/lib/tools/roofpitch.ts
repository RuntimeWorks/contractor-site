// Roof pitch from rise and run. In US roofing, pitch is said as inches of rise per 12 inches of run ("6 in 12").
// The angle is atan(rise ÷ run); the pitch multiplier, √(1 + (rise ÷ run)²), turns a flat (plan) area into the
// sloped area of the roof. Plain trigonometry, no outside figures.

import { show } from "../units"
import { fail, inches, len, type ToolSpec } from "../tool"

export const pitchFactor = (risePer12: number) => Math.sqrt(1 + (risePer12 / 12) ** 2)

export const roofPitch: ToolSpec = {
  id: "pitch",
  heading: "Work out the pitch",
  fields: [
    { kind: "length", id: "rise", label: "Rise", value: "6", unit: "in", hint: "How far the roof climbs over the run." },
    { kind: "length", id: "run", label: "Run", value: "12", unit: "in", hint: "Measured level. 12 in gives pitch directly." },
  ],
  explain: (v) => {
    const r = len(v, "rise"), n = len(v, "run")
    if (!r || !n) return fail("Enter the rise and the run as numbers.")
    const rise = inches(r), run = inches(n)
    if (run <= 0) return fail("Enter a run greater than zero.")
    const per12 = (rise / run) * 12
    const angle = (Math.atan2(rise, run) * 180) / Math.PI
    return {
      ok: true,
      headline: `${show(per12, 2)} in 12 pitch, ${show(angle, 2)}°.`,
      extra: `Pitch multiplier ${show(pitchFactor(per12), 4)}: a roof over 1,000 sq ft of plan is ${show(1000 * pitchFactor(per12), 0)} sq ft of slope.`,
      lines: [
        `Pitch = ${show(rise, 3)} ÷ ${show(run, 3)} × 12 = ${show(per12, 2)} in 12. Slope = ${show((rise / run) * 100, 1)}%.`,
        `Angle = atan(${show(rise, 3)} ÷ ${show(run, 3)}) = ${show(angle, 2)}°.`,
        `Multiplier = √(1 + (${show(per12, 2)} ÷ 12)²) = ${show(pitchFactor(per12), 4)}.`,
      ],
    }
  },
}
