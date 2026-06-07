/**
 * CyberLab — app/page.tsx
 * Root route: redirect authenticated users to /dashboard,
 * otherwise to /login.
 */

import { redirect } from 'next/navigation';

export default function RootPage() {
  // Server component — client auth is checked inside /dashboard
  redirect('/dashboard');
}
