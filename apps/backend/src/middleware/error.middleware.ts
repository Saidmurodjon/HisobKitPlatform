import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import type { ApiResponse } from "../types/index.js";
import { env } from "../config/env.js";

export function errorHandler(err: Error, c: Context): Response {
  if (err instanceof HTTPException) {
    const response: ApiResponse = {
      success: false,
      error: err.message,
    };
    return c.json(response, err.status);
  }

  if (err instanceof ZodError) {
    const response: ApiResponse = {
      success: false,
      error: "Validation failed",
      message: err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; "),
    };
    return c.json(response, 422);
  }

  console.error("[UnhandledError]", err);

  const response: ApiResponse = {
    success: false,
    error: "Internal server error",
    ...(env.NODE_ENV === "development" && { message: err.message }),
  };
  return c.json(response, 500);
}

export function notFoundHandler(c: Context): Response {
  return c.json<ApiResponse>({ success: false, error: `Route ${c.req.path} not found` }, 404);
}
