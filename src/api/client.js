// API admin dùng chung cho toàn bộ Admin Panel.
const API_BASE = "http://localhost:3002/api/admin";

/**
 * Gọi API backend và chuẩn hóa response lỗi.
 *
 * Input:
 * - path: ví dụ "/accommodations?limit=10"
 * - options: method, body, headers...
 *
 * Output:
 * - Thành công: trả payload JSON từ backend.
 * - Thất bại: throw Error có status, errorCode, errors.
 */

export async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,

    // Cookie vietpeace.admin.sid cần được gửi cùng request.
    credentials: "include",

    headers: {
      // FormData tự có Content-Type riêng kèm boundary.
      // Không được tự đặt application/json cho FormData.
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
  });

  // 401 nghĩa là session không còn hợp lệ hoặc chưa đăng nhập.
  if (response.status === 401) {
    const error = new Error("UNAUTHENTICATED");
    error.status = 401;
    throw error;
  }

  // Một số lỗi backend có thể không trả JSON,
  // nên không để response.json() làm ứng dụng crash thêm.
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.message || `HTTP ${response.status}`);

    // Gắn thêm thông tin để form xử lý lỗi theo từng field.
    error.status = response.status;
    error.errorCode = payload?.errorCode;
    error.errors = payload?.errors;
    throw error;
  }
  return payload;
}
