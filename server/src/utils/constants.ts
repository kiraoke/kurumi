import { nanoid } from "@sitnik/nanoid";

export const port: number = parseInt(Deno.env.get("PORT") || "8000");

export const serverUrl: string = Deno.env.get("SERVER_ROOT_URL") ||
  `http://localhost:${port}`;

export const clientUrl: string = Deno.env.get("CLIENT_ROOT_URL") ||
  "http://localhost:3000";

export const googleClientId: string = Deno.env.get("GOOGLE_CLIENT_ID") || "";

export const googleClientSecret: string =
  Deno.env.get("GOOGLE_CLIENT_SECRET") || "";

export const seed: () => string = () => nanoid(16);

export const JWT_SECRET: string = Deno.env.get("JWT_SECRET") || "default";

export const jwtSecret: Uint8Array<ArrayBufferLike> = new TextEncoder().encode(
  JWT_SECRET,
);

export const redirectUrl = `${serverUrl}/auth/google`;

export const postgresUrl: string = Deno.env.get("POSTGRES_URL") || "";
