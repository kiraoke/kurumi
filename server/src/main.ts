import { Context, Hono } from "@hono/hono";
import authRoute from "./routes/auth.ts";
import { port } from "./utils/constants.ts";
import profileRoute from "./routes/profile.ts";
import uploadRoute from "./routes/upload.ts";
import { upgradeWebSocket } from "@hono/hono/deno";
import corsMiddleWare from "./middlewares/corsMiddleware.ts";

const app: Hono = new Hono();

app.use("*", corsMiddleWare);

app.route("/auth", authRoute);
app.route("/profile", profileRoute);
app.route("/upload", uploadRoute);

app.get("/", (c: Context) => {
  return c.text("yo takodachi");
});

app.get(
  "/ws",
  upgradeWebSocket((c) => {
    return {
      onOpen: () => console.log("Connected"),
      onMessage: (event, ws) => {
        console.log("Message received:", event.data);
        ws.send(`Echo: ${event.data}`);
      },
      onClose: () => console.log("Disconnected"),
    };
  }),
);

Deno.serve({ port: port }, app.fetch);
