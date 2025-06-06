import { Server, Socket } from "https://deno.land/x/socket_io@0.2.1/mod.ts";
import {
  JwtPayloadWithUserId,
  verifyAccessTokenWithoutRefresh,
} from "../utils/jwt.ts";

const io = new Server();

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
    ({ roomId }: { roomId: string }) => {
      if (!roomId) {
        socket.emit("error", "Token and roomId are required");
      }

      socket.join(roomId);
      socket.to(roomId).emit("userJoined");
      console.log(`User with id ${userId} joined room ${roomId}`);
    },
  );

  socket.send("egg tako");
  console.log("User connected:", userId);
});

Deno.serve({
  handler: io.handler(),
  port: 4000,
});
