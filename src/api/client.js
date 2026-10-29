// API admin dùng chung cho toàn bộ Admin Panel.
const API_BASE = "http://localhost:3002/api/admin";

export async function apiFetch(path, options = {}) {
  const requestUrl = `${API_BASE}${path}`;

  console.group("[apiFetch] HTTP request");
  console.log("[1] URL:", requestUrl);
  console.log("[2] Method:", options.method || "GET");
  console.log("[3] Có body:", Boolean(options.body));

  const response = await fetch(requestUrl, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
  });

  console.log("[4] HTTP status:", response.status);

  const payload = await response.json().catch(() => null);

  console.log("[5] Response payload:", payload);
  console.groupEnd();

  // Phần xử lý lỗi hiện tại giữ nguyên ở bên dưới.
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
