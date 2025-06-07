import { Context, Hono } from "@hono/hono";
import authRoute from "./routes/auth.ts";
import { port } from "./utils/constants.ts";
import profileRoute from "./routes/profile.ts";
import uploadRoute from "./routes/upload.ts";
import corsMiddleWare from "./middlewares/corsMiddleware.ts";
import { upgrader } from "./socket/socket.ts";

const app: Hono = new Hono();

app.use("*", corsMiddleWare);

app.route("/auth", authRoute);
app.route("/profile", profileRoute);
app.route("/upload", uploadRoute);

app.get("/", (c: Context) => {
  return c.text("yo takodachi");
});

app.get("/ws", upgrader);

Deno.serve({ port: port }, app.fetch);
