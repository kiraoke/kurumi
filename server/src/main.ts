import { Context, Hono } from "@hono/hono";
import { cors } from "@hono/hono/cors";
import authRoute from "./routes/auth.ts";
import { port } from "./utils/constants.ts";

const app: Hono = new Hono();

app.use("*", cors({ origin: "*" }));

app.route("/auth", authRoute);

app.get("/", (c: Context) => {
  return c.text("hi");
});

Deno.serve({ port: port }, app.fetch);
