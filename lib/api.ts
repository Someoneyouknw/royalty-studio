import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "@/lib/auth";

/** Standard success envelope. */
export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, { status: 200, ...init });
}

export function created<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 });
}

/** Standard error envelope — never leaks raw DB/stack details to clients. */
export function fail(message: string, status = 400, extra?: unknown) {
  return NextResponse.json(
    { error: message, ...(extra ? { details: extra } : {}) },
    { status },
  );
}

/**
 * Translate thrown errors into clean HTTP responses. Zod → 422 with field
 * errors; AuthError → its status; anything else → a generic 500 (logged
 * server-side, never surfaced verbatim).
 */
export function handleError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Please check the highlighted fields.",
        fieldErrors: error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }
  if (error instanceof AuthError) {
    return fail(error.message, error.status);
  }
  console.error("[api] Unhandled error:", error);
  return fail("Something went wrong. Please try again.", 500);
}
