import { prisma } from "../db/prisma.js";
import { env } from "../config/env.js";
import { signToken } from "../middleware/auth.middleware.js";
import type { TelegramUser, GoogleTokenPayload } from "../types/index.js";
import { HTTPException } from "hono/http-exception";

// ─── Telegram Auth ────────────────────────────────────────────────────────────

export async function validateTelegramInitData(initData: string): Promise<TelegramUser> {
  const params = new URLSearchParams(initData);
  const receivedHash = params.get("hash");

  if (!receivedHash) {
    throw new HTTPException(401, { message: "Telegram initData missing hash" });
  }

  const authDate = parseInt(params.get("auth_date") ?? "0", 10);
  const MAX_AGE_SECONDS = 86400; // 24 hours
  if (Date.now() / 1000 - authDate > MAX_AGE_SECONDS) {
    throw new HTTPException(401, { message: "Telegram auth data expired" });
  }

  params.delete("hash");

  const dataCheckEntries = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const encoder = new TextEncoder();

  // Secret key = HMAC-SHA256("WebAppData", BOT_TOKEN)
  const secretKeyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode("WebAppData"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const secretKeyBuffer = await crypto.subtle.sign(
    "HMAC",
    secretKeyMaterial,
    encoder.encode(env.TELEGRAM_BOT_TOKEN)
  );

  // Compute HMAC-SHA256(data_check_string, secret_key)
  const hmacKey = await crypto.subtle.importKey(
    "raw",
    secretKeyBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    hmacKey,
    encoder.encode(dataCheckEntries)
  );

  const computedHash = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (computedHash !== receivedHash) {
    throw new HTTPException(401, { message: "Telegram auth data integrity check failed" });
  }

  const userStr = params.get("user");
  if (!userStr) {
    throw new HTTPException(401, { message: "Telegram user data missing" });
  }

  return JSON.parse(userStr) as TelegramUser;
}

export async function loginWithTelegram(initData: string): Promise<{ token: string; user: object }> {
  const telegramUser = await validateTelegramInitData(initData);

  const user = await prisma.user.upsert({
    where: { telegramId: String(telegramUser.id) },
    update: {
      name: [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(" "),
      avatar: telegramUser.photo_url ?? null,
    },
    create: {
      telegramId: String(telegramUser.id),
      name: [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(" "),
      avatar: telegramUser.photo_url ?? null,
      authProvider: "TELEGRAM",
    },
  });

  const token = await signToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    authProvider: "TELEGRAM",
  });

  return {
    token,
    user: { id: user.id, name: user.name, avatar: user.avatar, telegramId: user.telegramId },
  };
}

// ─── Google Auth ──────────────────────────────────────────────────────────────

async function verifyGoogleIdToken(idToken: string): Promise<GoogleTokenPayload> {
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );

  if (!response.ok) {
    throw new HTTPException(401, { message: "Invalid Google ID token" });
  }

  const payload = (await response.json()) as Record<string, unknown>;

  if (payload["aud"] !== env.GOOGLE_CLIENT_ID) {
    throw new HTTPException(401, { message: "Google token audience mismatch" });
  }

  if (payload["exp"] && Number(payload["exp"]) < Date.now() / 1000) {
    throw new HTTPException(401, { message: "Google token expired" });
  }

  return {
    sub: String(payload["sub"]),
    email: String(payload["email"]),
    name: String(payload["name"]),
    email_verified: payload["email_verified"] === "true" || payload["email_verified"] === true,
    ...(payload["picture"] ? { picture: String(payload["picture"]) } : {}),
  };
}

export async function loginWithGoogle(idToken: string): Promise<{ token: string; user: object }> {
  const googleUser = await verifyGoogleIdToken(idToken);

  if (!googleUser.email_verified) {
    throw new HTTPException(401, { message: "Google email not verified" });
  }

  const user = await prisma.user.upsert({
    where: { email: googleUser.email },
    update: {
      name: googleUser.name,
      avatar: googleUser.picture ?? null,
    },
    create: {
      email: googleUser.email,
      name: googleUser.name,
      avatar: googleUser.picture ?? null,
      authProvider: "GOOGLE",
    },
  });

  const token = await signToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    authProvider: "GOOGLE",
  });

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar },
  };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      telegramId: true,
      avatar: true,
      role: true,
      authProvider: true,
      createdAt: true,
    },
  });
  return user;
}
