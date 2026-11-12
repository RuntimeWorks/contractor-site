// An OSHA 300 log as an Excel workbook: the Form 300 columns A to M as OSHA prints them (OSHA's Form 300, Rev.
// 04/2004, in "OSHA Forms for Recording Work-Related Injuries and Illnesses", read 2026-11-12), an X picked from a
// drop-down for the outcome (G to J) and the type (M1 to M6), and a second sheet with the Form 300A summary worked by
// formula: COUNTIF of each outcome and type, SUM of the days in K and L. Rates are added below the summary: the
// non-fatal case rate as BLS's calculator counts it (H + I + J), the rate counting deaths too (G + H + I + J, as many
// prequalification forms ask) and DART (H + I), each × 200,000 ÷ hours worked. The file holds only what is typed into
// it; this page sends nothing anywhere.
import { book, type Cell } from "../xlsx"
import { fail, pick, type ToolSpec } from "../tool"

export const LOG = "Form 300 log", SUMMARY = "Form 300A summary"
export const HEADERS = [
  "(A) Case no.", "(B) Employee's name", "(C) Job title", "(D) Date of injury or onset of illness", "(E) Where the event occurred",
  "(F) Describe injury or illness, parts of body affected, and object/substance that directly injured or made person ill",
  "(G) Death", "(H) Days away from work", "(I) Job transfer or restriction", "(J) Other recordable cases",
  "(K) Days away from work (days)", "(L) Days on job transfer or restriction (days)",
  "(M1) Injury", "(M2) Skin disorder", "(M3) Respiratory condition", "(M4) Poisoning", "(M5) Hearing loss", "(M6) All other illnesses", "Check",
]
export const FIRST = 6 // the first case row; rows 1 to 5 hold the title, notes and headers
const s = (v: string, bold = false): Cell => ({ t: "s", v, bold })
const f = (formula: string, bold = false): Cell => ({ t: "f", f: formula, bold })

/** A sample case for tests: A to F as text (D as a date serial), the outcome letter, days in K and L, the type 1 to 6. */
export interface Case { no: string; name: string; job: string; date: number; where: string; what: string; outcome: "G" | "H" | "I" | "J"; k?: number; l?: number; type: number }

export const logRows = (year: number, place: string, n: number, cases: Case[] = []): Cell[][] => {
  const rows: Cell[][] = [
    [s(`OSHA's Form 300 (Rev. 04/2004): Log of Work-Related Injuries and Illnesses, year ${year}`, true)],
    [s(`Establishment: ${place || "________________"}`)],
    [s("One row per recordable case. Pick X in one of G to J for the most serious outcome, and X in one of M1 to M6 for the type. For a privacy concern case, write \"Privacy case\" instead of the name and keep the names on a separate list (29 CFR 1904.29(b)(6) to (9)).")],
    [s("Totals go to the Form 300A summary sheet by themselves. Keep the log and summary for 5 years after the year they cover.")],
    HEADERS.map((h) => s(h, true)),
  ]
  for (let i = 0; i < n; i++) {
    const r = FIRST + i, c = cases[i]
    const check = f(`IF(COUNTA(A${r}:R${r})=0,"",IF(COUNTIF(G${r}:J${r},"X")<>1,"Mark one of G to J",IF(COUNTIF(M${r}:R${r},"X")<>1,"Mark one type in M","")))`)
    if (!c) { rows.push([...Array(HEADERS.length - 1).fill(null), check]); continue }
    rows.push([
      s(c.no), s(c.name), s(c.job), { t: "n", v: c.date, date: true }, s(c.where), s(c.what),
      ...(["G", "H", "I", "J"] as const).map((o) => (o === c.outcome ? s("X") : null)),
      c.k ? { t: "n", v: c.k } : null, c.l ? { t: "n", v: c.l } : null,
      ...[1, 2, 3, 4, 5, 6].map((t) => (t === c.type ? s("X") : null)),
      check,
    ])
  }
  return rows
}

const ref = (col: string, n: number) => `'${LOG}'!${col}${FIRST}:${col}${FIRST + n - 1}`
/** The summary sheet; B12 and B13 are for the average number of employees and the hours worked. */
export const summaryRows = (year: number, place: string, n: number): Cell[][] => {
  const count = (col: string) => f(`COUNTIF(${ref(col, n)},"X")`)
  return [
    [s(`OSHA's Form 300A (Rev. 04/2004): Summary of Work-Related Injuries and Illnesses, year ${year}`, true)],
    [s(`Establishment: ${place || "________________"}`)],
    [s("Number of cases", true)],
    [s("(G) Total number of deaths"), count("G")],
    [s("(H) Total number of cases with days away from work"), count("H")],
    [s("(I) Total number of cases with job transfer or restriction"), count("I")],
    [s("(J) Total number of other recordable cases"), count("J")],
    [s("Number of days", true)],
    [s("(K) Total number of days away from work"), f(`SUM(${ref("K", n)})`)],
    [s("(L) Total number of days of job transfer or restriction"), f(`SUM(${ref("L", n)})`)],
    [s("Employment information (type these in)", true)],
    [s("Annual average number of employees"), null],
    [s("Total hours worked by all employees last year"), null],
    [s("Injury and illness types", true)],
    [s("(M1) Injuries"), count("M")], [s("(M2) Skin disorders"), count("N")], [s("(M3) Respiratory conditions"), count("O")],
    [s("(M4) Poisonings"), count("P")], [s("(M5) Hearing loss"), count("Q")], [s("(M6) All other illnesses"), count("R")],
    [s("Rates per 100 full-time workers (not part of Form 300A): cases × 200,000 ÷ hours worked", true)],
    [s("Non-fatal recordable case rate, H + I + J (as the BLS calculator counts it)"), f(`IF(N(B13)>0,ROUND((B5+B6+B7)*200000/B13,2),"")`)],
    [s("Recordable case rate including deaths, G + H + I + J"), f(`IF(N(B13)>0,ROUND((B4+B5+B6+B7)*200000/B13,2),"")`)],
    [s("DART rate, H + I"), f(`IF(N(B13)>0,ROUND((B5+B6)*200000/B13,2),"")`)],
    [null],
    [s("Post this summary from February 1 to April 30 of the year after the year it covers, signed by a company executive, even if there were no cases (write 0).")],
  ]
}

export const ROWS = [25, 50, 100, 250]
const read = (v: Parameters<ToolSpec["explain"]>[0]) => {
  const year = Number(pick(v, "year")) || 2026, n = ROWS.includes(Number(pick(v, "rows"))) ? Number(pick(v, "rows")) : 50
  return { year, n, place: pick(v, "place").trim() }
}
export const osha300Book = (year: number, place: string, n: number, cases: Case[] = []) => {
  const last = FIRST + n - 1, x = { source: '"X"' }
  return book([
    { name: LOG, rows: logRows(year, place, n, cases), widths: [10, 22, 18, 14, 22, 48, 8, 10, 10, 10, 10, 12, 8, 8, 10, 9, 9, 10, 22], extras: { colStyles: { 3: 4 }, lists: [{ range: `G${FIRST}:J${last}`, ...x }, { range: `M${FIRST}:R${last}`, ...x }] } },
    { name: SUMMARY, rows: summaryRows(year, place, n), widths: [72, 14] },
  ], '"$"#,##0.00')
}

export const osha300: ToolSpec = {
  id: "osha300",
  heading: "Make an OSHA 300 log",
  fields: [
    { kind: "select", id: "year", label: "Year the log covers", value: "2026", options: [2025, 2026, 2027].map((y) => ({ value: String(y), label: String(y) })) },
    { kind: "line", id: "place", label: "Establishment, optional", value: "", hint: "The site or office the log covers, such as Main yard, Springfield." },
    { kind: "select", id: "rows", label: "Rows for cases", value: "50", options: ROWS.map((r) => ({ value: String(r), label: String(r) })) },
  ],
  explain: (v) => {
    const { year, n, place } = read(v)
    if (place.length > 80) return fail("Keep the establishment under 80 characters.")
    return {
      ok: true,
      headline: `A ${year} OSHA 300 log with room for ${n} cases, and its 300A summary.`,
      lines: [
        "Sheet 1 is the log, with OSHA's columns A to M. Pick X from a drop-down for the outcome (G to J) and the type (M1 to M6); a Check column flags a row with no outcome or two.",
        "Sheet 2 is the Form 300A summary, counted by formula as you type, with the TRIR and DART rates once you add the hours worked.",
        "Post the summary from February 1 to April 30 of the next year, signed by a company executive. Keep both for 5 years.",
      ],
    }
  },
  fileLabel: "Excel file",
  fileType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: async (v) => { const { year, n, place } = read(v); return { bytes: await osha300Book(year, place, n), file: `osha-300-log-${year}.xlsx` } },
}
