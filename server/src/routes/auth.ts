import { Context, Hono } from "@hono/hono";
import { getGoogleAuthUrl, getTokens, GoogleUser } from "../utils/google.ts";
import {
  clientUrl,
  googleClientId,
  googleClientSecret,
  redirectUrl,
  seed,
} from "../utils/constants.ts";
import {
  createAccessToken,
  createRefreshToken,
  JwtPayloadWithUserId,
  verifyJWT,
  verifyRefreshToken,
} from "../utils/jwt.ts";
import { deleteCookie, getCookie, setCookie } from "@hono/hono/cookie";
import redis from "../utils/redis.ts";
import { createUser } from "../db/ops.ts";
import username from "../utils/names.ts";

const authRoute = new Hono();

authRoute.get("/google/url", (c: Context) => {
  return c.json({
    url: getGoogleAuthUrl(),
  }, 200);
});

authRoute.get("/google", async (c: Context) => {
  const code = c.req.query("code");

  try {
    if (!code) throw new Error("Authorization code is missing", { cause: 400 });

    const { id_token, access_token } = await getTokens({
      code,
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      redirectUrl,
    });

    const googleUser = await fetch(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
      {
        headers: {
          Authorization: `Bearer ${id_token}`,
        },
      },
    );

    const data: GoogleUser = await googleUser.json();
    if (!data || !data.id) {
      throw new Error("Failed to fetch user data from Google", { cause: 500 });
    }

    await createUser({
      email: data.email,
      username: username(),
      pfp: data.picture || `${clientUrl}/pfp.png`,
      userId: data.id,
    });

    const seedValue = seed();

    const refreshToken = await createRefreshToken(
      data.id,
      data.email,
      seedValue,
    );

    setCookie(c, "refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    const accessToken = await createAccessToken(data.id, data.email, seedValue);

    return c.redirect(
      `${clientUrl}/auth/success?accessToken=${accessToken}`,
      302,
    );
  } catch (error) {
    console.error("Error during Google authentication:", error);
    return c.json({
      error: "Failed to authenticate with Google",
      message: (error as Error).message,
    }, (error as Error).cause || 500);
  }
});

authRoute.get("/refresh", async (c: Context) => {
  try {
    const refreshToken = getCookie(c, "refreshToken");

    if (!refreshToken) {
      throw new Error("Refresh token is missing", {
        cause: 401,
      });
    }

    const validatedToken: JwtPayloadWithUserId = await verifyRefreshToken(
      refreshToken,
    );

    deleteCookie(c, "refreshToken");
    const seedValue = seed();
    const refreshTokenNew: string = await createRefreshToken(
      validatedToken.userId,
      validatedToken.email,
      seedValue,
    );

    setCookie(c, "refreshToken", refreshTokenNew, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    const accessToken: string = await createAccessToken(
      validatedToken.userId,
      validatedToken.email,
      seedValue,
    );

    return c.json(
      { message: "Refresh token is valid", accessToken: accessToken },
      200,
    );
  } catch (error) {
    console.error("Error during token refresh:", error);
    deleteCookie(c, "refreshToken");
    return c.json(
      { error: "Failed to refresh token", message: (error as Error).message },
      (error as Error).cause || 500,
    );
  }
});

authRoute.get("/logout", async (c: Context) => {
  try {
    const refreshToken = getCookie(c, "refreshToken");
    if (refreshToken) {
      const validatedToken: JwtPayloadWithUserId = await verifyJWT(
        refreshToken,
      );
      if (!redis) throw new Error("Internal server error", { cause: 500 });
      await redis.sendCommand(["DEl", `refresh_${validatedToken.userId}`]);
    }

    deleteCookie(c, "refreshToken");
    return c.json({ message: "Logged out successfully" }, 200);
  } catch (error) {
    console.error("Error during logout:", error);
    return c.json(
      { error: "Failed to log out", message: (error as Error).message },
      (error as Error).cause || 500,
    );
  }
});

export default authRoute;
