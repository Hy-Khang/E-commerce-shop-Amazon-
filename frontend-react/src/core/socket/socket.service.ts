import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

function getSocketUrl(): string {
  const apiBase = import.meta.env.VITE_API_BASE_URL || '';
  try {
    return new URL(apiBase).origin;
  } catch {
    return window.location.origin;
  }
}

export function connectSocket(): Socket {
  if (socket?.connected) return socket;

  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No access token for socket connection');
  }

  if (socket) {
    socket.disconnect();
  }

  socket = io(getSocketUrl(), {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 30000,
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}

export function reconnectWithNewToken(): void {
  if (!socket) return;
  const token = localStorage.getItem('accessToken');
  if (token) {
    socket.auth = { token };
    socket.disconnect().connect();
  }
}
