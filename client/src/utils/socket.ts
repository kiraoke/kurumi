import { accessTokenAtom } from "@/state/store";
import { useAtom } from "jotai";
import { useRef, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export interface User {
  user_id: string;
  email: string;
  username: string;
  pfp: string;
}

interface SocketProps {
  serverUrl: string;
  roomId: string;
  uid?: string;
}

export function useSocket({ serverUrl, roomId, uid }: SocketProps) {
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

      console.log("Connecting to tako server:", accessToken, roomId);

      socketRef.current = socket;
      socket.emit("joinRoom", { roomId, uid });
    }

    socketRef.current?.on("connect", () => {
      console.log("Socket connected");
      setIsConnected(true);
    });

    socketRef.current?.on("disconnect", () => {
      setIsConnected(false);
      console.log("Socket disconnected");
    });

    socketRef.current?.on("userJoined", ({ user }: { user: User }) => {
      console.log("Takodachi joineeeee:", user, usersRef.current);
      if (usersRef.current.has(user.user_id)) return; // Prevent duplicates
      setUsers((prevUsers) => [...prevUsers, user]);
      usersRef.current.add(user.user_id);
    });

    socketRef.current?.on("prevUsers", ({ users }: { users: User[] }) => {
      console.log("Previous takodachis:", users);
      const newUsers = users.filter(
        (user) => !usersRef.current.has(user.user_id)
      );
      setUsers((prevUsers) => [...prevUsers, ...newUsers]);
      newUsers.forEach((user) => usersRef.current.add(user.user_id));
    });

    socketRef.current?.on("userLeft", ({ user_id}: { user_id: string }) => {
      console.log("Takodachi left:", user_id);
      setUsers((prevUsers) =>
        prevUsers.filter((user) => user.user_id !== user_id)
      );
      usersRef.current.delete(user_id);
    });

    const unloadHandler = () => {
      socketRef.current?.emit("leaveRoom", { roomId });
      socketRef.current?.disconnect();
    };

    window.addEventListener("beforeunload", unloadHandler);

    return () => {
      if (socketRef.current) {
        socketRef.current.off("connect");
        socketRef.current.off("disconnect");
        socketRef.current.off("message");
        window.removeEventListener("beforeunload", unloadHandler);
      }
    };
  }, [serverUrl, accessToken]);

  return { socket: socketRef.current, isConnected: isConnected, users };
}
