/**
 * CyberLab — routes/authRoutes.js
 * ─────────────────────────────────────────────────────────────
 * Authentication endpoints:
 *
 *  POST /api/v1/auth/register  — create a new account
 *  POST /api/v1/auth/login     — authenticate and get JWT
 *  GET  /api/v1/auth/me        — fetch current user profile
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

const { Router } = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = Router();

router.post('/register', register);
router.post('/login',    login);
router.get('/me',        protect, getMe); // Protected — requires valid JWT

module.exports = router;
