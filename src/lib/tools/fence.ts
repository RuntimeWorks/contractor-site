// A straight fence run. Sections = run length ÷ post spacing, rounded up; posts = sections + 1; rails = sections ×
// rails per section. Concrete per post: the hole (π × (diameter ÷ 2)² × depth) less the part of a square post below
// ground (width² × depth), in bags by QUIKRETE Concrete Mix yields (see src/lib/concrete.ts for the source).

import { bagCount, bags } from "../concrete"
import { show } from "../units"
import { fail, feet, inches, len, num, type ToolSpec } from "../tool"

export const fence: ToolSpec = {
  id: "fence",
  heading: "Work out posts, rails and concrete",
  fields: [
    { kind: "length", id: "run", label: "Fence length", value: "100", unit: "ft", hint: "One straight run. Add runs separately." },
    { kind: "length", id: "spacing", label: "Post spacing (center to center)", value: "8", unit: "ft", hint: "Usually your panel width." },
    { kind: "number", id: "rails", label: "Rails per section", value: "2", whole: true },
    { kind: "length", id: "post", label: "Post width (square post)", value: "3.5", unit: "in", hint: "A 4×4 is 3½ in." },
    { kind: "length", id: "hole", label: "Hole diameter", value: "10", unit: "in" },
    { kind: "length", id: "depth", label: "Hole depth", value: "24", unit: "in" },
  ],
  explain: (v) => {
    const run = len(v, "run"), sp = len(v, "spacing"), rails = num(v, "rails"), post = len(v, "post"), hole = len(v, "hole"), depth = len(v, "depth")
    if (!run || !sp || !post || !hole || !depth) return fail("Enter every length as a number.")
    if (rails === null || !Number.isInteger(rails)) return fail("Enter the rails per section as a whole number.")
    const R = feet(run), S = feet(sp)
    if (R <= 0 || S <= 0) return fail("Enter a fence length and spacing greater than zero.")
    const sections = Math.ceil(R / S - 1e-9)
    const posts = sections + 1
    const holeFt3 = Math.PI * (feet(hole) / 2) ** 2 * feet(depth) - feet(post) ** 2 * feet(depth)
    if (holeFt3 <= 0) return fail("The hole must be wider than the post.")
    const total = holeFt3 * posts
    const b80 = bags.find((b) => b.pounds === 80)!, b50 = bags.find((b) => b.pounds === 50)!
    return {
      ok: true,
      headline: `${posts} posts, ${sections} sections, ${sections * rails} rails.`,
      extra: `Concrete: ${show(total, 2)} cubic feet, ${bagCount(total, b80.cubicFeet)} bags of 80 lb or ${bagCount(total, b50.cubicFeet)} of 50 lb.`,
      lines: [
        `Sections = ${show(R, 2)} ft ÷ ${show(S, 2)} ft = ${show(R / S, 2)}, rounded up to ${sections}. Posts = ${sections} + 1 = ${posts}.`,
        `Concrete per hole = π × (${show(inches(hole), 2)} in ÷ 2)² × ${show(inches(depth), 1)} in, less the post, = ${show(holeFt3, 3)} cubic feet.`,
        `${posts} holes × ${show(holeFt3, 3)} = ${show(total, 2)} cubic feet. An 80 lb bag yields about 0.60 cubic feet and a 50 lb bag 0.375 (QUIKRETE).`,
      ],
    }
  },
}
