import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { getSocketClient, disconnectSocketClient } from '../lib/socket-client';
import { useAuth } from '../lib/auth-context';

export function useSocket() {
  const { token, user } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token || !user) return;

    const socket = getSocketClient(token);
    socketRef.current = socket;

    return () => {
      // Disconnecting globally can cause issues if multiple components use this hook.
      // A better pattern for a unified app is to just let it connect/disconnect at the root layout.
      // But for backward compatibility with the existing getSocketClient:
      // We do nothing on unmount here, assuming global singleton handles it, 
      // or we expose a clean up method.
    };
  }, [token, user]);

  return socketRef.current;
}
