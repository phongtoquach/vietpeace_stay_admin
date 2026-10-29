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
    console.warn(
      "[apiFetch] [6] Nhận 401 — session đăng nhập không tồn tại hoặc đã hết hạn"
    );

    const error = new Error("UNAUTHENTICATED");
    error.status = 401;
    error.errorCode = payload?.errorCode;

    // Chỉ chuyển hướng khi KHÔNG ở trang login, tránh vòng lặp reload
    // nếu một API nào đó lỡ được gọi từ chính trang login.
    if (window.location.pathname.startsWith("/login")) {
      console.warn(
        "[apiFetch] [7] Đã ở /login, không chuyển hướng để tránh vòng lặp"
      );
    } else {
      console.warn(
        "[apiFetch] [7] Đang ở",
        window.location.pathname,
        "→ chuyển hướng về /login (reload để xoá state cũ)"
      );
      window.location.assign("/login");
    }

    // Vẫn throw để caller dừng xử lý ngay,
    // không set state bằng dữ liệu rỗng trong lúc trang sắp reload.
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
