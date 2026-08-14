/**
 * Thin Amber Autonomous API client (no dependencies beyond fetch).
 */
export class AmberAutonomousClient {
  constructor({ apiKey, baseUrl = "https://hq.amberoneai.com" }) {
    if (!apiKey) throw new Error("apiKey is required");
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async request(method, path, { body, headers } = {}) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const payload = await res.json();
    if (!payload.ok) {
      const err = new Error(payload.error?.message || "API error");
      err.code = payload.error?.code;
      err.requestId = payload.requestId;
      throw err;
    }
    return payload.data;
  }

  account() {
    return this.request("GET", "/api/v1/account");
  }

  submitJob(body, { idempotencyKey } = {}) {
    return this.request("POST", "/api/v1/autonomous/jobs", {
      body,
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {},
    });
  }

  getJob(id) {
    return this.request("GET", `/api/v1/autonomous/jobs/${id}`);
  }

  listJobs(query = {}) {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(query).filter(([, v]) => v != null)),
    ).toString();
    return this.request("GET", `/api/v1/autonomous/jobs${qs ? `?${qs}` : ""}`);
  }

  cancelJob(id) {
    return this.request("DELETE", `/api/v1/autonomous/jobs/${id}`);
  }
}
