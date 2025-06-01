import { Context, Hono } from "@hono/hono";
import authMiddleware from "../middlewares/authMiddleware.ts";

const profileRoute = new Hono();

profileRoute.use("*", authMiddleware);

profileRoute.get("/", (c: Context) => {
  const email: string = c.get("email");

  return c.json({
    email,
  }, 200);
});

export default profileRoute;
