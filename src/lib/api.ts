import { NextResponse } from "next/server";
import { AdminAuthError } from "@/lib/auth/admin";

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected server error";
}

export function jsonError(status: number, error: string, details?: string[]) {
  return NextResponse.json(
    {
      error,
      details,
    },
    { status },
  );
}

export function handleApiError(error: unknown) {
  if (error instanceof AdminAuthError) {
    return jsonError(error.status, error.message);
  }

  return jsonError(500, getErrorMessage(error));
}
