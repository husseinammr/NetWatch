<div align="center">

# 🛡️ NetWatch
### Real-Time Network Security Operations Platform

![Version](https://img.shields.io/badge/version-1.0.0-emerald)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8)
![License](https://img.shields.io/badge/license-MIT-brightgreen)

**منصة أمن سيبراني متكاملة — فحص شبكات حقيقي بـ Nmap، تنبيهات لحظية عبر WebSocket، ولوحة تحكم تفاعلية داكنة**

</div>

---

## 📸 لقطات الشاشة

| الداشبورد الرئيسي | مودال الفحص | مركز الإشعارات |
|:-:|:-:|:-:|
| KPIs + رسوم بيانية | اختيار الشبكة والـ Profile | تنبيهات لحظية |

---

## ✨ المميزات الرئيسية

- 🔍 **فحص شبكات حقيقي** — مدعوم بـ Nmap مع 4 مستويات فحص
- ⚡ **إشعارات لحظية** — WebSocket يبث نتائج الفحص فور اكتمالها
- 🔐 **نظام صلاحيات RBAC** — ثلاثة أدوار: Admin، Analyst، Viewer
- 📊 **داشبورد تفاعلي** — KPIs، رسوم بيانية SVG، جدول الأجهزة المكتشفة
- 🌙 **تصميم داكن احترافي** — ألوان Slate/Emerald/Red
- 🛡️ **أمان متكامل** — JWT، bcrypt، Helmet، Rate Limiting، CORS
- 🖥️ **اكتشاف تلقائي** — يكتشف شبكاتك المحلية تلقائياً

---

## 🏗️ بنية المشروع

```
NetWatch/
├── cyberlab-backend/                  # Node.js + Express + Socket.io
│   ├── server.js                      # نقطة الدخول الرئيسية
│   ├── package.json
│   ├── .env.example                   # Template للـ Environment Variables
│   ├── controllers/
│   │   ├── authController.js          # تسجيل الدخول والتسجيل
│   │   └── scanController.js          # منطق الفحص والإحصائيات
│   ├── middleware/
│   │   └── authMiddleware.js          # JWT Verification + RBAC
│   ├── routes/
│   │   ├── authRoutes.js              # /auth/*
│   │   └── scanRoutes.js              # /scans/*
│   ├── services/
│   │   └── nmapScanner.js             # محرك Nmap الحقيقي
│   ├── sockets/
│   │   └── socketManager.js           # Socket.io Manager
│   └── utils/
│       └── validateTarget.js          # منع Command Injection
│
└── cyberlab-frontend/                 # Next.js 14 + Tailwind + TypeScript
    ├── app/
    │   ├── layout.tsx                 # Root Layout + AuthProvider
    │   ├── globals.css                # Global Styles
    │   ├── page.tsx                   # Root Redirect
    │   ├── login/page.tsx             # Login Page
    │   └── dashboard/page.tsx         # Main Dashboard
    ├── components/dashboard/
    │   ├── Topbar.tsx                 # Navigation Bar
    │   ├── KpiCard.tsx                # KPI Metric Cards
    │   ├── VulnBreakdown.tsx          # Vulnerability Bar Chart
    │   ├── TrendChart.tsx             # 7-Day SVG Chart
    │   ├── ActivityFeed.tsx           # Recent Events Table
    │   ├── HostsTable.tsx             # Discovered Hosts Table
    │   ├── NotificationCenter.tsx     # Real-time Alerts Panel
    │   └── ScanLauncher.tsx           # Scan Modal
    ├── hooks/
    │   └── useSocket.js               # Socket.io Custom Hook
    ├── lib/
    │   ├── api.ts                     # Typed API Client
    │   └── authContext.tsx            # JWT Auth Context
    └── types/
        └── index.ts                   # TypeScript Interfaces
```

---

## 🚀 التشغيل المحلي

### المتطلبات

| الأداة | الإصدار | الرابط |
|--------|---------|--------|
| Node.js | >= 18.0.0 | [nodejs.org](https://nodejs.org) |
| Nmap | >= 7.90 | [nmap.org](https://nmap.org/download.html) |
| Windows | مع Admin | — |

### 1. تثبيت Nmap

```
https://nmap.org/download.html
```

تأكد من تفعيل **Register Nmap Path** و **Npcap** أثناء التثبيت.

---

### 2. إعداد Backend

```bash
cd cyberlab-backend
npm install
cp .env.example .env
```

عدّل ملف `.env`:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_strong_secret_here
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=http://localhost:3000
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

لتوليد JWT_SECRET قوي:
```bash
node -e "require('crypto').randomBytes(64).toString('hex')"
```

شغّل البـ Backend **كـ Administrator**:
```bash
npm run dev
```

> ⚠️ يجب تشغيل CMD كـ Administrator على Windows لأن Nmap يحتاج صلاحيات عالية

---

### 3. إعداد Frontend

```bash
cd cyberlab-frontend
npm install
cp .env.local.example .env.local
```

محتوى `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

شغّل الـ Frontend:
```bash
npm run dev
```

---

### 4. افتح المتصفح

```
http://localhost:3000
```

---

## 🔑 بيانات الدخول التجريبية

| البريد | كلمة المرور | الدور |
|--------|-------------|-------|
| admin@cyberlab.io | Admin@CyberLab1! | Admin |

---

## 📡 API Reference

### Auth Endpoints

| Method | Endpoint | الوصول | الوصف |
|--------|----------|--------|-------|
| POST | `/api/v1/auth/register` | عام | إنشاء حساب جديد |
| POST | `/api/v1/auth/login` | عام | تسجيل الدخول والحصول على JWT |
| GET | `/api/v1/auth/me` | مسجّل | بيانات المستخدم الحالي |

### Scan Endpoints

| Method | Endpoint | الوصول | الوصف |
|--------|----------|--------|-------|
| POST | `/api/v1/scans/run-scan` | Admin, Analyst | تشغيل فحص Nmap حقيقي |
| GET | `/api/v1/scans/stats` | الكل | إحصائيات الداشبورد |
| GET | `/api/v1/scans/hosts` | Admin, Analyst | تفاصيل الأجهزة المكتشفة |
| GET | `/api/v1/scans/networks` | Admin, Analyst | الشبكات المتاحة تلقائياً |
| GET | `/api/v1/scans/profiles` | الكل | أنواع الفحص المتاحة |
| GET | `/api/v1/scans/history` | الكل | سجل الفحوصات السابقة |
| GET | `/health` | عام | فحص حالة السيرفر |

---

## 🔌 Socket.io Events

| الحدث | الاتجاه | الوصف |
|-------|---------|-------|
| `scan:started` | Server → Client | بدأ الفحص |
| `scan:progress` | Server → Client | تقدم الفحص |
| `scan:completed` | Server → Client | اكتمل بدون ثغرات |
| `scan:alert` | Server → Client | اكتُشفت ثغرات |
| `scan:error` | Server → Client | فشل الفحص |

---

## 🔍 أنواع الفحص

| النوع | الوقت | الوصف |
|-------|-------|-------|
| Discovery | 30 ثانية | اكتشاف الأجهزة فقط |
| Quick | دقيقة | أشهر 100 منفذ + الخدمات |
| Standard | دقيقتين | أشهر 1000 منفذ + تفاصيل |
| Vuln | 5 دقائق | فحص ثغرات كامل بـ Nmap Scripts |

---

## 👥 نظام الأدوار RBAC

| الدور | تشغيل فحص | إحصائيات | الأجهزة | السجل |
|-------|-----------|----------|---------|-------|
| Admin | ✅ | ✅ | ✅ | ✅ |
| Analyst | ✅ | ✅ | ✅ | ✅ |
| Viewer | ❌ | ✅ | ❌ | ✅ |

---

## 🔒 ممارسات الأمان المطبّقة

- ✅ JWT مع توقيع HS256 وانتهاء صلاحية
- ✅ تشفير كلمات المرور بـ bcrypt (12 rounds)
- ✅ حماية Timing Attack في تسجيل الدخول
- ✅ RBAC مطبّق على مستوى الـ Backend
- ✅ Helmet.js لـ HTTP Security Headers
- ✅ Rate Limiting (100 طلب / 15 دقيقة)
- ✅ CORS Whitelist من الـ Environment
- ✅ تحقق من الـ Target لمنع Command Injection
- ✅ حد أقصى لحجم الـ Request Body (10kb)
- ✅ جميع الـ Secrets في ملف `.env`

---

## 🛠️ التقنيات المستخدمة

### Backend
| التقنية | الاستخدام |
|---------|----------|
| Node.js + Express | REST API Server |
| Socket.io | WebSocket للإشعارات اللحظية |
| jsonwebtoken | JWT Authentication |
| bcryptjs | تشفير كلمات المرور |
| Nmap | فحص الشبكات الحقيقي |
| Helmet | HTTP Security Headers |
| express-rate-limit | حماية من Brute Force |
| Morgan | HTTP Request Logging |

### Frontend
| التقنية | الاستخدام |
|---------|----------|
| Next.js 14 | React Framework |
| TypeScript | Type Safety |
| Tailwind CSS | UI Styling |
| Socket.io Client | WebSocket Connection |

---

## ⚠️ تحذير قانوني

```
استخدم هذه الأداة فقط على الشبكات التي تملكها
أو لديك إذن صريح وخطي بفحصها.
الفحص غير المصرّح به مخالف للقانون في معظم دول العالم.
```

---

## 📄 الرخصة

MIT License — حر الاستخدام والتعديل مع ذكر المصدر.

---

<div align="center">

صُنع بـ ❤️ لأغراض تعليمية في مجال الأمن السيبراني

**[husseinammr](https://github.com/husseinammr)**

</div>
