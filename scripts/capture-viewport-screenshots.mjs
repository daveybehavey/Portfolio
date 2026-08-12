/**
 * Capture truthful viewport screenshots for DeviceShowcase.
 * Records desktop / tablet / mobile of live Maestro + StarMap only.
 *
 * Viewports (device CSS pixels, DPR 1):
 *   desktop: 1440 × 900
 *   tablet:   768 × 1024
 *   mobile:   390 × 844
 *
 * Output: public/projects/{slug}-{mode}.webp (optimized, not full-page PNG)
 */
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const projects = [
  { slug: "maestrosservices", url: "https://maestrosservices.com" },
  { slug: "starmapco", url: "https://starmapco.com" },
];

/** @type {ReadonlyArray<{ mode: string, width: number, height: number, outputWidth: number, quality: number }>} */
const VIEWPORTS = [
  { mode: "desktop", width: 1440, height: 900, outputWidth: 1200, quality: 78 },
  { mode: "tablet", width: 768, height: 1024, outputWidth: 768, quality: 78 },
  { mode: "mobile", width: 390, height: 844, outputWidth: 390, quality: 78 },
];

const outDir = path.join(process.cwd(), "public", "projects");

async function settlePage(page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1400);
}

async function capture() {
  await fs.mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const manifest = [];

  for (const project of projects) {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
        colorScheme: "light",
        isMobile: vp.mode === "mobile",
        hasTouch: vp.mode !== "desktop",
      });
      const page = await context.newPage();
      const pngPath = path.join(outDir, `${project.slug}-${vp.mode}.png`);
      const webpPath = path.join(outDir, `${project.slug}-${vp.mode}.webp`);

      console.log(
        `Capturing ${project.slug} @ ${vp.mode} (${vp.width}×${vp.height})…`,
      );

      try {
        await page.goto(project.url, {
          waitUntil: "domcontentloaded",
          timeout: 90000,
        });
        try {
          await page.waitForLoadState("networkidle", { timeout: 20000 });
        } catch {
          /* analytics / long-poll may block networkidle */
        }
        await settlePage(page);

        await page.screenshot({
          path: pngPath,
          fullPage: false,
          clip: { x: 0, y: 0, width: vp.width, height: vp.height },
          animations: "disabled",
        });

        await sharp(pngPath)
          .resize({ width: vp.outputWidth, withoutEnlargement: true })
          .webp({ quality: vp.quality, effort: 5 })
          .toFile(webpPath);

        await fs.unlink(pngPath).catch(() => {});
        const stat = await fs.stat(webpPath);
        const meta = await sharp(webpPath).metadata();
        const entry = {
          slug: project.slug,
          mode: vp.mode,
          captureViewport: { width: vp.width, height: vp.height },
          output: {
            path: `public/projects/${project.slug}-${vp.mode}.webp`,
            width: meta.width,
            height: meta.height,
            bytes: stat.size,
          },
        };
        manifest.push(entry);
        console.log(
          `  → ${project.slug}-${vp.mode}.webp ${meta.width}×${meta.height} (${Math.round(stat.size / 1024)} KB)`,
        );
      } catch (err) {
        console.error(`  ✗ Failed ${project.slug} ${vp.mode}:`, err?.message || err);
        await context.close();
        await browser.close();
        process.exitCode = 1;
        return;
      }

      await context.close();
    }
  }

  await browser.close();
  const manifestPath = path.join(outDir, "viewport-screenshots.json");
  await fs.writeFile(
    manifestPath,
    `${JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        note: "Above-the-fold screenshots of live project homepages at each CSS viewport. Not fabricated.",
        viewports: VIEWPORTS.map((vp) => ({
          mode: vp.mode,
          width: vp.width,
          height: vp.height,
        })),
        assets: manifest,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  console.log(`Wrote ${manifestPath}`);
  console.log("Done.");
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
