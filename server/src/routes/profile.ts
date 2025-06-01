import { Context, Hono } from "@hono/hono";
import authMiddleware from "../middlewares/authMiddleware.ts";
import { getUserById, updatePfp, updateUsername, User } from "../db/ops.ts";

const profileRoute = new Hono();

profileRoute.use("*", authMiddleware);

profileRoute.get("/", async (c: Context) => {
  const userId = c.get("userId") as string;

  try {
    const user: User | null = await getUserById(userId);

    if (!user) throw new Error("User not found", { cause: 404 });

    return c.json({
      email: user.email,
      username: user.username,
    }, 200);
  } catch (error) {
    console.error("Error fetching user profile:", (error as Error).message);
    return c.json({
      error: "Failed to fetch user profile",
      message: (error as Error).message,
    }, (error as Error).cause || 500);
  }
});

profileRoute.post("/update/username", async (c: Context) => {
  try {
    const userId = c.get("userId") as string;
    const { username } = await c.req.json();

    if (!username) throw new Error("Username is required", { cause: 400 });

    const user: User | null = await getUserById(userId);

    if (!user) throw new Error("User not found", { cause: 404 });

    const updatedUser: User = await updateUsername({
      userId,
      username,
    });

    return c.json({
      message: "Profile updated successfully",
      user: updatedUser,
    }, 200);
  } catch (error) {
    console.error("Error updating username:", (error as Error).message);
    return c.json({
      error: "Failed to update username",
      message: (error as Error).message,
    }, (error as Error).cause || 500);
  }
});

profileRoute.post("/update/pfp", async (c: Context) => {
  try {
    const userId = c.get("userId") as string;
    const { pfp } = await c.req.json();

    if (!pfp) throw new Error("Username is required", { cause: 400 });

    const user: User | null = await getUserById(userId);

    if (!user) throw new Error("User not found", { cause: 404 });

    const updatedUser: User = await updatePfp({
      userId,
      pfp,
    });

    return c.json({
      message: "Profile updated successfully",
      user: updatedUser,
    }, 200);
  } catch (error) {
    console.error("Error updating username:", (error as Error).message);
    return c.json({
      error: "Failed to update username",
      message: (error as Error).message,
    }, (error as Error).cause || 500);
  }
});

export default profileRoute;
