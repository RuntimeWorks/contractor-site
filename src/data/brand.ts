// The one place this site's facts live. Pages, the footer, the sitemap and the structured data read from here.
//
// The site's own name and address are working values until the founder picks a name (naming follows the founder's
// check order: trademarks, companies, domains, handles; memory name-hunt-check-order). Change `site` here and the
// whole site follows. The publisher's facts are the company's own (copied from ~/boldsand-policies src/data/brand.ts,
// sources in projects/boldsand-com/PLAN.md §1–§2).

export const site = {
  /** Working name, shown beside the Boldsand mark. */
  name: "Contractor calculators",
  /** Working address: a subdomain of the company's own boldsand.com, so no new domain is needed to start. */
  url: "https://contractors.boldsand.com",
  description: "Free calculators for contractors: concrete, square footage, gravel, stairs, roofing, drywall, paint, tile, fence, rebar and more, with every formula and source shown.",
}

export const brand = {
  name: "Boldsand",
  legalName: "Boldsand Software Inc.",
  url: site.url,
  companyUrl: "https://boldsand.com",
  email: "deya@boldsand.com",
  address: { street: "C 505 University Ave", city: "Charlottetown", region: "PE", regionName: "Prince Edward Island", postal: "C1A 9S3", country: "CA" },
  // Colour inputs for Radix's palette generator (scripts/gen-tokens.ts). The founder's approved Boldsand theme, kept
  // as-is (GOLD-STANDARD.md §2 station 4b: a new site keeps the approved look unless the founder asks for another):
  // accent = the harbour navy; gray = the theme's blue grey; light background = paper; dark background = ink.
  colors: { accent: "#0F2B47", gray: "#56616D", backgroundLight: "#FBF8F2", backgroundDark: "#0C1723", markSand: "#EEE4D1" },
  theme: {
    harbour: "#0F2B47", harbour2: "#173A5E", onHarbour: "#EDE5D4", onHarbour2: "#B4C1CF",
    sand: "#EEE4D1", sand2: "#E2D4B8", paper: "#FBF8F2", white: "#FFFFFF", ink: "#0C1723", pass: "#17663F",
    shadowCard: "0 1px 2px rgba(12,23,35,.08), 0 18px 40px -28px rgba(12,23,35,.35)", shadowCardHover: "0 1px 2px rgba(12,23,35,.08), 0 28px 50px -28px rgba(12,23,35,.45)",
    shadowShot: "0 18px 30px -18px rgba(12,23,35,.5)", shadowFrame: "0 40px 70px -30px rgba(4,14,26,.7)",
    radius: "14px", radiusSmall: "10px",
  },
} as const

export interface Tool {
  href: string
  name: string
  /** What it answers, in one sentence. */
  summary: string
}

export const tools: Tool[] = [
  { href: "/concrete-calculator/", name: "Concrete calculator", summary: "Cubic yards, cubic meters and the number of 40, 50, 60, 80 and 90 lb bags for slabs, footings, walls, columns, post holes and tubes." },
  { href: "/square-footage-calculator/", name: "Square footage calculator", summary: "Square feet, square yards, square meters and acres for rooms, lots and odd shapes, with cut-outs taken away." },
  { href: "/gravel-calculator/", name: "Gravel calculator", summary: "Cubic yards and tons of gravel or crushed stone for a driveway, path or base, from published weights." },
  { href: "/mulch-calculator/", name: "Mulch calculator", summary: "Cubic yards of mulch for a bed, or the number of bags by the volume printed on them." },
  { href: "/topsoil-calculator/", name: "Topsoil calculator", summary: "Cubic yards and tons of topsoil for a lawn or garden bed." },
  { href: "/cubic-yard-calculator/", name: "Cubic yard calculator", summary: "Cubic yards from length, width and depth in any unit, with the weight for gravel, stone, sand and topsoil." },
  { href: "/board-foot-calculator/", name: "Board foot calculator", summary: "Board feet of lumber for one piece or a whole order, and what it costs." },
  { href: "/stair-calculator/", name: "Stair calculator", summary: "Risers, treads, total run and stringer length from the total rise, checked against the IRC limits." },
  { href: "/roof-pitch-calculator/", name: "Roof pitch calculator", summary: "Pitch in inches per 12, angle in degrees and the multiplier from plan area to roof area." },
  { href: "/roofing-calculator/", name: "Roofing calculator", summary: "Roof area, squares and bundles of shingles from the footprint and pitch." },
  { href: "/pool-volume-calculator/", name: "Pool volume calculator", summary: "Gallons and liters in a rectangular, round or oval pool, sloped or flat." },
  { href: "/fence-calculator/", name: "Fence calculator", summary: "Posts, sections, rails and concrete bags for a straight fence run." },
  { href: "/tile-calculator/", name: "Tile calculator", summary: "Tiles and boxes for a floor or wall, counting the grout joint." },
  { href: "/drywall-calculator/", name: "Drywall calculator", summary: "Sheets of 4×8, 4×10 or 4×12 drywall and joint tape for a room." },
  { href: "/paint-calculator/", name: "Paint calculator", summary: "Gallons of paint for a room's walls and ceiling, for any number of coats." },
  { href: "/btu-calculator/", name: "BTU calculator", summary: "Room air conditioner size in BTU per hour from ENERGY STAR's chart." },
  { href: "/rebar-calculator/", name: "Rebar calculator", summary: "Feet, pounds and stock bars of rebar for a slab grid, by bar size and spacing." },
  { href: "/electricity-cost-calculator/", name: "Electricity cost calculator", summary: "Kilowatt-hours and cost to run an appliance from its watts and hours of use." },
  { href: "/concrete-block-calculator/", name: "Concrete block", summary: "8 × 8 × 16 in concrete blocks for a wall, less openings." },
  { href: "/brick-calculator/", name: "Brick calculator", summary: "Bricks for a wall from the brick size and mortar joint." },
  { href: "/asphalt-calculator/", name: "Asphalt calculator", summary: "Tons of hot mix asphalt from the area and compacted thickness." },
  { href: "/flooring-calculator/", name: "Flooring calculator", summary: "Square feet and boxes of flooring for a room." },
  { href: "/siding-calculator/", name: "Siding calculator", summary: "Squares of siding for walls and gables, less openings." },
  { href: "/deck-calculator/", name: "Deck calculator", summary: "Deck boards and joists from the deck size and spacing." },
  { href: "/retaining-wall-calculator/", name: "Retaining wall", summary: "Retaining wall blocks and caps from the wall and block size." },
  { href: "/osha-incidence-rate-calculator/", name: "OSHA incidence rate", summary: "TRIR and DART from the 300 log." },
  { href: "/osha-300-log/", name: "OSHA 300 log (Excel)", summary: "Form 300 log and 300A summary." },
  { href: "/voltage-drop-calculator/", name: "Voltage drop calculator", summary: "Volts lost and the wire size to fix it." },
]
