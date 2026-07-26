const PRODUCTION_HOSTS = new Set(["eurodigital.ca", "www.eurodigital.ca"]);

function extractEmail(value) {
  const normalized = String(value || "").trim();
  const angle = normalized.match(/<([^<>]+)>$/);
  return (angle ? angle[1] : normalized).trim().toLowerCase();
}

function parseCsv(value) {
  return String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function summarize(checks) {
  return {
    passed: checks.filter((item) => item.status === "pass").length,
    warnings: checks.filter((item) => item.status === "warn").length,
    failed: checks.filter((item) => item.status === "fail").length,
  };
}

export function applyEuroDigitalProductionPolicy(report, environment) {
  if (report.mode !== "production") return report;

  const checks = [...report.checks];
  const sender = extractEmail(environment.CONTACT_FROM_EMAIL);
  const senderDomain = sender.split("@")[1] || "";
  const senderControlled =
    senderDomain === "eurodigital.ca" || senderDomain.endsWith(".eurodigital.ca");
  checks.push({
    name: "EURODIGITAL_PRODUCTION_SENDER",
    status: senderControlled ? "pass" : "fail",
    message: senderControlled
      ? "Production sender uses an EuroDigital-controlled domain."
      : "Production sender must use eurodigital.ca or an approved subdomain.",
  });

  const originHosts = [];
  let originParseFailed = false;
  for (const entry of parseCsv(environment.CONTACT_ALLOWED_ORIGINS)) {
    try {
      originHosts.push(new URL(entry).hostname.toLowerCase());
    } catch {
      originParseFailed = true;
    }
  }
  const originsInScope =
    !originParseFailed &&
    originHosts.includes("eurodigital.ca") &&
    originHosts.every((hostname) => PRODUCTION_HOSTS.has(hostname));
  checks.push({
    name: "EURODIGITAL_PRODUCTION_ORIGINS",
    status: originsInScope ? "pass" : "fail",
    message: originsInScope
      ? "Production origins are limited to reviewed EuroDigital hosts."
      : "Production origins must include eurodigital.ca and may only include reviewed EuroDigital hosts.",
  });

  const configuredHostnames = parseCsv(environment.TURNSTILE_ALLOWED_HOSTNAMES).map(
    (hostname) => hostname.toLowerCase(),
  );
  const effectiveHostnames = configuredHostnames.length ? configuredHostnames : originHosts;
  const hostnamesInScope =
    effectiveHostnames.includes("eurodigital.ca") &&
    effectiveHostnames.every((hostname) => PRODUCTION_HOSTS.has(hostname));
  checks.push({
    name: "EURODIGITAL_TURNSTILE_HOSTNAMES",
    status: hostnamesInScope ? "pass" : "fail",
    message: hostnamesInScope
      ? "Production Turnstile validation is limited to reviewed EuroDigital hosts."
      : "Production Turnstile hostnames must include eurodigital.ca and may only include reviewed EuroDigital hosts.",
  });

  const summary = summarize(checks);
  return { ...report, checks, summary, ok: summary.failed === 0 };
}
