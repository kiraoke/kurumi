import { Context, Hono } from "@hono/hono";
import authMiddleware from "../middlewares/authMiddleware.ts";
import { getUserById, updatePfp, updateUsername, User } from "../db/ops.ts";

const profileRoute = new Hono();

profileRoute.use("*", authMiddleware);

profileRoute.get("/user_id", (c: Context) => {
  const user_id = c.get("user_id") as string;

  return c.json(
    {
      user_id,
    },
    200,
  );
});

profileRoute.get("/", async (c: Context) => {
  const user_id = c.get("user_id") as string;

  try {
    const user: User | null = await getUserById(user_id);

    if (!user) throw new Error("User not found", { cause: 404 });

    return c.json(
      {
        email: user.email,
        username: user.username,
        user_id: user.user_id,
        pfp: user.pfp,
      },
      200,
    );
  } catch (error) {
    console.error("Error fetching user profile:", (error as Error).message);
    return c.json(
      {
        error: "Failed to fetch user profile",
        message: (error as Error).message,
      },
      (error as Error).cause || 500,
    );
  }
});

profileRoute.post("/update/username", async (c: Context) => {
  try {
    const user_id = c.get("user_id") as string;
    const { username } = await c.req.json();

    if (!username) throw new Error("Username is required", { cause: 400 });

    const user: User | null = await getUserById(user_id);

    if (!user) throw new Error("User not found", { cause: 404 });

    const updatedUser: User = await updateUsername({
      user_id,
      username,
    });

    return c.json(
      {
        message: "Profile updated successfully",
        user: updatedUser,
      },
      200,
    );
  } catch (error) {
    console.error("Error updating username:", (error as Error).message);
    return c.json(
      {
        error: "Failed to update username",
        message: (error as Error).message,
      },
      (error as Error).cause || 500,
    );
  }
});

profileRoute.post("/update/pfp", async (c: Context) => {
  try {
    const user_id = c.get("user_id") as string;
    const { pfp } = await c.req.json();

    if (!pfp) throw new Error("Username is required", { cause: 400 });

    const user: User | null = await getUserById(user_id);

    if (!user) throw new Error("User not found", { cause: 404 });

    const updatedUser: User = await updatePfp({
      user_id,
      pfp,
    });

    return c.json(
      {
        message: "Profile updated successfully",
        user: updatedUser,
      },
      200,
    );
  } catch (error) {
    console.error("Error updating username:", (error as Error).message);
    return c.json(
      {
        error: "Failed to update username",
        message: (error as Error).message,
      },
      (error as Error).cause || 500,
    );
  }
});

export default profileRoute;
