'use client';

import { io, Socket } from 'socket.io-client';
import { getApiBaseUrl } from './api-client';

let socketInstance: Socket | null = null;

function getSocketUrl() {
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  return (socketUrl || getApiBaseUrl()).replace(/\/$/, '');
}

export function getSocketClient(token?: string | null) {
  if (!socketInstance) {
    socketInstance = io(getSocketUrl(), {
      autoConnect: false,
      transports: ['websocket'],
      withCredentials: true,
    });
  }

  socketInstance.auth = token ? { token } : {};

  if (!socketInstance.connected) {
    socketInstance.connect();
  }

  return socketInstance;
}

export function disconnectSocketClient() {
  if (!socketInstance) {
    return;
  }

  socketInstance.disconnect();
  socketInstance = null;
}
