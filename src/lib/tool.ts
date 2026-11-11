// One shape for every calculator built after the first seven: a list of fields and one function that turns their
// values into the words on the page. The server renders the first answer from the same function the browser runs
// (src/components/Calc.astro), so the page never shifts when the script loads, and tests call the same function.

import { readNumber, toFeet, type LengthUnit } from "./units"

export interface Len { value: number; unit: LengthUnit }

export type Field =
  | { kind: "length"; id: string; label: string; value: string; unit: LengthUnit; hint?: string }
  | { kind: "number"; id: string; label: string; value: string; hint?: string; whole?: boolean }
  | { kind: "select"; id: string; label: string; value: string; options: { value: string; label: string }[]; hint?: string }

export type Values = Record<string, number | string | Len | null>

export type Answer =
  | { ok: false; message: string }
  | { ok: true; headline: string; extra?: string | null; lines: string[] }

export interface ToolSpec {
  id: string
  heading: string
  fields: Field[]
  explain: (v: Values) => Answer
}

/** A field's typed value from what is in the box: blank, negative or not a number is null. */
export const parse = (f: Field, raw: string, unit?: string): number | string | Len | null => {
  if (f.kind === "select") return raw
  const n = readNumber(raw)
  if (f.kind === "length") return n === null ? null : { value: n, unit: (unit ?? f.unit) as LengthUnit }
  return n
}

/** The values the page starts with, which the server answers. */
export const startValues = (fields: Field[]): Values =>
  Object.fromEntries(fields.map((f) => [f.id, parse(f, f.value, f.kind === "length" ? f.unit : undefined)]))

export const len = (v: Values, k: string) => v[k] as Len | null
export const num = (v: Values, k: string) => v[k] as number | null
export const pick = (v: Values, k: string) => v[k] as string
export const feet = (l: Len) => toFeet(l.value, l.unit)
export const inches = (l: Len) => toFeet(l.value, l.unit) * 12
export const fail = (message: string): Answer => ({ ok: false, message })
