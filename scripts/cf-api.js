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

function getAuthHeaders(env) {
  const token = env.CLOUDFLARE_API_TOKEN?.trim();
  const email = env.CLOUDFLARE_API_EMAIL?.trim();
  const globalKey = env.CLOUDFLARE_GLOBAL_API_KEY?.trim();

  if (token) {
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };
  }

  if (email && globalKey) {
    if (globalKey.length < 30) {
      console.error(
        "CLOUDFLARE_GLOBAL_API_KEY looks too short — paste the full Global API Key from Cloudflare Profile → API Tokens → Global API Key (View), or use CLOUDFLARE_API_TOKEN instead."
      );
      process.exit(2);
    }
    return {
      "X-Auth-Email": email,
      "X-Auth-Key": globalKey,
      "Content-Type": "application/json"
    };
  }

  console.error(
    "Missing Cloudflare credentials in .env.local. Use either:\n" +
      "  CLOUDFLARE_API_TOKEN=<token>\n" +
      "or:\n" +
      "  CLOUDFLARE_API_EMAIL=<account email>\n" +
      "  CLOUDFLARE_GLOBAL_API_KEY=<global api key>"
  );
  process.exit(2);
}

function printApiErrors(json) {
  const errors = json?.errors;
  if (!errors?.length) return;
  for (const err of errors) {
    console.error(err.message || JSON.stringify(err));
  }
}

async function main() {
  const env = { ...readDotEnvLocal(), ...process.env };
  const authHeaders = getAuthHeaders(env);

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
      printApiErrors(json);
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

  if (cmd === "email-routing-status") {
    const zoneId = process.argv[3];
    if (!zoneId) {
      console.error("Usage: node scripts/cf-api.js email-routing-status <zoneId>");
      process.exit(2);
    }

    const [settings, rules, dns] = await Promise.all([
      cfRequest({ method: "GET", path: `/zones/${zoneId}/email/routing`, headers: authHeaders }),
      cfRequest({ method: "GET", path: `/zones/${zoneId}/email/routing/rules`, headers: authHeaders }),
      cfRequest({
        method: "GET",
        path: `/zones/${zoneId}/dns_records?type=MX`,
        headers: authHeaders
      })
    ]);

    const out = {
      enabled: settings.json?.result?.enabled ?? null,
      status: settings.json?.result?.status ?? null,
      mxRecords: (dns.json?.result || []).map((r) => ({ name: r.name, content: r.content, priority: r.priority })),
      rules: (rules.json?.result || []).map((r) => ({
        id: r.id,
        name: r.name,
        enabled: r.enabled,
        matchers: r.matchers,
        actions: r.actions
      }))
    };
    console.log(JSON.stringify(out, null, 2));
    return;
  }

  if (cmd === "ensure-contact-forward") {
    const zoneId = process.argv[3];
    const destination = process.argv[4];
    if (!zoneId || !destination) {
      console.error("Usage: node scripts/cf-api.js ensure-contact-forward <zoneId> <destinationEmail>");
      process.exit(2);
    }

    const zoneRes = await cfRequest({ method: "GET", path: `/zones/${zoneId}`, headers: authHeaders });
    const accountId = zoneRes.json?.result?.account?.id;
    if (!accountId) {
      console.error("Could not resolve Cloudflare account id for zone.");
      process.exit(1);
    }

    const destList = await cfRequest({
      method: "GET",
      path: `/accounts/${accountId}/email/routing/addresses`,
      headers: authHeaders
    });
    let dest = (destList.json?.result || []).find((a) => a.email === destination);
    if (!dest) {
      const created = await cfRequest({
        method: "POST",
        path: `/accounts/${accountId}/email/routing/addresses`,
        headers: authHeaders,
        body: { email: destination }
      });
      if (!created.json?.success) {
        console.error("Failed to create destination address. Check API token permissions.");
        console.error(JSON.stringify(created.json?.errors || created.json, null, 2));
        process.exit(1);
      }
      dest = created.json.result;
      console.log("CREATED_DESTINATION (verify the email Cloudflare sent before forwarding works)");
    } else if (!dest.verified) {
      console.log("DESTINATION_EXISTS_BUT_NOT_VERIFIED — check inbox for Cloudflare verification link");
    } else {
      console.log("DESTINATION_VERIFIED");
    }

    const rulesRes = await cfRequest({
      method: "GET",
      path: `/zones/${zoneId}/email/routing/rules`,
      headers: authHeaders
    });
    const customAddress = "contact@eurodigital.ca";
    const existing = (rulesRes.json?.result || []).find((r) =>
      r.matchers?.some((m) => m.type === "literal" && m.field === "to" && m.value === customAddress)
    );

    if (existing) {
      console.log("RULE_EXISTS", existing.id);
      return;
    }

    if (!dest?.verified) {
      console.log("Skipping rule creation until destination is verified.");
      return;
    }

    const ruleBody = {
      name: "Contact inbox",
      enabled: true,
      matchers: [{ type: "literal", field: "to", value: customAddress }],
      actions: [{ type: "forward", value: [destination] }]
    };
    const createdRule = await cfRequest({
      method: "POST",
      path: `/zones/${zoneId}/email/routing/rules`,
      headers: authHeaders,
      body: ruleBody
    });
    if (!createdRule.json?.success) {
      console.error("RULE_CREATE_FAILED");
      console.error(JSON.stringify(createdRule.json?.errors || createdRule.json, null, 2));
      process.exit(1);
    }
    console.log("CREATED_RULE", createdRule.json.result?.id);
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

