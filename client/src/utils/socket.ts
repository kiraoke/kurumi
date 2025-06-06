import { accessTokenAtom } from '@/state/store';
import { useAtom } from 'jotai';
import { useRef, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket(serverUrl: string) {
  const socketRef = useRef<Socket | null>(null);
  const [accessToken] = useAtom(accessTokenAtom);

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (accessToken && !socketRef.current) {
      const socket: Socket = io(serverUrl, {
        auth: { token: accessToken },
      });

      socketRef.current = socket;
    }

    socketRef.current?.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    socketRef.current?.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    });

    socketRef.current?.on('message', (message) => {
      console.log('Takodachi message', message)
    });

    socketRef.current?.emit("joinRoom", {
      roomId: "kuru",
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [serverUrl, accessToken]);

  return { socket: socketRef.current, isConnected: isConnected };
}
