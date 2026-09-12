# Luminous Labs — Senior Software Engineer (Node.js) Assignment

A small Node.js + TypeScript + Express API implementing the requested user order-history endpoint:

```text
GET /api/users/:id/orders
```

The endpoint returns a user's orders in newest-first order while enforcing authentication and authorization.

---

## Assignment Context

The assignment materials referenced a PostgreSQL schema and seed script containing approximately:

- 5,000 users
- 50,000 orders

Those original schema and seed files were not included in the materials I received.

To keep the submission reproducible and testable, I created a minimal equivalent schema and a deterministic seed script containing representative users and orders.

The implementation is intentionally focused on the requested requirements rather than introducing unnecessary infrastructure.

---

# Tech Stack

- **Node.js 24 LTS**
- **TypeScript**
- **Express 5**
- **PostgreSQL**
- **Neon PostgreSQL**
- **Drizzle ORM**
- **Drizzle Kit**
- **JWT**
- **bcrypt**
- **Zod**
- **Helmet**
- **CORS**
- **Vitest**
- **Supertest**

---

# Project Structure

```text
luminous-orders-api/
├── drizzle/
│   ├── meta/
│   └── *.sql
├── scripts/
│   └── seed.ts
├── src/
│   ├── config/
│   │   ├── constants.ts
│   │   └── env.ts
│   ├── db/
│   │   ├── index.ts
│   │   └── schema.ts
│   ├── errors/
│   │   ├── app-error.ts
│   │   └── error-codes.ts
│   ├── middleware/
│   │   ├── async-error-wrapper.ts
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── not-found.middleware.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── login.schema.ts
│   │   │   └── users.repository.ts
│   │   └── orders/
│   │       ├── orders.controller.ts
│   │       ├── orders.repository.ts
│   │       ├── orders.routes.ts
│   │       ├── orders.service.ts
│   │       └── params.schema.ts
│   ├── types/
│   │   └── express.d.ts
│   ├── utils/
│   │   └── logger.ts
│   ├── app.ts
│   └── server.ts
├── tests/
│   ├── auth.test.ts
│   └── orders.test.ts
├── .env.example
├── .gitignore
├── AGENTS.md
├── DECISIONS.md
├── drizzle.config.ts
├── package.json
├── package-lock.json
├── tsconfig.json
└── vitest.config.ts
```

---

# Prerequisites

You need:

- Node.js 24 LTS or another compatible modern Node.js version
- npm
- PostgreSQL

The easiest way to run the assignment is using the configured **Neon PostgreSQL** database.

You can also use your own PostgreSQL database if preferred.

---

# Database

This project uses PostgreSQL.

For the submitted setup, the database is hosted on **Neon PostgreSQL**.

The repository contains `.env.example` with the database configuration needed to connect to the evaluation database.

### Important

If the provided Neon database credentials are available in `.env.example`, simply copy the file to `.env` and use it as described below.

If you prefer to use your own PostgreSQL instance, replace `DATABASE_URL` with your own PostgreSQL connection string.

---

# Setup Option 1 — Use the Provided Neon PostgreSQL Database

This is the easiest way to test the assignment.

## 1. Install dependencies

```bash
npm install
```

## 2. Create `.env`

Copy `.env.example` to `.env`.

### Linux/macOS

```bash
cp .env.example .env
```

### Windows PowerShell

```powershell
Copy-Item .env.example .env
```

The environment file should contain values similar to:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL="your-neon-postgresql-connection-string"
JWT_SECRET="your-secret-at-least-32-characters-long"
JWT_EXPIRES_IN="1h"
CORS_ORIGIN="*"
```

The actual database URL is provided in the supplied `.env.example`.

---

## 3. Run migrations

```bash
npm run db:migrate
```

If the provided Neon database already contains the required schema, Drizzle will report that there are no new migrations to apply.

---

## 4. Seed the database

```bash
npm run db:seed
```

The seed script creates the deterministic demo dataset.

> **Note:** The seed script clears the existing `users` and `orders` tables before inserting the demo data. Therefore, it should only be run against the dedicated assignment/evaluation database or a local database created for this assignment.

Expected output is similar to:

```text
Seeding database...

Seed complete!

Demo credentials (password for all: password123):

  Admin:  admin@example.com   (id: 1, role: ADMIN)
  User 1: alice@example.com   (id: 2, role: USER) — 5 orders
  User 2: bob@example.com     (id: 3, role: USER) — 3 orders
  User 3: charlie@example.com (role: USER) — 0 orders
```

The exact numeric IDs may differ depending on the state of the database.

---

# Setup Option 2 — Use Your Own PostgreSQL Database

If you prefer to use a local or separate PostgreSQL database:

## 1. Create a PostgreSQL database

For example:

```text
luminous_orders
```

## 2. Update `.env`

Set:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/luminous_orders"
```

Keep the other variables unchanged or configure them as needed.

Example:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL="postgresql://postgres:password@localhost:5432/luminous_orders"
JWT_SECRET="replace-with-a-secret-at-least-32-characters-long"
JWT_EXPIRES_IN="1h"
CORS_ORIGIN="*"
```

## 3. Run migrations

```bash
npm run db:migrate
```

## 4. Seed the database

```bash
npm run db:seed
```

---

# Running the Application

## Development

```bash
npm run dev
```

The API will be available at:

```text
http://localhost:5000
```

---

## Production Build

Compile the TypeScript application:

```bash
npm run build
```

Then start the compiled application:

```bash
npm start
```

---

# API Overview

## Health Check

```http
GET /health
```

## Login

```http
POST /api/auth/login
```

## Get User Orders

```http
GET /api/users/:id/orders
```

The order-history endpoint requires a valid JWT:

```http
Authorization: Bearer <JWT>
```

---

# Health Check

### Request

```bash
curl http://localhost:5000/health
```

Expected response:

```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

---

# Authentication

A small JWT authentication endpoint is included so the protected order-history endpoint can be tested end-to-end without requiring an external authentication service.

## Login Endpoint

```http
POST /api/auth/login
```

### Linux/macOS

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123"}'
```

### Windows PowerShell

```powershell
curl.exe -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"alice@example.com","password":"password123"}'
```

The response contains a JWT token:

```json
{
  "success": true,
  "data": {
    "token": "YOUR_JWT_TOKEN",
    "user": {
      "id": 2,
      "email": "alice@example.com",
      "role": "USER"
    }
  }
}
```

Copy the returned token for the order API requests.

---

# Demo Accounts

All demo accounts use:

```text
password123
```

| Email | Role | Orders |
|---|---|---:|
| `admin@example.com` | ADMIN | 0 |
| `alice@example.com` | USER | 5 |
| `bob@example.com` | USER | 3 |
| `charlie@example.com` | USER | 0 |

The seed script generates the actual user IDs.

---

# Get User Orders

## Endpoint

```http
GET /api/users/:id/orders
```

### Authentication

```http
Authorization: Bearer <JWT>
```

### Authorization Rules

A normal user:

- can view their own orders
- cannot view another user's orders

An admin:

- can view any user's orders

Additional behavior:

- Missing authentication → `401`
- Invalid/tampered token → `401`
- Authenticated user accessing another user's orders → `403`
- Nonexistent user → `404`
- Existing user with no orders → `200` with an empty array

---

# Manual API Verification

The following steps verify the main assignment requirements.

## 1. Login as Alice

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123"}'
```

Copy the returned JWT.

For the following examples:

```text
ALICE_TOKEN=<paste-token-here>
```

---

## 2. Alice Gets Her Own Orders

```bash
curl http://localhost:5000/api/users/2/orders \
  -H "Authorization: Bearer ALICE_TOKEN"
```

Replace `2` with Alice's actual ID if the seed output shows a different ID.

Expected:

```text
HTTP 200
```

Alice should have 5 orders.

They should be returned newest first:

```text
2025-05-18
2025-04-05
2025-03-10
2025-02-20
2025-01-15
```

---

## 3. Alice Attempts to Access Bob's Orders

```bash
curl http://localhost:5000/api/users/3/orders \
  -H "Authorization: Bearer ALICE_TOKEN"
```

Replace `3` with Bob's actual ID if necessary.

Expected:

```text
HTTP 403
```

Example response:

```json
{
  "success": false,
  "error": {
    "code": "ORDER_HISTORY_ACCESS_DENIED",
    "message": "You are not allowed to view this user's orders."
  }
}
```

This verifies the user-to-user authorization restriction.

---

## 4. Request Without Authentication

```bash
curl http://localhost:5000/api/users/2/orders
```

Expected:

```text
HTTP 401
```

---

## 5. Login as Admin

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

Copy the returned token:

```text
ADMIN_TOKEN=<paste-token-here>
```

---

## 6. Admin Gets Alice's Orders

```bash
curl http://localhost:5000/api/users/2/orders \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

Expected:

```text
HTTP 200
```

with Alice's 5 orders.

---

## 7. Existing User With No Orders

The seeded admin user has no orders.

```bash
curl http://localhost:5000/api/users/1/orders \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

Replace `1` with the actual admin ID if necessary.

Expected:

```json
{
  "success": true,
  "data": []
}
```

This verifies that an existing user with no orders is handled as a successful request rather than an error.

Charlie is also intentionally seeded with zero orders.

---

## 8. Nonexistent User

```bash
curl http://localhost:5000/api/users/999/orders \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

Expected:

```text
HTTP 404
```

with an error code:

```text
USER_NOT_FOUND
```

---

## 9. Invalid/Tampered Token

For example:

```bash
curl http://localhost:5000/api/users/2/orders \
  -H "Authorization: Bearer invalid-token"
```

Expected:

```text
HTTP 401
```

---

# Response Format

All successful responses follow:

```json
{
  "success": true,
  "data": {}
}
```

Errors follow:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

## Common HTTP Status Codes

| Status | Meaning |
|---:|---|
| `200` | Successful request |
| `400` | Invalid request |
| `401` | Missing or invalid authentication |
| `403` | Authenticated but not authorized |
| `404` | User or route not found |
| `500` | Unexpected server error |

---

# Database Design

The main query pattern is:

```sql
SELECT ...
FROM orders
WHERE user_id = ?
ORDER BY created_at DESC;
```

The `orders` table therefore has a composite index:

```text
(user_id, created_at)
```

This index is designed around the endpoint's actual access pattern.

Instead of scanning all orders, PostgreSQL can use the user ID to narrow the relevant rows and efficiently support the requested ordering.

The database also has a foreign key:

```text
orders.user_id -> users.id
```

---

# Scalability

The endpoint is designed so that it does not load the complete `orders` table into application memory.

The query is scoped to a single user:

```sql
WHERE user_id = ?
```

and supported by:

```text
(user_id, created_at)
```

The current approach should therefore remain efficient as the total number of orders grows.

## What happens at much larger scale?

The first likely concern is a user with a very large order history.

The current endpoint returns the complete order history in a single response. At sufficiently large scale, this could cause:

- larger database result sets
- longer query execution
- larger JSON serialization work
- increased network transfer
- higher application memory usage
- slower client-side processing

The first API-level improvement would therefore be cursor-based pagination.

A stable ordering could use:

```text
created_at DESC, id DESC
```

and the cursor would contain the last `(created_at, id)` pair returned.

Pagination was deliberately not implemented because it was not explicitly required by the assignment.

More detailed scalability reasoning is documented in `DECISIONS.md`.

---

# Testing

The project includes integration tests using Vitest and Supertest.

Run:

```bash
npm test
```

The tests cover the main externally observable API behavior, including:

- successful authentication
- invalid authentication
- missing authentication
- user accessing their own orders
- user attempting to access another user's orders
- admin accessing another user's orders
- existing user with no orders
- nonexistent user
- invalid request parameters
- invalid/tampered authentication tokens
- order ordering

For watch mode:

```bash
npm run test:watch
```

---

# Available Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Compile TypeScript |
| `npm start` | Start compiled application |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run db:generate` | Generate a Drizzle migration |
| `npm run db:migrate` | Apply database migrations |
| `npm run db:seed` | Clear and seed demo data |
| `npm run db:studio` | Open Drizzle Studio |

---

# Reproducibility

The repository contains both database migrations and a seed script.

A fresh setup can therefore be performed with:

```bash
npm install
npm run db:migrate
npm run db:seed
npm test
npm run build
npm run dev
```

The only environment-specific value required is the PostgreSQL connection string.

The application can use either:

1. The provided Neon PostgreSQL database configuration, or
2. Any compatible PostgreSQL database supplied by the evaluator.

---

# Deliberate Scope

This assignment intentionally does not include infrastructure that is not required for the requested endpoint.

Not included:

- Redis
- Docker
- Kubernetes
- Microservices
- Message queues
- Elasticsearch
- Background workers
- Frontend application
- Full authentication platform
- Registration
- Password reset
- Email verification
- Refresh-token flow
- Caching layer
- Pagination
- Generic repository/DI framework

The goal was to keep the solution focused, understandable, testable, and easy to run while still addressing the important engineering concerns of authentication, authorization, database indexing, validation, error handling, and scalability.

The reasoning behind these decisions is documented in `DECISIONS.md`.

---

# Environment and Security

The repository includes `.env.example` to make setup easy.

A real `.env` file should not be committed to source control.

If the provided Neon connection string contains credentials, it should be treated as a secret and should only be shared with the evaluator through an appropriate private channel or through a dedicated evaluation database with appropriately limited access.

The `.gitignore` excludes `.env`.

---

# Final Verification Before Submission

Before submitting, I recommend running the following from a clean checkout:

```bash
npm install
npm run db:migrate
npm run db:seed
npm test
npm run build
```

Then:

```bash
npm run dev
```

and verify:

```bash
curl http://localhost:5000/health
```

Follow the manual API verification steps above.

Also check:

```bash
git status
```

Make sure sensitive or generated files are not committed:

```text
.env
node_modules/
dist/
```

The repository should contain:

```text
src/
tests/
scripts/seed.ts
drizzle/
AGENTS.md
README.md
DECISIONS.md
package.json
package-lock.json
tsconfig.json
vitest.config.ts
drizzle.config.ts
.env.example
.gitignore
```

---

# Submission

The assignment can be submitted as either:

- a Git repository, or
- a ZIP archive

A Git repository is preferred because it makes the project history and structure easier to inspect.

The submission should contain the complete source code, migrations, seed script, tests, `README.md`, and `DECISIONS.md`.

Do not include:

```text
.env
node_modules/
dist/
```

The evaluator should be able to follow this README to configure PostgreSQL, run the migrations and seed script, start the server, and test the requested endpoint.