import { apiFetch } from "./client";
import { buildImageUrl, buildQueryString } from "./accommodations.js";

/**
 * DTO DB -> dữ liệu UI.
 *
 * Khác biệt quan trọng so với mock cũ:
 * - DB dùng `bedDescription` (UI cũ gọi `bed_type`)
 * - DB dùng `areaSqm` (UI cũ gọi `room_size`)
 * - Ảnh bìa lấy từ room_type_images, cần nối origin backend
 * - DB không có cột "view" nên UI bỏ filter hướng nhìn
 */
export function mapRoomTypeSummary(item) {
  return {
    id: item.id,
    code: item.code,
    name: item.name,
    accommodationId: item.accommodationId,
    accommodationName: item.accommodationName || "",
    quantity: item.quantity,
    basePrice: item.basePrice,
    areaSqm: item.areaSqm,
    bedDescription: item.bedDescription || "",
    includedAdults: item.includedAdults,
    includedChildren: item.includedChildren,
    maxOccupancy: item.maxOccupancy,
    status: item.status,
    statusLabel: item.statusLabel || "",
    coverImageUrl: buildImageUrl(item.coverImageUrl),
    updatedAt: item.updatedAt || null,
  };
}

export function mapRoomTypeDetail(item) {
  const images = (item.images || []).map((image) => ({
    ...image,
    imageUrl: buildImageUrl(image.imageUrl),
  }));
  const cover = images.find((image) => image.isCover) || images[0] || null;

  return {
    ...item,
    images,
    coverImageUrl: cover?.imageUrl || null,
    galleryImageUrls: images
      .filter((image) => image !== cover)
      .map((image) => image.imageUrl),
    amenityIds: (item.amenities || []).map((amenity) => amenity.id),
    weekdayRates: item.weekdayRates || [],
  };
}

export const roomTypesApi = {
  /** Lấy danh sách loại phòng có filter/sort/pagination từ backend. */
  async getList(params = {}) {
    const queryString = buildQueryString(params);
    const payload = await apiFetch(`/room-types${queryString}`);
    const rawItems = payload.data?.items || [];

    return {
      ...payload,
      data: {
        ...payload.data,
        items: rawItems.map(mapRoomTypeSummary),
      },
    };
  },

  async getDetail(id) {
    const payload = await apiFetch(`/room-types/${id}`);
    return {
      ...payload,
      data: mapRoomTypeDetail(payload.data),
    };
  },
};
