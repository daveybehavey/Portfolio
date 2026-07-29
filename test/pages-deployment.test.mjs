import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
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
  parsePorcelainStatus,
  PREVIEW_BRANCH,
  PREVIEW_SITE_KEY,
  PREVIEW_VARS,
  PRODUCTION_BRANCH,
  PRODUCTION_SITE_KEY,
  PRODUCTION_VARS,
  PROJECT_NAME,
  resolveExecutable,
  runGuardedPreviewDeploy,
  runGuardedProductionDeploy,
  scanBuildAssets,
  validatePagesConfig,
} from "../scripts/pages-deployment-lib.mjs";

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

async function writeMinimalOut(root, { siteKey, includeRoutes = true, includeContact = true }) {
  const outDir = path.join(root, "out");
  await mkdir(outDir, { recursive: true });
  await writeFile(
    path.join(outDir, "index.html"),
    `<html><body data-sitekey="${siteKey}"></body></html>\n`,
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

test("wrangler deploy args pin project and branch", () => {
  const previewArgs = buildWranglerDeployArgs({
    target: "preview",
    commitHash: "dfde13d",
    commitMessage: "preview",
  });
  assert.ok(previewArgs.includes("--branch=contact-preview"));
  assert.ok(previewArgs.includes("--project-name=eurodigital-ca"));
  assert.ok(previewArgs.includes("--config=wrangler.jsonc"));
  assert.ok(previewArgs.includes("--commit-dirty=false"));

  const productionArgs = buildWranglerDeployArgs({
    target: "production",
    commitHash: "dfde13d",
    commitMessage: "production",
  });
  assert.ok(productionArgs.includes("--branch=main"));
  assert.ok(productionArgs.includes("--config=wrangler.jsonc"));
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
    const previewAsProd = await scanBuildAssets(path.join(root, "out"), {
      requireTestSiteKey: false,
      forbidTestSiteKey: true,
      requireProductionSiteKey: true,
      forbidProductionSiteKey: false,
      requireContactRoute: true,
    });
    assert.equal(previewAsProd.ok, false);
    assert.ok(
      previewAsProd.errors.some((error) => error.includes("test sitekey")),
    );

    await writeMinimalOut(root, {
      siteKey: PRODUCTION_SITE_KEY,
      includeContact: false,
    });
    const missingContact = await scanBuildAssets(path.join(root, "out"), {
      requireTestSiteKey: false,
      forbidTestSiteKey: true,
      requireProductionSiteKey: true,
      forbidProductionSiteKey: false,
      requireContactRoute: true,
    });
    assert.equal(missingContact.ok, false);
    assert.ok(
      missingContact.errors.some((error) => error.includes("/api/contact")),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

function productionDeployHarness(overrides = {}) {
  const calls = { build: 0, scan: 0, process: [], statusReads: 0 };
  let git = cleanGitStatus(overrides.initialGit);
  const logs = [];

  const harness = {
    calls,
    logs,
    setGit(next) {
      git = { ...git, ...next };
    },
    deps: {
      loadConfig: async () => baseConfig(),
      validateConfig: validatePagesConfig,
      getStatus: () => {
        calls.statusReads += 1;
        return { ...git };
      },
      buildTarget: async () => {
        calls.build += 1;
        if (overrides.buildResult) return overrides.buildResult;
        return { ok: true, errors: [] };
      },
      scanAssets: async () => {
        calls.scan += 1;
        if (overrides.scanResult) return overrides.scanResult;
        return { ok: true, errors: [], findings: {} };
      },
      runProcess: (command, args) => {
        calls.process.push({ command, args });
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
    dryRun: false,
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
    ...harness.deps,
  });
  assert.equal(result.ok, true);
  assert.equal(harness.calls.build, 1);
  assert.ok(harness.calls.scan >= 1);
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
    dryRun: false,
    ...harness.deps,
  });
  assert.equal(result.ok, true);
  assert.equal(result.wranglerInvoked, true);
  assert.equal(harness.calls.build, 1);
  assert.ok(harness.calls.scan >= 1);
  assert.equal(harness.calls.process.length, 1);
  assert.equal(harness.calls.process[0].command, "npx");
  assert.equal(harness.calls.process[0].args[0], "wrangler");
  assert.ok(harness.calls.process[0].args.includes("pages"));
  assert.ok(harness.calls.process[0].args.includes("deploy"));
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
    dryRun: false,
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
    ...production.deps,
  });
  assert.equal(productionResult.ok, true);
  assert.equal(productionResult.wranglerInvoked, false);
  assert.equal(production.calls.build, 1);
  assert.ok(production.calls.scan >= 1);
  assert.equal(production.calls.process.length, 0);
});
