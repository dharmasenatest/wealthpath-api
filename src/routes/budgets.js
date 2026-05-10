'use strict';

const express = require('express');
const { store } = require('../data/seed');
const { paginate, parsePositiveInt } = require('../utils/paginate');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /budgets?page=<n>&limit=<n>
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const page  = parsePositiveInt(req.query.page,  1);
  const limit = parsePositiveInt(req.query.limit, 20);

  const { data, hasMore } = paginate(store.budgets, page, limit);

  res.json({
    data,
    hasMore,
    page,
    limit,
    count: data.length,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /budgets/:id
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const budget = store.budgets.find(b => b.id === req.params.id);
  if (!budget) {
    return res.status(404).json({
      error:   'Not Found',
      message: `Budget with id '${req.params.id}' was not found.`,
      code:    'BUDGET_NOT_FOUND',
    });
  }
  res.json(budget);
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /budgets/:id
// Body: { limit: number }
// Updates the budget limit. Supports optimistic-update rollback testing.
// Set header X-Force-Fail: true to simulate a failed patch (for rollback tests).
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id', (req, res) => {
  // Rollback simulation: candidate sends X-Force-Fail header
  if (req.headers['x-force-fail'] === 'true') {
    return res.status(500).json({
      error:   'Simulated Failure',
      message: 'Forced server error for rollback testing. Your optimistic update should be reverted.',
      code:    'FORCED_FAILURE',
    });
  }

  const budget = store.budgets.find(b => b.id === req.params.id);
  if (!budget) {
    return res.status(404).json({
      error:   'Not Found',
      message: `Budget with id '${req.params.id}' was not found.`,
      code:    'BUDGET_NOT_FOUND',
    });
  }

  const { limit } = req.body ?? {};

  // Validation
  if (limit === undefined || limit === null) {
    return res.status(422).json({
      error:   'Validation Error',
      message: "'limit' field is required.",
      code:    'VALIDATION_ERROR',
    });
  }
  if (typeof limit !== 'number' || limit < 0) {
    return res.status(422).json({
      error:   'Validation Error',
      message: "'limit' must be a non-negative number.",
      code:    'VALIDATION_ERROR',
    });
  }

  // Mutate in-place
  budget.limit = parseFloat(parseFloat(limit).toFixed(2));

  res.json(budget);
});

module.exports = router;
