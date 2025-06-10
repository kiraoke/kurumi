import { Server, Socket } from "https://deno.land/x/socket_io@0.2.1/mod.ts";
import {
  JwtPayloadWithUserId,
  verifyAccessTokenWithoutRefresh,
} from "../utils/jwt.ts";
import { getUserById, User } from "../db/ops.ts";

const io = new Server({
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingInterval: 10000,
  pingTimeout: 30000,
});

const userRoomMap = new Map<string, string>();
const roomUserMap = new Map<string, User[]>();
const roomTrackMap = new Map<
  string,
  {
    track: string;
    duration: number;
    lastTimestamp: number;
    paused: boolean;
    seeked: number;
  }
>();

io.on("connection", async (socket: Socket) => {
  const token = socket.handshake.auth.token as string | undefined;
  if (!token) {
    console.error("No token provided");
    socket.disconnect();
    return;
  }

  console.log("connector", socket.id);

  const verifiedToken: JwtPayloadWithUserId | null =
    await verifyAccessTokenWithoutRefresh(token);

  if (!verifiedToken) {
    console.error("Invalid token");
    socket.disconnect();
    return;
  }

  const user_id: string = verifiedToken.user_id;

  socket.on("joinRoom", async ({ roomId }: { roomId: string }) => {
    if (!roomId) {
      console.log("Room ID is required");
      socket.emit("error", {
        message: "Room ID is required",
      });
      return;
    }

    if (userRoomMap.has(user_id)) {
      console.log(`User ${user_id} already in a room`);
      socket.emit("error", {
        message: "User already in a room",
      });
      return;
    }

    try {
      const user: User = await getUserById(user_id);

      socket.join(roomId);
      socket.broadcast.to(roomId).emit("userJoined", {
        user,
      });

      userRoomMap.set(user_id, roomId);
      const roomSet: User[] | undefined = roomUserMap.get(roomId);
      console.log("roomSet", roomSet);

      if (roomSet?.length) {
        console.log("preview");
        socket.emit("prevUsers", {
          users: Array.from(roomSet),
        });

        const trackData = roomTrackMap.get(roomId);
        const distance = Math.floor(
          (Date.now() - (trackData?.lastTimestamp || 0)) / 1000,
        );

        socket.emit("prevTrack", {
          track: trackData?.track,
          duration: trackData?.duration,
          progress: trackData?.paused
            ? trackData.seeked
            : (trackData?.seeked || 0) + distance,
        });

        let found = false;

        for (let i = 0; i < roomSet.length; i++) {
          if (roomSet[i].user_id === user_id) {
            found = true;
            break;
          }
        }

        if (!found) roomSet.push(user);
      } else {
        console.log("new room");
        roomUserMap.set(roomId, [user]);
      }

      console.log(`Takodachi with id ${user_id} joined room ${roomId}`);
    } catch (error) {
      console.error("Error joining room:", error);
      socket.emit("error", {
        message: "Failed to join room",
      });
    }
  });

  socket.on(
    "pushTrack",
    ({
      roomId,
      track,
      duration,
    }: {
      roomId: string;
      track: string;
      duration: number;
    }) => {
      roomTrackMap.set(roomId, {
        track,
        duration,
        lastTimestamp: Date.now(),
        paused: false,
        seeked: 0,
      });

      socket.broadcast.to(roomId).emit("trackPushed", {
        track,
        duration,
        user_id,
      });
    },
  );

  socket.on(
    "pauseTrack",
    ({
      roomId,
      track,
      timestamp,
      duration,
    }: {
      roomId: string;
      track: string;
      timestamp: number;
      duration: number;
    }) => {
      roomTrackMap.set(roomId, {
        track,
        duration,
        lastTimestamp: Date.now(),
        paused: true,
        seeked: timestamp,
      });

      socket.broadcast.to(roomId).emit("trackPaused", {
        track,
        timestamp,
        duration,
        user_id,
      });
    },
  );

  socket.on(
    "resumeTrack",
    ({
      roomId,
      track,
      timestamp,
      duration,
    }: {
      roomId: string;
      track: string;
      timestamp: number;
      duration: number;
    }) => {
      roomTrackMap.set(roomId, {
        track,
        duration,
        lastTimestamp: Date.now(),
        paused: false,
        seeked: timestamp,
      });

      socket.broadcast.to(roomId).emit("trackResumed", {
        track,
        timestamp,
        duration,
        user_id,
      });
    },
  );

  socket.on("disconnect", () => {
    console.log("Takodachi disconnected:", user_id);
    const roomId: string | undefined = userRoomMap.get(user_id);
    if (roomId) socket.to(roomId).emit("userLeft", { user_id });
    userRoomMap.delete(user_id);
    if (roomId && roomUserMap.get(roomId)?.length) {
      const roomSet = [...(roomUserMap.get(roomId) as User[])];
      roomUserMap.set(
        roomId,
        roomSet.filter((u) => u.user_id !== user_id),
      );
    }
  });

  socket.emit("tako", "egg tako");
  console.log("User connected:", user_id);
});

Deno.serve({
  handler: io.handler(),
  port: 4000,
});
