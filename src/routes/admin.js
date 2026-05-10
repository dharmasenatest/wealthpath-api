'use strict';

const express   = require('express');
const { store, reseed } = require('../data/seed');

const router = express.Router();

// ── GET /health ───────────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({
    status:     'ok',
    service:    'WealthPath Assessment API',
    version:    '2.0.0',
    timestamp:  new Date().toISOString(),
    records: {
      spending: store.spending.length,
      budgets:  store.budgets.length,
    },
  });
});

// ── GET /config ───────────────────────────────────────────────────────────────
// Returns current simulation config so candidates can inspect active settings.
router.get('/config', (req, res) => {
  res.json({
    delayMs:     parseInt(process.env.DELAY_MS      ?? '400', 10),
    delayJitter: parseInt(process.env.DELAY_JITTER  ?? '200', 10),
    failureRate: parseFloat(process.env.FAILURE_RATE ?? '0'),
    offlineMode: process.env.OFFLINE_MODE === 'true',
    note: 'These values are controlled by server environment variables. Candidates cannot change them.',
  });
});

// ── POST /reseed ──────────────────────────────────────────────────────────────
// Resets all in-memory data to a fresh generated dataset.
// Useful at the start of a new assessment session.
router.post('/reseed', (req, res) => {
  reseed();
  res.json({
    message:  'Data reseeded successfully.',
    spending: store.spending.length,
    budgets:  store.budgets.length,
  });
});

module.exports = router;
