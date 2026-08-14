#!/usr/bin/env python3
"""Amber Autonomous API — Python quick start.

  AMBER_API_KEY=wrap_test_… python main.py
"""
from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request
from uuid import uuid4

API_KEY = os.environ.get("AMBER_API_KEY") or os.environ.get("AMBERONE_API_KEY")
BASE = os.environ.get("AMBER_BASE_URL", "https://hq.amberoneai.com")

if not API_KEY:
    print("Set AMBER_API_KEY first.", file=sys.stderr)
    sys.exit(1)


def call(method: str, path: str, body: dict | None = None, headers: dict | None = None):
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            **({"Content-Type": "application/json"} if body is not None else {}),
            **(headers or {}),
        },
    )
    with urllib.request.urlopen(req) as res:
        payload = json.loads(res.read().decode())
    if not payload.get("ok"):
        err = payload.get("error") or {}
        print(f"{err.get('code')}: {err.get('message')}", file=sys.stderr)
        print(f"requestId: {payload.get('requestId')}", file=sys.stderr)
        sys.exit(1)
    return payload["data"]


def main() -> None:
    account = call("GET", "/api/v1/account")
    print(f"Account: {account.get('account', {}).get('name')}")
    aa = (account.get("usage") or {}).get("autonomous") or {}
    print(f"Autonomous quota: {aa.get('used')}/{aa.get('limit')}")

    job = call(
        "POST",
        "/api/v1/autonomous/jobs",
        {
            "goal": "Run a dry autonomous checklist, recover if a controlled failure is injected, verify, return result.",
            "providers": ["KIE_API_KEY"],
            "injectFailure": True,
        },
        {"Idempotency-Key": f"py-aa-{uuid4()}"},
    )
    print(f"Submitted: {job['id']} ({job['status']})")

    for _ in range(60):
        time.sleep(3)
        cur = call("GET", f"/api/v1/autonomous/jobs/{job['id']}")
        print(f"  {cur['status']} · {cur.get('stage') or ''}")
        if cur["status"] in ("COMPLETED", "FAILED", "CANCELLED"):
            print(json.dumps(cur, indent=2))
            return
    print("Timed out", file=sys.stderr)
    sys.exit(1)


if __name__ == "__main__":
    main()
