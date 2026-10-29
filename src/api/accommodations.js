import { apiFetch } from "./client";

const API_ORIGIN = "http://localhost:3002";
/**
 * Backend trả URL tương đối như:
 * /uploads/accommodations/example.jpg
 *
 * Trình duyệt frontend chạy ở port 5175 sẽ hiểu URL này
 * là http://localhost:5175/uploads/...
 *
 * Vì file thật nằm ở backend port 3002,
 * cần chuyển thành URL tuyệt đối.
 */

export function buildImageUrl(imageUrl) {
  if (!imageUrl) {
    console.log("[buildImageUrl] Không có imageUrl, trả về null");
    return null;
  }
  // Nếu sau này backend đã trả URL đầy đủ,
  // không nối domain lần nữa.
  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://") ||
    imageUrl.startsWith("data:")
  ) {
    console.log("[buildImageUrl] URL đã đầy đủ:", imageUrl);
    return imageUrl;
  }
  const normalizedPath = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  const absoluteUrl = `${API_ORIGIN}${normalizedPath}`;
  console.log("[buildImageUrl] Chuyển URL tương đối thành URL tuyệt đối:", {
    input: imageUrl,
    output: absoluteUrl,
  });
  return absoluteUrl;
}

/**
 * Đổi một item từ DTO backend sang format mà UI accommodation hiện tại đang dùng.
 *
 * Backend dùng camelCase, còn một số component cũ đang dùng snake_case.
 * Adapter là lớp trung gian để hai phía không phải phụ thuộc trực tiếp vào nhau.
 */
export function mapAccommodationSummary(item) {
  console.log("[mapAccommodationSummary] Đang map accommodation:", {
    id: item.id,
    name: item.name,
    coverImageUrl: item.coverImageUrl,
  });

  const mappedItem = {
    id: item.id,
    code: item.code,
    name: item.name,
    slug: item.slug,

    type: item.type?.code || item.type?.name || "",

    statusValue: item.status,
    status: item.statusLabel || String(item.status ?? ""),
    statusLabel: item.statusLabel || "",

    // Quan trọng: URL ảnh phải trỏ tới backend port 3002.
    cover_image: buildImageUrl(item.coverImageUrl),

    location_id: item.location?.id ?? null,
    location: item.location || null,
    province: item.province || null,
    // UI cũ (FormPage) đọc `ward` như CHUỖI tên phường (mapping mục 5.1),
    // còn backend trả object { id, name }. Nếu giữ object, JSX
    // <option>{formData.ward}</option> sẽ ném lỗi
    // "Objects are not valid as a React child".
    ward: item.ward?.name || "",
    address: item.addressLine || "",
    star_rating: item.starRating ?? null,
    featured: Boolean(item.isFeatured),
    room_types_count: item.roomTypesCount ?? 0,
    amenities_count: item.amenitiesCount ?? 0,
    updatedAt: item.updatedAt || null,
  };

  console.log("[mapAccommodationSummary] Kết quả sau khi map:", {
    id: mappedItem.id,
    cover_image: mappedItem.cover_image,
  });

  // Log kiểu dữ liệu ward để kiểm chứng form Sửa nhận chuỗi, không nhận object.
  console.log("[mapAccommodationSummary] Phường/xã map sang chuỗi:", {
    id: item.id,
    wardObject: item.ward,
    wardName: mappedItem.ward,
  });

  return mappedItem;
}

/**
 * Chuyển object params thành query string an toàn.
 * Mảng được gửi theo format CSV mà backend quy định, ví dụ status=1,2.
 */
export function buildQueryString(params = {}) {
  console.group("[buildQueryString]");
  console.log("[1] Params đầu vào:", params);

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    // Không gửi filter rỗng để URL gọn và backend nhận được NULL đúng nghĩa.
    if (value === undefined || value === null || value === "") {
      return;
    }

    if (Array.isArray(value)) {
      if (value.length > 0) {
        searchParams.set(key, value.join(","));
      }
      return;
    }

    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();
  const output = queryString ? `?${queryString}` : "";
  console.log(
    "[2] Query string trả về:",
    output || "(rỗng — không có filter nào được gửi)"
  );
  console.groupEnd();
  return output;
}

export const accommodationsApi = {
  /** Lấy danh sách, filter, sort và pagination từ backend. */
  async getList(params = {}) {
    console.group("[accommodationsApi.getList]");
    console.log("[1] Params nhận từ AdminContext:", params);

    const queryString = buildQueryString(params);
    const path = `/accommodations${queryString}`;
    console.log("[2] API path:", path);

    try {
      const payload = await apiFetch(path);

      const rawItems = payload.data?.items || [];
      console.log("[3] Backend trả về:", {
        itemCount: rawItems.length,
        pagination: payload.data?.pagination
      });

      const mappedItems = rawItems.map(mapAccommodationSummary);
      console.log("[4] Số item sau adapter:", mappedItems.length);

      return {
        ...payload,
        data: {
          ...payload.data,
          items: mappedItems,
        },
      };
    } catch (error) {
      console.error("[ERROR] getList thất bại:", {
        message: error.message,
        status: error.status,
        errorCode: error.errorCode,
      });
      throw error;
    } finally {
      console.groupEnd();
    }
  },

  /** Lấy chi tiết một accommodation theo id. */
  async getDetail(id) {
    console.group("[accommodationsApi.getDetail]");
    console.log("[1] ID nhận từ DetailPage:", id);

    if (!id) {
      console.error("[ERROR] Thiếu accommodation id.");
      console.groupEnd();
      throw new Error("Thiếu accommodation id.");
    }

    const path = `/accommodations/${id}`;
    console.log("[2] API path:", path);

    try {
      const payload = await apiFetch(path);

      console.log("[3] DTO detail nhận từ backend:", payload.data);

      const mappedData = mapAccommodationDetail(payload.data);

      console.log("[4] Detail sau khi adapter:", mappedData);
      console.log("[5] Số ảnh:", mappedData?.images?.length || 0);
      console.log("[6] Số tiện nghi:", mappedData?.amenities?.length || 0);
      console.log(
        "[7] Số điểm tham quan:",
        mappedData?.attractions?.length || 0,
      );
      console.log("[8] Số loại phòng:", mappedData?.roomTypes?.length || 0);

      return {
        ...payload,
        data: mappedData,
      };
    } catch (error) {
      console.error("[ERROR] getDetail thất bại:", {
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

/**
 * Chuyển DTO detail từ backend sang format mà DetailPage hiện tại đang dùng.
 *
 * Input:
 *   accommodation detail theo camelCase từ backend
 *
 * Output:
 *   object có thêm các field tương thích với UI cũ,
 *   ví dụ cover_image, address, star_rating.
 */

export function mapAccommodationDetail(item) {
  console.group("[mapAccommodationDetail]");
  console.log("[1] DTO đầu vào:", item);
  if (!item) {
    console.warn("[2] DTO detail rỗng.");
    console.groupEnd();
    return null;
  }
  const mappedItem = {
    ...item,
    cover_image: buildImageUrl(item.coverImageUrl),
    address: item.addressLine || "",
    star_rating: item.starRating ?? null,
    featured: Boolean(item.isFeatured),
    short_description: item.shortDescription || "",
    full_description: item.description || "",
    images: (item.images || []).map((image) => ({
      ...image,
      imageUrl: buildImageUrl(image.imageUrl),
    })),
    // Giữ thêm gallery_images để tab Hình ảnh cũ có thể render đúng dữ liệu API.
    gallery_images: (item.images || []).map((image) =>
      buildImageUrl(image.imageUrl),
    ),
    amenities: (item.amenities || []).map((amenity) => ({
      ...amenity,
      // Alias phục vụ component cũ đang đọc category.
      category: amenity.categoryName || amenity.categoryCode || "",
    })),
    attractions: (item.attractions || []).map((attraction) => ({
      ...attraction,
      // Alias phục vụ bảng cũ; giá trị gốc camelCase vẫn được giữ nguyên.
      attraction_id: attraction.attractionId,
      distance: attraction.distanceMeters,
      distance_unit: "m",
      notes: attraction.note || "",
      image: buildImageUrl(attraction.imageUrl),
      address: attraction.addressLine || "",
      is_active: attraction.isActive,
    })),
    room_types: (item.roomTypes || []).map((room) => ({
      ...room,
      base_price: room.minPrice ?? null,
      cover_image: buildImageUrl(room.coverImageUrl),
      // Tên field tương thích với bảng room type cũ.
      room_image: buildImageUrl(room.coverImageUrl),
      // Manager nhập số lượng và loại giường trong một ô text.
      bed_type: room.bedDescription || "—",
      room_size: room.areaSqm ?? null,
      included_adults: room.includedAdults ?? 0,
      included_children: room.includedChildren ?? 0,
      max_occupancy: room.maxOccupancy ?? "—",
      statusLabel:
        room.statusLabel ||
        ({ 0: "Bản nháp", 1: "Đang hoạt động", 2: "Ngừng hoạt động" }[
          room.status
        ] || "Không xác định"),
      accommodation_id: item.id,
    })),
  };
  console.log("[3] Các field chính sau adapter:", {
    id: mappedItem.id,
    name: mappedItem.name,
    cover_image: mappedItem.cover_image,
    address: mappedItem.address,
    star_rating: mappedItem.star_rating,
  });
  console.log("[4] Số mảng con sau adapter:", {
    images: mappedItem.images.length,
    amenities: mappedItem.amenities.length,
    attractions: mappedItem.attractions.length,
    room_types: mappedItem.room_types.length,
  });
  console.groupEnd();
  return mappedItem;
}
