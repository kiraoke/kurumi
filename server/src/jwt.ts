import { JWTPayload, jwtVerify, SignJWT } from "@panva/jose";
import redisClient from "./redis.ts";

const JWT_SECRET = Deno.env.get("JWT_SECRET") || "default";
const secret = new TextEncoder().encode(JWT_SECRET);

export async function createJWT(
  payload: JWTPayload,
  expiration: string,
): Promise<string> {
  const jwt: string = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiration)
    .sign(secret);

  return jwt;
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);

    return payload;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
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
  redisClient.sendCommand(["SET", `refresh_${userId}`, token]);

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
): Promise<JwtPayloadWithUserId | null> {
  const payload: JwtPayloadWithUserId = await verifyJWT(token);

  if (payload && payload.type === "refresh" && payload.userId) {
    const storedToken = await redisClient.sendCommand([
      "GET",
      `refresh_${payload.userId}`,
    ]);

    if (storedToken === token) return payload;

    return null;
  }

  return null;
}

export async function verifyAccessToken(
  token: string,
  refreshTokenSeed: string,
): Promise<JwtPayloadWithUserId | null> {
  const payload: JwtPayloadWithUserId = await verifyJWT(token);

  if (payload && payload.type === "access" && payload.userId) {
    if (payload.seed === refreshTokenSeed) return payload;

    return null;
  }

  return null;
}
