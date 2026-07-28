import assert from "node:assert/strict";
import test from "node:test";
import {
  assertPreviewDeployGuards,
  assertProductionDeployGuards,
  buildWranglerDeployArgs,
  COMPATIBILITY_DATE,
  parseJsonc,
  PREVIEW_BRANCH,
  PREVIEW_SITE_KEY,
  PREVIEW_VARS,
  PRODUCTION_BRANCH,
  PRODUCTION_SITE_KEY,
  PRODUCTION_VARS,
  PROJECT_NAME,
  validatePagesConfig,
} from "../scripts/pages-deployment-lib.mjs";

function baseConfig(overrides = {}) {
  return {
    name: PROJECT_NAME,
    pages_build_output_dir: "./out",
    compatibility_date: COMPATIBILITY_DATE,
    env: {
      preview: {
        compatibility_date: COMPATIBILITY_DATE,
        vars: { ...PREVIEW_VARS },
      },
      production: {
        compatibility_date: COMPATIBILITY_DATE,
        vars: { ...PRODUCTION_VARS },
      },
      ...overrides.env,
    },
    ...overrides,
  };
}

test("parseJsonc strips line and block comments", () => {
  const parsed = parseJsonc(`{
    // comment
    "name": "eurodigital-ca",
    /* block */
    "pages_build_output_dir": "./out"
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
  config.env.production.vars.TURNSTILE_SECRET_KEY = "0xsecret";
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
  config.env.production.vars.NEXT_PUBLIC_TURNSTILE_SITE_KEY = PREVIEW_SITE_KEY;
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
  config.env.production.vars.CONTACT_ALLOWED_ORIGINS =
    "https://eurodigital.ca,http://localhost:3000";
  config.env.production.vars.TURNSTILE_ALLOWED_HOSTNAMES =
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
  config.env.production.vars.CONTACT_FROM_EMAIL =
    "EuroDigital <onboarding@resend.dev>";
  config.env.production.vars.CONTACT_TO_EMAIL = "delivered@resend.dev";
  const report = validatePagesConfig(config);
  assert.equal(report.ok, false);
  const failed = report.checks
    .filter((item) => item.status === "fail")
    .map((item) => item.name);
  assert.ok(failed.includes("PRODUCTION_SENDER"));
  assert.ok(failed.includes("PRODUCTION_RECIPIENT"));
});

test("preview deploy guards refuse production branch", () => {
  const ok = assertPreviewDeployGuards({
    projectName: PROJECT_NAME,
    gitBranch: PREVIEW_BRANCH,
    deployBranch: PREVIEW_BRANCH,
    environment: "preview",
    productionBranch: PRODUCTION_BRANCH,
  });
  assert.equal(ok.ok, true);

  const badMain = assertPreviewDeployGuards({
    projectName: PROJECT_NAME,
    gitBranch: PRODUCTION_BRANCH,
    deployBranch: PREVIEW_BRANCH,
    environment: "preview",
    productionBranch: PRODUCTION_BRANCH,
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
  });
  assert.equal(badDeploy.ok, false);
});

test("production deploy guards refuse preview branch and missing authorization", () => {
  const base = {
    projectName: PROJECT_NAME,
    gitBranch: PRODUCTION_BRANCH,
    deployBranch: PRODUCTION_BRANCH,
    environment: "production",
    trackedDirty: false,
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
    assertProductionDeployGuards({ ...base, trackedDirty: true }).ok,
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
