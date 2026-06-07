/**
 * CyberLab — hooks/useSocket.js
 * Socket.io hook — يستقبل جميع أحداث الفحص الحقيقي
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const MAX_NOTIFICATIONS = 50;

const resolveType = (event, severity) => {
  if (event === 'scan:started')   return 'info';
  if (event === 'scan:completed') return 'success';
  if (event === 'scan:error')     return 'warning';
  if (severity === 'critical')    return 'critical';
  if (severity === 'high')        return 'warning';
  return 'info';
};

export function useSocket(authToken) {
  const socketRef = useRef(null);
  const [isConnected,   setIsConnected]   = useState(false);
  const [notifications, setNotifications] = useState([]);

  const pushNotification = useCallback((event, data) => {
    const n = {
      id       : `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      event,
      type     : resolveType(event, data.severity),
      severity : data.severity  || null,
      message  : data.message   || data.label || 'حدث فحص جديد',
      scanId   : data.scanId    || null,
      target   : data.target    || null,
      hostsFound: data.hostsFound ?? null,
      findings : data.findings  || null,
      timestamp: data.timestamp || new Date().toISOString(),
      read     : false,
    };

    setNotifications(prev => [n, ...prev].slice(0, MAX_NOTIFICATIONS));

    // Browser notification للتنبيهات الحرجة
    if (
      (event === 'scan:alert' || n.type === 'critical') &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      new Notification(`CyberLab — ${n.severity?.toUpperCase() ?? 'ALERT'}`, {
        body: n.message,
        icon: '/favicon.ico',
      });
    }
  }, []);

  useEffect(() => {
    if (!authToken) return;

    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

    const socket = io(SOCKET_URL, {
      transports          : ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay   : 2000,
      auth                : { token: authToken },
    });

    socketRef.current = socket;

    socket.on('connect',       () => { console.log('[SOCKET] Connected', socket.id); setIsConnected(true); });
    socket.on('disconnect',    ()  => { setIsConnected(false); });
    socket.on('connect_error', ()  => { setIsConnected(false); });

    // أحداث الفحص الحقيقي
    socket.on('scan:started',   (d) => pushNotification('scan:started',   d));
    socket.on('scan:progress',  (d) => pushNotification('scan:progress',  d));
    socket.on('scan:completed', (d) => pushNotification('scan:completed', d));
    socket.on('scan:alert',     (d) => pushNotification('scan:alert',     d));
    socket.on('scan:error',     (d) => pushNotification('scan:error',     d));

    return () => {
      ['scan:started','scan:progress','scan:completed','scan:alert','scan:error',
       'connect','disconnect','connect_error'].forEach(e => socket.off(e));
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [authToken, pushNotification]);

  const clearNotifications = useCallback(() => setNotifications([]), []);

  return { notifications, isConnected, clearNotifications };
}
