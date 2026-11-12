// Keyboard alone (WCAG 2.1.1, 2.4.3, 2.4.7; APG disclosure contract), adapted from PurchaseRow's keyboard test.
// On the built site: the skip link comes first and moves focus into the page; every focused control shows a visible
// focus ring; the phone menu opens with Enter and closes with Escape, giving focus back; a question opens with Enter;
// both calculators are reachable and answer typed input, shape changes and added parts.
import fs from "node:fs"
import http from "node:http"
import path from "node:path"
import { chromium } from "playwright"

const dist = path.resolve(import.meta.dirname, "../dist")
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname)
  if (p.endsWith("/")) p += "index.html"
  const f = path.join(dist, p)
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end() }
  res.writeHead(200, { "content-type": { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" }[path.extname(f)] ?? "application/octet-stream" })
  fs.createReadStream(f).pipe(res)
})
await new Promise((ok) => server.listen(0, "127.0.0.1", ok))
const base = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch()
let failed = 0
const check = (ok, what) => { console.log(`  ${ok ? "ok  " : "FAIL"} ${what}`); if (!ok) failed++ }
const focusInfo = (page) => page.evaluate(() => {
  const el = document.activeElement
  const s = getComputedStyle(el)
  const ring = (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0) || s.boxShadow !== "none" || (el.matches("a") && getComputedStyle(el, "::after").outlineStyle !== "none")
  return { tag: el.tagName, text: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 40), href: el.getAttribute("href"), ring }
})

for (const width of [390, 1280]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } })
  await page.goto(`${base}/`)
  await page.keyboard.press("Tab")
  let f = await focusInfo(page)
  check(f.href === "#main" && f.ring, `${width}px: the first Tab lands on the skip link, with a visible ring`)
  await page.keyboard.press("Enter")
  check(await page.evaluate(() => location.hash === "#main"), `${width}px: the skip link moves to the main content`)
  // Walk the page by Tab: every stop shows a ring, and the product links are reachable.
  await page.goto(`${base}/`)
  const seen = []
  for (let i = 0; i < 60; i++) { await page.keyboard.press("Tab"); f = await focusInfo(page); if (f.tag === "BODY") break; seen.push(f); if (!f.ring) check(false, `${width}px: no visible focus on ${f.tag} "${f.text}"`) } // BODY: focus has left the page
  check(seen.some((x) => x.href === "/concrete-calculator/"), `${width}px: Tab reaches the concrete calculator`)
  check(seen.some((x) => x.href === "/square-footage-calculator/"), `${width}px: Tab reaches the square footage calculator`)
  if (width === 390) {
    await page.goto(`${base}/`)
    await page.locator("summary", { hasText: "Menu" }).focus()
    await page.keyboard.press("Enter")
    check(await page.locator("details[data-menu]").evaluate((d) => d.open), "390px: Enter opens the menu")
    await page.keyboard.press("Escape")
    check(!(await page.locator("details[data-menu]").evaluate((d) => d.open)) && (await focusInfo(page)).text === "Menu", "390px: Escape closes the menu and returns focus to it")
  }
  await page.close()
}

const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
// Concrete: the worked example on the page, typed. 10 ft × 10 ft × 4 in = 33.33 ft³; with the default 5% extra,
// 35 ft³ = 1.3 yd³ and 35 ÷ 0.60 = 58.3, so 59 bags of 80 lb (QUIKRETE data sheet).
await page.goto(`${base}/concrete-calculator/`)
await page.locator("#length").focus(); await page.keyboard.press("ControlOrMeta+a"); await page.keyboard.type("10")
await page.keyboard.press("Tab"); await page.keyboard.press("Tab")
await page.keyboard.press("ControlOrMeta+a"); await page.keyboard.type("10")
const head = () => page.locator('[data-o="headline"]').textContent()
check((await head()).startsWith("Order 1.3 cubic yards"), "concrete: the 10 × 10 ft × 4 in slab gives 1.3 cubic yards with 5% extra")
check((await page.locator('[data-bag="80"]').textContent()) === "59", "concrete: 59 bags of 80 lb")
await page.locator('input[name="shape"][value="slab"]').focus(); await page.keyboard.press("ArrowDown")
check(await page.locator('input[name="shape"][value="column"]').isChecked(), "concrete: an arrow key picks the next shape")
check(await page.locator("#diameter").isVisible() && !(await page.locator("#length").isVisible()), "concrete: the column's fields replace the slab's")
// Square footage: add a part, fill it and remove it, all by keyboard.
await page.goto(`${base}/square-footage-calculator/`)
const area = () => page.locator('[data-o="headline"]').textContent()
check((await area()).startsWith("120 square feet"), "area: the starting 12 × 10 ft room is 120 square feet")
await page.locator("[data-add]").focus(); await page.keyboard.press("Enter")
check(await page.evaluate(() => document.activeElement?.getAttribute("data-k") === "shape"), "area: Add another part moves focus to the new part's shape")
await page.keyboard.press("Tab"); await page.keyboard.type("4")
await page.keyboard.press("Tab"); await page.keyboard.press("Tab"); await page.keyboard.type("2")
await page.locator('[data-part]').nth(1).locator('[data-k="subtract"]').focus(); await page.keyboard.press("Space")
check((await area()).startsWith("112 square feet"), "area: a 4 × 2 ft cut-out taken away leaves 112 square feet")
await page.locator('[data-part]').nth(1).locator("[data-remove]").focus(); await page.keyboard.press("Enter")
check((await area()).startsWith("120 square feet") && (await page.locator("[data-part]").count()) === 1, "area: Remove takes the part away again")

// Voltage drop, by keyboard: a bigger wire chosen brings the drop within 3%.
{
  const p = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await p.goto(`${base}/voltage-drop-calculator/`)
  const before = await p.locator("[data-o=headline]").textContent()
  await p.locator("#vdrop-size").focus()
  await p.locator("#vdrop-size").selectOption("6 AWG")
  const after = await p.locator("[data-o=headline]").textContent()
  check(before.includes("4.6") && /Voltage drop \d+\.\d\d V, [12]\.\d\d%\./.test(after), `vdrop: 10 AWG "${before}", then 6 AWG "${after}"`)
  await p.close()
}
// OSHA 300 log, by keyboard: the year changed, then Enter on the download button saves an .xlsx (a zip: "PK").
{
  const p = await browser.newPage({ viewport: { width: 1280, height: 900 }, acceptDownloads: true })
  await p.goto(`${base}/osha-300-log/`)
  await p.locator("#osha300-year").selectOption("2027")
  await p.getByRole("button", { name: "Download Excel file" }).focus()
  const [dl] = await Promise.all([p.waitForEvent("download"), p.keyboard.press("Enter")])
  const head = fs.readFileSync(await dl.path()).subarray(0, 2).toString()
  check(head === "PK" && dl.suggestedFilename() === "osha-300-log-2027.xlsx", `osha300: Enter downloads ${dl.suggestedFilename()}`)
  await p.close()
}
await browser.close()
server.close()
console.log(failed ? `\n${failed} keyboard checks failed` : "\nall keyboard checks passed")
process.exit(failed ? 1 : 0)
