// One-off generator for public/og.png — the social-share card.
// Run via `node scripts/generate-og.mjs` whenever the title, URL, or logo
// changes. The PNG is committed; Cloudflare Pages serves it as a static
// asset, and BaseLayout points <meta property="og:image"> at it.
//
// Uses Sharp (already a transitive dep via Astro). Text is drawn in an
// SVG layer that Sharp rasterises to PNG, then composites the logo on
// top of the cream background.

import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const W = 1200;
const H = 630;

const logoPath = join(ROOT, "src/assets/wcec-logo.png");
const outPath = join(ROOT, "public/og.png");

const logoTargetW = 480;
const logoMeta = await sharp(logoPath).metadata();
const logoTargetH = Math.round(
  logoMeta.height * (logoTargetW / logoMeta.width),
);

const logoX = Math.round((W - logoTargetW) / 2);
const logoY = 50;
const titleY = logoY + logoTargetH + 80;
const urlY = H - 50;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="#fcfdf7"/>
  <text x="${W / 2}" y="${titleY}" text-anchor="middle"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="56" font-weight="700" fill="#184a5d">Let's get this transition right.</text>
  <text x="${W / 2}" y="${urlY}" text-anchor="middle"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="24" fill="#3f7d8c">wacleanenergy.org</text>
</svg>`;

const logo = await sharp(logoPath).resize(logoTargetW).toBuffer();

await sharp(Buffer.from(svg))
  .composite([{ input: logo, top: logoY, left: logoX }])
  .png()
  .toFile(outPath);

console.log(`Wrote ${outPath} (${W}×${H})`);
