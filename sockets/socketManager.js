/**
 * CyberLab — sockets/socketManager.js
 * ─────────────────────────────────────────────────────────────
 * Centralises Socket.io initialisation so the `io` instance
 * is created once and shared across the entire application.
 *
 * Responsibilities:
 *  • Creates the Socket.io server attached to the HTTP server
 *  • Configures CORS to match Express CORS policy
 *  • Registers connection / disconnection lifecycle hooks
 *  • Exports helper `emitScanEvent` used by controllers
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

const { Server } = require('socket.io');

/** Singleton — set once during initSocket() */
let _io = null;

/**
 * Initialise Socket.io and bind it to the HTTP server.
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server}
 */
function initSocket(httpServer) {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());

  _io = new Server(httpServer, {
    cors: {
      origin     : allowedOrigins,
      methods    : ['GET', 'POST'],
      credentials: true,
    },
    // Graceful transport fallback: WebSocket first, then long-polling
    transports: ['websocket', 'polling'],
    // Ping interval / timeout for connection health checks
    pingInterval: 25_000,
    pingTimeout : 20_000,
  });

  _io.on('connection', (socket) => {
    console.log(`[SOCKET] Client connected    ↑ id=${socket.id}`);

    // Allow the client to subscribe to a named "room" (e.g. per-user alerts)
    socket.on('join:room', (room) => {
      if (typeof room === 'string' && room.length <= 64) {
        socket.join(room);
        console.log(`[SOCKET] ${socket.id} joined room "${room}"`);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`[SOCKET] Client disconnected ↓ id=${socket.id} reason=${reason}`);
    });

    // Catch any unhandled errors on this socket
    socket.on('error', (err) => {
      console.error(`[SOCKET] Error on ${socket.id}:`, err.message);
    });
  });

  console.log('[SOCKET] Socket.io initialised');
  return _io;
}

/**
 * Returns the singleton `io` instance.
 * Throws if called before `initSocket()`.
 */
function getIO() {
  if (!_io) throw new Error('Socket.io has not been initialised yet.');
  return _io;
}

/**
 * Broadcast a scan lifecycle event to ALL connected clients.
 *
 * @param {'scan:completed' | 'scan:alert' | 'scan:started'} event
 * @param {object} payload
 */
function emitScanEvent(event, payload) {
  const io = getIO();
  io.emit(event, {
    ...payload,
    timestamp: new Date().toISOString(),
  });
  console.log(`[SOCKET] Emitted "${event}" to all clients`);
}

module.exports = { initSocket, getIO, emitScanEvent };
