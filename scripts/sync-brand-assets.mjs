/**
 * Copies EuroDigital logo assets and generates favicon + OG images (best-practice sizes).
 * Source: ../EuroDigital Invoices/ASSETS (override with EURODIGITAL_ASSETS_DIR)
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const repoRoot = process.cwd();
const defaultAssetsDir = path.resolve(repoRoot, "..", "EuroDigital Invoices", "ASSETS");
const assetsDir = process.env.EURODIGITAL_ASSETS_DIR?.trim() || defaultAssetsDir;
const brandDir = path.join(repoRoot, "public", "brand");
const publicDir = path.join(repoRoot, "public");

const SQUARE_CANDIDATES = ["logo.png", "logo1254x1254.png"];
const WIDE_LOGO = "logo1122x1402.png";

async function resolveSquareLogo() {
  for (const name of SQUARE_CANDIDATES) {
    const p = path.join(assetsDir, name);
    try {
      await fs.access(p);
      return { path: p, name };
    } catch {
      /* try next */
    }
  }
  throw new Error(
    `No square logo in ${assetsDir}. Add logo.png or logo1254x1254.png (icon only, no text).`
  );
}

async function ensureDirs() {
  await fs.mkdir(brandDir, { recursive: true });
}

async function assertSource(name) {
  const p = path.join(assetsDir, name);
  try {
    await fs.access(p);
    return p;
  } catch {
    throw new Error(`Missing asset: ${p}\nSet EURODIGITAL_ASSETS_DIR if assets live elsewhere.`);
  }
}

/** Flat brand background for OG / icons */
async function createBrandBackground(width, height) {
  const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#faf9f7"/>
      <stop offset="38%" style="stop-color:#f1f0ff"/>
      <stop offset="72%" style="stop-color:#ecfdf5"/>
      <stop offset="100%" style="stop-color:#faf9f7"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function generateFavicons(squareLogoPath) {
  const base = sharp(squareLogoPath).ensureAlpha().trim();

  const sizes = [
    { name: "favicon-16x16.png", size: 16 },
    { name: "favicon-32x32.png", size: 32 },
    { name: "apple-touch-icon.png", size: 180 },
    { name: "icon-192.png", size: 192 },
    { name: "icon-512.png", size: 512 }
  ];

  for (const { name, size } of sizes) {
    const out = path.join(publicDir, name);
    await base
      .clone()
      .resize(size, size, { fit: "contain", background: { r: 250, g: 249, b: 247, alpha: 1 } })
      .png({ compressionLevel: 9 })
      .toFile(out);
    console.log(`Wrote ${name}`);
  }

  // Root favicon for crawlers that request /favicon.ico without parsing <head>
  await base
    .clone()
    .resize(48, 48, { fit: "contain", background: { r: 250, g: 249, b: 247, alpha: 1 } })
    .png()
    .toFile(path.join(publicDir, "favicon.ico"));
  console.log("Wrote favicon.ico");
}

async function generateOgImage(squareLogoPath) {
  const w = 1200;
  const h = 630;
  const markSize = 220;

  const logoBuffer = await sharp(squareLogoPath)
    .resize(markSize, markSize, {
      fit: "contain",
      background: { r: 250, g: 249, b: 247, alpha: 1 }
    })
    .png()
    .toBuffer();

  const meta = await sharp(logoBuffer).metadata();
  const logoW = meta.width ?? maxLogoW;
  const logoH = meta.height ?? maxLogoH;
  const left = Math.max(0, Math.round((w - logoW) / 2));
  const top = Math.max(0, Math.round((h - logoH) / 2));

  const bg = await createBrandBackground(w, h);

  await sharp(bg)
    .composite([{ input: logoBuffer, left, top }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(publicDir, "og-image.png"));

  await sharp(path.join(publicDir, "og-image.png"))
    .webp({ quality: 82 })
    .toFile(path.join(publicDir, "og-image.webp"));

  console.log("Wrote og-image.png + og-image.webp");
}

async function main() {
  console.log(`Assets dir: ${assetsDir}`);
  await ensureDirs();

  const { path: squarePath, name: squareName } = await resolveSquareLogo();
  const widePath = await assertSource(WIDE_LOGO);

  await fs.copyFile(squarePath, path.join(brandDir, "logo.png"));
  await fs.copyFile(widePath, path.join(brandDir, "logo-wide.png"));
  console.log(`Square mark: ${squareName} → public/brand/logo.png`);

  // Crisp UI mark for header/footer (square icon only)
  const paper = { r: 250, g: 249, b: 247, alpha: 1 };
  await sharp(squarePath)
    .resize(160, 160, { fit: "contain", background: paper })
    .webp({ quality: 90, effort: 4 })
    .toFile(path.join(brandDir, "logo-mark.webp"));

  console.log("Wrote public/brand/logo-mark.webp");

  await generateFavicons(squarePath);
  await generateOgImage(squarePath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
