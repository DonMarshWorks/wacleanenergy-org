import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const site = "https://wacleanenergy.org";

// Enumerate /news-assets PDFs at config load so they appear in the sitemap.
// Astro's sitemap integration only includes routed pages by default; the
// linked-from-news-posts PDFs need an explicit customPages entry each.
const newsAssetsDir = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "public/news-assets",
);
const pdfPages = readdirSync(newsAssetsDir)
  .filter((f) => f.endsWith(".pdf"))
  .map((f) => `${site}/news-assets/${f}`);

// https://astro.build/config
export default defineConfig({
  site,
  // Fully static site — no SSR adapter. See docs/plans/content-migration.md.
  // MDX is enabled so individual page bodies (currently just home.mdx)
  // can drop Astro components inline between Markdown paragraphs.
  integrations: [mdx(), sitemap({ customPages: pdfPages })],
  vite: {
    // @tailwindcss/vite ships a Plugin typed against a newer Vite than
    // Astro bundles. The plugin works at runtime; the cast suppresses a
    // structural-type mismatch that goes away when versions resync.
    plugins: [/** @type {any} */ (tailwindcss())],
  },
});
