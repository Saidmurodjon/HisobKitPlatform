import type { Context, Next } from "hono";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import * as jose from "jose";
import { env } from "../config/env.js";
import type { AuthenticatedUser, JWTPayload } from "../types/index.js";

declare module "hono" {
  interface ContextVariableMap {
    user: AuthenticatedUser;
  }
}

const SECRET = new TextEncoder().encode(env.JWT_SECRET);

export const authMiddleware = createMiddleware(async (c: Context, next: Next) => {
  const authorization = c.req.header("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new HTTPException(401, { message: "Missing or invalid authorization header" });
  }

  const token = authorization.slice(7);

  try {
    const { payload } = await jose.jwtVerify(token, SECRET);
    const typedPayload = payload as unknown as JWTPayload;

    c.set("user", {
      userId: typedPayload.userId,
      email: typedPayload.email,
      name: typedPayload.name,
      role: typedPayload.role,
      authProvider: typedPayload.authProvider,
    });

    await next();
  } catch (err) {
    if (err instanceof jose.errors.JWTExpired) {
      throw new HTTPException(401, { message: "Token expired" });
    }
    throw new HTTPException(401, { message: "Invalid token" });
  }
});

export async function signToken(payload: Omit<JWTPayload, "iat" | "exp">): Promise<string> {
  return new jose.SignJWT(payload as jose.JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(SECRET);
}
