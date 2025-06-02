import { Context, Hono } from "@hono/hono";
import { cors } from "@hono/hono/cors";
import authRoute from "./routes/auth.ts";
import { port } from "./utils/constants.ts";
import profileRoute from "./routes/profile.ts";
import uploadRoute from "./routes/upload.ts";

const app: Hono = new Hono();

app.use("*", cors({ origin: "*" }));

app.route("/auth", authRoute);
app.route("/profile", profileRoute);
app.route("/upload", uploadRoute);

app.get("/", (c: Context) => {
  return c.text("hi");
});

Deno.serve({ port: port }, app.fetch);
