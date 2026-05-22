import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ZodSchema } from "zod";

export function validateBody<T>(schema: ZodSchema<T>) {
  return async (c: Context, next: Next) => {
    const body = await c.req.json().catch(() => {
      throw new HTTPException(400, { message: "Invalid JSON body" });
    });

    const result = schema.safeParse(body);
    if (!result.success) {
      throw new HTTPException(422, {
        message: result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; "),
      });
    }

    c.set("validatedBody" as never, result.data);
    await next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return async (c: Context, next: Next) => {
    const query = c.req.query();
    const result = schema.safeParse(query);
    if (!result.success) {
      throw new HTTPException(422, {
        message: result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; "),
      });
    }
    c.set("validatedQuery" as never, result.data);
    await next();
  };
}
