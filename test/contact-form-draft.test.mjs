import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Exercise the real TSX submit handler, with hook state and provider I/O stubbed.
// This is a handler regression test, not browser or Turnstile integration.
const source = readFileSync(new URL("../src/components/ContactForm.tsx", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
});

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

function harness() {
  const slots = [];
  let cursor = 0;
  const jsx = (type, props) => ({ type, props });
  const response = deferred();
  const json = deferred();
  const requests = [];
  const leads = [];
  const react = {
    useId: () => "contact",
    useEffect: () => {},
    useCallback: (callback) => callback,
    useRef: (value) => {
      const index = cursor++;
      return slots[index] ??= { current: value };
    },
    useState: (value) => {
      const index = cursor++;
      if (!(index in slots)) slots[index] = value;
      return [slots[index], (next) => { slots[index] = typeof next === "function" ? next(slots[index]) : next; }];
    },
  };
  const modules = {
    react,
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "next/link": { default: "a" },
    "next/script": { default: "script" },
    "next/navigation": { useSearchParams: () => new URLSearchParams() },
    "@/components/Button": { ButtonA: "a" },
    "@/lib/analytics": { trackGenerateLead: (event) => leads.push(event) },
    "@/lib/lead-attribution": { collectLeadAttribution: () => ({}) },
    "@/lib/website-needs": { CONTACT_PROJECT_TYPES: [], resolveProjectTypeFromSearch: () => "" },
  };
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    require: (name) => {
      assert.ok(name in modules, `Unexpected import: ${name}`);
      return modules[name];
    },
    process: { env: { NEXT_PUBLIC_TURNSTILE_SITE_KEY: "local-test-only" } },
    window: {},
    crypto: { randomUUID: (() => { let id = 0; return () => `submission-${++id}`; })() },
    FormData: class {
      constructor(form) { this.values = { ...form.values }; }
      get(name) { return this.values[name] ?? null; }
    },
    fetch: async (_url, options) => { requests.push(JSON.parse(options.body)); return response.promise; },
  });
  const initial = { name: "Example", email: "example@example.com", business: "Example business", projectType: "small-repair", message: "Original inquiry with enough details.", website: "" };
  const form = { values: { ...initial }, resets: 0, reset() { this.resets++; this.values = Object.fromEntries(Object.keys(initial).map((key) => [key, ""])); } };
  const inner = exports.ContactForm({ email: "test@example.com" }).props.children.type;
  function render() {
    cursor = 0;
    const tree = inner({ email: "test@example.com" });
    const nodes = [];
    function walk(node) {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) return node.forEach(walk);
      nodes.push(node);
      walk(node.props?.children);
    }
    walk(tree);
    return nodes;
  }
  render();
  // The token is normally supplied by the widget callback. Stub it locally.
  slots[5] = "test-token";
  slots[8] = initial.projectType;
  const find = (type) => render().find((node) => node.type === type);
  return {
    form, requests, leads, response, json,
    submit: () => {
      slots[5] = "test-token"; // Simulate a fresh widget completion for each retry.
      return find("form").props.onSubmit({ preventDefault() {}, currentTarget: form });
    },
    editProjectType(value) { form.values.projectType = value; find("select").props.onChange({ target: { value } }); },
    projectType: () => find("select").props.value,
    status: () => render().find((node) => node.props?.role === "status").props.children,
    respond(ok = true) { response.resolve({ ok, json: () => json.promise }); },
    finish(ok = true) { json.resolve({ ok, message: ok ? "Accepted for delivery." : "Please retry." }); },
  };
}

for (const field of ["name", "email", "business", "message", "projectType"]) {
  test(`older success preserves newer ${field} edits and gives the next draft a new ID`, async () => {
    const h = harness();
    const pending = h.submit();
    const sent = { ...h.requests[0] };
    if (field === "projectType") h.editProjectType("custom");
    else h.form.values[field] = `New ${field}`;
    h.respond();
    h.finish();
    await pending;
    assert.equal(h.form.resets, 0);
    assert.equal(h.form.values[field], field === "projectType" ? "custom" : `New ${field}`);
    assert.equal(h.projectType(), field === "projectType" ? "custom" : "small-repair");
    assert.match(h.status(), /newer edits.*have not been sent/);
    assert.equal(h.requests[0][field], sent[field]);
    assert.equal(h.leads.length, 1);
    const newerValue = h.form.values[field];
    await h.submit();
    assert.notEqual(h.requests[1].submissionId, sent.submissionId);
    assert.equal(h.requests[1][field], newerValue);
  });
}

test("edits during response JSON parsing are preserved", async () => {
  const h = harness();
  const pending = h.submit();
  h.respond();
  await Promise.resolve();
  await Promise.resolve();
  h.form.values.message = "New message during JSON parsing";
  h.editProjectType("custom");
  h.finish();
  await pending;
  assert.equal(h.form.resets, 0);
  assert.equal(h.projectType(), "custom");
  assert.match(h.status(), /have not been sent/);
});

test("unchanged successful draft resets text and controlled project type", async () => {
  const h = harness();
  const pending = h.submit();
  h.respond(); h.finish(); await pending;
  assert.equal(h.form.resets, 1);
  assert.equal(h.form.values.message, "");
  assert.equal(h.projectType(), "");
  assert.equal(h.status(), "Accepted for delivery.");
});

test("failed response preserves newer text and project type", async () => {
  const h = harness();
  const pending = h.submit();
  h.form.values.message = "New message";
  h.editProjectType("custom");
  h.respond(false); h.finish(false); await pending;
  assert.equal(h.form.resets, 0);
  assert.equal(h.form.values.message, "New message");
  assert.equal(h.projectType(), "custom");
  assert.equal(h.leads.length, 0);
  assert.equal(h.status(), "Please retry.");
});

test("unchanged failed retry retains its submission ID", async () => {
  const h = harness();
  const pending = h.submit();
  h.respond(false); h.finish(false); await pending;
  await h.submit();
  assert.equal(h.requests[1].submissionId, h.requests[0].submissionId);
});
