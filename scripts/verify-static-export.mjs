import { lstat } from "node:fs/promises";
import path from "node:path";

const expectedFiles = [
  "out/index.html",
  "out/projects.html",
  "out/privacy.html",
  "out/404.html",
  "out/robots.txt",
  "out/sitemap.xml",
  "out/manifest.webmanifest",
  "out/_headers"
];

const failures = [];

for (const relativePath of expectedFiles) {
  const absolutePath = path.resolve(process.cwd(), relativePath);

  try {
    const stats = await lstat(absolutePath);

    if (stats.isSymbolicLink()) {
      failures.push(`${relativePath}: symbolic links are not allowed`);
      continue;
    }

    if (!stats.isFile()) {
      failures.push(`${relativePath}: expected a regular file`);
      continue;
    }

    if (stats.size === 0) {
      failures.push(`${relativePath}: file is empty`);
      continue;
    }

    console.log(`Verified ${relativePath} (${stats.size} bytes)`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(`${relativePath}: ${message}`);
  }
}

if (failures.length > 0) {
  console.error("\nStatic export verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`\nVerified ${expectedFiles.length} required static export artifacts.`);
