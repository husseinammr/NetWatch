/**
 * CyberLab — middleware/authMiddleware.js
 * ─────────────────────────────────────────────────────────────
 * Two middleware functions for route-level access control:
 *
 *  1. `protect`          — Verifies the Bearer JWT in every
 *                          request and attaches the decoded
 *                          payload to req.user.
 *
 *  2. `restrictTo(roles)` — RBAC gate: allows the request to
 *                          proceed only if req.user.role is
 *                          in the supplied roles array.
 *
 * Usage example:
 *   router.post('/run-scan',
 *     protect,
 *     restrictTo('Admin', 'Analyst'),
 *     runScanController
 *   );
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

const jwt = require('jsonwebtoken');

// ─── Allowed roles in the system (single source of truth) ────
const VALID_ROLES = Object.freeze(['Admin', 'Analyst', 'Viewer']);

/**
 * Creates a standardised error response helper.
 * Avoids leaking internal stack traces to clients.
 *
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 */
const sendError = (res, statusCode, message) =>
  res.status(statusCode).json({ status: 'error', message });

// ─────────────────────────────────────────────────────────────
/**
 * `protect` middleware
 *
 * Extracts and verifies the JWT from the `Authorization` header.
 * On success, attaches the decoded payload to `req.user` and
 * calls `next()`. On failure, responds with 401.
 *
 * Expected header format:
 *   Authorization: Bearer <token>
 */
const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 1. Presence check
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'Authentication required. Please provide a valid Bearer token.');
    }

    const token = authHeader.split(' ')[1];

    // 2. Token must not be empty after split
    if (!token) {
      return sendError(res, 401, 'Malformed authorization header.');
    }

    // 3. Verify signature & expiry — jwt.verify throws on failure
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Basic payload sanity check
    if (!decoded.id || !decoded.role) {
      return sendError(res, 401, 'Invalid token payload.');
    }

    // 5. Confirm the embedded role is still a known role
    //    (guards against stale tokens if the role enum changed)
    if (!VALID_ROLES.includes(decoded.role)) {
      return sendError(res, 403, 'Token contains an unrecognised role.');
    }

    // Attach safe user context to the request for downstream use
    req.user = {
      id      : decoded.id,
      email   : decoded.email,
      role    : decoded.role,
      iat     : decoded.iat,
      exp     : decoded.exp,
    };

    next();
  } catch (err) {
    // Distinguish token expiry from other verification errors
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Your session has expired. Please log in again.');
    }
    if (err.name === 'JsonWebTokenError') {
      return sendError(res, 401, 'Invalid token. Authentication failed.');
    }
    // Unexpected errors — log server-side, hide details from client
    console.error('[AUTH] Unexpected error in protect middleware:', err);
    sendError(res, 500, 'An internal authentication error occurred.');
  }
};

// ─────────────────────────────────────────────────────────────
/**
 * `restrictTo(...roles)` middleware factory
 *
 * Returns a middleware that permits access only to users whose
 * `req.user.role` is included in the provided `roles` list.
 *
 * Must be used AFTER `protect` (requires req.user to exist).
 *
 * @param {...string} roles - One or more of 'Admin', 'Analyst', 'Viewer'
 * @returns {import('express').RequestHandler}
 *
 * Example:
 *   restrictTo('Admin', 'Analyst')
 */
const restrictTo = (...roles) => {
  // Validate role names at boot time — catches typos immediately
  roles.forEach((role) => {
    if (!VALID_ROLES.includes(role)) {
      throw new Error(
        `[RBAC] Invalid role "${role}" passed to restrictTo(). ` +
        `Valid roles: ${VALID_ROLES.join(', ')}`
      );
    }
  });

  return (req, res, next) => {
    // Guard: protect() must have run first
    if (!req.user) {
      return sendError(res, 401, 'Authentication required.');
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Access denied. Your role (${req.user.role}) does not have permission ` +
        `to perform this action. Required: ${roles.join(' or ')}.`
      );
    }

    next();
  };
};

module.exports = { protect, restrictTo, VALID_ROLES };
