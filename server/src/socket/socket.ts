import { Context, Hono } from "@hono/hono";

const socketRoute = new Hono();

socketRoute.get(
  "/",
  async (c: Context) => {
    const upgrade = c.req.header("upgrade");

    if (upgrade !== "websocket") {
      return c.json({
        error: "WebSocket upgrade required",
      }, 400);
    }

    const { socket, response } = Deno.upgradeWebSocket(c.req.raw);

    socket.onopen = () => {
      console.log("WebSocket connection opened");
    };

    socket.onmessage = (event) => {
      console.log("Message received:", event.data);
      // Echo the message back to the client
      socket.send(`Echo: ${event.data}`);
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return response;
  },
);

export default socketRoute;
