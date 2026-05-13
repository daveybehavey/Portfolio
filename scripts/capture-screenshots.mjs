import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const projects = [
  { slug: "maestrosservices", url: "https://maestrosservices.com" },
  { slug: "angelkisscreations", url: "https://angelkisscreations.com" },
  { slug: "starmapco", url: "https://starmapco.com" },
  { slug: "notebill", url: "https://notebill.app" },
  { slug: "vancouverislandproroofing", url: "https://vancouverislandproroofing.com" }
];

const outDir = path.join(process.cwd(), "public", "projects");

async function ensureDir() {
  await fs.mkdir(outDir, { recursive: true });
}

async function capture() {
  await ensureDir();

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  for (const p of projects) {
    const pngPath = path.join(outDir, `${p.slug}.png`);
    const webpPath = path.join(outDir, `${p.slug}.webp`);

    console.log(`Capturing ${p.slug}...`);
    await page.goto(p.url, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(800);

    await page.screenshot({ path: pngPath, fullPage: false });

    await sharp(pngPath)
      .resize({ width: 1200 })
      .webp({ quality: 78 })
      .toFile(webpPath);

    await fs.unlink(pngPath).catch(() => {});
  }

  await browser.close();
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});

