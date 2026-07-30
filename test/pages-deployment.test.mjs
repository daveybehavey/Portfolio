import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import test from "node:test";
import {
  assertPreviewDeployGuards,
  assertProductionDeployGuards,
  buildWranglerDeployArgs,
  buildProcessInvocation,
  COMPATIBILITY_DATE,
  DEFAULT_PREVIEW_COMMIT_MESSAGE,
  DEFAULT_PRODUCTION_COMMIT_MESSAGE,
  getGitStatus,
  parseJsonc,
  parsePagesDeployArgs,
  parsePorcelainStatus,
  PREVIEW_BRANCH,
  PREVIEW_SITE_KEY,
  PREVIEW_VARS,
  PRODUCTION_BRANCH,
  PRODUCTION_SITE_KEY,
  PRODUCTION_VARS,
  PROJECT_NAME,
  refreshOriginMain,
  isValidCommitSha,
  isValidDeploymentId,
  productionDisabledScanExpectations,
  productionScanExpectations,
  previewScanExpectations,
  resolveExecutable,
  runGuardedPreviewDeploy,
  runGuardedProductionDeploy,
  scanBuildAssets,
  validatePagesConfig,
  CONTACT_MAILTO_HREF,
  ONLINE_FORM_DISABLED_MESSAGE,
  buildPagesStaticExport,
} from "../scripts/pages-deployment-lib.mjs";

const SAMPLE_ROLLBACK_DEPLOYMENT_ID = "f0ddd72c-3740-4340-a9f7-4e98b63cf807";
const OTHER_ROLLBACK_DEPLOYMENT_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

function baseConfig(overrides = {}) {
  const base = {
    name: PROJECT_NAME,
    pages_build_output_dir: "./out",
    compatibility_date: COMPATIBILITY_DATE,
    vars: { ...PRODUCTION_VARS },
    env: {
      preview: {
        vars: { ...PREVIEW_VARS },
      },
    },
  };
  return {
    ...base,
    ...overrides,
    vars:
      overrides.vars === undefined
        ? base.vars
        : overrides.vars === null
          ? null
          : { ...overrides.vars },
    env:
      overrides.env === undefined
        ? base.env
        : {
            ...base.env,
            ...overrides.env,
            preview:
              overrides.env?.preview === undefined
                ? base.env.preview
                : {
                    ...base.env.preview,
                    ...overrides.env.preview,
                    vars:
                      overrides.env.preview?.vars === undefined
                        ? base.env.preview.vars
                        : { ...overrides.env.preview.vars },
                  },
          },
  };
}

function cleanGitStatus(overrides = {}) {
  return {
    branch: PRODUCTION_BRANCH,
    head: "abc123",
    originMain: "abc123",
    porcelain: "",
    trackedChanges: [],
    untrackedFiles: [],
    trackedDirty: false,
    workingTreeDirty: false,
    ...overrides,
  };
}

function silentLog() {}

async function writeMinimalOut(
  root,
  {
    siteKey,
    includeRoutes = true,
    includeContact = true,
    includeMailto = true,
    includeDisabledMessage = false,
  },
) {
  const outDir = path.join(root, "out");
  await mkdir(outDir, { recursive: true });
  const extras = [];
  if (includeMailto) extras.push(`<a href="${CONTACT_MAILTO_HREF}">email</a>`);
  if (includeDisabledMessage) extras.push(`<p>${ONLINE_FORM_DISABLED_MESSAGE}</p>`);
  await writeFile(
    path.join(outDir, "index.html"),
    `<html><body data-sitekey="${siteKey}">${extras.join("")}</body></html>\n`,
    "utf8",
  );
  if (includeRoutes) {
    const include = includeContact ? ["/api/contact"] : ["/api/other"];
    await writeFile(
      path.join(outDir, "_routes.json"),
      JSON.stringify({ version: 1, include, exclude: [] }),
      "utf8",
    );
  }
}

async function createTempGitRepo() {
  const root = await mkdtemp(path.join(tmpdir(), "pages-deploy-"));
  execFileSync("git", ["init"], { cwd: root, stdio: "ignore" });
  execFileSync("git", ["config", "user.email", "test@example.com"], {
    cwd: root,
    stdio: "ignore",
  });
  execFileSync("git", ["config", "user.name", "Test"], {
    cwd: root,
    stdio: "ignore",
  });
  await writeFile(path.join(root, "README.md"), "temp\n", "utf8");
  await writeFile(path.join(root, ".gitignore"), "out\n", "utf8");
  execFileSync("git", ["add", "."], { cwd: root, stdio: "ignore" });
  execFileSync("git", ["commit", "-m", "init"], { cwd: root, stdio: "ignore" });
  execFileSync("git", ["branch", "-M", "main"], { cwd: root, stdio: "ignore" });
  // Simulate origin/main without a remote.
  execFileSync("git", ["update-ref", "refs/remotes/origin/main", "HEAD"], {
    cwd: root,
    stdio: "ignore",
  });
  return root;
}

test("parseJsonc accepts comments and trailing commas", () => {
  const parsed = parseJsonc(`{
    // comment
    "name": "eurodigital-ca", // project
    /* block */
    "pages_build_output_dir": "./out",
  }`);
  assert.equal(parsed.name, "eurodigital-ca");
  assert.equal(parsed.pages_build_output_dir, "./out");
});

test("reviewed Pages configuration validates", () => {
  const report = validatePagesConfig(baseConfig());
  assert.equal(report.ok, true, JSON.stringify(report.checks.filter((c) => c.status === "fail")));
  assert.equal(report.summary.failed, 0);
});

test("validator rejects missing preview plain-text vars", () => {
  const config = baseConfig();
  delete config.env.preview.vars.CONTACT_ALLOWED_ORIGINS;
  const report = validatePagesConfig(config);
  assert.equal(report.ok, false);
  assert.ok(
    report.checks.some(
      (item) =>
        item.status === "fail" && item.name === "PREVIEW_CONTACT_ALLOWED_ORIGINS",
    ),
  );
});

test("validator rejects committed secrets", () => {
  const config = baseConfig();
  config.env.preview.vars.RESEND_API_KEY = "re_should_not_be_committed";
  config.vars.TURNSTILE_SECRET_KEY = "0xsecret";
  const report = validatePagesConfig(config);
  assert.equal(report.ok, false);
  const failed = report.checks
    .filter((item) => item.status === "fail")
    .map((item) => item.name);
  assert.ok(failed.includes("PREVIEW_NO_SECRET_RESEND_API_KEY"));
  assert.ok(failed.includes("PRODUCTION_NO_SECRET_TURNSTILE_SECRET_KEY"));
});

test("validator rejects production test credentials", () => {
  const config = baseConfig();
  config.vars.NEXT_PUBLIC_TURNSTILE_SITE_KEY = PREVIEW_SITE_KEY;
  const report = validatePagesConfig(config);
  assert.equal(report.ok, false);
  assert.ok(
    report.checks.some(
      (item) => item.status === "fail" && item.name === "PRODUCTION_NO_TEST_SITEKEY",
    ),
  );
});

test("validator rejects production sitekey in preview", () => {
  const config = baseConfig();
  config.env.preview.vars.NEXT_PUBLIC_TURNSTILE_SITE_KEY = PRODUCTION_SITE_KEY;
  const report = validatePagesConfig(config);
  assert.equal(report.ok, false);
  assert.ok(
    report.checks.some(
      (item) =>
        item.status === "fail" && item.name === "PREVIEW_NO_PRODUCTION_SITEKEY",
    ),
  );
});

test("validator rejects production localhost and wildcards", () => {
  const config = baseConfig();
  config.vars.CONTACT_ALLOWED_ORIGINS =
    "https://eurodigital.ca,http://localhost:3000";
  config.vars.TURNSTILE_ALLOWED_HOSTNAMES =
    "eurodigital.ca,*.eurodigital.ca,localhost";
  const report = validatePagesConfig(config);
  assert.equal(report.ok, false);
  const failed = report.checks
    .filter((item) => item.status === "fail")
    .map((item) => item.name);
  assert.ok(failed.includes("PRODUCTION_NO_WILDCARD"));
  assert.ok(failed.includes("PRODUCTION_NO_LOCALHOST"));
});

test("validator rejects production sender/recipient mismatches", () => {
  const config = baseConfig();
  config.vars.CONTACT_FROM_EMAIL =
    "EuroDigital <onboarding@resend.dev>";
  config.vars.CONTACT_TO_EMAIL = "delivered@resend.dev";
  const report = validatePagesConfig(config);
  assert.equal(report.ok, false);
  const failed = report.checks
    .filter((item) => item.status === "fail")
    .map((item) => item.name);
  assert.ok(failed.includes("PRODUCTION_SENDER"));
  assert.ok(failed.includes("PRODUCTION_RECIPIENT"));
});

test("canonical top-level Production plus env.preview passes", () => {
  const report = validatePagesConfig(baseConfig());
  assert.equal(report.ok, true);
  assert.ok(
    report.checks.some(
      (item) => item.status === "pass" && item.name === "NO_ENV_PRODUCTION",
    ),
  );
});

test("legacy env.production-only shape fails validation", () => {
  const legacy = {
    name: PROJECT_NAME,
    pages_build_output_dir: "./out",
    compatibility_date: COMPATIBILITY_DATE,
    env: {
      preview: { vars: { ...PREVIEW_VARS } },
      production: { vars: { ...PRODUCTION_VARS } },
    },
  };
  const report = validatePagesConfig(legacy);
  assert.equal(report.ok, false);
  const failed = report.checks
    .filter((item) => item.status === "fail")
    .map((item) => item.name);
  assert.ok(failed.includes("NO_ENV_PRODUCTION"));
  assert.ok(failed.includes("PRODUCTION_VARS_PRESENT"));
  assert.ok(failed.includes("PRODUCTION_TOP_LEVEL_VARS"));
});

test("missing top-level Production vars fails", () => {
  const config = baseConfig({ vars: null });
  delete config.vars;
  const report = validatePagesConfig(config);
  assert.equal(report.ok, false);
  assert.ok(
    report.checks.some(
      (item) => item.status === "fail" && item.name === "PRODUCTION_VARS_PRESENT",
    ),
  );
});

test("env.production presence fails even with top-level vars", () => {
  const config = baseConfig({
    env: {
      preview: { vars: { ...PREVIEW_VARS } },
      production: { vars: { ...PRODUCTION_VARS } },
    },
  });
  const report = validatePagesConfig(config);
  assert.equal(report.ok, false);
  assert.ok(
    report.checks.some(
      (item) => item.status === "fail" && item.name === "NO_ENV_PRODUCTION",
    ),
  );
});

test("Preview values accidentally placed at top level fail", () => {
  const config = baseConfig({ vars: { ...PREVIEW_VARS } });
  const report = validatePagesConfig(config);
  assert.equal(report.ok, false);
  assert.ok(
    report.checks.some(
      (item) => item.status === "fail" && item.name === "PRODUCTION_NO_TEST_SITEKEY",
    ),
  );
});

test("Production values accidentally placed in Preview fail", () => {
  const config = baseConfig({
    env: { preview: { vars: { ...PRODUCTION_VARS } } },
  });
  const report = validatePagesConfig(config);
  assert.equal(report.ok, false);
  assert.ok(
    report.checks.some(
      (item) =>
        item.status === "fail" && item.name === "PREVIEW_NO_PRODUCTION_SITEKEY",
    ),
  );
});

test("secret names under top-level vars fail", () => {
  const config = baseConfig();
  config.vars.RESEND_API_KEY = "re_should_not_be_committed";
  const report = validatePagesConfig(config);
  assert.equal(report.ok, false);
  assert.ok(
    report.checks.some(
      (item) =>
        item.status === "fail" && item.name === "PRODUCTION_NO_SECRET_RESEND_API_KEY",
    ),
  );
});

test("secret names under Preview vars fail", () => {
  const config = baseConfig();
  config.env.preview.vars.TURNSTILE_SECRET_KEY = "0xsecret";
  const report = validatePagesConfig(config);
  assert.equal(report.ok, false);
  assert.ok(
    report.checks.some(
      (item) =>
        item.status === "fail" &&
        item.name === "PREVIEW_NO_SECRET_TURNSTILE_SECRET_KEY",
    ),
  );
});
test("preview deploy guards refuse production branch", () => {
  const ok = assertPreviewDeployGuards({
    projectName: PROJECT_NAME,
    gitBranch: PREVIEW_BRANCH,
    deployBranch: PREVIEW_BRANCH,
    environment: "preview",
    productionBranch: PRODUCTION_BRANCH,
    workingTreeDirty: false,
  });
  assert.equal(ok.ok, true);

  const badMain = assertPreviewDeployGuards({
    projectName: PROJECT_NAME,
    gitBranch: PRODUCTION_BRANCH,
    deployBranch: PREVIEW_BRANCH,
    environment: "preview",
    productionBranch: PRODUCTION_BRANCH,
    workingTreeDirty: false,
  });
  assert.equal(badMain.ok, false);
  assert.ok(
    badMain.errors.some((error) => error.includes("git branch must be")),
  );

  const badDeploy = assertPreviewDeployGuards({
    projectName: PROJECT_NAME,
    gitBranch: PREVIEW_BRANCH,
    deployBranch: PRODUCTION_BRANCH,
    environment: "preview",
    productionBranch: PRODUCTION_BRANCH,
    workingTreeDirty: false,
  });
  assert.equal(badDeploy.ok, false);

  const dirty = assertPreviewDeployGuards({
    projectName: PROJECT_NAME,
    gitBranch: PREVIEW_BRANCH,
    deployBranch: PREVIEW_BRANCH,
    environment: "preview",
    productionBranch: PRODUCTION_BRANCH,
    workingTreeDirty: true,
  });
  assert.equal(dirty.ok, false);
});

test("production deploy guards refuse preview branch and missing authorization", () => {
  const base = {
    projectName: PROJECT_NAME,
    gitBranch: PRODUCTION_BRANCH,
    deployBranch: PRODUCTION_BRANCH,
    environment: "production",
    workingTreeDirty: false,
    head: "abc123",
    originMain: "abc123",
    expectedSha: "abc123",
    authorizeProductionDeploy: true,
    configOk: true,
  };
  assert.equal(assertProductionDeployGuards(base).ok, true);

  assert.equal(
    assertProductionDeployGuards({
      ...base,
      gitBranch: PREVIEW_BRANCH,
      deployBranch: PREVIEW_BRANCH,
    }).ok,
    false,
  );
  assert.equal(
    assertProductionDeployGuards({ ...base, workingTreeDirty: true }).ok,
    false,
  );
  assert.equal(
    assertProductionDeployGuards({ ...base, expectedSha: "deadbeef" }).ok,
    false,
  );
  assert.equal(
    assertProductionDeployGuards({
      ...base,
      authorizeProductionDeploy: false,
    }).ok,
    false,
  );
});

test("wrangler deploy args pin project and branch without custom --config", () => {
  const previewArgs = buildWranglerDeployArgs({
    target: "preview",
    commitHash: "dfde13d",
    commitMessage: "preview",
  });
  assert.ok(previewArgs.includes("--branch=contact-preview"));
  assert.ok(previewArgs.includes("--project-name=eurodigital-ca"));
  assert.equal(previewArgs.includes("--config=wrangler.jsonc"), false);
  assert.equal(
    previewArgs.some((arg) => arg === "-c" || arg.startsWith("--config")),
    false,
  );
  assert.ok(previewArgs.includes("--commit-dirty=false"));
  assert.deepEqual(previewArgs.slice(0, 3), ["pages", "deploy", "out"]);

  const productionArgs = buildWranglerDeployArgs({
    target: "production",
    commitHash: "dfde13d",
    commitMessage: "production",
  });
  assert.ok(productionArgs.includes("--branch=main"));
  assert.equal(productionArgs.includes("--config=wrangler.jsonc"), false);
  assert.equal(
    productionArgs.some((arg) => arg === "-c" || arg.startsWith("--config")),
    false,
  );
  assert.ok(!productionArgs.includes("--branch=contact-preview"));
});

test("parsePorcelainStatus classifies tracked and untracked entries", () => {
  const parsed = parsePorcelainStatus(
    [" M README.md", "?? functions/rogue.js", "A  scripts/new.mjs"].join("\n"),
  );
  assert.deepEqual(parsed.trackedChanges, ["README.md", "scripts/new.mjs"]);
  assert.deepEqual(parsed.untrackedFiles, ["functions/rogue.js"]);
});

test("getGitStatus treats untracked files as dirty and ignores out/", async () => {
  const root = await createTempGitRepo();
  try {
    const clean = getGitStatus({ cwd: root });
    assert.equal(clean.workingTreeDirty, false);
    assert.deepEqual(clean.untrackedFiles, []);

    await mkdir(path.join(root, "out"), { recursive: true });
    await writeFile(path.join(root, "out", "index.html"), "ignored\n", "utf8");
    const withIgnoredOut = getGitStatus({ cwd: root });
    assert.equal(withIgnoredOut.workingTreeDirty, false);

    await mkdir(path.join(root, "functions"), { recursive: true });
    await writeFile(path.join(root, "functions", "rogue.js"), "export {}\n", "utf8");
    const withUntracked = getGitStatus({ cwd: root });
    assert.equal(withUntracked.workingTreeDirty, true);
    assert.ok(
      withUntracked.untrackedFiles.some(
        (entry) => entry.replace(/\\/g, "/").includes("functions"),
      ),
      JSON.stringify(withUntracked.untrackedFiles),
    );

    await writeFile(path.join(root, "notes.tmp"), "temp\n", "utf8");
    const withArbitrary = getGitStatus({ cwd: root });
    assert.equal(withArbitrary.workingTreeDirty, true);
    assert.ok(
      withArbitrary.untrackedFiles.some((entry) =>
        entry.replace(/\\/g, "/").includes("notes.tmp"),
      ),
    );

    await writeFile(path.join(root, "README.md"), "changed\n", "utf8");
    const withTracked = getGitStatus({ cwd: root });
    assert.equal(withTracked.workingTreeDirty, true);
    assert.ok(withTracked.trackedChanges.includes("README.md"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("scanBuildAssets rejects preview sitekey and missing contact route for production", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "pages-scan-"));
  try {
    await writeMinimalOut(root, { siteKey: PREVIEW_SITE_KEY });
    const previewAsProd = await scanBuildAssets(
      path.join(root, "out"),
      productionScanExpectations(),
    );
    assert.equal(previewAsProd.ok, false);
    assert.ok(
      previewAsProd.errors.some((error) => error.includes("test sitekey")),
    );

    await writeMinimalOut(root, {
      siteKey: PRODUCTION_SITE_KEY,
      includeContact: false,
    });
    const missingContact = await scanBuildAssets(
      path.join(root, "out"),
      productionScanExpectations(),
    );
    assert.equal(missingContact.ok, false);
    assert.ok(
      missingContact.errors.some((error) => error.includes("/api/contact")),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

function productionDeployHarness(overrides = {}) {
  const order = [];
  const calls = { build: 0, scan: 0, process: [], statusReads: 0, refreshes: 0 };
  let git = cleanGitStatus(overrides.initialGit);
  let remoteSha = overrides.remoteSha ?? git.originMain ?? git.head ?? "abc123";
  const logs = [];

  const harness = {
    calls,
    order,
    logs,
    setGit(next) {
      git = { ...git, ...next };
    },
    setRemoteSha(next) {
      remoteSha = next;
    },
    deps: {
      loadConfig: async () => {
        order.push("config");
        return baseConfig();
      },
      validateConfig: validatePagesConfig,
      refreshRemoteMain: () => {
        calls.refreshes += 1;
        order.push(`fetch-${calls.refreshes}`);
        if (Array.isArray(overrides.refreshResults)) {
          return overrides.refreshResults[calls.refreshes - 1];
        }
        if (overrides.refreshResult && calls.refreshes === 1) {
          return overrides.refreshResult;
        }
        if (typeof overrides.refreshFactory === "function") {
          return overrides.refreshFactory(calls.refreshes, { git, remoteSha });
        }
        return { ok: true, originMain: remoteSha };
      },
      getStatus: () => {
        calls.statusReads += 1;
        order.push(`git-${calls.statusReads}`);
        return { ...git };
      },
      buildTarget: async (options = {}) => {
        calls.build += 1;
        order.push("build");
        calls.buildModes = calls.buildModes || [];
        calls.buildModes.push(options.contactFormMode || "enabled");
        if (typeof overrides.onBuild === "function") {
          overrides.onBuild(harness, options);
        }
        if (overrides.buildResult) return overrides.buildResult;
        return { ok: true, errors: [], contactFormMode: options.contactFormMode || "enabled" };
      },
      scanAssets: async (outDir, expectations) => {
        calls.scan += 1;
        order.push("scan");
        calls.scanExpectations = calls.scanExpectations || [];
        calls.scanExpectations.push(expectations);
        if (overrides.scanResult) return overrides.scanResult;
        return { ok: true, errors: [], findings: {} };
      },
      runProcess: (command, args) => {
        calls.process.push({ command, args });
        order.push("wrangler");
        return { status: 0, stdout: "", stderr: "" };
      },
      log: (message) => logs.push(String(message)),
      logError: silentLog,
    },
  };
  return harness;
}

test("production deploy refuses preview-style out artifact before Wrangler", async () => {
  const harness = productionDeployHarness({
    scanResult: {
      ok: false,
      errors: ["Built assets contain a Cloudflare Turnstile test sitekey."],
      findings: {},
    },
  });
  const result = await runGuardedProductionDeploy({
    root: "/tmp/unused",
    expectedSha: "abc123",
    authorizeProductionDeploy: true,
    executeDeploy: true,
        rollbackDeploymentId: "f0ddd72c-3740-4340-a9f7-4e98b63cf807",
      ...harness.deps,
  });
  assert.equal(result.ok, false);
  assert.equal(result.stage, "scan");
  assert.equal(result.wranglerInvoked, false);
  assert.equal(harness.calls.build, 1);
  assert.equal(harness.calls.process.length, 0);
});

test("production deploy rebuilds instead of trusting stale out/", async () => {
  const harness = productionDeployHarness();
  const result = await runGuardedProductionDeploy({
    root: "/tmp/unused",
    expectedSha: "abc123",
    authorizeProductionDeploy: true,
    dryRun: true,
        rollbackDeploymentId: "f0ddd72c-3740-4340-a9f7-4e98b63cf807",
      ...harness.deps,
  });
  assert.equal(result.ok, true);
  assert.equal(harness.calls.build, 1);
  assert.ok(harness.calls.scan >= 1);
  assert.equal(harness.calls.refreshes, 2);
  assert.equal(result.remoteRefreshCount, 2);
  assert.equal(result.wranglerInvoked, false);
});

test("production build failure stops before Wrangler", async () => {
  const harness = productionDeployHarness({
    buildResult: { ok: false, errors: ["npm run build failed with exit 1."] },
  });
  const result = await runGuardedProductionDeploy({
    root: "/tmp/unused",
    expectedSha: "abc123",
    authorizeProductionDeploy: true,
        rollbackDeploymentId: "f0ddd72c-3740-4340-a9f7-4e98b63cf807",
      ...harness.deps,
  });
  assert.equal(result.ok, false);
  assert.equal(result.stage, "build");
  assert.equal(result.wranglerInvoked, false);
  assert.equal(harness.calls.process.length, 0);
});

test("production asset-scan failure stops before Wrangler", async () => {
  const harness = productionDeployHarness({
    scanResult: {
      ok: false,
      errors: ["Built assets do not contain the production Turnstile sitekey."],
      findings: {},
    },
  });
  const result = await runGuardedProductionDeploy({
    root: "/tmp/unused",
    expectedSha: "abc123",
    authorizeProductionDeploy: true,
        rollbackDeploymentId: "f0ddd72c-3740-4340-a9f7-4e98b63cf807",
      ...harness.deps,
  });
  assert.equal(result.ok, false);
  assert.equal(result.stage, "scan");
  assert.equal(result.wranglerInvoked, false);
});

test("missing _routes.json stops before Wrangler", async () => {
  const harness = productionDeployHarness({
    scanResult: {
      ok: false,
      errors: ["_routes.json is missing from the build output."],
      findings: {},
    },
  });
  const result = await runGuardedProductionDeploy({
    root: "/tmp/unused",
    expectedSha: "abc123",
    authorizeProductionDeploy: true,
        rollbackDeploymentId: "f0ddd72c-3740-4340-a9f7-4e98b63cf807",
      ...harness.deps,
  });
  assert.equal(result.ok, false);
  assert.equal(result.stage, "scan");
  assert.equal(result.wranglerInvoked, false);
});

test("test Turnstile sitekey in production output stops before Wrangler", async () => {
  const harness = productionDeployHarness({
    scanResult: {
      ok: false,
      errors: ["Built assets contain a Cloudflare Turnstile test sitekey."],
      findings: {},
    },
  });
  const result = await runGuardedProductionDeploy({
    root: "/tmp/unused",
    expectedSha: "abc123",
    authorizeProductionDeploy: true,
        rollbackDeploymentId: "f0ddd72c-3740-4340-a9f7-4e98b63cf807",
      ...harness.deps,
  });
  assert.equal(result.ok, false);
  assert.equal(result.wranglerInvoked, false);
});

test("missing production sitekey stops before Wrangler", async () => {
  const harness = productionDeployHarness({
    scanResult: {
      ok: false,
      errors: ["Built assets do not contain the production Turnstile sitekey."],
      findings: {},
    },
  });
  const result = await runGuardedProductionDeploy({
    root: "/tmp/unused",
    expectedSha: "abc123",
    authorizeProductionDeploy: true,
        rollbackDeploymentId: "f0ddd72c-3740-4340-a9f7-4e98b63cf807",
      ...harness.deps,
  });
  assert.equal(result.ok, false);
  assert.equal(result.wranglerInvoked, false);
});

test("git HEAD changing between guards stops before Wrangler", async () => {
  const harness = productionDeployHarness();
  let reads = 0;
  harness.deps.getStatus = () => {
    reads += 1;
    if (reads === 1) return cleanGitStatus();
    // post-build status after buildTarget's requireCleanWorkingTree read and deploy's post read
    return cleanGitStatus({ head: "changedsha", originMain: "abc123" });
  };
  // buildTarget also calls getStatus - simplify by not requiring clean in injected build
  harness.deps.buildTarget = async () => {
    harness.calls.build += 1;
    return { ok: true, errors: [] };
  };

  const result = await runGuardedProductionDeploy({
    root: "/tmp/unused",
    expectedSha: "abc123",
    authorizeProductionDeploy: true,
        rollbackDeploymentId: "f0ddd72c-3740-4340-a9f7-4e98b63cf807",
      ...harness.deps,
  });
  assert.equal(result.ok, false);
  assert.equal(result.stage, "post-build-git");
  assert.equal(result.wranglerInvoked, false);
  assert.equal(harness.calls.process.length, 0);
});

test("production dry-run prepares artifact but makes no Cloudflare call", async () => {
  const harness = productionDeployHarness();
  const result = await runGuardedProductionDeploy({
    root: "/tmp/unused",
    expectedSha: "abc123",
    authorizeProductionDeploy: true,
    dryRun: true,
        rollbackDeploymentId: "f0ddd72c-3740-4340-a9f7-4e98b63cf807",
      ...harness.deps,
  });
  assert.equal(result.ok, true);
  assert.equal(result.stage, "dry-run");
  assert.equal(result.wranglerInvoked, false);
  assert.equal(harness.calls.build, 1);
  assert.ok(harness.calls.scan >= 1);
  assert.equal(harness.calls.process.length, 0);
  assert.ok(
    harness.logs.some((line) =>
      line.includes("Production artifact built and verified."),
    ),
  );
  assert.ok(
    harness.logs.some((line) =>
      line.includes("Dry run complete. No Cloudflare request was made."),
    ),
  );
});

test("successful guarded execution invokes Wrangler only after build scan and git verification", async () => {
  const harness = productionDeployHarness();
  const result = await runGuardedProductionDeploy({
    root: "/tmp/unused",
    expectedSha: "abc123",
    authorizeProductionDeploy: true,
    executeDeploy: true,
        rollbackDeploymentId: "f0ddd72c-3740-4340-a9f7-4e98b63cf807",
      ...harness.deps,
  });
  assert.equal(result.ok, true);
  assert.equal(result.wranglerInvoked, true);
  assert.equal(result.remoteRefreshCount, 2);
  assert.equal(harness.calls.build, 1);
  assert.ok(harness.calls.scan >= 1);
  assert.equal(harness.calls.refreshes, 2);
  assert.equal(harness.calls.process.length, 1);
  assert.equal(harness.calls.process[0].command, "npx");
  assert.equal(harness.calls.process[0].args[0], "wrangler");
  assert.ok(harness.calls.process[0].args.includes("pages"));
  assert.ok(harness.calls.process[0].args.includes("deploy"));
  const expectedOrder = ["fetch-1", "git-1", "build", "scan", "fetch-2", "git-2", "wrangler"];
  assert.deepEqual(
    harness.order.filter((step) => expectedOrder.includes(step)),
    expectedOrder,
  );
});

test("untracked functions/rogue.js blocks production before Wrangler", async () => {
  const harness = productionDeployHarness({
    initialGit: cleanGitStatus({
      workingTreeDirty: true,
      untrackedFiles: ["functions/rogue.js"],
    }),
  });
  const result = await runGuardedProductionDeploy({
    root: "/tmp/unused",
    expectedSha: "abc123",
    authorizeProductionDeploy: true,
        rollbackDeploymentId: "f0ddd72c-3740-4340-a9f7-4e98b63cf807",
      ...harness.deps,
  });
  assert.equal(result.ok, false);
  assert.equal(result.stage, "initial-git");
  assert.equal(result.wranglerInvoked, false);
  assert.equal(harness.calls.build, 0);
  assert.equal(harness.calls.process.length, 0);
});

test("arbitrary non-ignored untracked file blocks production before Wrangler", async () => {
  const harness = productionDeployHarness({
    initialGit: cleanGitStatus({
      workingTreeDirty: true,
      untrackedFiles: ["notes.tmp"],
    }),
  });
  const result = await runGuardedProductionDeploy({
    root: "/tmp/unused",
    expectedSha: "abc123",
    authorizeProductionDeploy: true,
        rollbackDeploymentId: "f0ddd72c-3740-4340-a9f7-4e98b63cf807",
      ...harness.deps,
  });
  assert.equal(result.ok, false);
  assert.equal(result.wranglerInvoked, false);
  assert.equal(harness.calls.process.length, 0);
});

test("tracked modification blocks production before Wrangler", async () => {
  const harness = productionDeployHarness({
    initialGit: cleanGitStatus({
      workingTreeDirty: true,
      trackedChanges: ["scripts/pages-deploy.mjs"],
      trackedDirty: true,
    }),
  });
  const result = await runGuardedProductionDeploy({
    root: "/tmp/unused",
    expectedSha: "abc123",
    authorizeProductionDeploy: true,
        rollbackDeploymentId: "f0ddd72c-3740-4340-a9f7-4e98b63cf807",
      ...harness.deps,
  });
  assert.equal(result.ok, false);
  assert.equal(result.wranglerInvoked, false);
});

test("missing authorization blocks production before Wrangler", async () => {
  const harness = productionDeployHarness();
  const result = await runGuardedProductionDeploy({
    root: "/tmp/unused",
    expectedSha: "abc123",
    authorizeProductionDeploy: false,
        rollbackDeploymentId: "f0ddd72c-3740-4340-a9f7-4e98b63cf807",
      ...harness.deps,
  });
  assert.equal(result.ok, false);
  assert.equal(result.stage, "initial-git");
  assert.equal(result.wranglerInvoked, false);
  assert.equal(harness.calls.process.length, 0);
});

test("mismatched expected SHA blocks production before Wrangler", async () => {
  const harness = productionDeployHarness();
  const result = await runGuardedProductionDeploy({
    root: "/tmp/unused",
    expectedSha: "deadbeef",
    authorizeProductionDeploy: true,
        rollbackDeploymentId: "f0ddd72c-3740-4340-a9f7-4e98b63cf807",
      ...harness.deps,
  });
  assert.equal(result.ok, false);
  assert.equal(result.stage, "initial-git");
  assert.equal(result.wranglerInvoked, false);
  assert.equal(harness.calls.process.length, 0);
});

function cleanPreviewGitStatus(overrides = {}) {
  return {
    branch: PREVIEW_BRANCH,
    head: "previewsha",
    originMain: "abc123",
    porcelain: "",
    trackedChanges: [],
    untrackedFiles: [],
    trackedDirty: false,
    workingTreeDirty: false,
    ...overrides,
  };
}

function previewDeployHarness(overrides = {}) {
  const order = [];
  const calls = { build: 0, scan: 0, process: [], statusReads: 0 };
  let git = cleanPreviewGitStatus(overrides.initialGit);
  const logs = [];

  return {
    calls,
    order,
    logs,
    setGit(next) {
      git = { ...git, ...next };
    },
    deps: {
      loadConfig: async () => {
        order.push("config");
        return baseConfig();
      },
      validateConfig: (config) => {
        order.push("validate");
        return validatePagesConfig(config);
      },
      getStatus: () => {
        calls.statusReads += 1;
        order.push(`git-${calls.statusReads}`);
        return { ...git };
      },
      buildTarget: async () => {
        calls.build += 1;
        order.push("build");
        if (overrides.buildResult) return overrides.buildResult;
        return { ok: true, errors: [] };
      },
      scanAssets: async () => {
        calls.scan += 1;
        order.push("scan");
        if (overrides.scanResult) return overrides.scanResult;
        return { ok: true, errors: [], findings: {} };
      },
      runProcess: (command, args) => {
        calls.process.push({ command, args });
        order.push("wrangler");
        return { status: 0, stdout: "", stderr: "" };
      },
      log: (message) => logs.push(String(message)),
      logError: silentLog,
    },
  };
}

test("preview deploy rebuilds rather than trusting stale out/", async () => {
  const harness = previewDeployHarness();
  const result = await runGuardedPreviewDeploy({
    root: "/tmp/unused",
    dryRun: true,
    ...harness.deps,
  });
  assert.equal(result.ok, true);
  assert.equal(harness.calls.build, 1);
  assert.ok(harness.calls.scan >= 1);
  assert.ok(harness.order.indexOf("build") < harness.order.indexOf("scan"));
  assert.equal(result.wranglerInvoked, false);
});

test("production-keyed artifact cannot be uploaded as Preview", async () => {
  const harness = previewDeployHarness({
    scanResult: {
      ok: false,
      errors: ["Built assets contain the production Turnstile sitekey."],
      findings: {},
    },
  });
  const result = await runGuardedPreviewDeploy({
    root: "/tmp/unused",
    ...harness.deps,
  });
  assert.equal(result.ok, false);
  assert.equal(result.stage, "scan");
  assert.equal(result.wranglerInvoked, false);
  assert.equal(harness.calls.build, 1);
  assert.equal(harness.calls.process.length, 0);
  assert.ok(!harness.order.includes("wrangler"));
});

test("missing Preview test sitekey stops before Wrangler", async () => {
  const harness = previewDeployHarness({
    scanResult: {
      ok: false,
      errors: ["Built assets do not contain the official Turnstile test sitekey."],
      findings: {},
    },
  });
  const result = await runGuardedPreviewDeploy({
    root: "/tmp/unused",
    ...harness.deps,
  });
  assert.equal(result.ok, false);
  assert.equal(result.stage, "scan");
  assert.equal(result.wranglerInvoked, false);
});

test("production sitekey in Preview output stops before Wrangler", async () => {
  const harness = previewDeployHarness({
    scanResult: {
      ok: false,
      errors: ["Built assets contain the production Turnstile sitekey."],
      findings: {},
    },
  });
  const result = await runGuardedPreviewDeploy({
    root: "/tmp/unused",
    ...harness.deps,
  });
  assert.equal(result.ok, false);
  assert.equal(result.wranglerInvoked, false);
  assert.equal(harness.calls.process.length, 0);
});

test("preview build failure stops before Wrangler", async () => {
  const harness = previewDeployHarness({
    buildResult: { ok: false, errors: ["npm run build failed with exit 1."] },
  });
  const result = await runGuardedPreviewDeploy({
    root: "/tmp/unused",
    ...harness.deps,
  });
  assert.equal(result.ok, false);
  assert.equal(result.stage, "build");
  assert.equal(result.wranglerInvoked, false);
  assert.equal(harness.calls.scan, 0);
  assert.equal(harness.calls.process.length, 0);
});

test("preview asset-scan failure stops before Wrangler", async () => {
  const harness = previewDeployHarness({
    scanResult: {
      ok: false,
      errors: ["Built assets contain a Resend API key pattern."],
      findings: {},
    },
  });
  const result = await runGuardedPreviewDeploy({
    root: "/tmp/unused",
    ...harness.deps,
  });
  assert.equal(result.ok, false);
  assert.equal(result.stage, "scan");
  assert.equal(result.wranglerInvoked, false);
});

test("preview missing _routes.json stops before Wrangler", async () => {
  const harness = previewDeployHarness({
    scanResult: {
      ok: false,
      errors: ["_routes.json is missing from the build output."],
      findings: {},
    },
  });
  const result = await runGuardedPreviewDeploy({
    root: "/tmp/unused",
    ...harness.deps,
  });
  assert.equal(result.ok, false);
  assert.equal(result.stage, "scan");
  assert.equal(result.wranglerInvoked, false);
});

test("preview missing /api/contact route stops before Wrangler", async () => {
  const harness = previewDeployHarness({
    scanResult: {
      ok: false,
      errors: ["_routes.json must include the /api/contact Function route."],
      findings: {},
    },
  });
  const result = await runGuardedPreviewDeploy({
    root: "/tmp/unused",
    ...harness.deps,
  });
  assert.equal(result.ok, false);
  assert.equal(result.stage, "scan");
  assert.equal(result.wranglerInvoked, false);
});

test("dirty tracked tree blocks Preview before Wrangler", async () => {
  const harness = previewDeployHarness({
    initialGit: cleanPreviewGitStatus({
      workingTreeDirty: true,
      trackedChanges: ["README.md"],
      trackedDirty: true,
    }),
  });
  const result = await runGuardedPreviewDeploy({
    root: "/tmp/unused",
    ...harness.deps,
  });
  assert.equal(result.ok, false);
  assert.equal(result.stage, "initial-git");
  assert.equal(result.wranglerInvoked, false);
  assert.equal(harness.calls.build, 0);
  assert.equal(harness.calls.process.length, 0);
});

test("non-ignored untracked file blocks Preview before Wrangler", async () => {
  const harness = previewDeployHarness({
    initialGit: cleanPreviewGitStatus({
      workingTreeDirty: true,
      untrackedFiles: ["functions/rogue.js"],
    }),
  });
  const result = await runGuardedPreviewDeploy({
    root: "/tmp/unused",
    ...harness.deps,
  });
  assert.equal(result.ok, false);
  assert.equal(result.stage, "initial-git");
  assert.equal(result.wranglerInvoked, false);
  assert.equal(harness.calls.build, 0);
});

test("HEAD changing during Preview build blocks before Wrangler", async () => {
  const harness = previewDeployHarness();
  let reads = 0;
  harness.deps.getStatus = () => {
    reads += 1;
    harness.order.push(`git-${reads}`);
    if (reads === 1) return cleanPreviewGitStatus();
    return cleanPreviewGitStatus({ head: "drifted" });
  };
  const result = await runGuardedPreviewDeploy({
    root: "/tmp/unused",
    ...harness.deps,
  });
  assert.equal(result.ok, false);
  assert.equal(result.stage, "post-build-git");
  assert.equal(result.wranglerInvoked, false);
  assert.equal(harness.calls.process.length, 0);
  assert.ok(harness.order.indexOf("build") < harness.order.lastIndexOf("git-2"));
});

test("branch changing during Preview build blocks before Wrangler", async () => {
  const harness = previewDeployHarness();
  let reads = 0;
  harness.deps.getStatus = () => {
    reads += 1;
    if (reads === 1) return cleanPreviewGitStatus();
    return cleanPreviewGitStatus({ branch: PRODUCTION_BRANCH });
  };
  const result = await runGuardedPreviewDeploy({
    root: "/tmp/unused",
    ...harness.deps,
  });
  assert.equal(result.ok, false);
  assert.equal(result.stage, "post-build-git");
  assert.equal(result.wranglerInvoked, false);
  assert.equal(harness.calls.process.length, 0);
});

test("preview dry-run builds and verifies but never invokes Wrangler", async () => {
  const harness = previewDeployHarness();
  const result = await runGuardedPreviewDeploy({
    root: "/tmp/unused",
    dryRun: true,
    ...harness.deps,
  });
  assert.equal(result.ok, true);
  assert.equal(result.stage, "dry-run");
  assert.equal(result.wranglerInvoked, false);
  assert.equal(harness.calls.build, 1);
  assert.ok(harness.calls.scan >= 1);
  assert.equal(harness.calls.process.length, 0);
  assert.ok(
    harness.logs.some((line) =>
      line.includes("Preview artifact built and verified."),
    ),
  );
  assert.ok(
    harness.logs.some((line) =>
      line.includes("Dry run complete. No Cloudflare request was made."),
    ),
  );
  assert.deepEqual(
    harness.order.filter((step) =>
      ["build", "scan", "wrangler"].includes(step),
    ),
    ["build", "scan"],
  );
});

test("successful Preview execution invokes Wrangler only after build scan and git verification", async () => {
  const harness = previewDeployHarness();
  const result = await runGuardedPreviewDeploy({
    root: "/tmp/unused",
    executeDeploy: true,
    authorizePreviewDeploy: true,
    ...harness.deps,
  });
  assert.equal(result.ok, true);
  assert.equal(result.wranglerInvoked, true);
  assert.equal(harness.calls.build, 1);
  assert.ok(harness.calls.scan >= 1);
  assert.equal(harness.calls.process.length, 1);
  assert.equal(harness.calls.process[0].command, "npx");
  assert.equal(harness.calls.process[0].args[0], "wrangler");
  const buildIdx = harness.order.indexOf("build");
  const scanIdx = harness.order.indexOf("scan");
  const wranglerIdx = harness.order.indexOf("wrangler");
  assert.ok(buildIdx >= 0 && scanIdx > buildIdx && wranglerIdx > scanIdx);
});

test("parseJsonc accepts strict JSON", () => {
  const parsed = parseJsonc('{"name":"eurodigital-ca","pages_build_output_dir":"./out"}');
  assert.equal(parsed.name, "eurodigital-ca");
});

test("parseJsonc accepts inline line and block comments", () => {
  const parsed = parseJsonc(`{
    "name": "eurodigital-ca", // project
    "pages_build_output_dir": /* output */ "./out"
  }`);
  assert.equal(parsed.name, "eurodigital-ca");
  assert.equal(parsed.pages_build_output_dir, "./out");
});

test("parseJsonc accepts multiline block comments", () => {
  const parsed = parseJsonc(`{
    /* multi
       line */
    "name": "eurodigital-ca"
  }`);
  assert.equal(parsed.name, "eurodigital-ca");
});

test("parseJsonc accepts trailing commas in nested objects", () => {
  const parsed = parseJsonc(`{
    "name": "eurodigital-ca",
    "env": {
      "preview": {
        "vars": {
          "CONTACT_TO_EMAIL": "delivered@resend.dev",
        },
      },
    },
  }`);
  assert.equal(parsed.env.preview.vars.CONTACT_TO_EMAIL, "delivered@resend.dev");
});

test("parseJsonc preserves // and block markers inside strings", () => {
  const parsed = parseJsonc(`{
    "note": "use https://eurodigital.ca // not a comment",
    "block": "keep /* inside */ strings"
  }`);
  assert.equal(parsed.note, "use https://eurodigital.ca // not a comment");
  assert.equal(parsed.block, "keep /* inside */ strings");
});

test("parseJsonc rejects malformed syntax without leaking contents", () => {
  assert.throws(
    () => parseJsonc('{ "name": "eurodigital-ca", '),
    (error) => {
      assert.equal(error.message, "Invalid Wrangler JSONC configuration.");
      assert.ok(!String(error.message).includes("eurodigital-ca"));
      return true;
    },
  );
});

test("canonical wrangler.jsonc continues to validate", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8"),
  );
  const config = parseJsonc(source);
  const report = validatePagesConfig(config);
  assert.equal(report.ok, true, JSON.stringify(report.checks.filter((c) => c.status === "fail")));
});

test("Windows resolver maps npm and npx to cmd shims", () => {
  assert.equal(resolveExecutable("npm", "win32"), "npm.cmd");
  assert.equal(resolveExecutable("npx", "win32"), "npx.cmd");
  assert.equal(resolveExecutable("node", "win32"), "node");
  assert.equal(resolveExecutable("npm", "linux"), "npm");
  assert.equal(resolveExecutable("npx", "darwin"), "npx");
});

test("Windows process invocation disables shell and preserves spaced commit messages", () => {
  const previewArgs = buildWranglerDeployArgs({
    target: "preview",
    commitHash: "abc",
    commitMessage: DEFAULT_PREVIEW_COMMIT_MESSAGE,
  });
  const productionArgs = buildWranglerDeployArgs({
    target: "production",
    commitHash: "abc",
    commitMessage: DEFAULT_PRODUCTION_COMMIT_MESSAGE,
  });
  const custom = "Release candidate 42";
  const meta = "Release & | < > ^ % ( )";
  const customArgs = buildWranglerDeployArgs({
    target: "preview",
    commitHash: "abc",
    commitMessage: custom,
  });
  const metaArgs = buildWranglerDeployArgs({
    target: "production",
    commitHash: "abc",
    commitMessage: meta,
  });

  assert.equal(
    previewArgs.filter((arg) => arg.startsWith("--commit-message=")).length,
    1,
  );
  assert.ok(
    previewArgs.includes(`--commit-message=${DEFAULT_PREVIEW_COMMIT_MESSAGE}`),
  );
  assert.ok(
    productionArgs.includes(
      `--commit-message=${DEFAULT_PRODUCTION_COMMIT_MESSAGE}`,
    ),
  );
  assert.ok(customArgs.includes(`--commit-message=${custom}`));
  assert.ok(metaArgs.includes(`--commit-message=${meta}`));

  const invocation = buildProcessInvocation("npx", ["wrangler", ...customArgs], {
    platform: "win32",
    execPath: "C:\\fake\\node.exe",
    cwd: "/tmp",
    env: { PATH: "x" },
    stdio: "pipe",
  });
  assert.equal(invocation.command, "C:\\fake\\node.exe");
  assert.equal(invocation.shim, "npx.cmd");
  assert.equal(invocation.resolvedVia, "node-cli");
  assert.equal(invocation.options.shell, false);
  assert.ok(invocation.args[0].replace(/\\/g, "/").endsWith("npx-cli.js"));
  assert.deepEqual(
    invocation.args.filter((arg) => arg.startsWith("--commit-message=")),
    [`--commit-message=${custom}`],
  );

  const npmInvocation = buildProcessInvocation("npm", ["run", "build"], {
    platform: "win32",
    execPath: "C:\\fake\\node.exe",
  });
  assert.equal(npmInvocation.command, "C:\\fake\\node.exe");
  assert.equal(npmInvocation.shim, "npm.cmd");
  assert.equal(npmInvocation.options.shell, false);
  assert.ok(npmInvocation.args[0].replace(/\\/g, "/").endsWith("npm-cli.js"));
  assert.deepEqual(npmInvocation.args.slice(1), ["run", "build"]);

  const nodeInvocation = buildProcessInvocation(
    "node",
    ["scripts/verify-static-export.mjs"],
    { platform: "win32" },
  );
  assert.equal(nodeInvocation.command, "node");
  assert.equal(nodeInvocation.options.shell, false);
  assert.deepEqual(nodeInvocation.args, ["scripts/verify-static-export.mjs"]);

  const metaInvocation = buildProcessInvocation(
    "npx",
    ["wrangler", ...metaArgs],
    { platform: "win32", execPath: "C:\\fake\\node.exe" },
  );
  assert.ok(metaInvocation.args.includes(`--commit-message=${meta}`));
});

test("guarded dry-runs preserve process order and never invoke Wrangler", async () => {
  const preview = previewDeployHarness();
  const previewResult = await runGuardedPreviewDeploy({
    root: "/tmp/unused",
    dryRun: true,
    ...preview.deps,
  });
  assert.equal(previewResult.ok, true);
  assert.equal(previewResult.wranglerInvoked, false);
  assert.deepEqual(
    preview.order.filter((step) => ["build", "scan", "wrangler"].includes(step)),
    ["build", "scan"],
  );

  const production = productionDeployHarness();
  const productionResult = await runGuardedProductionDeploy({
    root: "/tmp/unused",
    expectedSha: "abc123",
    authorizeProductionDeploy: true,
    dryRun: true,
        rollbackDeploymentId: "f0ddd72c-3740-4340-a9f7-4e98b63cf807",
      ...production.deps,
  });
  assert.equal(productionResult.ok, true);
  assert.equal(productionResult.wranglerInvoked, false);
  assert.equal(productionResult.remoteRefreshCount, 2);
  assert.equal(production.calls.build, 1);
  assert.ok(production.calls.scan >= 1);
  assert.equal(production.calls.refreshes, 2);
  assert.equal(production.calls.process.length, 0);
});

test("parsePagesDeployArgs rejects --commit-message --dry-run", () => {
  assert.throws(
    () =>
      parsePagesDeployArgs([
        "--target",
        "preview",
        "--commit-message",
        "--dry-run",
      ]),
    /--commit-message requires a value/,
  );
});

test("parsePagesDeployArgs rejects missing and empty commit-message values", () => {
  assert.throws(
    () => parsePagesDeployArgs(["--target", "preview", "--commit-message"]),
    /--commit-message requires a value/,
  );
  assert.throws(
    () => parsePagesDeployArgs(["--target", "preview", "--commit-message="]),
    /--commit-message requires a value/,
  );
});

test("parsePagesDeployArgs rejects missing and empty expected-sha values", () => {
  assert.throws(
    () =>
      parsePagesDeployArgs([
        "--target",
        "production",
        "--expected-sha",
        "--authorize-production-deploy",
      ]),
    /--expected-sha requires a value/,
  );
  assert.throws(
    () =>
      parsePagesDeployArgs([
        "--target",
        "production",
        "--expected-sha",
      ]),
    /--expected-sha requires a value/,
  );
  assert.throws(
    () =>
      parsePagesDeployArgs([
        "--target",
        "production",
        "--expected-sha=",
      ]),
    /--expected-sha requires a value/,
  );
});

test("parsePagesDeployArgs rejects missing and empty target values", () => {
  assert.throws(
    () => parsePagesDeployArgs(["--target", "--dry-run"]),
    /--target requires a value/,
  );
  assert.throws(
    () => parsePagesDeployArgs(["--target"]),
    /--target requires a value/,
  );
  assert.throws(
    () => parsePagesDeployArgs(["--target="]),
    /--target requires a value/,
  );
});

test("parsePagesDeployArgs preserves spaced and metacharacter commit messages", () => {
  const spaced = parsePagesDeployArgs([
    "--target",
    "preview",
    "--commit-message",
    "Release candidate 42",
    "--dry-run",
  ]);
  assert.equal(spaced.commitMessage, "Release candidate 42");
  assert.equal(spaced.dryRun, true);

  const meta = "Release & | < > ^ % ( )";
  const withMeta = parsePagesDeployArgs([
    "--target=preview",
    `--commit-message=${meta}`,
  ]);
  assert.equal(withMeta.commitMessage, meta);
});

test("parsePagesDeployArgs accepts valid Preview and Production dry-run shapes", () => {
  const preview = parsePagesDeployArgs([
    "--target",
    "preview",
    "--dry-run",
  ]);
  assert.deepEqual(preview, {
    target: "preview",
    dryRun: true,
    executeDeploy: false,
    expectedSha: null,
    authorizeProductionDeploy: false,
    authorizePreviewDeploy: false,
    commitMessage: null,
    rollbackDeploymentId: null,
    disableContactForm: false,
    authorizeContactFormDisable: false,
    help: false,
  });

  const sha = "a".repeat(40);
  const production = parsePagesDeployArgs([
    "--target",
    "production",
    "--expected-sha",
    sha,
    "--rollback-deployment-id",
    SAMPLE_ROLLBACK_DEPLOYMENT_ID,
    "--authorize-production-deploy",
    "--dry-run",
  ]);
  assert.equal(production.target, "production");
  assert.equal(production.expectedSha, sha);
  assert.equal(production.authorizeProductionDeploy, true);
  assert.equal(production.dryRun, true);
  assert.equal(production.executeDeploy, false);
  assert.equal(production.rollbackDeploymentId, SAMPLE_ROLLBACK_DEPLOYMENT_ID);
  assert.equal(production.disableContactForm, false);
});

test("parsePagesDeployArgs treats missing dry-run as safe non-execution", () => {
  const preview = parsePagesDeployArgs(["--target", "preview"]);
  assert.equal(preview.executeDeploy, false);
  assert.equal(preview.dryRun, false);
});

test("dangerous production argv with missing commit-message fails before build or Wrangler", async () => {
  const dangerous = [
    "--target",
    "production",
    "--expected-sha",
    "a".repeat(40),
    "--authorize-production-deploy",
    "--commit-message",
    "--dry-run",
  ];

  let parserRejected = false;
  let buildInvoked = false;
  let wranglerInvoked = false;

  try {
    const options = parsePagesDeployArgs(dangerous);
    // Unreachable when the parser rejects flag-shaped values; if it ever
    // incorrectly succeeds, prove deploy still must not be treated as dry-run.
    assert.equal(options.dryRun, true);
    const harness = productionDeployHarness();
    harness.deps.buildTarget = async () => {
      buildInvoked = true;
      return { ok: true, errors: [] };
    };
    harness.deps.runProcess = () => {
      wranglerInvoked = true;
      return { status: 0, stdout: "", stderr: "" };
    };
    await runGuardedProductionDeploy({
      root: "/tmp/unused",
      expectedSha: options.expectedSha,
      authorizeProductionDeploy: options.authorizeProductionDeploy,
      executeDeploy: options.executeDeploy,
      commitMessage: options.commitMessage,
      rollbackDeploymentId: "f0ddd72c-3740-4340-a9f7-4e98b63cf807",
      ...harness.deps,
    });
  } catch (error) {
    parserRejected = /--commit-message requires a value/.test(
      error instanceof Error ? error.message : String(error),
    );
  }

  assert.equal(parserRejected, true);
  assert.equal(buildInvoked, false);
  assert.equal(wranglerInvoked, false);
});

const FULL_SHA_A = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const FULL_SHA_B = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const FULL_SHA_C = "cccccccccccccccccccccccccccccccccccccccc";

test("isValidCommitSha accepts only full hexadecimal SHAs", () => {
  assert.equal(isValidCommitSha(FULL_SHA_A), true);
  assert.equal(isValidCommitSha("ABCDEF0123456789ABCDEF0123456789ABCDEF01"), true);
  assert.equal(isValidCommitSha("abc123"), false);
  assert.equal(isValidCommitSha(`${FULL_SHA_A}\n${FULL_SHA_B}`), false);
  assert.equal(isValidCommitSha("g".repeat(40)), false);
  assert.equal(isValidCommitSha(""), false);
  assert.equal(isValidCommitSha(null), false);
});

test("initial live remote refresh happens before the first Production Git guard", async () => {
  const harness = productionDeployHarness({ remoteSha: "abc123" });
  const result = await runGuardedProductionDeploy({
    root: "/tmp/unused",
    expectedSha: "abc123",
    authorizeProductionDeploy: true,
    dryRun: true,
        rollbackDeploymentId: "f0ddd72c-3740-4340-a9f7-4e98b63cf807",
      ...harness.deps,
  });
  assert.equal(result.ok, true);
  const fetchIdx = harness.order.indexOf("fetch-1");
  const gitIdx = harness.order.indexOf("git-1");
  assert.ok(fetchIdx >= 0);
  assert.ok(gitIdx > fetchIdx);
});

test("second live remote refresh happens after build and scan", async () => {
  const harness = productionDeployHarness({ remoteSha: "abc123" });
  await runGuardedProductionDeploy({
    root: "/tmp/unused",
    expectedSha: "abc123",
    authorizeProductionDeploy: true,
    dryRun: true,
        rollbackDeploymentId: "f0ddd72c-3740-4340-a9f7-4e98b63cf807",
      ...harness.deps,
  });
  const buildIdx = harness.order.indexOf("build");
  const scanIdx = harness.order.indexOf("scan");
  const fetch2Idx = harness.order.indexOf("fetch-2");
  const git2Idx = harness.order.indexOf("git-2");
  assert.ok(buildIdx >= 0);
  assert.ok(scanIdx > buildIdx);
  assert.ok(fetch2Idx > scanIdx);
  assert.ok(git2Idx > fetch2Idx);
});

test("initial fetch failure stops before build and Wrangler", async () => {
  const harness = productionDeployHarness({
    refreshResults: [{ ok: false, errors: ["Unable to refresh origin/main."] }],
  });
  let buildOrWrangler = false;
  harness.deps.buildTarget = async () => {
    buildOrWrangler = true;
    return { ok: true, errors: [] };
  };
  harness.deps.runProcess = () => {
    buildOrWrangler = true;
    return { status: 0, stdout: "", stderr: "" };
  };
  const result = await runGuardedProductionDeploy({
    root: "/tmp/unused",
    expectedSha: "abc123",
    authorizeProductionDeploy: true,
    executeDeploy: true,
        rollbackDeploymentId: "f0ddd72c-3740-4340-a9f7-4e98b63cf807",
      ...harness.deps,
  });
  assert.equal(result.ok, false);
  assert.equal(result.stage, "initial-fetch");
  assert.equal(result.wranglerInvoked, false);
  assert.equal(harness.calls.refreshes, 1);
  assert.equal(harness.calls.build, 0);
  assert.equal(buildOrWrangler, false);
});

test("post-build fetch failure stops before Wrangler", async () => {
  const harness = productionDeployHarness({
    refreshResults: [
      { ok: true, originMain: "abc123" },
      { ok: false, errors: ["Unable to refresh origin/main."] },
    ],
  });
  const result = await runGuardedProductionDeploy({
    root: "/tmp/unused",
    expectedSha: "abc123",
    authorizeProductionDeploy: true,
    executeDeploy: true,
        rollbackDeploymentId: "f0ddd72c-3740-4340-a9f7-4e98b63cf807",
      ...harness.deps,
  });
  assert.equal(result.ok, false);
  assert.equal(result.stage, "post-build-fetch");
  assert.equal(result.wranglerInvoked, false);
  assert.equal(result.remoteRefreshCount, 2);
  assert.equal(harness.calls.build, 1);
  assert.equal(harness.calls.process.length, 0);
});

test("missing origin stops before build", async () => {
  const harness = productionDeployHarness({
    refreshResult: { ok: false, errors: ["Unable to refresh origin/main."] },
  });
  const result = await runGuardedProductionDeploy({
    root: "/tmp/unused",
    expectedSha: "abc123",
    authorizeProductionDeploy: true,
    dryRun: true,
        rollbackDeploymentId: "f0ddd72c-3740-4340-a9f7-4e98b63cf807",
      ...harness.deps,
  });
  assert.equal(result.ok, false);
  assert.equal(result.stage, "initial-fetch");
  assert.equal(harness.calls.build, 0);
  assert.equal(result.wranglerInvoked, false);
});

test("missing remote main stops before build", async () => {
  const harness = productionDeployHarness({
    refreshResult: { ok: false, errors: ["Unable to refresh origin/main."] },
  });
  const result = await runGuardedProductionDeploy({
    root: "/tmp/unused",
    expectedSha: "abc123",
    authorizeProductionDeploy: true,
    dryRun: true,
        rollbackDeploymentId: "f0ddd72c-3740-4340-a9f7-4e98b63cf807",
      ...harness.deps,
  });
  assert.equal(result.ok, false);
  assert.equal(result.stage, "initial-fetch");
  assert.equal(harness.calls.build, 0);
});

test("stale local origin/main that refreshes to another SHA blocks deployment", async () => {
  const harness = productionDeployHarness({
    initialGit: cleanGitStatus({
      head: "abc123",
      originMain: "stale-cached-sha",
    }),
    remoteSha: "live-fresh-sha",
  });
  let buildOrWrangler = false;
  const originalBuild = harness.deps.buildTarget;
  harness.deps.buildTarget = async (...args) => {
    buildOrWrangler = true;
    return originalBuild(...args);
  };
  harness.deps.runProcess = () => {
    buildOrWrangler = true;
    return { status: 0, stdout: "", stderr: "" };
  };
  const result = await runGuardedProductionDeploy({
    root: "/tmp/unused",
    expectedSha: "abc123",
    authorizeProductionDeploy: true,
    executeDeploy: true,
        rollbackDeploymentId: "f0ddd72c-3740-4340-a9f7-4e98b63cf807",
      ...harness.deps,
  });
  assert.equal(result.ok, false);
  assert.equal(result.stage, "initial-git");
  assert.equal(result.wranglerInvoked, false);
  assert.equal(buildOrWrangler, false);
  assert.match(result.errors.join("\n"), /origin\/main|HEAD/i);
});

test("remote main advancing during the Production build blocks deployment", async () => {
  const harness = productionDeployHarness({
    remoteSha: "abc123",
    onBuild: (h) => {
      h.setRemoteSha("advanced-sha");
    },
  });
  const result = await runGuardedProductionDeploy({
    root: "/tmp/unused",
    expectedSha: "abc123",
    authorizeProductionDeploy: true,
    dryRun: true,
        rollbackDeploymentId: "f0ddd72c-3740-4340-a9f7-4e98b63cf807",
      ...harness.deps,
  });
  assert.equal(result.ok, false);
  assert.equal(result.stage, "post-build-git");
  assert.equal(result.wranglerInvoked, false);
  assert.equal(harness.calls.refreshes, 2);
  assert.equal(harness.calls.process.length, 0);
});

test("remote force-push to another SHA blocks deployment", async () => {
  const harness = productionDeployHarness({
    remoteSha: "abc123",
    onBuild: (h) => {
      h.setRemoteSha("force-pushed-sha");
    },
  });
  const result = await runGuardedProductionDeploy({
    root: "/tmp/unused",
    expectedSha: "abc123",
    authorizeProductionDeploy: true,
    executeDeploy: true,
        rollbackDeploymentId: "f0ddd72c-3740-4340-a9f7-4e98b63cf807",
      ...harness.deps,
  });
  assert.equal(result.ok, false);
  assert.equal(result.stage, "post-build-git");
  assert.equal(result.wranglerInvoked, false);
});

test("malformed or ambiguous fetched ref fails closed in refreshOriginMain", () => {
  const calls = [];
  const runProcess = (command, args) => {
    calls.push({ command, args });
    if (args[0] === "remote") {
      return { status: 0, stdout: "origin\n", stderr: "" };
    }
    if (args[0] === "fetch") {
      return { status: 0, stdout: "", stderr: "" };
    }
    if (args[0] === "rev-parse") {
      return {
        status: 0,
        stdout: `${FULL_SHA_A}\n${FULL_SHA_B}\n`,
        stderr: "",
      };
    }
    return { status: 1, stdout: "", stderr: "unexpected" };
  };
  const result = refreshOriginMain({ cwd: "/tmp/unused", runProcess });
  assert.equal(result.ok, false);
  assert.deepEqual(result.errors, ["Unable to refresh origin/main."]);
  assert.ok(calls.some((c) => c.args[0] === "fetch"));
});

test("fetched SHA must be a full valid hexadecimal commit SHA", () => {
  const runProcess = (command, args) => {
    if (args[0] === "remote") {
      return { status: 0, stdout: "origin\n", stderr: "" };
    }
    if (args[0] === "fetch") {
      return { status: 0, stdout: "", stderr: "" };
    }
    if (args[0] === "rev-parse") {
      return { status: 0, stdout: "not-a-full-sha\n", stderr: "" };
    }
    return { status: 1, stdout: "", stderr: "" };
  };
  const result = refreshOriginMain({ cwd: "/tmp/unused", runProcess });
  assert.equal(result.ok, false);
  assert.deepEqual(result.errors, ["Unable to refresh origin/main."]);
});

test("refreshOriginMain fails closed when origin is missing", () => {
  const runProcess = (command, args) => {
    if (args[0] === "remote") {
      return { status: 0, stdout: "upstream\n", stderr: "" };
    }
    return { status: 0, stdout: "", stderr: "" };
  };
  const result = refreshOriginMain({ cwd: "/tmp/unused", runProcess });
  assert.equal(result.ok, false);
});

test("refreshOriginMain fails closed when fetch fails", () => {
  const runProcess = (command, args) => {
    if (args[0] === "remote") {
      return { status: 0, stdout: "origin\n", stderr: "" };
    }
    if (args[0] === "fetch") {
      return { status: 1, stdout: "", stderr: "fetch failed" };
    }
    return { status: 0, stdout: "", stderr: "" };
  };
  const result = refreshOriginMain({ cwd: "/tmp/unused", runProcess });
  assert.equal(result.ok, false);
  assert.ok(result.errors.join(" ").includes("Unable to refresh origin/main."));
});

test("refreshOriginMain uses shell-free argv fetch of origin main with GIT_TERMINAL_PROMPT=0", () => {
  const envs = [];
  const runProcess = (command, args, options = {}) => {
    envs.push(options.env || {});
    if (args[0] === "remote") {
      return { status: 0, stdout: "origin\n", stderr: "" };
    }
    if (args[0] === "fetch") {
      assert.equal(command, "git");
      assert.deepEqual(args, [
        "fetch",
        "--no-tags",
        "--prune",
        "origin",
        "+refs/heads/main:refs/remotes/origin/main",
      ]);
      return { status: 0, stdout: "", stderr: "" };
    }
    if (args[0] === "rev-parse") {
      return { status: 0, stdout: `${FULL_SHA_A}\n`, stderr: "" };
    }
    return { status: 1, stdout: "", stderr: "" };
  };
  const result = refreshOriginMain({ cwd: "/tmp/unused", runProcess });
  assert.equal(result.ok, true);
  assert.equal(result.originMain, FULL_SHA_A);
  assert.ok(envs.every((env) => env.GIT_TERMINAL_PROMPT === "0"));
});

test("HEAD, refreshed origin/main, and --expected-sha must all match", async () => {
  const harness = productionDeployHarness({
    initialGit: cleanGitStatus({ head: "abc123", originMain: "abc123" }),
    remoteSha: "abc123",
  });
  const mismatch = await runGuardedProductionDeploy({
    root: "/tmp/unused",
    expectedSha: "different-expected",
    authorizeProductionDeploy: true,
    dryRun: true,
        rollbackDeploymentId: "f0ddd72c-3740-4340-a9f7-4e98b63cf807",
      ...harness.deps,
  });
  assert.equal(mismatch.ok, false);
  assert.equal(mismatch.stage, "initial-git");
  assert.equal(mismatch.wranglerInvoked, false);
});

test("successful dry-run performs two refreshes and no Wrangler call", async () => {
  const harness = productionDeployHarness({ remoteSha: "abc123" });
  const result = await runGuardedProductionDeploy({
    root: "/tmp/unused",
    expectedSha: "abc123",
    authorizeProductionDeploy: true,
    dryRun: true,
        rollbackDeploymentId: "f0ddd72c-3740-4340-a9f7-4e98b63cf807",
      ...harness.deps,
  });
  assert.equal(result.ok, true);
  assert.equal(result.remoteRefreshCount, 2);
  assert.equal(harness.calls.refreshes, 2);
  assert.equal(result.wranglerInvoked, false);
  assert.equal(harness.calls.process.length, 0);
  assert.ok(
    harness.logs.some((line) =>
      line.includes("Production artifact built and verified."),
    ),
  );
  assert.ok(
    harness.logs.some((line) =>
      line.includes("Dry run complete. No Cloudflare request was made."),
    ),
  );
});

test("successful non-dry mocked flow invokes Wrangler only after fetch → guards → build → scan → fetch → post-build guards", async () => {
  const harness = productionDeployHarness({ remoteSha: "abc123" });
  const result = await runGuardedProductionDeploy({
    root: "/tmp/unused",
    expectedSha: "abc123",
    authorizeProductionDeploy: true,
    executeDeploy: true,
        rollbackDeploymentId: "f0ddd72c-3740-4340-a9f7-4e98b63cf807",
      ...harness.deps,
  });
  assert.equal(result.ok, true);
  assert.equal(result.wranglerInvoked, true);
  assert.deepEqual(
    harness.order.filter((step) =>
      ["fetch-1", "git-1", "build", "scan", "fetch-2", "git-2", "wrangler"].includes(
        step,
      ),
    ),
    ["fetch-1", "git-1", "build", "scan", "fetch-2", "git-2", "wrangler"],
  );
});

test("Preview deploy never requires origin/main refresh", async () => {
  const harness = previewDeployHarness();
  let refreshCalled = false;
  harness.deps.refreshRemoteMain = () => {
    refreshCalled = true;
    return { ok: true, originMain: "abc123" };
  };
  const result = await runGuardedPreviewDeploy({
    root: "/tmp/unused",
    dryRun: true,
    ...harness.deps,
  });
  assert.equal(result.ok, true);
  assert.equal(refreshCalled, false);
  assert.equal(harness.order.includes("fetch-1"), false);
  assert.equal(harness.calls.build, 1);
});

test("refreshOriginMain integration against local bare remotes without internet", async () => {
  const base = await mkdtemp(path.join(tmpdir(), "origin-main-refresh-"));
  const bare = path.join(base, "bare.git");
  const work = path.join(base, "work");
  try {
    execFileSync("git", ["init", "--bare", bare], { stdio: "pipe" });
    execFileSync("git", ["clone", bare, work], { stdio: "pipe" });
    execFileSync("git", ["-C", work, "checkout", "-b", "main"], {
      stdio: "pipe",
    });
    await writeFile(path.join(work, "README.md"), "one\n", "utf8");
    execFileSync("git", ["-C", work, "add", "README.md"], { stdio: "pipe" });
    execFileSync(
      "git",
      ["-C", work, "commit", "-m", "first"],
      {
        stdio: "pipe",
        env: {
          ...process.env,
          GIT_AUTHOR_NAME: "Test",
          GIT_AUTHOR_EMAIL: "test@example.com",
          GIT_COMMITTER_NAME: "Test",
          GIT_COMMITTER_EMAIL: "test@example.com",
        },
      },
    );
    execFileSync("git", ["-C", work, "push", "-u", "origin", "main"], {
      stdio: "pipe",
    });
    const sha1 = execFileSync("git", ["-C", work, "rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim();

    const first = refreshOriginMain({ cwd: work });
    assert.equal(first.ok, true);
    assert.equal(first.originMain, sha1.toLowerCase());

    await writeFile(path.join(work, "README.md"), "two\n", "utf8");
    execFileSync("git", ["-C", work, "add", "README.md"], { stdio: "pipe" });
    execFileSync(
      "git",
      ["-C", work, "commit", "-m", "second"],
      {
        stdio: "pipe",
        env: {
          ...process.env,
          GIT_AUTHOR_NAME: "Test",
          GIT_AUTHOR_EMAIL: "test@example.com",
          GIT_COMMITTER_NAME: "Test",
          GIT_COMMITTER_EMAIL: "test@example.com",
        },
      },
    );
    execFileSync("git", ["-C", work, "push", "origin", "main"], {
      stdio: "pipe",
    });
    const sha2 = execFileSync("git", ["-C", work, "rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim();

    // Simulate a stale remote-tracking ref by resetting origin/main locally.
    execFileSync(
      "git",
      ["-C", work, "update-ref", "refs/remotes/origin/main", sha1],
      { stdio: "pipe" },
    );
    const stale = execFileSync(
      "git",
      ["-C", work, "rev-parse", "refs/remotes/origin/main"],
      { encoding: "utf8" },
    ).trim();
    assert.equal(stale, sha1);

    const refreshed = refreshOriginMain({ cwd: work });
    assert.equal(refreshed.ok, true);
    assert.equal(refreshed.originMain, sha2.toLowerCase());
    assert.notEqual(refreshed.originMain, sha1.toLowerCase());
  } finally {
    await rm(base, { recursive: true, force: true });
  }
});

test("Production rejects missing --rollback-deployment-id", () => {
  assert.throws(
    () =>
      parsePagesDeployArgs([
        "--target",
        "production",
        "--expected-sha",
        "a".repeat(40),
        "--authorize-production-deploy",
        "--dry-run",
      ]),
    /--rollback-deployment-id is required/,
  );
});

test("parsePagesDeployArgs rejects --rollback-deployment-id --dry-run", () => {
  assert.throws(
    () =>
      parsePagesDeployArgs([
        "--target",
        "production",
        "--expected-sha",
        "a".repeat(40),
        "--rollback-deployment-id",
        "--dry-run",
        "--authorize-production-deploy",
      ]),
    /--rollback-deployment-id requires a value/,
  );
});

test("parsePagesDeployArgs rejects empty --rollback-deployment-id=", () => {
  assert.throws(
    () =>
      parsePagesDeployArgs([
        "--target",
        "production",
        "--expected-sha",
        "a".repeat(40),
        "--rollback-deployment-id=",
        "--authorize-production-deploy",
      ]),
    /--rollback-deployment-id requires a value/,
  );
});

test("parsePagesDeployArgs rejects malformed rollback deployment IDs", () => {
  assert.throws(
    () =>
      parsePagesDeployArgs([
        "--target",
        "production",
        "--expected-sha",
        "a".repeat(40),
        "--rollback-deployment-id",
        "not-a-uuid",
        "--authorize-production-deploy",
      ]),
    /Cloudflare deployment UUID/,
  );
  assert.equal(isValidDeploymentId("not-a-uuid"), false);
  assert.equal(isValidDeploymentId(SAMPLE_ROLLBACK_DEPLOYMENT_ID), true);
});

test("parsePagesDeployArgs accepts canonical and future rollback UUIDs", () => {
  const first = parsePagesDeployArgs([
    "--target",
    "production",
    "--expected-sha",
    "a".repeat(40),
    "--rollback-deployment-id",
    SAMPLE_ROLLBACK_DEPLOYMENT_ID,
    "--authorize-production-deploy",
  ]);
  assert.equal(first.rollbackDeploymentId, SAMPLE_ROLLBACK_DEPLOYMENT_ID);

  const second = parsePagesDeployArgs([
    "--target",
    "production",
    "--expected-sha",
    "a".repeat(40),
    `--rollback-deployment-id=${OTHER_ROLLBACK_DEPLOYMENT_ID}`,
    "--authorize-production-deploy",
  ]);
  assert.equal(second.rollbackDeploymentId, OTHER_ROLLBACK_DEPLOYMENT_ID);
  assert.notEqual(second.rollbackDeploymentId, SAMPLE_ROLLBACK_DEPLOYMENT_ID);
});

test("Preview rejects --rollback-deployment-id", () => {
  assert.throws(
    () =>
      parsePagesDeployArgs([
        "--target",
        "preview",
        "--rollback-deployment-id",
        SAMPLE_ROLLBACK_DEPLOYMENT_ID,
        "--dry-run",
      ]),
    /only valid for Production/,
  );
});

test("disable mode requires --authorize-contact-form-disable", () => {
  assert.throws(
    () =>
      parsePagesDeployArgs([
        "--target",
        "production",
        "--expected-sha",
        "a".repeat(40),
        "--rollback-deployment-id",
        SAMPLE_ROLLBACK_DEPLOYMENT_ID,
        "--disable-contact-form",
        "--authorize-production-deploy",
      ]),
    /must be supplied together/,
  );
});

test("disable authorization without disable mode fails", () => {
  assert.throws(
    () =>
      parsePagesDeployArgs([
        "--target",
        "production",
        "--expected-sha",
        "a".repeat(40),
        "--rollback-deployment-id",
        SAMPLE_ROLLBACK_DEPLOYMENT_ID,
        "--authorize-contact-form-disable",
        "--authorize-production-deploy",
      ]),
    /must be supplied together/,
  );
});

test("disable mode is rejected for Preview", () => {
  assert.throws(
    () =>
      parsePagesDeployArgs([
        "--target",
        "preview",
        "--disable-contact-form",
        "--authorize-contact-form-disable",
        "--dry-run",
      ]),
    /only valid for Production/,
  );
});

test("parser failure for rollback ID invokes no Git build or Wrangler", async () => {
  let buildInvoked = false;
  let wranglerInvoked = false;
  let parserRejected = false;
  try {
    const options = parsePagesDeployArgs([
      "--target",
      "production",
      "--expected-sha",
      "a".repeat(40),
      "--rollback-deployment-id",
      "--dry-run",
      "--authorize-production-deploy",
    ]);
    const harness = productionDeployHarness();
    harness.deps.buildTarget = async () => {
      buildInvoked = true;
      return { ok: true, errors: [] };
    };
    harness.deps.runProcess = () => {
      wranglerInvoked = true;
      return { status: 0, stdout: "", stderr: "" };
    };
    await runGuardedProductionDeploy({
      root: "/tmp/unused",
      expectedSha: options.expectedSha,
      authorizeProductionDeploy: options.authorizeProductionDeploy,
      rollbackDeploymentId: options.rollbackDeploymentId,
      dryRun: options.dryRun,
      ...harness.deps,
    });
  } catch (error) {
    parserRejected = /--rollback-deployment-id requires a value/.test(
      error instanceof Error ? error.message : String(error),
    );
  }
  assert.equal(parserRejected, true);
  assert.equal(buildInvoked, false);
  assert.equal(wranglerInvoked, false);
});

test("disabled production scan rejects production and test sitekeys", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "pages-disabled-scan-"));
  try {
    await writeMinimalOut(root, {
      siteKey: PRODUCTION_SITE_KEY,
      includeMailto: true,
      includeDisabledMessage: true,
    });
    const withProd = await scanBuildAssets(
      path.join(root, "out"),
      productionDisabledScanExpectations(),
    );
    assert.equal(withProd.ok, false);
    assert.ok(withProd.errors.some((e) => e.includes("production Turnstile")));

    await writeMinimalOut(root, {
      siteKey: PREVIEW_SITE_KEY,
      includeMailto: true,
      includeDisabledMessage: true,
    });
    const withTest = await scanBuildAssets(
      path.join(root, "out"),
      productionDisabledScanExpectations(),
    );
    assert.equal(withTest.ok, false);
    assert.ok(withTest.errors.some((e) => e.includes("test sitekey")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("disabled production scan requires mailto fallback and disabled messaging", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "pages-disabled-mail-"));
  try {
    await writeMinimalOut(root, {
      siteKey: "",
      includeMailto: true,
      includeDisabledMessage: true,
    });
    const okScan = await scanBuildAssets(
      path.join(root, "out"),
      productionDisabledScanExpectations(),
    );
    assert.equal(okScan.ok, true, JSON.stringify(okScan.errors));
    assert.ok(okScan.findings.mailtoFallbackFiles.length > 0);
    assert.ok(okScan.findings.onlineFormDisabledMessageFiles.length > 0);
    assert.equal(okScan.findings.productionSiteKeyFiles.length, 0);
    assert.equal(okScan.findings.testSiteKeyFiles.length, 0);

    await writeMinimalOut(root, {
      siteKey: "",
      includeMailto: false,
      includeDisabledMessage: true,
    });
    const noMail = await scanBuildAssets(
      path.join(root, "out"),
      productionDisabledScanExpectations(),
    );
    assert.equal(noMail.ok, false);
    assert.ok(noMail.errors.some((e) => e.includes("mailto:")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("normal Production builds request enabled sitekey mode", async () => {
  const harness = productionDeployHarness();
  const result = await runGuardedProductionDeploy({
    root: "/tmp/unused",
    expectedSha: "abc123",
    authorizeProductionDeploy: true,
    rollbackDeploymentId: SAMPLE_ROLLBACK_DEPLOYMENT_ID,
    dryRun: true,
    ...harness.deps,
  });
  assert.equal(result.ok, true);
  assert.equal(result.contactFormMode, "enabled");
  assert.deepEqual(harness.calls.buildModes, ["enabled"]);
  assert.equal(
    harness.calls.scanExpectations.at(-1).requireProductionSiteKey,
    true,
  );
});

test("disabled Production builds request blank sitekey mode and disabled scan", async () => {
  const harness = productionDeployHarness();
  const result = await runGuardedProductionDeploy({
    root: "/tmp/unused",
    expectedSha: "abc123",
    authorizeProductionDeploy: true,
    rollbackDeploymentId: SAMPLE_ROLLBACK_DEPLOYMENT_ID,
    disableContactForm: true,
    authorizeContactFormDisable: true,
    dryRun: true,
    ...harness.deps,
  });
  assert.equal(result.ok, true);
  assert.equal(result.contactFormMode, "disabled");
  assert.deepEqual(harness.calls.buildModes, ["disabled"]);
  assert.equal(
    harness.calls.scanExpectations.at(-1).forbidProductionSiteKey,
    true,
  );
  assert.equal(
    harness.calls.scanExpectations.at(-1).requireMailtoFallback,
    true,
  );
  assert.ok(
    harness.logs.some((line) =>
      line.includes("Production contact form disable artifact built and verified."),
    ),
  );
  assert.equal(result.wranglerInvoked, false);
  assert.equal(result.remoteRefreshCount, 2);
});

test("stale enabled artifact is rebuilt for disable mode", async () => {
  const harness = productionDeployHarness();
  const result = await runGuardedProductionDeploy({
    root: "/tmp/unused",
    expectedSha: "abc123",
    authorizeProductionDeploy: true,
    rollbackDeploymentId: SAMPLE_ROLLBACK_DEPLOYMENT_ID,
    disableContactForm: true,
    authorizeContactFormDisable: true,
    dryRun: true,
    ...harness.deps,
  });
  assert.equal(result.ok, true);
  assert.equal(harness.calls.build, 1);
  assert.deepEqual(harness.calls.buildModes, ["disabled"]);
});

test("stale disabled artifact is rebuilt for normal mode", async () => {
  const harness = productionDeployHarness();
  const result = await runGuardedProductionDeploy({
    root: "/tmp/unused",
    expectedSha: "abc123",
    authorizeProductionDeploy: true,
    rollbackDeploymentId: SAMPLE_ROLLBACK_DEPLOYMENT_ID,
    dryRun: true,
    ...harness.deps,
  });
  assert.equal(result.ok, true);
  assert.equal(harness.calls.build, 1);
  assert.deepEqual(harness.calls.buildModes, ["enabled"]);
});

test("disabled build failure stops before Wrangler", async () => {
  const harness = productionDeployHarness({
    buildResult: { ok: false, errors: ["disable build failed"] },
  });
  const result = await runGuardedProductionDeploy({
    root: "/tmp/unused",
    expectedSha: "abc123",
    authorizeProductionDeploy: true,
    rollbackDeploymentId: SAMPLE_ROLLBACK_DEPLOYMENT_ID,
    disableContactForm: true,
    authorizeContactFormDisable: true,
    executeDeploy: true,
    ...harness.deps,
  });
  assert.equal(result.ok, false);
  assert.equal(result.stage, "build");
  assert.equal(result.wranglerInvoked, false);
  assert.equal(harness.calls.process.length, 0);
});

test("disabled scan failure stops before Wrangler", async () => {
  const harness = productionDeployHarness({
    scanResult: {
      ok: false,
      errors: ["Built assets contain the production Turnstile sitekey."],
      findings: {},
    },
  });
  const result = await runGuardedProductionDeploy({
    root: "/tmp/unused",
    expectedSha: "abc123",
    authorizeProductionDeploy: true,
    rollbackDeploymentId: SAMPLE_ROLLBACK_DEPLOYMENT_ID,
    disableContactForm: true,
    authorizeContactFormDisable: true,
    executeDeploy: true,
    ...harness.deps,
  });
  assert.equal(result.ok, false);
  assert.equal(result.stage, "scan");
  assert.equal(result.wranglerInvoked, false);
});

test("remote advancement blocks disable mode", async () => {
  const harness = productionDeployHarness({
    remoteSha: "abc123",
    onBuild: (h) => {
      h.setRemoteSha("advanced-sha");
    },
  });
  const result = await runGuardedProductionDeploy({
    root: "/tmp/unused",
    expectedSha: "abc123",
    authorizeProductionDeploy: true,
    rollbackDeploymentId: SAMPLE_ROLLBACK_DEPLOYMENT_ID,
    disableContactForm: true,
    authorizeContactFormDisable: true,
    dryRun: true,
    ...harness.deps,
  });
  assert.equal(result.ok, false);
  assert.equal(result.stage, "post-build-git");
  assert.equal(result.wranglerInvoked, false);
  assert.equal(result.contactFormMode, "disabled");
});

test("rollback ID reaches reporting unchanged", async () => {
  const harness = productionDeployHarness();
  const result = await runGuardedProductionDeploy({
    root: "/tmp/unused",
    expectedSha: "abc123",
    authorizeProductionDeploy: true,
    rollbackDeploymentId: OTHER_ROLLBACK_DEPLOYMENT_ID,
    dryRun: true,
    ...harness.deps,
  });
  assert.equal(result.ok, true);
  assert.equal(result.rollbackDeploymentId, OTHER_ROLLBACK_DEPLOYMENT_ID);
  assert.ok(
    harness.logs.some(
      (line) =>
        line ===
        `Operator-supplied rollback deployment: ${OTHER_ROLLBACK_DEPLOYMENT_ID}`,
    ),
  );
});

test("successful mocked disable deployment invokes Wrangler only after all guards", async () => {
  const harness = productionDeployHarness();
  const result = await runGuardedProductionDeploy({
    root: "/tmp/unused",
    expectedSha: "abc123",
    authorizeProductionDeploy: true,
    rollbackDeploymentId: SAMPLE_ROLLBACK_DEPLOYMENT_ID,
    disableContactForm: true,
    authorizeContactFormDisable: true,
    executeDeploy: true,
    ...harness.deps,
  });
  assert.equal(result.ok, true);
  assert.equal(result.wranglerInvoked, true);
  assert.equal(result.contactFormMode, "disabled");
  assert.deepEqual(
    harness.order.filter((step) =>
      ["fetch-1", "git-1", "build", "scan", "fetch-2", "git-2", "wrangler"].includes(
        step,
      ),
    ),
    ["fetch-1", "git-1", "build", "scan", "fetch-2", "git-2", "wrangler"],
  );
});

test("buildPagesStaticExport disable mode blanks sitekey only for the build env", async () => {
  const envs = [];
  const result = await buildPagesStaticExport({
    target: "production",
    root: "/tmp/unused",
    contactFormMode: "disabled",
    skipConfigValidation: true,
    requireCleanWorkingTree: false,
    runProcess: (command, args, options = {}) => {
      envs.push(options.env || {});
      return { status: 0, stdout: "", stderr: "" };
    },
    scanAssets: async (_out, expectations) => {
      assert.equal(expectations.forbidProductionSiteKey, true);
      assert.equal(expectations.requireMailtoFallback, true);
      return { ok: true, errors: [], findings: {} };
    },
    log: silentLog,
  });
  assert.equal(result.ok, true);
  assert.equal(result.contactFormMode, "disabled");
  assert.ok(envs.length >= 1);
  assert.equal(envs[0].NEXT_PUBLIC_TURNSTILE_SITE_KEY, "");
});

test("buildPagesStaticExport normal production embeds production sitekey", async () => {
  const envs = [];
  const result = await buildPagesStaticExport({
    target: "production",
    root: "/tmp/unused",
    contactFormMode: "enabled",
    skipConfigValidation: true,
    requireCleanWorkingTree: false,
    runProcess: (command, args, options = {}) => {
      envs.push(options.env || {});
      return { status: 0, stdout: "", stderr: "" };
    },
    scanAssets: async (_out, expectations) => {
      assert.equal(expectations.requireProductionSiteKey, true);
      return { ok: true, errors: [], findings: {} };
    },
    log: silentLog,
  });
  assert.equal(result.ok, true);
  assert.equal(envs[0].NEXT_PUBLIC_TURNSTILE_SITE_KEY, PRODUCTION_SITE_KEY);
});

test("buildPagesStaticExport rejects disable mode for Preview", async () => {
  const result = await buildPagesStaticExport({
    target: "preview",
    root: "/tmp/unused",
    contactFormMode: "disabled",
    skipConfigValidation: true,
    requireCleanWorkingTree: false,
    log: silentLog,
  });
  assert.equal(result.ok, false);
  assert.ok(
    result.errors.some((error) =>
      error.includes("only valid for Production builds"),
    ),
  );
});

test("Preview Wrangler args never include --config or -c", () => {
  const args = buildWranglerDeployArgs({
    target: "preview",
    commitHash: "a".repeat(40),
    commitMessage: "preview",
  });
  const configPresent = args.some(
    (arg) => arg === "-c" || arg.startsWith("--config"),
  );
  assert.equal(configPresent, false);
  assert.deepEqual(args.slice(0, 5), [
    "pages",
    "deploy",
    "out",
    "--project-name=eurodigital-ca",
    "--branch=contact-preview",
  ]);
  console.log(`PAGES_CUSTOM_CONFIG_ARG_PRESENT=${configPresent}`);
});

test("Production Wrangler args never include --config or -c", () => {
  const args = buildWranglerDeployArgs({
    target: "production",
    commitHash: "a".repeat(40),
    commitMessage: "production",
  });
  assert.equal(
    args.some((arg) => arg === "-c" || arg.startsWith("--config")),
    false,
  );
  assert.ok(args.includes("--branch=main"));
});

test("mocked Preview execution invokes Wrangler with cwd equal to repository root", async () => {
  const harness = previewDeployHarness();
  let capturedCwd = null;
  harness.deps.runProcess = (command, args, options = {}) => {
    harness.calls.process.push({ command, args, cwd: options.cwd });
    harness.order.push("wrangler");
    capturedCwd = options.cwd;
    return { status: 0, stdout: "", stderr: "" };
  };
  const result = await runGuardedPreviewDeploy({
    root: "/verified/repo/root",
    executeDeploy: true,
    authorizePreviewDeploy: true,
    ...harness.deps,
  });
  assert.equal(result.ok, true);
  assert.equal(result.wranglerInvoked, true);
  assert.equal(capturedCwd, "/verified/repo/root");
  assert.equal(
    result.wranglerArgs.some((arg) => arg.startsWith("--config")),
    false,
  );
});

test("missing root config fails before Wrangler for Preview", async () => {
  const harness = previewDeployHarness();
  harness.deps.loadConfig = async () => {
    throw new Error("ENOENT: missing wrangler.jsonc");
  };
  let caught = false;
  try {
    await runGuardedPreviewDeploy({
      root: "/tmp/unused",
      executeDeploy: true,
      authorizePreviewDeploy: true,
      ...harness.deps,
    });
  } catch (error) {
    caught = /ENOENT|missing wrangler\.jsonc/.test(
      error instanceof Error ? error.message : String(error),
    );
  }
  assert.equal(caught, true);
  assert.equal(harness.calls.process.length, 0);
  assert.equal(harness.calls.build, 0);
});

test("invalid root config fails before Wrangler for Preview", async () => {
  const harness = previewDeployHarness();
  harness.deps.loadConfig = async () => ({ name: "wrong-project" });
  const result = await runGuardedPreviewDeploy({
    root: "/tmp/unused",
    executeDeploy: true,
    authorizePreviewDeploy: true,
    ...harness.deps,
  });
  assert.equal(result.ok, false);
  assert.equal(result.stage, "config");
  assert.equal(result.wranglerInvoked, false);
  assert.equal(harness.calls.build, 0);
  assert.equal(harness.calls.process.length, 0);
});

test("Preview with only --target preview is a dry-run", async () => {
  const options = parsePagesDeployArgs(["--target", "preview"]);
  assert.equal(options.executeDeploy, false);
  const harness = previewDeployHarness();
  const result = await runGuardedPreviewDeploy({
    root: "/tmp/unused",
    executeDeploy: options.executeDeploy,
    authorizePreviewDeploy: options.authorizePreviewDeploy,
    ...harness.deps,
  });
  assert.equal(result.ok, true);
  assert.equal(result.stage, "dry-run");
  assert.equal(result.wranglerInvoked, false);
  assert.equal(harness.calls.process.length, 0);
});

test("simulating a dropped --dry-run still leaves wranglerInvoked=false", async () => {
  // Operator intended --dry-run but npm dropped it: argv is only --target preview.
  const options = parsePagesDeployArgs(["--target", "preview"]);
  assert.equal(options.dryRun, false);
  assert.equal(options.executeDeploy, false);
  const harness = previewDeployHarness();
  const result = await runGuardedPreviewDeploy({
    root: "/tmp/unused",
    executeDeploy: options.executeDeploy,
    authorizePreviewDeploy: options.authorizePreviewDeploy,
    ...harness.deps,
  });
  assert.equal(result.wranglerInvoked, false);
  assert.equal(result.stage, "dry-run");
  console.log(`DROPPED_DRY_RUN_SAFE=${result.wranglerInvoked === false}`);
  console.log(`DEFAULT_PREVIEW_WRANGLER_INVOKED=${result.wranglerInvoked}`);
});

test("Production with guards but no --execute-deploy remains a dry-run", async () => {
  const harness = productionDeployHarness();
  const result = await runGuardedProductionDeploy({
    root: "/tmp/unused",
    expectedSha: "abc123",
    authorizeProductionDeploy: true,
    rollbackDeploymentId: SAMPLE_ROLLBACK_DEPLOYMENT_ID,
    executeDeploy: false,
    ...harness.deps,
  });
  assert.equal(result.ok, true);
  assert.equal(result.stage, "dry-run");
  assert.equal(result.wranglerInvoked, false);
  assert.equal(result.remoteRefreshCount, 2);
  console.log(`DEFAULT_PRODUCTION_WRANGLER_INVOKED=${result.wranglerInvoked}`);
});

test("Preview actual execution requires --execute-deploy", async () => {
  assert.throws(
    () =>
      parsePagesDeployArgs([
        "--target",
        "preview",
        "--authorize-preview-deploy",
      ]),
    /without --execute-deploy is contradictory/,
  );
});

test("Preview actual execution also requires --authorize-preview-deploy", async () => {
  assert.throws(
    () =>
      parsePagesDeployArgs([
        "--target",
        "preview",
        "--execute-deploy",
      ]),
    /requires --authorize-preview-deploy/,
  );
  const harness = previewDeployHarness();
  const result = await runGuardedPreviewDeploy({
    root: "/tmp/unused",
    executeDeploy: true,
    authorizePreviewDeploy: false,
    ...harness.deps,
  });
  assert.equal(result.ok, false);
  assert.equal(result.stage, "config");
  assert.equal(result.wranglerInvoked, false);
  assert.equal(harness.calls.build, 0);
  console.log("PREVIEW_EXECUTE_REQUIRES_AUTH=true");
});

test("Preview authorization without execution fails closed", () => {
  assert.throws(
    () =>
      parsePagesDeployArgs([
        "--target",
        "preview",
        "--authorize-preview-deploy",
      ]),
    /contradictory/,
  );
});

test("Production actual execution requires --execute-deploy", async () => {
  assert.throws(
    () =>
      parsePagesDeployArgs([
        "--target",
        "production",
        "--expected-sha",
        "a".repeat(40),
        "--rollback-deployment-id",
        SAMPLE_ROLLBACK_DEPLOYMENT_ID,
        "--execute-deploy",
      ]),
    /requires --authorize-production-deploy/,
  );
});

test("--dry-run plus --execute-deploy fails before Git build or Wrangler", async () => {
  let buildInvoked = false;
  let wranglerInvoked = false;
  let parserRejected = false;
  try {
    parsePagesDeployArgs([
      "--target",
      "preview",
      "--dry-run",
      "--execute-deploy",
      "--authorize-preview-deploy",
    ]);
  } catch (error) {
    parserRejected = /contradictory/.test(
      error instanceof Error ? error.message : String(error),
    );
  }
  assert.equal(parserRejected, true);
  assert.equal(buildInvoked, false);
  assert.equal(wranglerInvoked, false);
});

test("Preview authorization is rejected for Production", () => {
  assert.throws(
    () =>
      parsePagesDeployArgs([
        "--target",
        "production",
        "--expected-sha",
        "a".repeat(40),
        "--rollback-deployment-id",
        SAMPLE_ROLLBACK_DEPLOYMENT_ID,
        "--authorize-preview-deploy",
        "--authorize-production-deploy",
        "--dry-run",
      ]),
    /only valid for Preview/,
  );
});

test("Production authorization does not authorize Preview", () => {
  assert.throws(
    () =>
      parsePagesDeployArgs([
        "--target",
        "preview",
        "--authorize-production-deploy",
        "--execute-deploy",
      ]),
    /does not authorize Preview/,
  );
});

test("successful mocked Preview execution order is config → git → build → scan → post-git → wrangler", async () => {
  const harness = previewDeployHarness();
  const result = await runGuardedPreviewDeploy({
    root: "/tmp/unused",
    executeDeploy: true,
    authorizePreviewDeploy: true,
    ...harness.deps,
  });
  assert.equal(result.ok, true);
  assert.deepEqual(
    harness.order.filter((step) =>
      ["config", "git-1", "build", "scan", "git-2", "wrangler"].includes(step),
    ),
    ["config", "git-1", "build", "scan", "git-2", "wrangler"],
  );
});

test("package scripts never embed --execute-deploy and omit deploy scripts", async () => {
  const pkg = JSON.parse(await readFile(path.join(process.cwd(), "package.json"), "utf8"));
  const scripts = pkg.scripts || {};
  for (const [name, value] of Object.entries(scripts)) {
    assert.equal(
      String(value).includes("--execute-deploy"),
      false,
      `${name} must not embed --execute-deploy`,
    );
  }
  assert.equal(Object.hasOwn(scripts, "pages:preview:deploy"), false);
  assert.equal(Object.hasOwn(scripts, "pages:production:deploy"), false);
  assert.ok(scripts["pages:preview:dry-run"]);
  assert.ok(scripts["pages:deploy:help"]);
});

test("pages-build.mjs rejects missing and flag-shaped --target values", async () => {
  const { spawnSync } = await import("node:child_process");
  const missing = spawnSync(
    process.execPath,
    ["scripts/pages-build.mjs", "--target", "--disable-contact-form"],
    { encoding: "utf8" },
  );
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr || missing.stdout, /--target requires a value/);

  const empty = spawnSync(
    process.execPath,
    ["scripts/pages-build.mjs", "--target="],
    { encoding: "utf8" },
  );
  assert.notEqual(empty.status, 0);
  assert.match(empty.stderr || empty.stdout, /--target requires a value/);
});
