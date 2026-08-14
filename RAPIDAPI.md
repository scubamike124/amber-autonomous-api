# RapidAPI listing kit (owner action)

Amber cannot create a RapidAPI **provider** account or accept PayPal payout terms on the owner's behalf.

When the owner has provider access:

1. Create listing **Amber Autonomous API** (do not overwrite AmberOne Wrap listing).
2. Import OpenAPI from:
   `https://raw.githubusercontent.com/scubamike124/amber-autonomous-api/main/openapi.json`
3. Base URL: `https://hq.amberoneai.com`
4. Auth: Bearer `wrap_live_…` / `wrap_test_…`
5. Highlight path `/api/v1/autonomous/jobs` and note Wrap API is a different product.

Vault for consumer RapidAPI keys (not seller publish): `RAPIDAPI_KEY` presence only.
