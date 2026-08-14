# Amber Autonomous API

**Submit a multi-step goal. Amber works in the cloud and returns a verified result.**

This is a **separate commercial product** from the [AmberOne Wrap API](https://github.com/scubamike124/amberone-api) (site → app packaging at `/api/v1/jobs`). Same host and API-key store; different endpoints, quotas, and capability.

```bash
curl -X POST https://hq.amberoneai.com/api/v1/autonomous/jobs \
  -H "Authorization: Bearer $AMBER_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{"goal":"Resolve video credentials, run a dry checklist, recover if primary fails, verify, return result.","providers":["KIE_API_KEY"],"injectFailure":true}'
```

Documentation: [scubamike124.github.io/amber-autonomous-api](https://scubamike124.github.io/amber-autonomous-api/)  
Public repository: [scubamike124/amber-autonomous-api](https://github.com/scubamike124/amber-autonomous-api)  
Signup / billing / keys: [hq.amberoneai.com/pricing](https://hq.amberoneai.com/pricing) · [hq.amberoneai.com](https://hq.amberoneai.com)

> ### Status: live (production-certified)
>
> Production base: `https://hq.amberoneai.com`  
> Path: `/api/v1/autonomous/jobs`  
> Sign up at Amber HQ → **Dashboard → Wrapper API / API keys** → create `wrap_live_…` or `wrap_test_…`.  
> Keys with empty scopes (full access) or explicit `autonomous` scope can call this API.  
> `wrap_test_` keys run the full pipeline and **do not** consume paid autonomous quota.

**Prefer Postman?** Import → Link:

```
https://raw.githubusercontent.com/scubamike124/amber-autonomous-api/main/postman_collection.json
```

---

## What it does

1. You **POST** a goal (natural language + optional providers/steps).
2. You receive a **job ID** immediately (`202`).
3. A **cloud worker** plans → resolves credentials (presence / last4 only) → runs tools → recovers → verifies.
4. You **GET** status until `COMPLETED` (with verified evidence) or `FAILED` / `CANCELLED`.

`COMPLETED` is only returned when `evidence.verified === true`. Public responses never include secret values.

---

## Getting started

1. **Choose a plan** at [hq.amberoneai.com/pricing](https://hq.amberoneai.com/pricing) (AmberOne Starter / Growth — Autonomous quotas are included; see Pricing below).
2. **Pay** via Stripe checkout (same AmberOne subscription used for the Wrap API).
3. **Create an API key** at Dashboard → Wrapper API / API keys.
4. **Submit a job**, poll status, read the verified result.

Evaluate for free with a `wrap_test_` key (no billable quota).

---

## Authentication

```http
Authorization: Bearer wrap_live_…
```

Also accepted: `X-API-Key: wrap_live_…`

| Kind | Prefix | Billing |
|------|--------|---------|
| Live | `wrap_live_` | Counts against period quotas |
| Test | `wrap_test_` | Full pipeline, never billed |

Scope: empty scopes = full access; or include `autonomous`.

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/autonomous/jobs` | Submit goal → **202** + job |
| GET | `/api/v1/autonomous/jobs` | List jobs (cursor) |
| GET | `/api/v1/autonomous/jobs/{id}` | Status / result |
| DELETE | `/api/v1/autonomous/jobs/{id}` | Cancel |
| GET | `/api/v1/account` | Plan + wrap + autonomous usage |

OpenAPI: [`openapi.json`](./openapi.json) · live: https://hq.amberoneai.com/api/v1/openapi.json

---

## Submit job

```bash
curl -sS -X POST "https://hq.amberoneai.com/api/v1/autonomous/jobs" \
  -H "Authorization: Bearer $AMBER_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: job-$(date +%s)" \
  -d '{
    "goal": "Resolve Kie credentials, select a video provider, run a dry autonomous checklist, recover if primary fails, verify, return result.",
    "providers": ["KIE_API_KEY", "OPENAI_API_KEY"],
    "injectFailure": true
  }'
```

Success envelope:

```json
{
  "ok": true,
  "data": {
    "id": "aa_…",
    "status": "QUEUED",
    "goal": "…",
    "stage": "…"
  },
  "requestId": "req_…"
}
```

---

## Retrieve status / result

```bash
curl -sS "https://hq.amberoneai.com/api/v1/autonomous/jobs/$JOB_ID" \
  -H "Authorization: Bearer $AMBER_API_KEY"
```

Poll until `status` is `COMPLETED`, `FAILED`, or `CANCELLED`. On `COMPLETED`, use `data.result` and `data.evidence` (secrets redacted to presence / last4).

---

## Cancel job

```bash
curl -sS -X DELETE "https://hq.amberoneai.com/api/v1/autonomous/jobs/$JOB_ID" \
  -H "Authorization: Bearer $AMBER_API_KEY"
```

Terminal jobs return `job_not_cancellable` (`409`).

---

## Idempotency

Send `Idempotency-Key` on POST. A replay with the same key + org returns the **same job** (`202`) and does **not** create a second in-flight job or consume an extra concurrency slot.

---

## Webhooks (optional)

Include `webhookUrl` on submit. On terminal status Amber POSTs:

```json
{
  "type": "autonomous.job.terminal",
  "jobId": "aa_…",
  "status": "COMPLETED",
  "requestId": "…"
}
```

Deliveries are best-effort; always poll GET as source of truth. Do not put secrets in webhook URLs.

---

## Rate limits & quotas

Per-plan **requests per minute** apply to all `/api/v1` calls (see `GET /api/v1/account`).

Autonomous-specific limits (included with AmberOne plans):

| Plan | Autonomous jobs / period | Concurrent autonomous | RPM (shared) |
|------|--------------------------|------------------------|--------------|
| Free | 3 | 1 | 20 |
| Starter ($79/mo) | 15 | 1 | 120 |
| Growth ($249/mo) | 60 | 3 | 300 |

- Live keys consume period quota on each accepted POST.
- Test keys do not.
- Exceeding concurrency or period quota returns `quota_exceeded`.

There is **no unlimited** autonomous tier on self-serve plans — provider cost is bounded by concurrency + period caps.

---

## Structured errors

```json
{
  "ok": false,
  "error": {
    "code": "quota_exceeded",
    "message": "Plan \"starter\" allows 15 autonomous jobs this period; 15 used."
  },
  "requestId": "req_…"
}
```

Common codes: `missing_api_key`, `invalid_api_key`, `api_key_revoked`, `forbidden`, `invalid_request`, `rate_limited`, `quota_exceeded`, `not_found`, `job_not_cancellable`, `internal_error`.

Branch on `error.code`. Quote `requestId` in support.

---

## Pricing & signup

Autonomous access is **bundled into AmberOne** (same Stripe checkout as Wrap):

- [Pricing](https://hq.amberoneai.com/pricing)
- [Signup](https://hq.amberoneai.com/signup?plan=starter)

Recommended **standalone** Autonomous SKUs (catalog only — not live-activated until owner confirms): see [`listing.json`](./listing.json).

---

## Not the Wrap API

| | Wrap API | Amber Autonomous API |
|--|----------|----------------------|
| Path | `/api/v1/jobs` | `/api/v1/autonomous/jobs` |
| Input | URL + platforms | Goal (+ providers) |
| Output | Downloadable app project | Verified cloud result |
| Repo | [amberone-api](https://github.com/scubamike124/amberone-api) | this repo |

---

## Examples

- [`examples/node-quickstart`](examples/node-quickstart) — submit → poll → print result
- [`examples/python-quickstart`](examples/python-quickstart) — same path in Python
- [`sdk/javascript`](sdk/javascript) — thin fetch client

---

## Security

See [`SECURITY.md`](./SECURITY.md). Never commit real `wrap_*` keys, Stripe secrets, or vault material. This repository is scanned before every publish.
