'use strict';

const morgan  = require('morgan');

// ── Request logger ────────────────────────────────────────────────────────────
const logger = morgan(':method :url :status :response-time ms - :res[content-length]');

// ── Artificial latency ────────────────────────────────────────────────────────
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Simulates configurable network latency.
 * Reads DELAY_MS from env (default 400 ms).
 * Set DELAY_MS=0 to disable.
 */
async function latencyMiddleware(req, res, next) {
  const base    = parseInt(process.env.DELAY_MS  ?? '400', 10);
  const jitter  = parseInt(process.env.DELAY_JITTER ?? '200', 10);
  const ms      = base + Math.floor(Math.random() * jitter);
  if (ms > 0) await delay(ms);
  next();
}

/**
 * Simulates random API failures.
 * FAILURE_RATE = 0..1  (default 0 = never fail)
 * OFFLINE_MODE = true  → always 503
 */
function failureMiddleware(req, res, next) {
  // Offline simulation mode — always fail
  if (process.env.OFFLINE_MODE === 'true') {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'Offline simulation mode is active. The server is intentionally unreachable.',
      code:  'OFFLINE_MODE',
    });
  }

  // Random failure rate
  const rate = parseFloat(process.env.FAILURE_RATE ?? '0');
  if (rate > 0 && Math.random() < rate) {
    const codes = [500, 502, 503, 429];
    const status = codes[Math.floor(Math.random() * codes.length)];
    return res.status(status).json({
      error:   status === 429 ? 'Too Many Requests' : 'Server Error',
      message: 'Simulated random failure. Retry your request.',
      code:    'SIMULATED_FAILURE',
    });
  }

  next();
}

// ── 404 handler ───────────────────────────────────────────────────────────────
function notFound(req, res) {
  res.status(404).json({
    error:   'Not Found',
    message: `Route ${req.method} ${req.path} does not exist.`,
    code:    'ROUTE_NOT_FOUND',
  });
}

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err);
  const status = err.status ?? 500;
  res.status(status).json({
    error:   err.name    ?? 'Internal Server Error',
    message: err.message ?? 'An unexpected error occurred.',
    code:    err.code    ?? 'INTERNAL_ERROR',
  });
}

// ── CORS config ───────────────────────────────────────────────────────────────
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
};

module.exports = { logger, latencyMiddleware, failureMiddleware, notFound, errorHandler, corsOptions };
