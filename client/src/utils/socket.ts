import { accessTokenAtom } from '@/state/store';
import { useAtom } from 'jotai';
import { useRef, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface User {
  userId: string;
  email: string;
  username: string;
  pfp: string;
}

export function useSocket(serverUrl: string, roomId: string) {
  const socketRef = useRef<Socket | null>(null);
  const [accessToken] = useAtom(accessTokenAtom);
  const [users, setUsers] = useState<User[]>([]);
  const usersRef = useRef<Set<string>>(new Set<string>());

  const [isConnected, setIsConnected] = useState(false);
  const loadingRef = useRef<boolean>(true);

  useEffect(() => {
    if (!accessToken) loadingRef.current = true;

    if (accessToken && !socketRef.current) {
      const socket: Socket = io(serverUrl, {
        auth: { token: accessToken },
        reconnection: true,
        reconnectionAttempts: 4,
        reconnectionDelay: 50,
        reconnectionDelayMax: 100,
      });

      console.log('Connecting to tako server:', accessToken, roomId);

      socketRef.current = socket;
      socket.emit("joinRoom", {roomId});
    }


    socketRef.current?.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    socketRef.current?.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    });

    socketRef.current?.on("tako", (message) => {
      console.log('Takodachi message', message)
    });

    socketRef.current?.on('userJoined', ({ user }: { user: User }) => {
      console.log('Takodachi joined:', user);
      if (usersRef.current.has(user.userId)) return; // Prevent duplicates
      setUsers(prevUsers => [...prevUsers, user]);
      usersRef.current.add(user.userId);
    });

    socketRef.current?.on('userLeft', ({ userId }: { userId: string }) => {
      console.log('Takodachi left:', userId);
      setUsers(prevUsers => prevUsers.filter(user => user.userId !== userId));
      usersRef.current.delete(userId);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('message');
      }
    };
  }, [serverUrl, accessToken]);

  return { socket: socketRef.current, isConnected: isConnected , users};
}
