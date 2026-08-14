# Security policy

## Reporting a vulnerability

Email **security@amberoneai.com** or use the contact path on
[hq.amberoneai.com](https://hq.amberoneai.com). Do not open a public GitHub
issue for a vulnerability.

Include what you did, what happened, what you expected, and any `requestId`.

## Scope

**In scope:** Amber Autonomous API at `hq.amberoneai.com/api/v1/autonomous`,
authentication, tenant isolation, quota enforcement, webhook delivery, and the
examples/SDK in this repository.

**Out of scope:** volumetric DoS; social engineering; automated scanner noise
with no demonstrated impact; third-party systems you point the worker at.

## How we protect data

- API keys stored as SHA-256 hashes only.
- Responses never include secret values — presence / last4 at most.
- Orgs are isolated on every read/write.
- Rate limits + period + concurrency caps bound provider spend.

## Do not commit secrets

Never put real `wrap_live_` / `wrap_test_` keys, Stripe secrets, vault contents,
or private keys in issues, PRs, or this repository.
