import { Context, Hono } from "@hono/hono";
import {
  JwtPayloadWithUserId,
  verifyAccessTokenWithoutRefresh,
} from "../utils/jwt.ts";
import { upgradeWebSocket } from "@hono/hono/deno";
import { WSContext } from "@hono/hono/ws";

const socketRoute = new Hono();

const rooms = new Map<string, Set<WSContext<WebSocket>>>();

function addToRoom(roomId: string, socket: WSContext<WebSocket>) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set<WSContext<WebSocket>>());
  }

  rooms.get(roomId)?.add(socket);
}

function removeFromRoom(roomId: string, socket: WSContext<WebSocket>) {
  const room = rooms.get(roomId);

  if (room) {
    room.delete(socket);

    if (room.size === 0) {
      rooms.delete(roomId);
    }
  }
}

function broadcastToRoom(
  roomId: string,
  message: string,
  sender?: WSContext<WebSocket>,
) {
  const room = rooms.get(roomId);

  if (room) {
    for (const socket of room) {
      if (socket !== sender && socket.readyState === WebSocket.OPEN) {
        socket.send(message);
      }
    }
  }
}

function isInRoom(roomId: string, socket: WSContext<WebSocket>): boolean {
  const room = rooms.get(roomId);
  return room ? room.has(socket) : false;
}

async function handleMessage(
  event: MessageEvent,
  socket: WSContext<WebSocket>,
) {
  console.log("Received message:", event.data);
  const data = JSON.parse(event.data);
  const accessToken: string = event.data.accessToken;
  if (!accessToken) {
    socket.send(JSON.stringify({ error: "Access token is required" }));
  }

  const verifiedToken: JwtPayloadWithUserId | null =
    await verifyAccessTokenWithoutRefresh(accessToken);

  if (!verifiedToken) {
    socket.send(JSON.stringify({ error: "Invalid access token" }));
    return;
  }

  if (data.type === "joinRoom") {
    const roomId = data.roomId;
    if (isInRoom(roomId, socket)) {
      socket.send(JSON.stringify({ error: "Already in room" }));
    } else {
      addToRoom(roomId, socket);
      broadcastToRoom(
        roomId,
        JSON.stringify({ type: "userJoined", roomId }),
        socket,
      );
      console.log(`Takodachi ${verifiedToken.userId} joined room ${roomId}`);
    }
  }
}

export const upgrader = upgradeWebSocket((c: Context) => {
  const urlparams = new URLSearchParams(new URL(c.req.url).search);
  const accessToken = urlparams.get("token");
  console.log("WebSocket upgrade request with token:", accessToken);

  return {
    onOpen: () => {
      console.log("WebSocket connection opened");
    },
    onMessage: async (event, socket: WSContext<WebSocket>) => {
      await handleMessage(event, socket);
    },
  };
});

socketRoute.get("/", async (c: Context) => {
  const upgrade = c.req.header("upgrade");

  if (upgrade !== "websocket") {
    return c.json(
      {
        error: "WebSocket upgrade required",
      },
      400,
    );
  }

  const { socket, response } = Deno.upgradeWebSocket(c.req.raw);
  const url = new URL(c.req.url);
  const accessToken = url.searchParams.get("accessToken");
  console.log("WebSocket connection attempt with token:", accessToken);

  if (!accessToken) {
    return c.json({ error: "Access token is required" }, 400);
  }

  const verifiedToken: JwtPayloadWithUserId | null =
    await verifyAccessTokenWithoutRefresh(accessToken);

  if (!verifiedToken) {
    return c.json({ error: "Invalid access token" }, 401);
  }

  socket.onopen = () => {
    console.log("WebSocket connection opened");
  };

  socket.onclose = () => {
    console.log("WebSocket connection closed");
  };

  return response;
});

export default socketRoute;
