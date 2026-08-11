const JIRA_API_BASE_URL =
  import.meta.env["VITE_API_BASE_URL"] ??
  import.meta.env["VITE_JIRA_API_BASE_URL"] ??
  "https://nodejsjirataskautomation-production.up.railway.app";

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

/** Shared JSON API caller for every backend service request. */
export async function apiRequest<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...requestOptions } = options;
  const response = await fetch(`${JIRA_API_BASE_URL}${path}`, {
    ...requestOptions,
    headers: {
      Accept: "application/json",
      ...(requestOptions.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const body = await response.json().catch(() => null) as { message?: string } | null;
  if (!response.ok) throw new ApiError(body?.message ?? "The server request failed.", response.status);
  return body as T;
}
