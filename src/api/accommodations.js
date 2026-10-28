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
    console.log(
      "[buildImageUrl] Không có imageUrl, trả về null"
    );
    return null;
  }
  // Nếu sau này backend đã trả URL đầy đủ,
  // không nối domain lần nữa.
  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://") ||
    imageUrl.startsWith("data:")
  ) {
    console.log(
      "[buildImageUrl] URL đã đầy đủ:",
      imageUrl
    );
    return imageUrl;
  }
  const normalizedPath = imageUrl.startsWith("/")
    ? imageUrl
    : `/${imageUrl}`;
  const absoluteUrl = `${API_ORIGIN}${normalizedPath}`;
  console.log(
    "[buildImageUrl] Chuyển URL tương đối thành URL tuyệt đối:",
    {
      input: imageUrl,
      output: absoluteUrl
    }
  );
  return absoluteUrl;
}

/**
 * Đổi một item từ DTO backend sang format mà UI accommodation hiện tại đang dùng.
 *
 * Backend dùng camelCase, còn một số component cũ đang dùng snake_case.
 * Adapter là lớp trung gian để hai phía không phải phụ thuộc trực tiếp vào nhau.
 */
export function mapAccommodationSummary(item) {
  console.log(
    "[mapAccommodationSummary] Đang map accommodation:",
    {
      id: item.id,
      name: item.name,
      coverImageUrl: item.coverImageUrl
    }
  );

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
    ward: item.ward || null,
    address: item.addressLine || "",
    star_rating: item.starRating ?? null,
    featured: Boolean(item.isFeatured),
    room_types_count: item.roomTypesCount ?? 0,
    amenities_count: item.amenitiesCount ?? 0,
    updatedAt: item.updatedAt || null
  };

  console.log(
    "[mapAccommodationSummary] Kết quả sau khi map:",
    {
      id: mappedItem.id,
      cover_image: mappedItem.cover_image
    }
  );

  return mappedItem;
}


/**
 * Chuyển object params thành query string an toàn.
 * Mảng được gửi theo format CSV mà backend quy định, ví dụ status=1,2.
 */
export function buildQueryString(params = {}) {
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
  return queryString ? `?${queryString}` : "";
}

export const accommodationsApi = {
  /** Lấy danh sách, filter, sort và pagination từ backend. */
  async getList(params = {}) {
    const queryString = buildQueryString(params);
    const payload = await apiFetch(`/accommodations${queryString}`);

    return {
      ...payload,
      data: {
        ...payload.data,
        items: (payload.data?.items || []).map(mapAccommodationSummary)
      }
    };
  },

  /** Lấy chi tiết một accommodation theo id. */
  async getDetail(id) {
    if (!id) {
      throw new Error("Thiếu accommodation id.");
    }

    return apiFetch(`/accommodations/${id}`);
  }
};
