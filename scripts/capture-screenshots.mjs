import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/** Keep in sync with src/lib/projects.ts URLs */
const projects = [
  { slug: "notebill", url: "https://notebill.app" },
  { slug: "starmapco", url: "https://starmapco.com" },
  { slug: "maestrosservices", url: "https://maestrosservices.com" },
  { slug: "angelkisscreations", url: "https://angelkisscreations.com" },
  { slug: "vancouverislandproroofing", url: "https://vancouverislandproroofing.com" }
];

const outDir = path.join(process.cwd(), "public", "projects");
const VIEWPORT = { width: 1440, height: 900 };
const OUTPUT_WIDTH = 1200;

async function ensureDir() {
  await fs.mkdir(outDir, { recursive: true });
}

async function settlePage(page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1200);
}

async function capture() {
  await ensureDir();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    colorScheme: "light"
  });
  const page = await context.newPage();

  for (const p of projects) {
    const pngPath = path.join(outDir, `${p.slug}.png`);
    const webpPath = path.join(outDir, `${p.slug}.webp`);

    console.log(`Capturing ${p.slug} (${p.url})...`);
    try {
      await page.goto(p.url, { waitUntil: "domcontentloaded", timeout: 90000 });
      try {
        await page.waitForLoadState("networkidle", { timeout: 20000 });
      } catch {
        /* animations / analytics may prevent networkidle */
      }
      await settlePage(page);

      await page.screenshot({
        path: pngPath,
        fullPage: false,
        clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
        animations: "disabled"
      });

      await sharp(pngPath)
        .resize({ width: OUTPUT_WIDTH })
        .webp({ quality: 80, effort: 4 })
        .toFile(webpPath);

      await fs.unlink(pngPath).catch(() => {});
      const stat = await fs.stat(webpPath);
      console.log(`  → ${p.slug}.webp (${Math.round(stat.size / 1024)} KB)`);
    } catch (err) {
      console.error(`  ✗ Failed ${p.slug}:`, err?.message || err);
    }
  }

  await browser.close();
  console.log("Done.");
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
