// Length units and exact conversions. Since the 1959 international yard and pound agreement, 1 yard = 0.9144 m,
// so 1 ft = 0.3048 m and 1 in = 0.0254 m exactly (NIST SP 811, 2008, Appendix B; NIST Handbook 44, Appendix C).
// Everything is converted to feet inside the calculators and back out only for display.

export type LengthUnit = "ft" | "in" | "yd" | "m" | "cm"

export const lengthUnits: { value: LengthUnit; label: string }[] = [
  { value: "ft", label: "feet" },
  { value: "in", label: "inches" },
  { value: "yd", label: "yards" },
  { value: "m", label: "meters" },
  { value: "cm", label: "centimeters" },
]

/** The word shown for a unit ("feet", "inches"...). */
export const unitLabel = (u: LengthUnit) => lengthUnits.find((x) => x.value === u)!.label

const METERS_PER: Record<LengthUnit, number> = { ft: 0.3048, in: 0.0254, yd: 0.9144, m: 1, cm: 0.01 }

/** A length in any unit, in feet. */
export const toFeet = (value: number, unit: LengthUnit) =>
  // Inches, feet and yards by exact division or multiplication, so 3 in is exactly 0.25 ft (going through meters
  // left 0.24999…, which turned 10.875 into 10.87 on the page). Metric through the exact 0.3048 m.
  unit === "ft" ? value : unit === "in" ? value / 12 : unit === "yd" ? value * 3 : (value * METERS_PER[unit]) / METERS_PER.ft

/** 1 ft³ = 0.3048³ m³ = 0.028316846592 m³ exactly. */
export const CUBIC_METERS_PER_CUBIC_FOOT = 0.3048 ** 3
/** 1 yd³ = 27 ft³ (3 ft × 3 ft × 3 ft). */
export const CUBIC_FEET_PER_CUBIC_YARD = 27
/** 1 ft² = 0.09290304 m² exactly. */
export const SQUARE_METERS_PER_SQUARE_FOOT = 0.3048 ** 2
/** 1 yd² = 9 ft². */
export const SQUARE_FEET_PER_SQUARE_YARD = 9
/** 1 acre = 43,560 ft² (NIST Handbook 44, Appendix C, units of area). */
export const SQUARE_FEET_PER_ACRE = 43560

/** A number read from a text field: blank, negative or not a number is null. */
export const readNumber = (raw: string): number | null => {
  const t = raw.trim().replace(/,/g, "")
  if (t === "") return null
  const n = Number(t)
  return Number.isFinite(n) && n >= 0 ? n : null
}

/** Numbers as shown on the page: grouped thousands, at most `digits` decimals, no trailing zeros. */
export const show = (n: number, digits = 2) => n.toLocaleString("en-US", { maximumFractionDigits: digits })
