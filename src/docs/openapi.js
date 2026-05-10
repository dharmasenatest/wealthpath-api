'use strict';

const spec = {
  openapi: '3.0.3',
  info: {
    title:       'WealthPath Assessment API',
    description: `
**WealthPath REST API** — used by Flutter candidates during the technical assessment.

### Assessment Sections
| Section | Endpoint group |
|---------|---------------|
| 1 — Clean Architecture & BLoC | \`/spending\` |
| 2 — BLoC Offline-First | \`/budgets\` |

### Simulation Controls
The server supports configurable behaviour via **HTTP headers** (per-request) and server-side environment variables.

| Header | Effect |
|--------|--------|
| \`X-Force-Fail: true\` | Forces a 500 error on \`PATCH /budgets/:id\` — use to test rollback |

Server-side env vars (set by assessor):
| Variable | Default | Description |
|----------|---------|-------------|
| \`DELAY_MS\` | 400 | Base artificial latency in ms |
| \`DELAY_JITTER\` | 200 | Random extra latency added to base |
| \`FAILURE_RATE\` | 0 | 0..1 probability of random server error |
| \`OFFLINE_MODE\` | false | If true, all API routes return 503 |

### Authentication
No authentication required. All endpoints are public.
    `.trim(),
    version: '2.0.0',
    contact: { name: 'WealthPath Engineering', email: 'engineering@wealthpath.dev' },
  },
  servers: [
    { url: '/api/v1', description: 'Base path' },
  ],
  tags: [
    { name: 'Spending',  description: 'Spending records — Section 1' },
    { name: 'Budgets',   description: 'Budget categories — Section 2' },
    { name: 'Admin',     description: 'Health, config & reseed utilities' },
  ],
  paths: {

    // ── /spending ─────────────────────────────────────────────────────────────
    '/spending': {
      get: {
        tags:    ['Spending'],
        summary: 'List spending records (paginated)',
        description: 'Returns a paginated, latest-first list of spending records and the USD total across all records.',
        parameters: [
          { name: 'page',  in: 'query', schema: { type: 'integer', default: 1,  minimum: 1 }, description: '1-indexed page number' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 }, description: 'Records per page' },
        ],
        responses: {
          200: {
            description: 'Paginated spending list',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SpendingListResponse' },
              example: {
                data: [
                  { id: 'sp_001_a1b2c3d4', merchant: 'Supermart', amount: 34.50, currency: 'USD', category: 'Groceries', date: '2024-05-08T09:00:00.000Z' },
                  { id: 'sp_002_e5f6g7h8', merchant: 'The Grill House', amount: 52.00, currency: 'USD', category: 'Dining', date: '2024-05-07T19:30:00.000Z' },
                ],
                total:   1245.50,
                hasMore: true,
                page:    1,
                limit:   20,
                count:   20,
              },
            }},
          },
          503: { $ref: '#/components/responses/ServiceUnavailable' },
        },
      },
      post: {
        tags:    ['Spending'],
        summary: 'Create a spending record',
        description: 'Creates a new spending record. Supports testing of **optimistic updates** — the item should appear in the UI before this call completes.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateSpendingRequest' },
            example: { merchant: 'FreshFields', amount: 47.80, category: 'Groceries', currency: 'USD' },
          }},
        },
        responses: {
          201: {
            description: 'Created spending record',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SpendingRecord' } } },
          },
          422: { $ref: '#/components/responses/ValidationError' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },

    '/spending/{id}': {
      get: {
        tags:    ['Spending'],
        summary: 'Get a single spending record',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Spending record', content: { 'application/json': { schema: { $ref: '#/components/schemas/SpendingRecord' } } } },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags:    ['Spending'],
        summary: 'Delete a spending record (test cleanup)',
        description: 'Removes a record from the in-memory store. Useful for cleaning up after optimistic add tests.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          204: { description: 'Deleted' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ── /budgets ──────────────────────────────────────────────────────────────
    '/budgets': {
      get: {
        tags:    ['Budgets'],
        summary: 'List budget categories (paginated)',
        parameters: [
          { name: 'page',  in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: {
            description: 'Paginated budget list',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/BudgetListResponse' },
              example: {
                data: [
                  { id: 'bud_001', category: 'Groceries',  spent: 312.40, limit: 400.00, currency: 'USD' },
                  { id: 'bud_002', category: 'Dining',     spent: 218.75, limit: 250.00, currency: 'USD' },
                  { id: 'bud_006', category: 'Shopping',   spent: 412.60, limit: 350.00, currency: 'USD' },
                ],
                hasMore: true,
                page: 1, limit: 20, count: 20,
              },
            }},
          },
          503: { $ref: '#/components/responses/ServiceUnavailable' },
        },
      },
    },

    '/budgets/{id}': {
      get: {
        tags:    ['Budgets'],
        summary: 'Get a single budget category',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Budget category', content: { 'application/json': { schema: { $ref: '#/components/schemas/Budget' } } } },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags:    ['Budgets'],
        summary: 'Update budget limit',
        description: `
Updates the spending limit for a budget category.

**Optimistic update rollback testing:**
Send header \`X-Force-Fail: true\` to receive a simulated 500 error.
Your BLoC should roll back the optimistic state change when this happens.
        `.trim(),
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'X-Force-Fail', in: 'header', schema: { type: 'string', enum: ['true', 'false'] }, description: 'Set to "true" to simulate a server failure for rollback testing' },
        ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateBudgetRequest' },
            example: { limit: 450.00 },
          }},
        },
        responses: {
          200: { description: 'Updated budget', content: { 'application/json': { schema: { $ref: '#/components/schemas/Budget' } } } },
          422: { $ref: '#/components/responses/ValidationError' },
          500: { $ref: '#/components/responses/ServerError' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ── Admin ─────────────────────────────────────────────────────────────────
    '/health': {
      get: {
        tags:    ['Admin'],
        summary: 'Health check',
        responses: { 200: { description: 'Service is healthy' } },
      },
    },
    '/config': {
      get: {
        tags:    ['Admin'],
        summary: 'Current simulation configuration',
        description: 'Returns active delay, failure rate, and offline mode settings.',
        responses: { 200: { description: 'Config object' } },
      },
    },
    '/reseed': {
      post: {
        tags:    ['Admin'],
        summary: 'Reseed all data',
        description: 'Resets in-memory spending and budget data to freshly generated values. Use at the start of a new assessment session.',
        responses: { 200: { description: 'Reseed confirmation' } },
      },
    },
  },

  components: {
    schemas: {
      SpendingRecord: {
        type: 'object',
        required: ['id', 'merchant', 'amount', 'currency', 'category', 'date'],
        properties: {
          id:       { type: 'string', example: 'sp_001_a1b2c3d4' },
          merchant: { type: 'string', example: 'Supermart' },
          amount:   { type: 'number', format: 'double', example: 34.50 },
          currency: { type: 'string', example: 'USD' },
          category: { type: 'string', example: 'Groceries' },
          date:     { type: 'string', format: 'date-time', example: '2024-05-08T09:00:00.000Z' },
        },
      },
      CreateSpendingRequest: {
        type: 'object',
        required: ['merchant', 'amount', 'category'],
        properties: {
          merchant: { type: 'string', example: 'FreshFields' },
          amount:   { type: 'number', example: 47.80 },
          category: { type: 'string', example: 'Groceries' },
          currency: { type: 'string', example: 'USD', default: 'USD' },
        },
      },
      SpendingListResponse: {
        type: 'object',
        properties: {
          data:    { type: 'array', items: { $ref: '#/components/schemas/SpendingRecord' } },
          total:   { type: 'number', description: 'Sum of all USD spending records across all pages' },
          hasMore: { type: 'boolean' },
          page:    { type: 'integer' },
          limit:   { type: 'integer' },
          count:   { type: 'integer', description: 'Number of records in this page' },
        },
      },
      Budget: {
        type: 'object',
        required: ['id', 'category', 'spent', 'limit', 'currency'],
        properties: {
          id:       { type: 'string', example: 'bud_001' },
          category: { type: 'string', example: 'Groceries' },
          spent:    { type: 'number', example: 312.40 },
          limit:    { type: 'number', example: 400.00 },
          currency: { type: 'string', example: 'USD' },
        },
      },
      UpdateBudgetRequest: {
        type: 'object',
        required: ['limit'],
        properties: {
          limit: { type: 'number', minimum: 0, example: 450.00 },
        },
      },
      BudgetListResponse: {
        type: 'object',
        properties: {
          data:    { type: 'array', items: { $ref: '#/components/schemas/Budget' } },
          hasMore: { type: 'boolean' },
          page:    { type: 'integer' },
          limit:   { type: 'integer' },
          count:   { type: 'integer' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error:   { type: 'string' },
          message: { type: 'string' },
          code:    { type: 'string' },
          details: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    responses: {
      NotFound: {
        description: 'Resource not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' },
          example: { error: 'Not Found', message: "Resource with the given id was not found.", code: 'NOT_FOUND' },
        }},
      },
      ValidationError: {
        description: 'Validation failed',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' },
          example: { error: 'Validation Error', message: 'One or more fields are invalid.', code: 'VALIDATION_ERROR', details: ['amount is required and must be a positive number.'] },
        }},
      },
      ServerError: {
        description: 'Internal server error or simulated failure',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' },
          example: { error: 'Simulated Failure', message: 'Forced server error for rollback testing.', code: 'FORCED_FAILURE' },
        }},
      },
      ServiceUnavailable: {
        description: '503 — offline simulation mode active',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
    },
  },
};

module.exports = spec;
