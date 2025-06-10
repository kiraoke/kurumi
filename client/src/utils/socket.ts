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
  isHost: boolean;
}

export interface MusicTrack {
  name: string;
  cover: string;
  duration: number;
}

export function useSocket({ serverUrl, roomId, isHost }: SocketProps) {
  const socketRef = useRef<Socket | null>(null);
  const [accessToken] = useAtom(accessTokenAtom);
  const [users, setUsers] = useState<User[]>([]);
  const usersRef = useRef<Set<string>>(new Set<string>());
  const [musicRecord, setMusicRecord] = useState<MusicTrack | null>(null);
  const [seekTime, setSeekTime] = useState<number>(0);
  const [playing, setPlaying] = useState<boolean>(false);

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
      socket.emit("joinRoom", { roomId });
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

    socketRef.current?.on("userLeft", ({ user_id }: { user_id: string }) => {
      console.log("Takodachi left:", user_id);
      setUsers((prevUsers) =>
        prevUsers.filter((user) => user.user_id !== user_id)
      );
      usersRef.current.delete(user_id);
    });

    socketRef.current?.on(
      "trackPushed",
      ({
        track,
        duration,
        user_id,
      }: {
        track: string;
        duration: number;
        user_id: string;
      }) => {
        if (isHost) return;

        setMusicRecord({
          name: track,
          cover: `http://localhost:8000/static/covers/${encodeURIComponent(track)}.png`,
          duration: duration,
        });

        setSeekTime(0);
        setPlaying(true);
      }
    );

    socketRef.current?.on(
      "trackPaused",
      ({
        track,
        duration,
        user_id,
        timestamp,
      }: {
        track: string;
        duration: number;
        user_id: string;
        timestamp: number;
      }) => {
        if (isHost) return;
        setSeekTime(timestamp);
        setPlaying(false);
      }
    );

    socketRef.current?.on(
      "trackResumed",
      ({
        track,
        duration,
        user_id,
        timestamp,
      }: {
        track: string;
        duration: number;
        user_id: string;
        timestamp: number;
      }) => {
        if (isHost) return;
        setSeekTime(timestamp);
        setPlaying(true);
      }
    );

    socketRef.current?.on(
      "prevTrack",
      ({
        track,
        duration,
        progress,
      }: {
        track: string;
        duration: number;
        progress: number;
      }) => {
        setMusicRecord({
          name: track,
          cover: `http://localhost:8000/static/covers/${encodeURIComponent(track)}.png`,
          duration: duration,
        });
        setSeekTime(progress);
        setPlaying(true);
      }
    );

    const unloadHandler = () => {
      socketRef.current?.disconnect();
    };

    window.addEventListener("beforeunload", unloadHandler);

    return () => {
      if (socketRef.current) {
        socketRef.current.off("connect");
        socketRef.current.off("disconnect");
        socketRef.current.off("message");
        socketRef.current.off("userJoined");
        socketRef.current.off("prevUsers");
        socketRef.current.off("userLeft");
        socketRef.current.off("trackPushed");
        socketRef.current.off("trackPaused");
        socketRef.current.off("trackResumed");
        socketRef.current.off("prevTrack");
        window.removeEventListener("beforeunload", unloadHandler);
      }
    };
  }, [serverUrl, accessToken]);

  useEffect(() => {
    if (!playing) return;

    const interval = setInterval(() => {
      setSeekTime((prev) => {
        if (prev === musicRecord?.duration) {
          return musicRecord.duration + 5;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [playing]);

  useEffect(() => {
    if (musicRecord?.duration) {
      if (musicRecord.duration <= seekTime) {
        setPlaying(false);
      }
    }
  }, [seekTime]);

  return {
    socket: socketRef.current,
    isConnected: isConnected,
    users,
    musicRecord,
    setMusicRecord,
    seekTime,
    setSeekTime,
    playing,
    setPlaying,
  };
}
