'use strict';

/**
 * Paginates an array.
 * @param {Array}  arr
 * @param {number} page   – 1-indexed
 * @param {number} limit
 * @returns {{ data: Array, hasMore: boolean, total: number, page: number, limit: number }}
 */
function paginate(arr, page = 1, limit = 20) {
  const p     = Math.max(1, parseInt(page,  10) || 1);
  const l     = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const start = (p - 1) * l;
  const end   = start + l;
  const slice = arr.slice(start, end);

  return {
    data:    slice,
    hasMore: end < arr.length,
    page:    p,
    limit:   l,
    total:   arr.length,
  };
}

/**
 * Parses and validates a positive integer query param.
 */
function parsePositiveInt(val, fallback) {
  const n = parseInt(val, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

module.exports = { paginate, parsePositiveInt };
