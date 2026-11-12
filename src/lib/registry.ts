// Every calculator built on src/lib/tool.ts, by id. The page component and its browser script look tools up here.
import type { ToolSpec } from "./tool"
import { stairs } from "./tools/stairs"
import { roofPitch } from "./tools/roofpitch"
import { incidenceRate } from "./tools/safety"
import { osha300 } from "./tools/osha300"
import { voltageDrop } from "./tools/voltage"
import { roofing } from "./tools/roofing"
import { pool } from "./tools/pool"
import { fence } from "./tools/fence"
import { tile } from "./tools/tile"
import { drywall } from "./tools/drywall"
import { paint } from "./tools/paint"
import { btu } from "./tools/btu"
import { rebar } from "./tools/rebar"
import { electricity } from "./tools/electricity"
import { block, brick, asphalt, flooring, siding, deck, retaining } from "./tools/masonry"

export const registry: Record<string, ToolSpec> = Object.fromEntries(
  [stairs, roofPitch, roofing, pool, fence, tile, drywall, paint, btu, rebar, electricity, block, brick, asphalt, flooring, siding, deck, retaining, incidenceRate, osha300, voltageDrop].map((t) => [t.id, t]),
)
