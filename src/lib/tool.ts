// One shape for every tool on the site: a list of fields and one function that turns their values into the words on
// the page. The server renders the first answer from the same function the browser runs (src/components/Calc.astro),
// so the page never shifts when the script loads, and the tests call the same function. Nothing typed leaves the page.

import { readNumber, toFeet, type LengthUnit } from "./units"

export interface Len { value: number; unit: LengthUnit }

export type Field =
  | { kind: "length"; id: string; label: string; value: string; unit: LengthUnit; hint?: string }
  | { kind: "number"; id: string; label: string; value: string; hint?: string; whole?: boolean }
  | { kind: "select"; id: string; label: string; value: string; options: { value: string; label: string }[]; hint?: string }
  | { kind: "line"; id: string; label: string; value: string; hint?: string }
  | { kind: "text"; id: string; label: string; value: string; rows?: number; hint?: string }

export type Values = Record<string, number | string | Len | null>

/** A drawing the tool makes, as SVG markup it built itself, with the size of its viewBox for a PNG copy. */
export interface Picture {
  /** What the page shows: SVG markup, or an <img> of it. */
  svg: string; label: string; desc: string; file: string; width: number; height: number
  /** Set to false to show the picture without download buttons. */
  downloads?: boolean
  /** The SVG file itself, when svg is an <img> of it; the downloads use this. */
  raw?: string
}

export type Answer =
  | { ok: false; message: string; lines?: string[] }
  | { ok: true; headline: string; extra?: string | null; lines: string[]; output?: string; picture?: Picture }

export interface ToolSpec {
  id: string
  heading: string
  fields: Field[]
  explain: (v: Values) => Answer
  /** A button that runs the tool again with the same settings, for tools that draw random values. */
  again?: string
  /** What the copyable result box is called, when the tool has one. */
  outputLabel?: string
  /** For printables: the PDF for the current values, built when the visitor asks for it. */
  pdf?: (v: Values) => Promise<{ bytes: Uint8Array; file: string }>
  /** What the made file is, when it isn't a PDF: its button word ("Excel file") and its media type. */
  fileLabel?: string
  fileType?: string
}

/** A field's typed value from what is in the box: blank, negative or not a number is null for numbers and lengths. */
export const parse = (f: Field, raw: string, unit?: string): number | string | Len | null => {
  if (f.kind === "select" || f.kind === "line" || f.kind === "text") return raw
  const n = readNumber(raw)
  if (f.kind === "length") return n === null ? null : { value: n, unit: (unit ?? f.unit) as LengthUnit }
  return n
}

export const startValues = (fields: Field[]): Values =>
  Object.fromEntries(fields.map((f) => [f.id, parse(f, f.value, f.kind === "length" ? f.unit : undefined)]))

export const len = (v: Values, k: string) => v[k] as Len | null
export const num = (v: Values, k: string) => v[k] as number | null
export const pick = (v: Values, k: string) => (v[k] ?? "") as string
export const feet = (l: Len) => toFeet(l.value, l.unit)
export const inches = (l: Len) => toFeet(l.value, l.unit) * 12
export const fail = (message: string, lines?: string[]): Answer => ({ ok: false, message, lines })
export const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`
export const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
