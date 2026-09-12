# DECISIONS.md

## 1. What did the requirements not tell you?

**The original schema and seed script were not included.** The assignment references a provided PostgreSQL schema and seed script containing ~5,000 users and ~50,000 orders, but these were not included in the materials received. I created a minimal schema and seed script that demonstrate all requirements with a small, explainable dataset.

**Assumptions made:**

- **Single `GET /api/users/:id/orders` endpoint** — the assignment is focused on this one endpoint; I did not build additional CRUD operations.
- **Order status values** — chose `PENDING`, `CONFIRMED`, `PROCESSING`, `COMPLETED`, `CANCELLED` as reasonable statuses. The exact values were not specified.
- **No pagination required** — the assignment says "do not introduce pagination unless the existing assignment requirements justify it." The scalability answer in section 3 addresses how pagination would be added.
- **`id` is an integer** — the `serial` primary key means IDs are integers; route params are validated accordingly.
- **Password comparison uses "generic" error messages** — both "user not found" and "wrong password" return the same `Invalid email or password` message to prevent user enumeration.
- **JWT `sub` claim holds the user ID as a string** — standard JWT convention, parsed back to integer on verification.

**Least-confident assumption:** The order status enum values. Without the original schema, I chose reasonable statuses. In a real project, these would come from product requirements.

## 2. What did you use AI for, and where did you override it?

**AI-assisted areas:**

- **Project structure decisions** — AI suggested the layered architecture (route → controller → service → database). I accepted this as it matches the assignment's explicit guidance.
- **Error handling patterns** — AI helped establish the `AppError` class with typed error codes and the centralized error middleware pattern.
- **Test mocking strategy** — AI suggested mocking at the service level for HTTP tests rather than attempting to mock the Drizzle chainable API. I accepted this as pragmatic for the assignment scope.
- **Vitest configuration** — AI identified that `vi.mock()` on the env module was necessary because env validation runs at import time and `process.exit(1)` would kill the test process.

**Where I overrode AI:**

- **Seed script design** — AI initially suggested generating 5,000 users and 50,000 orders. I overrode this to keep the dataset small and explainable, consistent with the assignment's "small and easy to explain in a 20-minute technical discussion" requirement.
- **No Zod in the auth service** — I used manual validation in the login controller instead of Zod, keeping the auth flow minimal. The env validation already demonstrates Zod usage.
- **Simplified test suite** — AI suggested comprehensive edge-case testing. I kept the test suite focused on the assignment's specified test cases to avoid over-engineering.

## 3. What breaks first at 100× this data?

At 100× (~500K users, ~5M orders), the **order-history query** is the first bottleneck.

**The specific problem:** The composite index `orders_user_created_at_idx (user_id, created_at)` efficiently serves the `WHERE user_id = ? ORDER BY created_at DESC` query. However, as the orders table grows:

1. **Index size** — the composite index grows proportionally with the orders table. At 5M rows, the index fits comfortably in memory on most Postgres instances, but on smaller Neon instances it may start spilling to disk.
2. **High-volume users** — a user with thousands of orders returns a large result set without pagination. This affects both query time and network transfer.

**How to detect before customers report it:**

- **Query latency monitoring** — add `pg_stat_statements` or Neon's query insights to track p95/p99 latency for the order-history query. Alert when it exceeds a threshold (e.g., 200ms).
- **EXPLAIN ANALYZE** — periodically run `EXPLAIN ANALYZE` on the order-history query to verify the index is still being used and the query plan hasn't degraded.
- **Load testing** — run k6 or similar against the endpoint with realistic data volumes before deployment.
- **Database metrics** — monitor `idx_scan` vs `seq_scan` in `pg_stat_user_indexes` to confirm the index is being used.

**First fix:** Add `LIMIT` / cursor-based pagination to the query. This bounds the result set regardless of how many orders a user has.

## 4. What did you deliberately not build?

| Omission | Reason |
|----------|--------|
| **Pagination** | The assignment says "pagination is not required unless the existing assignment requirements justify it." The implementation is designed so pagination can be added later without restructuring. |
| **Registration endpoint** | Not required. The assignment only needs login to obtain a test token. |
| **Password reset** | Not required. Would need email infrastructure. |
| **Refresh tokens** | Not required. A single short-lived token is sufficient for evaluation. |
| **Redis / caching** | The assignment explicitly says "do not solve the scalability requirement by adding Redis." The query is fast with the composite index at current scale. |
| **Rate limiting** | Not specified in requirements. Would be added in a production deployment. |
| **Logging infrastructure** | Console logging is sufficient. Structured logging (e.g., pino) would be added for production. |
| **Docker** | Not required. The assignment targets a simple `npm run dev` workflow. |
| **Generic repository/service frameworks** | The assignment says "avoid generic repository frameworks." The small, concrete service layer is sufficient. |
