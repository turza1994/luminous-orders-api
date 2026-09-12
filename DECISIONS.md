# Engineering Decisions

## 1. What requirements did not tell you? List your assumptions. Flag the one you're least confident about.

The assessment clearly specifies the required endpoint:

```text
GET /api/users/:id/orders
```

and requires:

- newest-first order history
- responsiveness as order count grows
- support for users with no orders
- access restricted to the user themselves or an admin

However, several implementation details were not specified.

### Assumptions

#### 1. The supplied PostgreSQL schema and seed data were not received

The assessment referenced an existing PostgreSQL schema and seed script containing approximately 5,000 users and 50,000 orders. Those files were not included in the assessment materials I received.

Rather than blocking implementation, I created a minimal equivalent schema containing:

```text
users
orders
```

and created a seed script with representative users and orders.

This is the assumption I am **least confident about**, because the original schema may have contained additional fields, constraints, relationships, or business rules that were not visible to me.

The implementation therefore focuses only on the data required by the stated endpoint.

#### 2. User identification

I assumed users have a numeric database ID because the endpoint uses:

```text
/api/users/:id/orders
```

The JWT contains the authenticated user's ID as the `sub` claim.

#### 3. Admin authorization

I assumed a user has a role of either:

```text
USER
ADMIN
```

and that `ADMIN` users can access any user's order history.

#### 4. Nonexistent users

I chose:

```text
404 Not Found
```

when the requested user does not exist.

This makes the distinction between:

```text
existing user with no orders → 200 + []
nonexistent user              → 404
```

explicit.

#### 5. Empty order history

A valid user with no orders receives:

```json
{
  "success": true,
  "data": {
    "orders": []
  }
}
```

rather than an error.

#### 6. Pagination

Pagination was not explicitly required, so I did not add it.

The current implementation is designed around the required query pattern and can be extended with limit/cursor pagination if the requirement changes.

#### 7. Authentication

The assessment requires authorization but does not specify an authentication mechanism.

I added a minimal JWT login endpoint solely to make the protected endpoint independently testable.

I did not implement registration, password reset, refresh tokens, social login, or other unrelated authentication features.

#### 8. Order fields

Only fields relevant to the assignment are exposed:

```text
id
userId
status
totalAmount
createdAt
```

Sensitive user information such as password hashes is never returned.

---

## 2. What AI did you use, and where did you override it?

AI tools were used during development for:

- discussing the project structure
- reviewing implementation approaches
- generating initial boilerplate
- suggesting test cases
- explaining testing concepts
- identifying mistakes in test mock paths
- reviewing scalability considerations
- helping draft documentation

I reviewed and tested the generated code rather than treating AI output as authoritative.

One concrete example where I changed the approach was testing.

The initial implementation contained separate service and repository unit tests in addition to HTTP integration tests. The service tests had incorrect mock paths and were failing.

After reviewing the coverage, I chose not to add unnecessary abstraction or dependency injection solely to make those unit tests easier to mock. Instead, I kept a focused integration-test suite covering the externally observable behavior required by the assignment.

I also manually tested the API using `curl` and verified the authentication and authorization scenarios independently.

The final implementation therefore reflects both AI assistance and my own review and verification.

---

## 3. What breaks first at 100× data? Be specific. How would you detect it?

At 100× the original referenced dataset, the orders table would contain approximately:

```text
50,000 × 100 = 5,000,000 orders
```

The first concern is the number of orders belonging to a **single user**.

The current query is designed around:

```sql
WHERE user_id = ?
ORDER BY created_at DESC
```

with a composite index on:

```text
(user_id, created_at)
```

This avoids scanning the entire orders table when retrieving one user's history.

However, if an individual user accumulates a very large number of orders, returning the entire order history in a single HTTP response eventually becomes the bottleneck.

The likely symptoms would be:

- increasing database query time
- increased response size
- increased memory usage
- increased network transfer time
- higher request latency

### Detection

I would monitor:

- API latency, especially p95/p99
- PostgreSQL query execution time
- database CPU and memory usage
- response payload size
- slow query logs
- database connection utilization

I would also inspect the query using PostgreSQL:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT ...
FROM orders
WHERE user_id = ?
ORDER BY created_at DESC;
```

### Next change

If the order history becomes large enough, I would add pagination.

For example, cursor-based pagination could use:

```text
created_at + id
```

as the cursor so that clients retrieve a bounded number of orders per request.

I deliberately did not build pagination because it was not required by the assignment.

---

## 4. What did you deliberately not build?

I intentionally kept the implementation small and focused on the stated requirement.

I did not build:

### Pagination

Not required by the current specification.

The query and API structure leave room to add cursor-based pagination later.

### Redis/cache

The endpoint is a straightforward indexed PostgreSQL query. Adding Redis would introduce another system and cache invalidation concerns without being necessary for the current assignment.

### Microservices

The assignment is small enough that a modular monolith is simpler and easier to reason about.

### Background jobs/queues

There is no asynchronous business process required by this endpoint.

### Search infrastructure

Elasticsearch or another search engine is unnecessary for a simple user/order lookup.

### Full authentication platform

Only the minimal login functionality required to exercise JWT-protected authorization was added.

I did not implement:

- registration
- refresh tokens
- password reset
- email verification
- social authentication
- MFA

### Frontend

The assignment asks for a backend API, so no frontend application was created.

### Generic repository or dependency-injection framework

There are only a small number of database operations. A framework or generic abstraction would add complexity without providing meaningful value for this assignment.

---

## Overall Design Rationale

The main goal was to implement the required behavior with the smallest reasonable architecture while still demonstrating:

- clear separation of responsibilities
- input validation
- authentication
- authorization
- centralized error handling
- PostgreSQL indexing
- reproducible database migrations
- automated API tests
- scalability awareness

The design can be extended later if the requirements grow, but unnecessary infrastructure was intentionally avoided for this assignment.