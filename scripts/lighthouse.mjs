/**
 * Build static export, serve locally, run Lighthouse (SEO + perf + a11y + best practices).
 * Requires: npm run build first (or run via npm run lighthouse).
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "out");
const port = Number(process.env.LH_PORT || 3456);
const baseUrl = `http://127.0.0.1:${port}`;

const pages = ["/", "/projects", "/privacy"];

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", shell: true, cwd: root, ...opts });
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

function serveStatic(dir) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let urlPath = req.url?.split("?")[0] || "/";
      if (urlPath.endsWith("/")) urlPath += "index.html";
      const filePath = path.join(dir, urlPath === "/" ? "index.html" : urlPath.replace(/^\//, ""));
      const tryPaths = [
        filePath,
        filePath.endsWith(".html") ? filePath : `${filePath}.html`,
        path.join(dir, "404.html")
      ];
      for (const p of tryPaths) {
        if (fs.existsSync(p) && fs.statSync(p).isFile()) {
          const ext = path.extname(p);
          const types = {
            ".html": "text/html",
            ".css": "text/css",
            ".js": "application/javascript",
            ".webp": "image/webp",
            ".png": "image/png",
            ".txt": "text/plain",
            ".xml": "application/xml",
            ".json": "application/json"
          };
          res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
          fs.createReadStream(p).pipe(res);
          return;
        }
      }
      res.writeHead(404);
      res.end("Not found");
    });
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

async function main() {
  if (!fs.existsSync(outDir)) {
    console.log("Building static export…");
    await run("npm", ["run", "build"]);
  }

  const server = await serveStatic(outDir);
  console.log(`Serving ${outDir} at ${baseUrl}`);

  const reportDir = path.join(root, "lighthouse-reports");
  await fs.promises.mkdir(reportDir, { recursive: true });

  for (const route of pages) {
    const url = `${baseUrl}${route}`;
    const slug = route === "/" ? "home" : route.slice(1);
    const outPath = path.join(reportDir, `${slug}.report.json`);
    console.log(`\nLighthouse: ${url}`);
    await run("npx", [
      "lighthouse",
      url,
      "--only-categories=performance,accessibility,best-practices,seo",
      "--output=json",
      `--output-path=${outPath}`,
      "--chrome-flags=--headless --no-sandbox",
      "--quiet"
    ]);
    const raw = await fs.promises.readFile(outPath, "utf8");
    const report = JSON.parse(raw);
    const scores = {};
    for (const [cat, data] of Object.entries(report.categories || {})) {
      scores[cat] = Math.round((data.score ?? 0) * 100);
    }
    console.log(`  Scores (${slug}):`, scores);
  }

  server.close();
  console.log(`\nReports saved under lighthouse-reports/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
