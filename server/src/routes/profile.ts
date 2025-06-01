import { Context, Hono } from "@hono/hono";
import authMiddleware from "../middlewares/authMiddleware.ts";
import { getUserById, User } from "../db/ops.ts";

const profileRoute = new Hono();

profileRoute.use("*", authMiddleware);

profileRoute.get("/", async (c: Context) => {
  const userId = c.get("userId") as string;

  const user: User | null = await getUserById(userId);

  if (!user) {
    return c.json({
      error: "User not found",
    }, 404);
  }

  return c.json({
    email: user.email,
    username: user.username,
  }, 200);
});

export default profileRoute;
