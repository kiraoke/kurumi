import { Context, Hono } from "@hono/hono";
import { serveStatic } from "@hono/hono/deno";
import authRoute from "./routes/auth.ts";
import { port } from "./utils/constants.ts";
import profileRoute from "./routes/profile.ts";
import uploadRoute from "./routes/upload.ts";
import corsMiddleWare from "./middlewares/corsMiddleware.ts";
import musicRoute from "./routes/music.ts";

const app: Hono = new Hono();

app.use("*", corsMiddleWare);
app.use(
  "/static/*",
  serveStatic({
    root: "./public",
    rewriteRequestPath: (path) => path.replace(/^\/static/, ""),
  }),
);

app.route("/auth", authRoute);
app.route("/profile", profileRoute);
app.route("/upload", uploadRoute);
app.route("/music", musicRoute);

app.get("/", (c: Context) => {
  return c.text("yo takodachi");
});

Deno.serve({ port: port }, app.fetch);
