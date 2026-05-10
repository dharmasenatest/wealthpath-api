'use strict';

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { store }      = require('../data/seed');
const { paginate, parsePositiveInt } = require('../utils/paginate');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /spending?page=<n>&limit=<n>
// Returns a paginated list of spending records, sorted latest-first.
// Also returns the running total of ALL records (not just this page).
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const page  = parsePositiveInt(req.query.page,  1);
  const limit = parsePositiveInt(req.query.limit, 20);

  // Always sorted latest-first (seed data already sorted, but guard insertions)
  const sorted = [...store.spending].sort((a, b) => new Date(b.date) - new Date(a.date));

  const { data, hasMore } = paginate(sorted, page, limit);

  // Aggregate total across ALL records (USD-only for simplicity)
  const total = parseFloat(
    store.spending
      .filter(r => r.currency === 'USD')
      .reduce((sum, r) => sum + r.amount, 0)
      .toFixed(2)
  );

  res.json({
    data,
    total,
    hasMore,
    page,
    limit,
    count: data.length,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /spending
// Body: { merchant: string, amount: number, category: string, currency?: string }
// Creates and persists a new spending record; returns the created object.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const { merchant, amount, category, currency } = req.body ?? {};

  // Validation
  const errors = [];
  if (!merchant || typeof merchant !== 'string' || merchant.trim() === '') {
    errors.push('merchant is required and must be a non-empty string.');
  }
  if (amount === undefined || amount === null || typeof amount !== 'number' || amount <= 0) {
    errors.push('amount is required and must be a positive number.');
  }
  if (!category || typeof category !== 'string' || category.trim() === '') {
    errors.push('category is required and must be a non-empty string.');
  }

  if (errors.length > 0) {
    return res.status(422).json({
      error:   'Validation Error',
      message: 'One or more fields are invalid.',
      details: errors,
      code:    'VALIDATION_ERROR',
    });
  }

  const record = {
    id:       `sp_new_${uuidv4().slice(0, 8)}`,
    merchant: merchant.trim(),
    amount:   parseFloat(parseFloat(amount).toFixed(2)),
    currency: (currency ?? 'USD').toUpperCase(),
    category: category.trim(),
    date:     new Date().toISOString(),
  };

  // Prepend (latest first)
  store.spending.unshift(record);

  res.status(201).json(record);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /spending/:id  — fetch a single record (bonus helper)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const record = store.spending.find(r => r.id === req.params.id);
  if (!record) {
    return res.status(404).json({
      error:   'Not Found',
      message: `SpendingRecord with id '${req.params.id}' was not found.`,
      code:    'SPENDING_NOT_FOUND',
    });
  }
  res.json(record);
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /spending/:id  — helper for rollback/cleanup during testing
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const idx = store.spending.findIndex(r => r.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({
      error:   'Not Found',
      message: `SpendingRecord with id '${req.params.id}' was not found.`,
      code:    'SPENDING_NOT_FOUND',
    });
  }
  store.spending.splice(idx, 1);
  res.status(204).send();
});

module.exports = router;
