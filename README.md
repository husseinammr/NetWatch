<div align="center">

# 🛡️ NetWatch — Frontend
### Security Operations Dashboard

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8)
![License](https://img.shields.io/badge/license-MIT-green)

**واجهة المستخدم لمنصة NetWatch — داشبورد أمني تفاعلي مع إشعارات لحظية**

> 🔗 Backend Repository: [NetWatch-Backend](https://github.com/husseinammr/NetWatch)

</div>

---

## ✨ المميزات

- 📊 **داشبورد تفاعلي** — KPIs، رسوم بيانية، جدول الأجهزة
- ⚡ **إشعارات لحظية** — WebSocket يبث نتائج الفحص فوراً
- 🔐 **نظام صلاحيات** — Admin، Analyst، Viewer
- 🌙 **تصميم داكن** — واجهة احترافية بألوان Slate/Emerald
- 📱 **متجاوب** — يعمل على جميع أحجام الشاشات

---

## 🏗️ بنية المشروع

```
cyberlab-frontend/
├── app/
│   ├── layout.tsx          # Root Layout
│   ├── globals.css         # Global Styles
│   ├── page.tsx            # Root Redirect
│   ├── login/
│   │   └── page.tsx        # Login Page
│   └── dashboard/
│       └── page.tsx        # Main Dashboard
├── components/
│   └── dashboard/
│       ├── Topbar.tsx              # Navigation Bar
│       ├── KpiCard.tsx             # KPI Metric Cards
│       ├── VulnBreakdown.tsx       # Vulnerability Chart
│       ├── TrendChart.tsx          # 7-Day SVG Chart
│       ├── ActivityFeed.tsx        # Recent Events Table
│       ├── HostsTable.tsx          # Discovered Hosts
│       ├── NotificationCenter.tsx  # Real-time Alerts
│       └── ScanLauncher.tsx        # Scan Modal
├── hooks/
│   └── useSocket.js        # Socket.io Hook
├── lib/
│   ├── api.ts              # API Client
│   └── authContext.tsx     # Auth Context
└── types/
    └── index.ts            # TypeScript Types
```

---

## 🚀 التشغيل المحلي

### المتطلبات

- Node.js >= 18.0.0
- NetWatch Backend يعمل على `localhost:5000`

### التثبيت

```bash
npm install
```

### إعداد البيئة

أنشئ ملف `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

### التشغيل

```bash
npm run dev
```

افتح المتصفح على:
```
http://localhost:3000
```

---

## 🔑 بيانات الدخول التجريبية

| البريد | كلمة المرور | الدور |
|--------|-------------|-------|
| admin@cyberlab.io | Admin@CyberLab1! | Admin |

---

## 👥 نظام الأدوار

| الدور | تشغيل فحص | عرض الإحصائيات | عرض الأجهزة |
|-------|-----------|----------------|-------------|
| Admin | ✅ | ✅ | ✅ |
| Analyst | ✅ | ✅ | ✅ |
| Viewer | ❌ | ✅ | ❌ |

---

## 🔌 Socket.io Events

| الحدث | الوصف |
|-------|-------|
| `scan:started` | بدأ الفحص |
| `scan:progress` | تقدم الفحص |
| `scan:completed` | اكتمل بدون ثغرات |
| `scan:alert` | اكتُشفت ثغرات |
| `scan:error` | فشل الفحص |

---

## 🛠️ التقنيات

| التقنية | الاستخدام |
|---------|----------|
| Next.js 14 | React Framework |
| TypeScript | Type Safety |
| Tailwind CSS | التصميم |
| Socket.io Client | WebSocket |

---

## ⚠️ ملاحظة

هذا المشروع لأغراض تعليمية فقط.
استخدم فقط على الشبكات التي تملكها.

---

<div align="center">
صُنع بـ ❤️ — NetWatch Security Platform
</div>
