# Luminous Orders API

A minimal Express API demonstrating user-order history with JWT authentication and role-based authorization.

## Prerequisites

- Node.js 24 LTS
- A PostgreSQL database (e.g., [Neon](https://neon.tech))

## Installation

```bash
npm install
```

## Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with your values:

```
NODE_ENV=development
PORT=5000
DATABASE_URL="postgresql://user:password@host:5432/dbname"
JWT_SECRET="replace-with-a-long-random-secret-at-least-32-chars"
JWT_EXPIRES_IN="1h"
CORS_ORIGIN="*"
```

## Database

### Generate and run migrations

```bash
npm run db:generate
npm run db:migrate
```

### Seed demo data

```bash
npm run db:seed
```

## Development

```bash
npm run dev
```

Server starts on `http://localhost:5000`.

## Build & Start

```bash
npm run build
npm start
```

## Tests

```bash
npm test
```

## Demo Credentials

| Email               | Password     | Role | ID | Orders |
|---------------------|-------------|------|-----|--------|
| admin@example.com   | password123 | ADMIN | —   | —      |
| alice@example.com   | password123 | USER  | 1*  | 5      |
| bob@example.com     | password123 | USER  | 2*  | 3      |
| charlie@example.com | password123 | USER  | —   | 0      |

\* IDs depend on seed order; run `db:seed` and check the output.

## API Examples

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@example.com", "password": "password123"}'
```

Response:

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { "id": 1, "email": "alice@example.com", "role": "USER" }
  }
}
```

### Get User Orders (as the user themselves)

```bash
TOKEN="eyJhbGciOiJIUzI1NiIs..."  # from login response

curl http://localhost:5000/api/users/1/orders \
  -H "Authorization: Bearer $TOKEN"
```

### Get User Orders (as admin)

```bash
ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIs..."  # login as admin@example.com

curl http://localhost:5000/api/users/1/orders \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Authorization Behavior

| Scenario                              | Result |
|---------------------------------------|--------|
| Normal user → own orders              | 200    |
| Normal user → another user's orders   | 403    |
| Admin → any user's orders             | 200    |
| User with no orders                   | 200 [] |
| Nonexistent user                      | 404    |
| Invalid/missing JWT                   | 401    |
| Invalid credentials                   | 401    |
