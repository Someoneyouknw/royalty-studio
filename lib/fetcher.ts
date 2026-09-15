/**
 * Client-side fetch helper for the app's JSON API. Returns the `data` payload
 * on success and throws an Error with a clean, user-safe message on failure.
 */
export interface ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string[]>;
}

export async function apiFetch<T = unknown>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      ...(init?.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...init?.headers,
    },
  });

  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (!res.ok) {
    const payload = (json ?? {}) as {
      error?: string;
      fieldErrors?: Record<string, string[]>;
    };
    const error = new Error(
      payload.error || "Something went wrong. Please try again.",
    ) as ApiError;
    error.status = res.status;
    error.fieldErrors = payload.fieldErrors;
    throw error;
  }

  return (json as { data: T }).data;
}
