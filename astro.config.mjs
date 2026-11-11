// @ts-check
import { defineConfig } from "astro/config"
import tailwindcss from "@tailwindcss/vite"
import sitemap from "@astrojs/sitemap"

// Static site, copied from boldsand.com's setup (~/boldsand-policies, GOLD-STANDARD.md §7). Every page is a folder with
// index.html. The address is a working value until the founder picks the site's name (src/data/brand.ts).
export default defineConfig({
  site: "https://contractors.boldsand.com",
  trailingSlash: "always",
  build: { format: "directory" },
  vite: { plugins: [tailwindcss()] },
  devToolbar: { enabled: false },
  // Content Security Policy as a meta tag (static hosts may not send headers). Astro hashes every script and style it
  // emits; everything else must come from this site. frame-ancestors cannot be set from a meta tag.
  security: {
    csp: {
      directives: ["default-src 'self'", "img-src 'self' data:", "font-src 'self'", "base-uri 'self'", "form-action 'self'", "object-src 'none'"],
    },
  },
  integrations: [sitemap()],
})
