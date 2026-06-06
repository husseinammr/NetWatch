/**
 * CyberLab — routes/scanRoutes.js
 * ─────────────────────────────────────────────────────────────
 * جميع مسارات الفحص مع RBAC
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

const { Router } = require('express');
const {
  runScan,
  getStats,
  getHosts,
  getNetworks,
  getProfiles,
  getHistory,
} = require('../controllers/scanController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = Router();

// جميع المسارات تتطلب JWT
router.use(protect);

// ── فحص حقيقي بـ Nmap ────────────────────────────────────────
// Body: { target: "192.168.1.0/24", profile: "quick" }
router.post('/run-scan',
  restrictTo('Admin', 'Analyst'),
  runScan
);

// ── إحصائيات الداشبورد ────────────────────────────────────────
router.get('/stats',
  restrictTo('Admin', 'Analyst', 'Viewer'),
  getStats
);

// ── تفاصيل الأجهزة المكتشفة (آخر فحص) ───────────────────────
router.get('/hosts',
  restrictTo('Admin', 'Analyst'),
  getHosts
);

// ── الشبكات المحلية المتاحة على الجهاز ────────────────────────
router.get('/networks',
  restrictTo('Admin', 'Analyst'),
  getNetworks
);

// ── profiles الفحص المتاحة ────────────────────────────────────
router.get('/profiles',
  restrictTo('Admin', 'Analyst', 'Viewer'),
  getProfiles
);

// ── سجل الفحوصات السابقة ─────────────────────────────────────
router.get('/history',
  restrictTo('Admin', 'Analyst', 'Viewer'),
  getHistory
);

module.exports = router;
