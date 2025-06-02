import { getCookie } from "@hono/hono/cookie";
import {
  JwtPayloadWithUserId,
  verifyAccessToken,
  verifyJWT,
} from "../utils/jwt.ts";
import { Context, Next } from "@hono/hono";

async function authMiddleware(c: Context, next: Next) {
  try {
    const token = c.req.header("Authorization");

    if (!token) {
      throw new Error("Authorization header is missing", { cause: 401 });
    }

    const accessToken = token.replace("Bearer ", "").trim();

    if (!accessToken) {
      throw new Error("Access token is missing", { cause: 401 });
    }

    const refreshToken = getCookie(c, "refreshToken");
    if (!refreshToken) {
      throw new Error("Refresh token is missing", { cause: 401 });
    }

    const refreshPayload: JwtPayloadWithUserId = await verifyJWT(refreshToken);

    const verifiedAccessToken: JwtPayloadWithUserId | null =
      await verifyAccessToken(
        accessToken,
        refreshPayload.seed,
      );

    if (!verifiedAccessToken) {
      throw new Error("Invalid access token", { cause: 401 });
    }

    c.set("userId", verifiedAccessToken.userId);
    c.set("email", verifiedAccessToken.email);
    await next();
  } catch (error) {
    console.error("Error during authentication:", error);
    return c.json(
      { error: "Authentication failed", message: (error as Error).message },
      (error as Error).cause || 500,
    );
  }
}

export default authMiddleware;
