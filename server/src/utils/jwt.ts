import { JWTPayload, jwtVerify, SignJWT } from "@panva/jose";
import redis from "./redis.ts";
import { jwtSecret } from "./constants.ts";

export async function createJWT(
  payload: JWTPayload,
  expiration: string,
): Promise<string> {
  const jwt: string = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiration)
    .sign(jwtSecret);

  return jwt;
}

export async function verifyJWT(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, jwtSecret);

    return payload;
  } catch (error) {
    console.error("JWT verification failed:", error);
    throw new Error("JWT verification failed", { cause: 400 });
  }
}

export async function createAccessToken(
  userId: string,
  email: string,
  seed: string,
): Promise<string> {
  const payload: JWTPayload = { userId, email, seed, type: "access" };
  return await createJWT(payload, "15m");
}

export async function createRefreshToken(
  userId: string,
  email: string,
  seed: string,
): Promise<string> {
  const payload: JWTPayload = { userId, email, type: "refresh", seed };
  const token = await createJWT(payload, "7d");

  if (!redis) throw new Error("Internal server error", { cause: 500 });

  await redis.sendCommand(["SET", `refresh_${userId}`, token]);

  return token;
}

export interface JwtPayloadWithUserId extends JWTPayload {
  userId: string;
  email: string;
  type: "access" | "refresh";
  seed: string;
}

export async function verifyRefreshToken(
  token: string,
): Promise<JwtPayloadWithUserId> {
  const payload: JwtPayloadWithUserId = await verifyJWT(token).catch(() => {
    throw new Error("Invalid refresh token, couldn't verify", { cause: 400 });
  }) as JwtPayloadWithUserId;

  if (!payload) throw new Error("Invalid refresh token", { cause: 400 });
  if (!payload.userId) {
    throw new Error("Invalid refresh token, payload not found", { cause: 400 });
  }
  if (payload.type !== "refresh") {
    throw new Error("Invalid refresh token type", { cause: 400 });
  }

  if (!redis) throw new Error("Internal server error", { cause: 500 });

  const storedToken = await redis.sendCommand([
    "GET",
    `refresh_${payload.userId}`,
  ]);

  if (storedToken !== token) {
    throw new Error("Invalid refresh token, session mismatch", { cause: 400 });
  }

  return payload;
}

export async function verifyAccessToken(
  token: string,
  refreshTokenSeed: string,
): Promise<JwtPayloadWithUserId> {
  const payload: JwtPayloadWithUserId = await verifyJWT(token).catch(() => {
    throw new Error("Invalid access token, couldn't verify");
  }) as JwtPayloadWithUserId;

  if (!payload) throw new Error("Invalid access token");
  if (!payload.userId) {
    throw new Error("Invalid access token, payload not found");
  }
  if (payload.type !== "access") throw new Error("Invalid access token type");
  if (payload.seed !== refreshTokenSeed) {
    throw new Error("Invalid access token, seed mismatch");
  }

  return payload;
}

export async function verifyAccessTokenWithoutRefresh(
  token: string,
): Promise<JwtPayloadWithUserId | null> {
  try {
    const payload: JwtPayloadWithUserId = await verifyJWT(token).catch(() => {
      throw new Error("Invalid access token, couldn't verify");
    }) as JwtPayloadWithUserId;

    if (!payload) throw new Error("Invalid access token");
    if (!payload.userId) {
      throw new Error("Invalid access token, payload not found");
    }
    if (payload.type !== "access") throw new Error("Invalid access token type");

    return payload;
  } catch (_error) {
    return null;
  }
}
