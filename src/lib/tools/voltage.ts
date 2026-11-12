// Voltage drop, worked from first principles rather than copied tables. A wire's area: AWG diameters follow
// d = 0.005 in × 92^((36 − n)/39) (ASTM B258; 0 is n = 0, 2/0 is −1, 3/0 −2, 4/0 −3), and area in circular mils is the
// diameter in thousandths of an inch, squared; kcmil sizes are their area. Resistance: annealed copper at 100% IACS is
// 10.371 Ω·cmil/ft at 20 °C with a temperature coefficient of 0.00393 per °C, and EC aluminum (1350) is 61% IACS with
// 0.00403 per °C (the International Annealed Copper Standard, IEC 60028, still how conductivity is stated). At 75 °C,
// the temperature the NEC's Chapter 9 Table 8 uses, that gives 1.931 Ω per 1,000 ft for solid 12 AWG copper (the table
// prints 1.93); stranded wire is about 2% higher because the strands spiral (the table's 1.98), so stranded adds 2%.
// Tests hold the results within 1.5% of Table 8 from 14 AWG to 500 kcmil. Drop = 2 × length × R × current for
// single-phase or DC (out and back), √3 × length × R × current for three-phase. AC reactance is left out: it is small up
// to about 4/0 at 60 Hz.
import { fail, num, pick, type ToolSpec } from "../tool"

export const SIZES: { label: string; cmil: number }[] = [
  ...[18, 16, 14, 12, 10, 8, 6, 4, 3, 2, 1, 0, -1, -2, -3].map((n) => {
    const d = 5 * 92 ** ((36 - n) / 39) // thousandths of an inch
    return { label: n > 0 ? `${n} AWG` : `${1 - n}/0 AWG`, cmil: d * d }
  }),
  ...[250, 300, 350, 400, 500].map((k) => ({ label: `${k} kcmil`, cmil: k * 1000 })),
]
const K20 = { copper: 10.371, aluminum: 10.371 / 0.61 }, ALPHA = { copper: 0.00393, aluminum: 0.00403 }
export type Metal = keyof typeof K20

/** DC resistance in ohms per 1,000 ft at a conductor temperature (°C). */
export const ohmsPerKft = (cmil: number, metal: Metal, stranded: boolean, temp = 75) => (K20[metal] * (1 + ALPHA[metal] * (temp - 20)) * (stranded ? 1.02 : 1) * 1000) / cmil

/** Volts lost in the wire: out and back for single-phase or DC, √3 for three-phase. */
export const drop = (amps: number, oneWayFt: number, ohmsKft: number, phase: "1" | "3") => (phase === "3" ? Math.sqrt(3) : 2) * oneWayFt * (ohmsKft / 1000) * amps

const FT_PER_M = 1 / 0.3048
export const voltageDrop: ToolSpec = {
  id: "vdrop",
  heading: "Work out voltage drop",
  fields: [
    { kind: "select", id: "phase", label: "Circuit", value: "1", options: [{ value: "1", label: "Single-phase or DC (two wires)" }, { value: "3", label: "Three-phase" }] },
    { kind: "number", id: "volts", label: "Supply voltage", value: "240" },
    { kind: "number", id: "amps", label: "Current (amps)", value: "30" },
    { kind: "number", id: "length", label: "Length of the run, one way", value: "150", hint: "From the panel to the load, not out and back." },
    { kind: "select", id: "unit", label: "Length in", value: "ft", options: [{ value: "ft", label: "Feet" }, { value: "m", label: "Metres" }] },
    { kind: "select", id: "metal", label: "Conductor", value: "copper", options: [{ value: "copper", label: "Copper" }, { value: "aluminum", label: "Aluminum" }] },
    { kind: "select", id: "size", label: "Wire size", value: "10 AWG", options: SIZES.map((s) => ({ value: s.label, label: s.label })) },
    { kind: "select", id: "strand", label: "Wire type", value: "stranded", options: [{ value: "stranded", label: "Stranded" }, { value: "solid", label: "Solid" }] },
  ],
  explain: (v) => {
    const volts = num(v, "volts"), amps = num(v, "amps"), len = num(v, "length")
    if (volts === null || volts <= 0) return fail("Enter the supply voltage, more than 0.")
    if (amps === null || amps <= 0) return fail("Enter the current in amps, more than 0.")
    if (len === null || len <= 0) return fail("Enter the one-way length of the run, more than 0.")
    const phase = pick(v, "phase") === "3" ? "3" : "1", metal = (pick(v, "metal") === "aluminum" ? "aluminum" : "copper") as Metal, stranded = pick(v, "strand") !== "solid"
    const ft = pick(v, "unit") === "m" ? len * FT_PER_M : len, size = SIZES.find((s) => s.label === pick(v, "size")) ?? SIZES[4]
    const r = ohmsPerKft(size.cmil, metal, stranded), vd = drop(amps, ft, r, phase), pct = (vd / volts) * 100
    const fits = SIZES.find((s) => (drop(amps, ft, ohmsPerKft(s.cmil, metal, stranded), phase) / volts) * 100 <= 3)
    const f2 = (x: number) => x.toFixed(2)
    return {
      ok: true,
      headline: `Voltage drop ${f2(vd)} V, ${f2(pct)}%.`,
      extra: `About ${f2(volts - vd)} V reaches the load.`,
      lines: [
        `${phase === "3" ? "√3" : "2"} × ${Math.round(ft).toLocaleString("en-US")} ft × ${r.toPrecision(3)} Ω per 1,000 ft × ${amps} A = ${f2(vd)} V, using ${size.label} ${stranded ? "stranded" : "solid"} ${metal} at 75 °C.`,
        pct <= 3 ? "Within 3%, the drop the NEC suggests as a limit for a branch circuit (5% for feeder and branch together). It is a recommendation, not a requirement." : `Over 3%, the drop the NEC suggests as a limit for a branch circuit. ${fits ? `The smallest ${metal} size within 3% here is ${fits.label}.` : "No size up to 500 kcmil keeps it within 3%; shorten the run or split the load."}`,
        "This sizes for voltage drop only: the wire must also carry the current (its ampacity) under the code that applies to you.",
      ],
    }
  },
}
