/**
 * Amber Autonomous API — Node quick start.
 *
 *   AMBER_API_KEY=wrap_test_… node index.js
 *
 * No dependencies. Node 18+.
 */
const API_KEY = process.env.AMBER_API_KEY || process.env.AMBERONE_API_KEY;
const BASE = process.env.AMBER_BASE_URL || "https://hq.amberoneai.com";

if (!API_KEY) {
  console.error("Set AMBER_API_KEY (wrap_test_… or wrap_live_…).");
  process.exit(1);
}

async function call(method, path, body, headers = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${API_KEY}`,
      ...(body ? { "content-type": "application/json" } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await res.json();
  if (!payload.ok) {
    console.error(`${payload.error?.code}: ${payload.error?.message}`);
    if (payload.requestId) console.error(`requestId: ${payload.requestId}`);
    process.exit(1);
  }
  return payload.data;
}

async function main() {
  const account = await call("GET", "/api/v1/account");
  console.log(`Account: ${account.account?.name}`);
  console.log(
    `Autonomous quota: ${account.usage?.autonomous?.used ?? "?"}/${account.usage?.autonomous?.limit ?? "?"}`,
  );

  const idem = `node-aa-${Date.now()}`;
  const job = await call(
    "POST",
    "/api/v1/autonomous/jobs",
    {
      goal: "Run a dry autonomous checklist, recover if a controlled failure is injected, verify, return result.",
      providers: ["KIE_API_KEY"],
      injectFailure: true,
    },
    { "Idempotency-Key": idem },
  );
  console.log(`Submitted: ${job.id} (${job.status})`);

  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const cur = await call("GET", `/api/v1/autonomous/jobs/${job.id}`);
    console.log(`  ${cur.status} · ${cur.stage || ""}`);
    if (["COMPLETED", "FAILED", "CANCELLED"].includes(cur.status)) {
      console.log(JSON.stringify(cur, null, 2));
      return;
    }
  }
  console.error("Timed out waiting for terminal status");
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
