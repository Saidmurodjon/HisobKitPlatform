import type { User } from "@prisma/client";

export type AuthProvider = "GOOGLE" | "TELEGRAM";

export interface JWTPayload {
  userId: string;
  email: string | null;
  name: string;
  role: "USER" | "ADMIN";
  authProvider: AuthProvider;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  userId: string;
  email: string | null;
  name: string;
  role: "USER" | "ADMIN";
  authProvider: AuthProvider;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
}

export interface GoogleTokenPayload {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  email_verified: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export type UserPublic = Pick<User, "id" | "name" | "avatar" | "email">;
