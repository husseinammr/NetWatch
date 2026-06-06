/**
 * CyberLab Backend — server.js
 * ─────────────────────────────────────────────────────────────
 * Entry point: bootstraps Express, HTTP server, Socket.io,
 * global middleware stack, and route mounting.
 *
 * Security layers applied:
 *  • Helmet  — sets secure HTTP response headers
 *  • CORS    — origin whitelist from environment config
 *  • Rate Limiter — brute-force / DoS mitigation on all routes
 *  • Morgan  — structured HTTP request logging
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

const http    = require('http');
const path    = require('path');

// Load env vars FIRST — before any other module reads process.env
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');

const { initSocket }  = require('./sockets/socketManager');
const authRoutes       = require('./routes/authRoutes');
const scanRoutes       = require('./routes/scanRoutes');

// ─── Validate Required Env Vars ───────────────────────────────
const REQUIRED_ENV = ['JWT_SECRET', 'PORT'];
REQUIRED_ENV.forEach((key) => {
  if (!process.env[key]) {
    console.error(`[FATAL] Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

// ─── App & HTTP Server ────────────────────────────────────────
const app    = express();
const server = http.createServer(app); // Wrap in raw HTTP server for Socket.io

// ─── Socket.io Initialization ─────────────────────────────────
// Must happen before routes so the `io` instance is available
const io = initSocket(server);

// Attach `io` to every request so controllers can emit events
app.use((req, _res, next) => {
  req.io = io;
  next();
});

// ─── CORS Configuration ───────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server requests (no origin) in non-production
    if (!origin && process.env.NODE_ENV !== 'production') return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS policy: origin "${origin}" not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Pre-flight for all routes

// ─── Security & Utility Middleware ────────────────────────────
app.use(helmet());                      // Secure HTTP headers
app.use(express.json({ limit: '10kb' })); // Body parser — hard size limit prevents payload bombs
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// HTTP request logger (compact in prod, colorful in dev)
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Global Rate Limiter ──────────────────────────────────────
const limiter = rateLimit({
  windowMs : Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max      : Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders  : false,
  message: {
    status : 429,
    message: 'Too many requests from this IP. Please try again later.',
  },
});
app.use('/api', limiter);

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/v1/auth',  authRoutes);
app.use('/api/v1/scans', scanRoutes);

// ─── Health Check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    status   : 'operational',
    timestamp: new Date().toISOString(),
    service  : 'cyberlab-backend',
  });
});

// ─── 404 Handler ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ status: 'error', message: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const isDev = process.env.NODE_ENV !== 'production';

  // CORS errors surface here
  if (err.message && err.message.startsWith('CORS policy')) {
    return res.status(403).json({ status: 'error', message: err.message });
  }

  console.error('[ERROR]', err);

  res.status(err.statusCode || 500).json({
    status : 'error',
    message: isDev ? err.message : 'An internal server error occurred',
    ...(isDev && { stack: err.stack }),
  });
});

// ─── Start Server ─────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 5000;

server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║        CyberLab Backend — ONLINE         ║
  ╠══════════════════════════════════════════╣
  ║  HTTP  : http://localhost:${PORT}           ║
  ║  Mode  : ${(process.env.NODE_ENV || 'development').padEnd(32)}║
  ╚══════════════════════════════════════════╝
  `);
});

// ─── Graceful Shutdown ────────────────────────────────────────
const shutdown = (signal) => {
  console.log(`[${signal}] Shutting down gracefully...`);
  server.close(() => {
    console.log('[SERVER] HTTP server closed.');
    process.exit(0);
  });
  // Force exit if still hanging after 10 s
  setTimeout(() => process.exit(1), 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

module.exports = { app, server }; // Export for testing
