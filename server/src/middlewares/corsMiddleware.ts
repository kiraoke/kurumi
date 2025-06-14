import { Context, Next } from "@hono/hono";
import { cors } from "@hono/hono/cors";

function corsMiddleWare(c: Context, next: Next) {
  const path = c.req.path;

  if (path === "/ws") return next();

  return cors({
    origin: "http://localhost:3000",
    credentials: true,
  })(c, next);
}

export default corsMiddleWare;
