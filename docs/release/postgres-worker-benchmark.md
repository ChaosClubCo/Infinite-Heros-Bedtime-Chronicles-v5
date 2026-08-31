# PostgreSQL Retention Benchmark Gate

**Status:** BENCHMARK SPECIFIED / STAGING EXECUTION PENDING  
**Decision authority:** ADR-0008  
**Current database authority:** PostgreSQL via Drizzle / node-postgres  
**Cloudflare transport target:** Hyperdrive

## Decision being tested

Cloudflare edge v1 keeps PostgreSQL as the structured-data authority. This gate determines whether the existing PostgreSQL workload can be served from Workers with acceptable latency, bounded failure behavior, and no change to application data semantics.

This benchmark does **not** compare PostgreSQL against D1. D1 is not approved for edge v1 and requires a separate ADR if later proposed.

## Why Hyperdrive

Cloudflare's current Workers documentation recommends `node-postgres` (`pg`) for PostgreSQL access through Hyperdrive. The repository already uses `pg@^8.22.0`, above Cloudflare's currently documented minimum. Hyperdrive therefore provides the narrowest migration path because it preserves the project's existing PostgreSQL/Drizzle authority instead of coupling the runtime migration to a database rewrite.

## Required staging binding

The Worker environment must expose a Hyperdrive binding with a staging-only ID. The repository must never contain the database connection string or Hyperdrive credential material.

Conceptual binding:

```jsonc
{
  "hyperdrive": [
    {
      "binding": "HYPERDRIVE",
      "id": "<staging-hyperdrive-id>"
    }
  ]
}
```

The concrete identifier is account configuration and is not evidence until a deployed staging Worker proves it can use the binding.

## Benchmark route

Expose a **staging-only** authenticated/operator synthetic route or invoke the same benchmark function from a scheduled/one-shot CI probe. Do not expose raw SQL input.

The benchmark operation must be fixed and read-only:

```sql
SELECT 1 AS ok
```

A second read may query a small existing table through the same repository abstraction only if it contains no user/child payload in the emitted evidence.

## Sample plan

For one exact deployed staging SHA:

1. 20 warm-up requests, excluded from statistics.
2. 200 fixed `SELECT 1` requests distributed over the staging Worker endpoint.
3. Record per-request connection/query elapsed time from the Worker.
4. Record end-to-end HTTP elapsed time from the synthetic runner.
5. Repeat from at least two geographic runner regions if CI/platform routing supports it.
6. Repeat once with Hyperdrive cache disabled/not applicable to prove connection-path behavior, then with normal Hyperdrive behavior.
7. Inject one controlled invalid/unavailable-connection scenario in staging to prove timeout and sanitized error handling.

## Metrics

Preserve:

- `sample_count`
- Worker region/colo where available
- client runner region
- `connect_query_ms` p50 / p90 / p95 / p99
- end-to-end HTTP p50 / p90 / p95 / p99
- timeout count
- connection error count
- HTTP 5xx count
- retry count
- maximum retry depth
- sanitized failure response shape
- candidate SHA / deployment ID
- Hyperdrive configuration ID reference, not connection string

## Acceptance thresholds

Initial edge-v1 thresholds are deliberately conservative and may be tightened after real baseline measurements.

| Metric | Accept | Warning | Fail |
|---|---:|---:|---:|
| successful fixed read | >= 99.5% | 99.0-99.49% | < 99.0% |
| Worker-side p95 fixed read | <= 250 ms | 251-500 ms | > 500 ms |
| Worker-side p99 fixed read | <= 750 ms | 751-1500 ms | > 1500 ms |
| unbounded/hung request | 0 | 0 | >= 1 |
| leaked connection string/credential in response/log evidence | 0 | 0 | >= 1 |
| write executed by benchmark | 0 | 0 | >= 1 |
| retries beyond configured bound | 0 | 0 | >= 1 |

If the existing production Postgres region makes these thresholds unrealistic, the benchmark must capture the baseline and an ADR amendment may change thresholds. The migration may not silently redefine a failure as success after seeing the numbers.

## Failure behavior contract

A database failure must:

- terminate within the configured timeout;
- return a sanitized 5xx/503 application response;
- preserve request/correlation ID;
- emit bounded operational telemetry without database credentials;
- perform no automatic D1 fallback;
- avoid retry storms;
- avoid converting database unavailability into a successful empty result.

## D1 promotion gate

D1 remains rejected for this release unless a separate ADR demonstrates all of the following:

1. concrete Postgres/Hyperdrive evidence fails an agreed requirement;
2. the failure cannot be corrected with bounded runtime/transport configuration;
3. schema/query/transaction semantics are mapped explicitly;
4. migration and rollback of real data are designed and tested;
5. auth/RLS implications are resolved;
6. operational cost/performance is measured rather than assumed; and
7. the database migration can be executed independently of the Worker hosting release.

## Evidence receipt template

```json
{
  "schema": "PostgresWorkerBenchmarkReceipt/v1",
  "candidate_sha": "",
  "deployment_id": "",
  "hyperdrive_config_ref": "",
  "sample_count": 0,
  "worker_regions": [],
  "client_regions": [],
  "worker_ms": { "p50": 0, "p90": 0, "p95": 0, "p99": 0 },
  "http_ms": { "p50": 0, "p90": 0, "p95": 0, "p99": 0 },
  "success_rate": 0,
  "timeouts": 0,
  "connection_errors": 0,
  "max_retry_depth": 0,
  "failure_injection": {
    "executed": false,
    "bounded": false,
    "sanitized": false
  },
  "verdict": "INCONCLUSIVE"
}
```

## Current verdict

`INCONCLUSIVE`: the retention path is architecturally supported and the repository's `pg` version is compatible with the documented Hyperdrive minimum, but no staging Worker/Hyperdrive runtime benchmark has yet been executed for the migration candidate.
