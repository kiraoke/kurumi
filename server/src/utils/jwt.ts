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
  user_id: string,
  email: string,
  seed: string,
): Promise<string> {
  const payload: JWTPayload = { user_id, email, seed, type: "access" };
  return await createJWT(payload, "15m");
}

export async function createRefreshToken(
  user_id: string,
  email: string,
  seed: string,
): Promise<string> {
  const payload: JWTPayload = { user_id, email, type: "refresh", seed };
  const token = await createJWT(payload, "7d");

  if (!redis) throw new Error("Internal server error", { cause: 500 });

  await redis.sendCommand(["SET", `refresh_${user_id}`, token]);

  return token;
}

export interface JwtPayloadWithUserId extends JWTPayload {
  user_id: string;
  email: string;
  type: "access" | "refresh";
  seed: string;
}

export async function verifyRefreshToken(
  token: string,
): Promise<JwtPayloadWithUserId> {
  const payload: JwtPayloadWithUserId = (await verifyJWT(token).catch(() => {
    throw new Error("Invalid refresh token, couldn't verify", { cause: 400 });
  })) as JwtPayloadWithUserId;

  if (!payload) throw new Error("Invalid refresh token", { cause: 400 });
  if (!payload.user_id) {
    throw new Error("Invalid refresh token, payload not found", { cause: 400 });
  }
  if (payload.type !== "refresh") {
    throw new Error("Invalid refresh token type", { cause: 400 });
  }

  if (!redis) throw new Error("Internal server error", { cause: 500 });

  const storedToken = await redis.sendCommand([
    "GET",
    `refresh_${payload.user_id}`,
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
  const payload: JwtPayloadWithUserId = (await verifyJWT(token).catch(() => {
    throw new Error("Invalid access token, couldn't verify");
  })) as JwtPayloadWithUserId;

  if (!payload) throw new Error("Invalid access token");
  if (!payload.user_id) {
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
    const payload: JwtPayloadWithUserId = (await verifyJWT(token).catch(() => {
      throw new Error("Invalid access token, couldn't verify");
    })) as JwtPayloadWithUserId;

    if (!payload) throw new Error("Invalid access token");
    if (!payload.user_id) {
      throw new Error("Invalid access token, payload not found");
    }
    if (payload.type !== "access") throw new Error("Invalid access token type");

    return payload;
  } catch (_error) {
    return null;
  }
}
