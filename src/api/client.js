// API admin dùng chung cho toàn bộ Admin Panel.
const API_BASE = "http://localhost:3002/api/admin";

export async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => null);

  if (response.status === 401) {
    const error = new Error("UNAUTHENTICATED");
    error.status = 401;
    error.errorCode = payload?.errorCode;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(payload?.message || `HTTP ${response.status}`);
    error.status = response.status;
    error.errorCode = payload?.errorCode;
    error.errors = payload?.errors;
    throw error;
  }

  return payload;
}
