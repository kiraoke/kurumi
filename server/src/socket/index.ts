import { Server, Socket } from "https://deno.land/x/socket_io@0.2.1/mod.ts";
import {
  JwtPayloadWithUserId,
  verifyAccessTokenWithoutRefresh,
} from "../utils/jwt.ts";
import { getUserById, User } from "../db/ops.ts";

const io = new Server();

const userRoomMap = new Map<string, string>();

io.on("connection", async (socket: Socket) => {
  const token = socket.handshake.auth.token as string | undefined;
  if (!token) {
    console.error("No token provided");
    socket.disconnect();
    return;
  }

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
        socket.emit("error", {
          message: "Room ID is required",
        });
        return;
      }

      if (userRoomMap.has(userId)) {
        socket.emit("error", {
          message: "User already in a room",
        });
        return;
      }

      try {
        const user: User = await getUserById(userId);

        socket.join(roomId);
        socket.to(roomId).emit("userJoined", {
          user,
        });

        userRoomMap.set(userId, roomId);

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
    const roomId: string | undefined = userRoomMap.get(userId);
    if (roomId) socket.to(roomId).emit("userLeft", { userId });
    userRoomMap.delete(userId);
  });

  socket.emit("tako", "egg tako");
  console.log("User connected:", userId);
});

Deno.serve({
  handler: io.handler(),
  port: 4000,
});
