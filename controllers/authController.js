/**
 * CyberLab — controllers/authController.js
 * ─────────────────────────────────────────────────────────────
 * Handles user registration and login.
 *
 * Production notes:
 *  • In a real system, replace the in-memory `userStore` with
 *    your database layer (Prisma / Mongoose / pg).
 *  • Passwords are NEVER stored or returned in plain text.
 *  • JWT payloads contain only non-sensitive claims.
 *  • Timing-safe comparison via bcrypt prevents timing attacks.
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const { VALID_ROLES } = require('../middleware/authMiddleware');

// ─── In-Memory User Store (Replace with DB in production) ────
// Keyed by email for O(1) lookup.
const userStore = new Map();

// Seed one admin account for development convenience.
// In production, admins are created via a secure onboarding flow.
(async () => {
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
  const hash = await bcrypt.hash('Admin@CyberLab1!', saltRounds);
  userStore.set('admin@cyberlab.io', {
    id           : uuidv4(),
    email        : 'admin@cyberlab.io',
    passwordHash : hash,
    role         : 'Admin',
    createdAt    : new Date().toISOString(),
  });
  console.log('[AUTH] Seed admin account ready (admin@cyberlab.io)');
})();

// ─── JWT Token Factory ────────────────────────────────────────
/**
 * Signs and returns a JWT for the given user.
 * Payload is kept minimal — never embed sensitive data in JWTs.
 *
 * @param {{ id: string, email: string, role: string }} user
 * @returns {string} signed JWT
 */
const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// ─── Controller: Register ─────────────────────────────────────
/**
 * POST /api/v1/auth/register
 *
 * Body: { email, password, role? }
 *
 * Creates a new user account. Role defaults to 'Viewer'.
 * Admins can only be provisioned via the seed or a separate
 * privileged endpoint — clients cannot self-assign 'Admin'.
 */
const register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // ── Input validation ──────────────────────────────────────
    if (!email || !password) {
      return res.status(400).json({
        status : 'error',
        message: 'Email and password are required.',
      });
    }

    // Basic email format check (a full regex is in the validator layer)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ status: 'error', message: 'Invalid email format.' });
    }

    // Password strength: min 8 chars, 1 uppercase, 1 digit, 1 special char
    const pwStrong = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(password);
    if (!pwStrong) {
      return res.status(400).json({
        status : 'error',
        message:
          'Password must be at least 8 characters and include an uppercase letter, ' +
          'a number, and a special character (!@#$%^&*).',
      });
    }

    // ── Duplicate check ───────────────────────────────────────
    const normalizedEmail = email.trim().toLowerCase();
    if (userStore.has(normalizedEmail)) {
      // Generic message — don't reveal that the email exists (user enumeration)
      return res.status(409).json({
        status : 'error',
        message: 'Registration failed. Please try a different email or log in.',
      });
    }

    // ── Role assignment ───────────────────────────────────────
    // Only allow 'Analyst' or 'Viewer' via self-registration.
    // Disallow 'Admin' to prevent privilege escalation.
    const allowedSelfRoles = ['Analyst', 'Viewer'];
    const assignedRole = (role && allowedSelfRoles.includes(role)) ? role : 'Viewer';

    // ── Password hashing ──────────────────────────────────────
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // ── Persist user ──────────────────────────────────────────
    const newUser = {
      id          : uuidv4(),
      email       : normalizedEmail,
      passwordHash,
      role        : assignedRole,
      createdAt   : new Date().toISOString(),
    };
    userStore.set(normalizedEmail, newUser);

    // ── Issue token ───────────────────────────────────────────
    const token = signToken(newUser);

    console.log(`[AUTH] New user registered: ${normalizedEmail} (role=${assignedRole})`);

    res.status(201).json({
      status : 'success',
      message: 'Account created successfully.',
      token,
      user   : {
        id       : newUser.id,
        email    : newUser.email,
        role     : newUser.role,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err) {
    console.error('[AUTH] register error:', err);
    res.status(500).json({ status: 'error', message: 'Registration failed due to a server error.' });
  }
};

// ─── Controller: Login ────────────────────────────────────────
/**
 * POST /api/v1/auth/login
 *
 * Body: { email, password }
 *
 * Validates credentials and returns a signed JWT.
 * Uses a constant-time bcrypt compare to prevent timing attacks.
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ── Input presence check ──────────────────────────────────
    if (!email || !password) {
      return res.status(400).json({
        status : 'error',
        message: 'Email and password are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = userStore.get(normalizedEmail);

    // ── Timing-safe credential validation ─────────────────────
    // Always run bcrypt.compare even on unknown emails to prevent
    // timing-based user enumeration attacks.
    const dummyHash = '$2a$12$invalidhashfortimingprotectiononly000000000000000000000'; // 60-char bcrypt dummy
    const hashToCompare = user ? user.passwordHash : dummyHash;
    const passwordMatch = await bcrypt.compare(password, hashToCompare);

    if (!user || !passwordMatch) {
      return res.status(401).json({
        status : 'error',
        message: 'Invalid email or password.',
      });
    }

    // ── Issue JWT ─────────────────────────────────────────────
    const token = signToken(user);

    console.log(`[AUTH] Successful login: ${normalizedEmail} (role=${user.role})`);

    res.status(200).json({
      status : 'success',
      message: 'Login successful.',
      token,
      user   : {
        id       : user.id,
        email    : user.email,
        role     : user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('[AUTH] login error:', err);
    res.status(500).json({ status: 'error', message: 'Login failed due to a server error.' });
  }
};

// ─── Controller: Get Current User ────────────────────────────
/**
 * GET /api/v1/auth/me
 * Protected route — returns the authenticated user's profile.
 */
const getMe = (req, res) => {
  res.status(200).json({
    status: 'success',
    user  : req.user,
  });
};

module.exports = { register, login, getMe };
