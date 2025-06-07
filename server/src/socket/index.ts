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

io.on("connection", async (socket: Socket) => {
  const token = socket.handshake.auth.token as string | undefined;
  if (!token) {
    console.error("No token provided");
    socket.disconnect();
    return;
  }

  console.log("connector", socket.id);

  const verifiedToken: JwtPayloadWithUserId | null =
    await verifyAccessTokenWithoutRefresh(
      token,
    );

  if (!verifiedToken) {
    console.error("Invalid token");
    socket.disconnect();
    return;
  }

  const userId: string = verifiedToken.userId;

  socket.on(
    "joinRoom",
    async ({ roomId }: { roomId: string }) => {
      if (!roomId) {
        console.log("Room ID is required");
        socket.emit("error", {
          message: "Room ID is required",
        });
        return;
      }

      if (userRoomMap.has(userId)) {
        console.log(`User ${userId} already in a room`);
        socket.emit("error", {
          message: "User already in a room",
        });
        return;
      }

      try {
        const user: User = await getUserById(userId);

        socket.join(roomId);
        socket.broadcast.to(roomId).emit("userJoined", {
          user,
        });

        userRoomMap.set(userId, roomId);
        const roomSet: User[] | undefined = roomUserMap.get(roomId);
        console.log("roomSet", roomSet);

        if (roomSet?.length) {
          console.log("preview");
          socket.emit("prevUsers", {
            users: Array.from(roomSet),
          });

          let found = false;

          for (let i = 0; i < roomSet.length; i++) {
            if (roomSet[i].user_id === userId) {
              found = true;
              break;
            }
          }

          if (!found) roomSet.push(user);
        } else {
          console.log("new room");
          roomUserMap.set(roomId, [user]);
        }

        console.log(`Takodachi with id ${userId} joined room ${roomId}`);
      } catch (error) {
        console.error("Error joining room:", error);
        socket.emit("error", {
          message: "Failed to join room",
        });
      }
    },
  );

  socket.on("disconnect", () => {
    console.log("Takodachi disconnected:", userId);
    const roomId: string | undefined = userRoomMap.get(userId);
    if (roomId) socket.to(roomId).emit("userLeft", { userId });
    userRoomMap.delete(userId);
    if (roomId && roomUserMap.get(roomId)?.length) {
      const roomSet = [...roomUserMap.get(roomId) as User[]];
      roomUserMap.set(roomId, roomSet.filter((u) => u.user_id !== userId));
    }
  });

  socket.emit("tako", "egg tako");
  console.log("User connected:", userId);
});

Deno.serve({
  handler: io.handler(),
  port: 4000,
});
