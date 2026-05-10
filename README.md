# WealthPath Assessment API

A lightweight REST API backend for the **WealthPath Flutter Technical Assessment**. Built with Node.js + Express. No database required — data lives in memory and is seeded fresh on each server start.

---

## Quick Start (local)

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Start the server
npm start
```

Server runs on **http://localhost:3000**  
Interactive docs at **http://localhost:3000/docs**

---

## Base URL

| Environment | Base URL |
|-------------|----------|
| Local       | `http://localhost:3000/api/v1` |
| Hosted      | See `HOSTED_URL.txt` provided by your recruiter |

All candidate endpoints are prefixed with `/api/v1`.

---

## Endpoints at a glance

### Section 1 — Spending Feature

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/api/v1/spending` | List spending records (paginated) |
| `POST` | `/api/v1/spending` | Create a new spending record |
| `GET`  | `/api/v1/spending/:id` | Fetch a single record |
| `DELETE` | `/api/v1/spending/:id` | Delete a record (test cleanup) |

### Section 2 — Budget Feature

| Method | Path | Description |
|--------|------|-------------|
| `GET`   | `/api/v1/budgets`     | List budget categories (paginated) |
| `GET`   | `/api/v1/budgets/:id` | Fetch a single budget |
| `PATCH` | `/api/v1/budgets/:id` | Update budget limit |

### Admin / Utilities

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/api/v1/health` | Health check |
| `GET`  | `/api/v1/config` | Active simulation settings |
| `POST` | `/api/v1/reseed` | Reset all data to fresh generated values |

---

## Request & Response Examples

### GET `/api/v1/spending?page=1&limit=20`

```json
{
  "data": [
    {
      "id":       "sp_001_a1b2c3d4",
      "merchant": "Supermart",
      "amount":   34.50,
      "currency": "USD",
      "category": "Groceries",
      "date":     "2024-05-08T09:00:00.000Z"
    }
  ],
  "total":   1245.50,
  "hasMore": true,
  "page":    1,
  "limit":   20,
  "count":   20
}
```

### POST `/api/v1/spending`

**Request body:**
```json
{
  "merchant": "FreshFields",
  "amount":   47.80,
  "category": "Groceries",
  "currency": "USD"
}
```

**Response (201 Created):**
```json
{
  "id":       "sp_new_f4a3b2c1",
  "merchant": "FreshFields",
  "amount":   47.80,
  "currency": "USD",
  "category": "Groceries",
  "date":     "2024-05-08T12:34:56.789Z"
}
```

### GET `/api/v1/budgets?page=1&limit=20`

```json
{
  "data": [
    {
      "id":       "bud_001",
      "category": "Groceries",
      "spent":    312.40,
      "limit":    400.00,
      "currency": "USD"
    },
    {
      "id":       "bud_006",
      "category": "Shopping",
      "spent":    412.60,
      "limit":    350.00,
      "currency": "USD"
    }
  ],
  "hasMore": true,
  "page":    1,
  "limit":   20,
  "count":   20
}
```

### PATCH `/api/v1/budgets/bud_001`

**Request body:**
```json
{ "limit": 450.00 }
```

**Response (200 OK):**
```json
{
  "id":       "bud_001",
  "category": "Groceries",
  "spent":    312.40,
  "limit":    450.00,
  "currency": "USD"
}
```

---

## Error Responses

All errors follow this structure:

```json
{
  "error":   "Validation Error",
  "message": "One or more fields are invalid.",
  "code":    "VALIDATION_ERROR",
  "details": ["amount is required and must be a positive number."]
}
```

| HTTP status | Code | When |
|-------------|------|------|
| 404 | `NOT_FOUND` | Resource doesn't exist |
| 422 | `VALIDATION_ERROR` | Invalid request body |
| 500 | `SIMULATED_FAILURE` | Random failure or `X-Force-Fail: true` |
| 503 | `OFFLINE_MODE` | Server is in offline simulation mode |

---

## Simulation Features

### Artificial Latency
Every `/spending` and `/budgets` request waits for `DELAY_MS ± DELAY_JITTER` ms before responding. Default: 400–600 ms. This is intentional — use it to test loading states and skeleton UIs.

### Random Failure Rate
Set `FAILURE_RATE=0.1` in `.env` to make ~10% of requests return a random 5xx error. Use this to stress-test your error handling and retry logic.

### Offline Simulation Mode
Set `OFFLINE_MODE=true` to make all API routes return **503 Service Unavailable**. Your offline-first implementation should serve cached data seamlessly when this is active.

### Rollback Testing (PATCH only)
Send header `X-Force-Fail: true` with any `PATCH /budgets/:id` request to receive a **500 error**. Your optimistic update should be rolled back when this happens.

```bash
curl -X PATCH http://localhost:3000/api/v1/budgets/bud_001 \
  -H "Content-Type: application/json" \
  -H "X-Force-Fail: true" \
  -d '{"limit": 999}'
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `DELAY_MS` | `400` | Base artificial latency (ms) |
| `DELAY_JITTER` | `200` | Random extra latency added to base |
| `FAILURE_RATE` | `0` | 0.0–1.0 random failure probability |
| `OFFLINE_MODE` | `false` | If `true`, all routes return 503 |

---

## Sample Data

### Known Spending IDs (first page)
IDs are generated on server start — use `GET /api/v1/spending` to discover them. The first record is always the most recent.

### Known Budget IDs (stable)
| ID | Category | Spent | Limit | Status |
|----|----------|-------|-------|--------|
| `bud_001` | Groceries | $312.40 | $400.00 | Under |
| `bud_002` | Dining | $218.75 | $250.00 | Near limit |
| `bud_006` | Shopping | $412.60 | $350.00 | **Over** |
| `bud_012` | Coffee | $72.30 | $60.00 | **Over** |
| `bud_016` | Insurance | $180.00 | $180.00 | At limit |
| `bud_023` | Food Delivery | $155.80 | $120.00 | **Over** |

---

## Deployment

### Render (recommended)
1. Push this repo to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `npm start`
5. Add environment variables in the Render dashboard
6. Deploy — Render provides a stable `*.onrender.com` URL

### Railway
```bash
railway init
railway up
```

### Fly.io
```bash
fly launch
fly deploy
```

### Local with ngrok (instant public URL)
```bash
npm start
# In another terminal:
ngrok http 3000
```

---

## API Documentation
Interactive Swagger UI: `GET /docs`  
OpenAPI JSON spec:     `GET /openapi.json`

---

## Data Reset
If data gets polluted during testing, hit `POST /api/v1/reseed` to restore fresh generated records without restarting the server.
