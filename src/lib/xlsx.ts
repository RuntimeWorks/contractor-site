// A minimal Excel workbook (Office Open XML, ECMA-376): sheets of text, numbers and formulas, zipped with fflate
// (MIT). Text is written as inline strings, so typed text can never become a formula; formulas carry no saved values
// and the workbook asks to be recalculated when opened (calcPr fullCalcOnLoad), which Excel, Google Sheets, Numbers
// and LibreOffice do.

export type Cell =
  | { t: "s"; v: string; bold?: boolean }
  | { t: "n"; v: number; money?: boolean; bold?: boolean; date?: boolean }
  | { t: "f"; f: string; money?: boolean; bold?: boolean; date?: boolean }
  | null

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
export const colName = (i: number): string => (i < 26 ? String.fromCharCode(65 + i) : colName(Math.floor(i / 26) - 1) + String.fromCharCode(65 + (i % 26)))
// Styles: 0 plain, 1 bold, 2 money, 3 bold money, 4 date (yyyy-mm-dd), 5 bold date.
const style = (c: Exclude<Cell, null>) => (c.t === "s" ? (c.bold ? 1 : 0) : c.date ? (c.bold ? 5 : 4) : (c.money ? 2 : 0) + (c.bold ? 1 : 0))

export interface SheetExtras { colStyles?: Record<number, number>; lists?: { range: string; source: string }[] }
export const sheetXml = (rows: Cell[][], widths: number[], extras: SheetExtras = {}) => {
  const body = rows.map((row, r) => {
    const cells = row.map((c, i) => {
      if (!c) return ""
      const ref = `${colName(i)}${r + 1}`, s = style(c)
      if (c.t === "s") return `<c r="${ref}" t="inlineStr"${s ? ` s="${s}"` : ""}><is><t xml:space="preserve">${esc(c.v)}</t></is></c>`
      if (c.t === "n") return `<c r="${ref}"${s ? ` s="${s}"` : ""}><v>${c.v}</v></c>`
      return `<c r="${ref}"${s ? ` s="${s}"` : ""}><f>${esc(c.f)}</f></c>`
    }).join("")
    return `<row r="${r + 1}">${cells}</row>`
  }).join("")
  const cols = widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"${extras.colStyles?.[i] ? ` style="${extras.colStyles[i]}"` : ""}/>`).join("")
  // Drop-down lists: a cell range limited to the values in another range (ECMA-376 dataValidation, type list).
  const lists = extras.lists?.length ? `<dataValidations count="${extras.lists.length}">${extras.lists.map((l) => `<dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="${l.range}"><formula1>${esc(l.source)}</formula1></dataValidation>`).join("")}</dataValidations>` : ""
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols>${cols}</cols><sheetData>${body}</sheetData>${lists}</worksheet>`
}

const STYLES = (money: string) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="2"><numFmt numFmtId="164" formatCode="${esc(money)}"/><numFmt numFmtId="165" formatCode="yyyy-mm-dd"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="6"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="164" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`
export interface SheetSpec { name: string; rows: Cell[][]; widths: number[]; extras?: SheetExtras }
/** The workbook as .xlsx bytes, one worksheet per spec. `money` is the Excel number format for money cells. */
export const book = async (sheets: SheetSpec[], money: string) => {
  const { zipSync, strToU8 } = await import("fflate")
  const ws = (i: number) => `xl/worksheets/sheet${i + 1}.xml`
  const files: Record<string, string> = {
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheets.map((_, i) => `<Override PartName="/${ws(i)}" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    "xl/workbook.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s, i) => `<sheet name="${esc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`,
    "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    "xl/styles.xml": STYLES(money),
  }
  sheets.forEach((s, i) => { files[ws(i)] = sheetXml(s.rows, s.widths, s.extras) })
  return zipSync(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, strToU8(v)])), { level: 6 })
}
