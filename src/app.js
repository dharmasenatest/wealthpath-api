'use strict';

require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const swaggerUi  = require('swagger-ui-express');

const { logger, latencyMiddleware, failureMiddleware, notFound, errorHandler, corsOptions } = require('./middleware');
const spendingRouter = require('./routes/spending');
const budgetsRouter  = require('./routes/budgets');
const adminRouter    = require('./routes/admin');
const openApiSpec    = require('./docs/openapi');

const app  = express();
const PORT = parseInt(process.env.PORT ?? '3000', 10);
const BASE = '/api/v1';

// ── Global middleware ─────────────────────────────────────────────────────────
app.use(cors(corsOptions));
app.use(express.json());
app.use(logger);

// ── Swagger docs (no latency/failure on docs) ─────────────────────────────────
app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    customSiteTitle: 'WealthPath API Docs',
    customCss: '.swagger-ui .topbar { background-color: #1B3A6B; } .swagger-ui .topbar .link { display: none; }',
    swaggerOptions: { persistAuthorization: true, displayRequestDuration: true },
  })
);

// ── JSON spec endpoint ────────────────────────────────────────────────────────
app.get('/openapi.json', (req, res) => res.json(openApiSpec));

// ── Root info ─────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    service:     'WealthPath Assessment API',
    version:     '2.0.0',
    description: 'Backend REST API for the WealthPath Flutter Technical Assessment.',
    docs:        '/docs',
    openapi:     '/openapi.json',
    health:      `${BASE}/health`,
    config:      `${BASE}/config`,
    endpoints: {
      spending: {
        list:   `GET  ${BASE}/spending?page=1&limit=20`,
        create: `POST ${BASE}/spending`,
        get:    `GET  ${BASE}/spending/:id`,
        delete: `DELETE ${BASE}/spending/:id`,
      },
      budgets: {
        list:   `GET  ${BASE}/budgets?page=1&limit=20`,
        get:    `GET  ${BASE}/budgets/:id`,
        update: `PATCH ${BASE}/budgets/:id`,
      },
      admin: {
        health: `GET  ${BASE}/health`,
        config: `GET  ${BASE}/config`,
        reseed: `POST ${BASE}/reseed`,
      },
    },
    simulationHeaders: {
      'X-Force-Fail': 'Set to "true" on PATCH /budgets/:id to simulate a server error for rollback testing.',
    },
  });
});

// ── API routes (with latency + failure simulation) ────────────────────────────
app.use(BASE,               adminRouter);          // /health, /config, /reseed — no sim
app.use(`${BASE}/spending`, latencyMiddleware, failureMiddleware, spendingRouter);
app.use(`${BASE}/budgets`,  latencyMiddleware, failureMiddleware, budgetsRouter);

// ── 404 + error handlers ──────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║       WealthPath Assessment API  v2.0.0              ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  Listening on  http://localhost:${PORT}                  ║`);
  console.log(`║  Docs          http://localhost:${PORT}/docs             ║`);
  console.log(`║  Health        http://localhost:${PORT}/api/v1/health    ║`);
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  DELAY_MS      ${String(process.env.DELAY_MS    ?? '400').padEnd(37)}║`);
  console.log(`║  FAILURE_RATE  ${String(process.env.FAILURE_RATE ?? '0').padEnd(37)}║`);
  console.log(`║  OFFLINE_MODE  ${String(process.env.OFFLINE_MODE ?? 'false').padEnd(37)}║`);
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');
});

module.exports = app;
