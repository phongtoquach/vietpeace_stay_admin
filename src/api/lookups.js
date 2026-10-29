import { apiFetch } from "./client";

export const lookupsApi = {
  /**
   * Lấy danh sách điểm đến thật từ bảng dbo.locations.
   * Dùng cho dropdown filter; form Thêm/Sửa sau này tái sử dụng.
   * Output: mảng [{ id, parentId, provinceId, name, slug, provinceName }]
   */
  async getLocations(params = {}) {
    console.group("[lookupsApi.getLocations]");
    console.log("[1] Params nhận vào:", params);

    // Chỉ gắn tham số có giá trị; gửi chuỗi rỗng sẽ thành ?q= và BE hiểu là filter rỗng.
    const search = new URLSearchParams();
    if (params.provinceId) search.set("provinceId", params.provinceId);
    if (params.parentId) search.set("parentId", params.parentId);
    if (params.q) search.set("q", params.q);
    const query = search.toString();

    // Lưu ý: prefix route là /lookup (số ít), không phải /lookups.
    const path = `/lookup/locations${query ? `?${query}` : ""}`;
    console.log("[2] API path:", path);

    try {
      const payload = await apiFetch(path);
      const items = payload?.data?.items || [];
      console.log("[3] Số điểm đến nhận được:", items.length);
      console.log("[4] Item đầu tiên (để đối chiếu id thật):", items[0] || null);
      return items;
    } catch (error) {
      console.error("[ERROR] getLocations thất bại:", {
        message: error.message,
        status: error.status,
        errorCode: error.errorCode,
      });
      throw error;
    } finally {
      console.groupEnd();
    }
  },

  /**
   * Lấy danh sách phường/xã theo tỉnh/thành.
   * BE bắt buộc phải có provinceId, thiếu sẽ trả 400 VALIDATION_ERROR.
   * Output: mảng [{ id, code, name, fullName, administrativeType }]
   */
  async getWards(provinceId) {
    console.group("[lookupsApi.getWards]");
    console.log("[1] provinceId nhận vào:", provinceId);

    if (!provinceId) {
      console.warn("[2] Không có provinceId → trả mảng rỗng, không gọi API.");
      console.groupEnd();
      return [];
    }

    const path = `/lookup/wards?provinceId=${provinceId}`;
    console.log("[3] API path:", path);

    try {
      const payload = await apiFetch(path);
      const items = payload?.data?.items || [];
      console.log("[4] Số phường/xã nhận được:", items.length);
      console.log("[5] Item đầu tiên:", items[0] || null);
      return items;
    } catch (error) {
      console.error("[ERROR] getWards thất bại:", {
        message: error.message,
        status: error.status,
        errorCode: error.errorCode,
      });
      throw error;
    } finally {
      console.groupEnd();
    }
  },

  /**
   * Lấy danh sách tiện nghi đang hoạt động.
   * scope: "accommodation" (mặc định) | "room" | "both"
   * Output: mảng [{ id, code, name, amenityScope, categoryCode, categoryName, iconKey, description, sortOrder }]
   */
  async getAmenities(scope = "accommodation") {
    console.group("[lookupsApi.getAmenities]");
    console.log("[1] scope:", scope);

    const path = `/lookup/amenities?scope=${scope}`;
    console.log("[2] API path:", path);

    try {
      const payload = await apiFetch(path);
      const items = payload?.data?.items || [];
      console.log("[3] Số tiện nghi nhận được:", items.length);
      console.log("[4] Item đầu tiên:", items[0] || null);
      return items;
    } catch (error) {
      console.error("[ERROR] getAmenities thất bại:", {
        message: error.message,
        status: error.status,
        errorCode: error.errorCode,
      });
      throw error;
    } finally {
      console.groupEnd();
    }
  },

  /**
   * Lấy danh sách điểm tham quan thuộc một điểm đến.
   * BE bắt buộc phải có locationId.
   * includeInactive = true để vẫn thấy các điểm đã ngừng hoạt động
   * (cần cho trường hợp cơ sở lưu trú đã liên kết từ trước).
   * Output: mảng [{ id, name, addressLine, imageUrl, isActive, latitude, longitude }]
   */
  async getAttractions(locationId, includeInactive = false) {
    console.group("[lookupsApi.getAttractions]");
    console.log("[1] locationId:", locationId, "| includeInactive:", includeInactive);

    if (!locationId) {
      console.warn("[2] Không có locationId → trả mảng rỗng, không gọi API.");
      console.groupEnd();
      return [];
    }

    const path = `/lookup/attractions?locationId=${locationId}&includeInactive=${
      includeInactive ? "true" : "false"
    }`;
    console.log("[3] API path:", path);

    try {
      const payload = await apiFetch(path);
      const items = payload?.data?.items || [];
      console.log("[4] Số điểm tham quan nhận được:", items.length);
      console.log("[5] Item đầu tiên:", items[0] || null);
      return items;
    } catch (error) {
      console.error("[ERROR] getAttractions thất bại:", {
        message: error.message,
        status: error.status,
        errorCode: error.errorCode,
      });
      throw error;
    } finally {
      console.groupEnd();
    }
  },
};
