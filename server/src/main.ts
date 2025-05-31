import { Context, Hono } from "@hono/hono";
import { cors } from "@hono/hono/cors";
import { deleteCookie, getCookie, setCookie } from "@hono/hono/cookie";
import {
  createAccessToken,
  createRefreshToken,
  JwtPayloadWithUserId,
  verifyAccessToken,
  verifyJWT,
  verifyRefreshToken,
} from "./jwt.ts";
import { nanoid } from "@sitnik/nanoid";
import redisClient from "./redis.ts";

const seed = () => nanoid(16);

const port: number = parseInt(Deno.env.get("PORT") || "8000");
const serverUrl: string = Deno.env.get("SERVER_ROOT_URL") ||
  `http://localhost:${port}`;
const clientUrl: string = Deno.env.get("CLIENT_ROOT_URL") ||
  "http://localhost:3000";
const googleClientId: string = Deno.env.get("GOOGLE_CLIENT_ID") || "";
const googleClientSecret: string = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";

const app: Hono = new Hono();

app.use("*", cors({ origin: "*" }));

app.get("/", (c: Context) => {
  return c.text("hi");
});

const redirectUri = `${serverUrl}/auth/google`;

interface GoogleUser {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

function getGoogleAuthUrl() {
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const options = {
    redirect_uri: redirectUri,
    client_id: googleClientId,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ].join(" "),
  };

  return `${rootUrl}?${new URLSearchParams(options).toString()}`;
}

app.get("/auth/google/url", (c: Context) => {
  return c.json({
    url: getGoogleAuthUrl(),
  }, 200);
});

async function getTokens({
  code,
  clientId,
  clientSecret,
  redirectUri,
}: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<{
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  id_token: string;
}> {
  const url = "https://oauth2.googleapis.com/token";
  const values = {
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  };

  try {
    const res: Response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(values).toString(),
    });

    if (!res.ok) {
      throw new Error(`Failed to get tokens: ${res.statusText}`);
    }

    return await res.json();
  } catch (error: unknown) {
    console.error("Error fetching tokens:", error);
    throw new Error(error instanceof Error ? error.message : "Unknown error");
  }
}

app.get("/auth/google", async (c: Context) => {
  const code = c.req.query("code");

  if (!code) {
    return c.json({ error: "Authorization code is required" }, 400);
  }

  const { id_token, access_token } = await getTokens({
    code,
    clientId: googleClientId,
    clientSecret: googleClientSecret,
    redirectUri,
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
    return c.json({ error: "Failed to fetch user data from Google" }, 400);
  }

  const seedValue = seed();

  const refreshToken = await createRefreshToken(data.id, data.email, seedValue);

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
});

app.get("/auth/refresh", async (c: Context) => {
  const refreshToken = getCookie(c, "refreshToken");
  console.log("refresh token:", refreshToken);

  if (!refreshToken) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const validatedToken: JwtPayloadWithUserId | null = await verifyRefreshToken(
    refreshToken,
  );

  if (!validatedToken) {
    deleteCookie(c, "refreshToken");
    return c.json({ error: "Invalid refresh token" }, 401);
  }

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
});

app.get("/auth/logout", async (c: Context) => {
  const refreshToken = getCookie(c, "refreshToken");
  if (refreshToken) {
    const validatedToken: JwtPayloadWithUserId = await verifyJWT(refreshToken);
    await redisClient.sendCommand(["DEl", `refresh_${validatedToken.userId}`]);
  }

  deleteCookie(c, "refreshToken");
  return c.json({ message: "Logged out successfully" }, 200);
});

app.get("/auth/profile", async (c: Context) => {
  const token = c.req.header("Authorization");

  console.log("profile header:", token);

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const accessToken = token.replace("Bearer ", "").trim();

  if (!accessToken) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const refreshToken = getCookie(c, "refreshToken");
  if (!refreshToken) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const refreshPayload: JwtPayloadWithUserId = await verifyJWT(refreshToken);

  const verifiedAccessToken: JwtPayloadWithUserId | null =
    await verifyAccessToken(
      accessToken,
      refreshPayload.seed,
    );

  if (!verifiedAccessToken) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json(
    {
      userId: verifiedAccessToken.userId,
      email: verifiedAccessToken.email,
    },
    200,
  );
});

Deno.serve({ port: port }, app.fetch);
