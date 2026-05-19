import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://wacleanenergy.org",
  // Fully static site — no SSR adapter. See docs/plans/content-migration.md.
  integrations: [sitemap()],
  vite: {
    // @tailwindcss/vite ships a Plugin typed against a newer Vite than
    // Astro bundles. The plugin works at runtime; the cast suppresses a
    // structural-type mismatch that goes away when versions resync.
    plugins: [/** @type {any} */ (tailwindcss())],
  },
});
