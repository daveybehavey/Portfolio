const fs = require("node:fs");
const https = require("node:https");

function readDotEnvLocal() {
  const envPath = ".env.local";
  if (!fs.existsSync(envPath)) return {};
  const raw = fs.readFileSync(envPath, "utf8");
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const k = trimmed.slice(0, idx).trim();
    const v = trimmed.slice(idx + 1).trim();
    out[k] = v;
  }
  return out;
}

function cfRequest({ method, path, headers, body }) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "api.cloudflare.com",
        path: `/client/v4${path}`,
        method,
        headers
      },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            resolve({ status: res.statusCode, json });
          } catch (e) {
            reject(new Error(`Failed to parse JSON (${res.statusCode}): ${data.slice(0, 300)}`));
          }
        });
      }
    );
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  const env = { ...readDotEnvLocal(), ...process.env };
  const email = env.CLOUDFLARE_API_EMAIL;
  const globalKey = env.CLOUDFLARE_GLOBAL_API_KEY;

  if (!email || !globalKey) {
    console.error("Missing CLOUDFLARE_API_EMAIL or CLOUDFLARE_GLOBAL_API_KEY in .env.local");
    process.exit(2);
  }

  const authHeaders = {
    "X-Auth-Email": email,
    "X-Auth-Key": globalKey,
    "Content-Type": "application/json"
  };

  const cmd = process.argv[2];
  if (cmd === "zone-id") {
    const zoneName = process.argv[3];
    if (!zoneName) {
      console.error("Usage: node scripts/cf-api.js zone-id <zoneName>");
      process.exit(2);
    }
    const { json } = await cfRequest({ method: "GET", path: `/zones?name=${encodeURIComponent(zoneName)}`, headers: authHeaders });
    if (!json?.success || !json?.result?.[0]?.id) {
      console.error("Cloudflare zone lookup failed.");
      process.exit(1);
    }
    process.stdout.write(String(json.result[0].id));
    return;
  }

  if (cmd === "ensure-www-cname") {
    const zoneId = process.argv[3];
    const target = process.argv[4];
    if (!zoneId || !target) {
      console.error("Usage: node scripts/cf-api.js ensure-www-cname <zoneId> <target>");
      process.exit(2);
    }
    const name = "www";
    const fqdn = "www.eurodigital.ca";

    // Find existing
    const list = await cfRequest({
      method: "GET",
      path: `/zones/${zoneId}/dns_records?type=CNAME&name=${encodeURIComponent(fqdn)}`,
      headers: authHeaders
    });

    const existing = list.json?.result?.[0];
    const record = { type: "CNAME", name: fqdn, content: target, proxied: true, ttl: 1 };

    if (existing?.id) {
      const upd = await cfRequest({
        method: "PUT",
        path: `/zones/${zoneId}/dns_records/${existing.id}`,
        headers: authHeaders,
        body: record
      });
      if (!upd.json?.success) {
        console.error("Failed updating CNAME record.");
        process.exit(1);
      }
      console.log("UPDATED_CNAME");
      return;
    }

    const create = await cfRequest({
      method: "POST",
      path: `/zones/${zoneId}/dns_records`,
      headers: authHeaders,
      body: record
    });
    if (!create.json?.success) {
      console.error("Failed creating CNAME record.");
      process.exit(1);
    }
    console.log("CREATED_CNAME");
    return;
  }

  if (cmd === "create-www-forward-page-rule") {
    const zoneId = process.argv[3];
    if (!zoneId) {
      console.error("Usage: node scripts/cf-api.js create-www-forward-page-rule <zoneId>");
      process.exit(2);
    }

    const body = {
      targets: [
        {
          target: "url",
          constraint: { operator: "matches", value: "www.eurodigital.ca/*" }
        }
      ],
      actions: [
        {
          id: "forwarding_url",
          value: { url: "https://eurodigital.ca/$1", status_code: 301 }
        }
      ],
      priority: 1,
      status: "active"
    };

    const res = await cfRequest({
      method: "POST",
      path: `/zones/${zoneId}/pagerules`,
      headers: authHeaders,
      body
    });

    if (!res.json?.success) {
      // If it already exists, Cloudflare returns an error; we'll surface a short message.
      console.error("PAGE_RULE_CREATE_FAILED");
      process.exit(1);
    }
    console.log("CREATED_PAGE_RULE");
    return;
  }

  console.error("Unknown command.");
  process.exit(2);
}

main().catch((e) => {
  console.error(e?.message || String(e));
  process.exit(1);
});

