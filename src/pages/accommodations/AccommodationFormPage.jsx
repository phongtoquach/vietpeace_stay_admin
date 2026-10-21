import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import FormInput from '../../components/forms/FormInput.jsx';
import FormSelect from '../../components/forms/FormSelect.jsx';
import FormTextarea from '../../components/forms/FormTextarea.jsx';
import ImageUpload from '../../components/forms/ImageUpload.jsx';
import { WARDS_BY_PROVINCE } from '../../data/mockData.js';
import {
  ArrowLeft,
  Save,
  Building,
  MapPin,
  Sparkles,
  Image as ImageIcon,
  Landmark,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  Globe,
  Info
} from 'lucide-react';
import resortDanangImg from '../../assets/images/resort_danang_1790825961463.jpg';

// Helper to resolve province for any location in hierarchy
export const getProvinceForLocation = (locationId, locations = []) => {
  if (!locationId || !locations || !locations.length) return null;
  let loc = locations.find((l) => Number(l.id) === Number(locationId));
  if (!loc) return null;

  let depth = 0;
  while (loc && depth < 10) {
    depth++;
    if (loc.type === 'Province / City') {
      return loc;
    }
    if (!loc.parent_location_id) {
      return loc;
    }
    const parent = locations.find((l) => Number(l.id) === Number(loc.parent_location_id));
    if (!parent || parent.type === 'Region') {
      return loc;
    }
    loc = parent;
  }
  return null;
};

export default function AccommodationFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const {
    accommodations,
    locations,
    amenities,
    attractions,
    addAccommodation,
    updateAccommodation
  } = useAdmin();

  // Active form section tab (4 tabs total, NO separate attraction tab)
  const [activeTab, setActiveTab] = useState('general');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'Hotel',
    short_description: '',
    full_description: '',
    address: '',
    ward: '',
    location_id: '',
    latitude: '',
    longitude: '',
    phone: '',
    email: '',
    website: '',
    checkin_time: '14:00',
    checkout_time: '12:00',
    star_rating: 4,
    status: 'Active',
    featured: false,
    cover_image: resortDanangImg,
    gallery_images: [resortDanangImg],
    amenity_ids: [],
    attractions: []
  });

  const [errors, setErrors] = useState({});

  // Populate data when in edit mode without triggering user location change wiping
  useEffect(() => {
    if (isEdit) {
      const existing = accommodations.find((a) => a.id === Number(id));
      if (existing) {
        setFormData({
          ...existing,
          ward: existing.ward || '',
          cover_image: existing.cover_image || resortDanangImg,
          gallery_images: existing.gallery_images || [existing.cover_image || resortDanangImg],
          amenity_ids: existing.amenity_ids || [],
          attractions: existing.attractions || []
        });
      }
    }
  }, [id, isEdit, accommodations]);

  // Hierarchical and contextual location options for "Điểm đến" dropdown
  const locationSelectOptions = useMemo(() => {
    return locations
      .filter((loc) => loc.type !== 'Region')
      .map((loc) => {
        const prov = getProvinceForLocation(loc.id, locations);
        let label = loc.name;
        if (prov && prov.id !== loc.id) {
          label = `${loc.name} (${prov.name} - ${loc.type})`;
        } else {
          label = `${loc.name} (${loc.type})`;
        }
        return {
          value: String(loc.id),
          label: label
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
  }, [locations]);

  // Determine Province for current selected location
  const currentProvince = useMemo(() => {
    return getProvinceForLocation(formData.location_id, locations);
  }, [formData.location_id, locations]);

  // Wards belonging to current province
  const availableWards = useMemo(() => {
    if (!currentProvince) return [];
    return WARDS_BY_PROVINCE[currentProvince.id] || [];
  }, [currentProvince]);

  // Attractions assigned to selected location
  const locationAttractions = useMemo(() => {
    if (!formData.location_id) return [];
    const locId = Number(formData.location_id);

    return attractions.filter((att) => {
      const matchesLoc = Number(att.location_id) === locId;
      if (!matchesLoc) return false;
      const isAlreadyLinked = (formData.attractions || []).some(
        (a) => Number(a.attraction_id) === Number(att.id)
      );
      // Offer active attractions for new selections. Keep inactive attractions visible only if already linked.
      return att.is_active || isAlreadyLinked;
    });
  }, [formData.location_id, attractions, formData.attractions]);

  // Group amenities by category
  const amenitiesByCategory = useMemo(() => {
    const grouped = {};
    amenities.forEach((item) => {
      const cat = item.category || 'Khác';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });
    return grouped;
  }, [amenities]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Location selection change handler with safety check & confirmation
  const handleLocationChange = (e) => {
    const newLocationId = e.target.value;
    const newIdStr = String(newLocationId);
    if (newIdStr === String(formData.location_id)) return;

    // Check if attractions are already linked or have edits
    const hasLinkedAttractions = (formData.attractions || []).length > 0;
    if (hasLinkedAttractions) {
      const confirmed = window.confirm(
        'Bạn có chắc chắn muốn thay đổi điểm đến? Danh sách các điểm tham quan đã chọn cho điểm đến hiện tại sẽ bị xóa để tải theo điểm đến mới.'
      );
      if (!confirmed) {
        return; // Retain previous selection
      }
    }

    // Determine if province changed
    const oldProv = getProvinceForLocation(formData.location_id, locations);
    const newProv = getProvinceForLocation(newLocationId, locations);

    // Check if current ward belongs to new province
    const newWards = newProv ? (WARDS_BY_PROVINCE[newProv.id] || []) : [];
    const isWardInNewProvince = newWards.some((w) => w.name === formData.ward);

    setFormData((prev) => ({
      ...prev,
      location_id: newLocationId,
      // Clear ward if it does not belong to new province
      ward: isWardInNewProvince ? prev.ward : '',
      // Clear attractions belonging to previous location
      attractions: []
    }));

    if (errors.location_id) {
      setErrors((prev) => ({ ...prev, location_id: null }));
    }
  };

  // Toggle nearby attraction selection
  const handleAttractionToggle = (attractionId) => {
    const idNum = Number(attractionId);
    setFormData((prev) => {
      const current = prev.attractions || [];
      const exists = current.find((a) => Number(a.attraction_id) === idNum);
      if (exists) {
        // Uncheck: remove from associations without deleting master record
        return {
          ...prev,
          attractions: current.filter((a) => Number(a.attraction_id) !== idNum)
        };
      } else {
        // Check: add new association
        const newItem = {
          attraction_id: idNum,
          distance: 1,
          distance_unit: 'km',
          distance_meters: 1000,
          notes: ''
        };
        return {
          ...prev,
          attractions: [...current, newItem]
        };
      }
    });
  };

  // Update attraction association fields (distance, unit, notes)
  const handleAttractionFieldChange = (attractionId, field, value) => {
    const idNum = Number(attractionId);
    setFormData((prev) => {
      const current = prev.attractions || [];
      const updated = current.map((item) => {
        if (Number(item.attraction_id) === idNum) {
          const next = { ...item, [field]: value };
          if (field === 'distance' || field === 'distance_unit') {
            const rawDist = field === 'distance' ? value : item.distance;
            const dist = parseFloat(rawDist) || 0;
            const unit = field === 'distance_unit' ? value : item.distance_unit;
            next.distance = rawDist;
            next.distance_unit = unit;
            next.distance_meters = unit === 'km' ? Math.round(dist * 1000) : Math.round(dist);
          }
          return next;
        }
        return item;
      });
      return { ...prev, attractions: updated };
    });
  };

  const handleAmenityToggle = (amenityId) => {
    setFormData((prev) => {
      const current = prev.amenity_ids || [];
      const updated = current.includes(amenityId)
        ? current.filter((id) => id !== amenityId)
        : [...current, amenityId];
      return { ...prev, amenity_ids: updated };
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Vui lòng nhập tên cơ sở lưu trú.';
    if (!formData.code.trim()) newErrors.code = 'Vui lòng nhập mã cơ sở lưu trú.';
    if (!formData.location_id) newErrors.location_id = 'Vui lòng chọn điểm đến trực thuộc.';
    if (!formData.address.trim()) newErrors.address = 'Vui lòng nhập địa chỉ cụ thể.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      if (!formData.name.trim() || !formData.code.trim()) {
        setActiveTab('general');
      } else if (!formData.location_id || !formData.address.trim()) {
        setActiveTab('location');
      }
      return;
    }

    const payload = {
      ...formData,
      location_id: Number(formData.location_id),
      star_rating: Number(formData.star_rating),
      attractions: (formData.attractions || []).map((a) => ({
        attraction_id: Number(a.attraction_id),
        distance: Number(a.distance) || 0,
        distance_unit: a.distance_unit || 'km',
        distance_meters:
          (a.distance_unit || 'km') === 'km'
            ? Math.round((Number(a.distance) || 0) * 1000)
            : Math.round(Number(a.distance) || 0),
        notes: (a.notes || '').trim()
      }))
    };

    if (isEdit) {
      updateAccommodation(id, payload);
      navigate(`/admin/accommodations/${id}`);
    } else {
      const created = addAccommodation(payload);
      navigate(`/admin/accommodations/${created.id}`);
    }
  };

  return (
    <div>
      <PageHeader
        title={isEdit ? `Chỉnh sửa cơ sở lưu trú: ${formData.name}` : 'Thêm cơ sở lưu trú mới'}
        description="Cấu hình thông số kỹ thuật, định vị địa lý, thông tin liên hệ, tiện nghi và điểm tham quan lân cận."
        breadcrumb={[
          { label: 'Cơ sở lưu trú', path: '/admin/accommodations' },
          { label: isEdit ? 'Chỉnh sửa' : 'Thêm mới' }
        ]}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to="/admin/accommodations" className="btn btn-secondary">
              <ArrowLeft size={14} /> Quay lại danh sách
            </Link>
            <button type="button" onClick={handleSubmit} className="btn btn-primary">
              <Save size={14} /> {isEdit ? 'Lưu thay đổi' : 'Tạo cơ sở lưu trú'}
            </button>
          </div>
        }
      />

      {/* Tabs: Exactly 4 consolidated tabs */}
      <div className="admin-tabs" style={{ marginBottom: '16px' }}>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          Thông tin chung & Liên hệ
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'location' ? 'active' : ''}`}
          onClick={() => setActiveTab('location')}
        >
          Điểm đến & điểm tham quan
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'amenities' ? 'active' : ''}`}
          onClick={() => setActiveTab('amenities')}
        >
          Tiện nghi ({formData.amenity_ids?.length || 0})
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'media' ? 'active' : ''}`}
          onClick={() => setActiveTab('media')}
        >
          Hình ảnh & Thư viện
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Tab 1: General Information & Contact */}
        {activeTab === 'general' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Property Profile */}
            <div className="admin-card">
              <div className="admin-card-header">
                <div className="admin-card-title">Hồ sơ cơ sở lưu trú & Thiết lập vận hành</div>
              </div>
              <div className="admin-card-body">
                <div className="form-grid">
                  <FormInput
                    label="Tên cơ sở lưu trú"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="VD: VietPeace Danang Premier Beach Resort"
                    required
                    error={errors.name}
                  />

                  <FormInput
                    label="Mã cơ sở lưu trú"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="VD: VPD-RES-01"
                    required
                    error={errors.code}
                    helperText="Mã nhận diện nội bộ cho quy trình kế toán và vận hành."
                  />

                  <FormSelect
                    label="Loại hình lưu trú"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    options={[
                      { value: 'Hotel', label: 'Khách sạn (Hotel)' },
                      { value: 'Resort', label: 'Khu nghỉ dưỡng (Resort)' },
                      { value: 'Homestay', label: 'Homestay' }
                    ]}
                    required
                  />

                  <FormSelect
                    label="Hạng sao"
                    name="star_rating"
                    value={formData.star_rating}
                    onChange={handleChange}
                    options={[
                      { value: 1, label: '1 Sao' },
                      { value: 2, label: '2 Sao' },
                      { value: 3, label: '3 Sao' },
                      { value: 4, label: '4 Sao' },
                      { value: 5, label: '5 Sao (Cao cấp)' }
                    ]}
                  />

                  <FormSelect
                    label="Trạng thái hoạt động"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    options={[
                      { value: 'Active', label: 'Đang hoạt động (Mở nhận đặt phòng)' },
                      { value: 'Inactive', label: 'Ngừng hoạt động (Tạm đóng bảo trì)' }
                    ]}
                  />

                  <div className="form-group" style={{ justifyContent: 'center' }}>
                    <label className="form-checkbox-label" style={{ marginTop: '16px' }}>
                      <input
                        type="checkbox"
                        name="featured"
                        checked={formData.featured}
                        onChange={handleChange}
                      />
                      <span>Đặt làm cơ sở nổi bật trên trang chủ</span>
                    </label>
                  </div>

                  <FormInput
                    label="Giờ nhận phòng (Check-in)"
                    name="checkin_time"
                    type="time"
                    value={formData.checkin_time}
                    onChange={handleChange}
                  />

                  <FormInput
                    label="Giờ trả phòng (Check-out)"
                    name="checkout_time"
                    type="time"
                    value={formData.checkout_time}
                    onChange={handleChange}
                  />

                  <div className="col-span-full">
                    <FormTextarea
                      label="Mô tả tóm tắt ngắn"
                      name="short_description"
                      value={formData.short_description}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Mô tả tóm tắt 1-2 câu giới thiệu điểm nhấn cơ sở..."
                    />
                  </div>

                  <div className="col-span-full">
                    <FormTextarea
                      label="Mô tả chi tiết đầy đủ"
                      name="full_description"
                      value={formData.full_description}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Mô tả toàn diện về khuôn viên, phong cách thiết kế, trải nghiệm nghỉ dưỡng..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Preserved Contact Section */}
            <div className="admin-card">
              <div className="admin-card-header">
                <div className="admin-card-title">Thông tin liên hệ cơ sở lưu trú</div>
              </div>
              <div className="admin-card-body">
                <div className="form-grid">
                  <FormInput
                    label="Số điện thoại lễ tân"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+84 236 388 9999"
                  />

                  <FormInput
                    label="Email đặt phòng"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="danang.resort@vietpeacestay.vn"
                  />

                  <FormInput
                    label="Website chính thức"
                    name="website"
                    type="url"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://vietpeacestay.vn/resorts/danang"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Consolidated "Điểm đến & điểm tham quan" */}
        {activeTab === 'location' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="admin-card">
              <div className="admin-card-header">
                <div className="admin-card-title">Định vị địa lý & Địa chỉ hành chính</div>
              </div>
              <div className="admin-card-body">
                <div className="form-grid">
                  {/* 1. "Điểm đến" dropdown (NO province dropdown) */}
                  <div className="col-span-full">
                    <label className="form-label" htmlFor="field-location-id" style={{ fontWeight: 600 }}>
                      Điểm đến <span style={{ color: '#E53E3E' }}>*</span>
                    </label>
                    <select
                      id="field-location-id"
                      name="location_id"
                      className="filter-select"
                      style={{
                        width: '100%',
                        height: '40px',
                        borderColor: errors.location_id ? '#E53E3E' : '#D9DDE2'
                      }}
                      value={formData.location_id || ''}
                      onChange={handleLocationChange}
                      required
                    >
                      <option value="">-- Chọn điểm đến --</option>
                      {locationSelectOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {errors.location_id && (
                      <p className="form-error" style={{ marginTop: '4px' }}>
                        {errors.location_id}
                      </p>
                    )}
                    <span style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px', display: 'block' }}>
                      Chọn điểm đến để hệ thống tự động xác định Tỉnh/thành, nạp danh sách Phường/xã và các điểm tham quan lân cận trực thuộc.
                    </span>
                  </div>

                  {/* 2. Read-only "Tỉnh/thành: {province name}" text */}
                  <div className="col-span-full">
                    {formData.location_id ? (
                      currentProvince ? (
                        <div
                          style={{
                            padding: '10px 14px',
                            backgroundColor: '#F0FDF4',
                            border: '1px solid #BBF7D0',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <MapPin size={16} color="#16A34A" />
                          <span style={{ fontSize: '13.5px', color: '#166534', fontWeight: 600 }}>
                            Tỉnh/thành: {currentProvince.name}
                          </span>
                        </div>
                      ) : (
                        <div
                          style={{
                            padding: '10px 14px',
                            backgroundColor: '#FEF2F2',
                            border: '1px solid #FECACA',
                            borderRadius: '6px',
                            color: '#991B1B',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <AlertCircle size={16} />
                          <span>Không xác định được tỉnh/thành cho điểm đến này.</span>
                        </div>
                      )
                    ) : (
                      <div
                        style={{
                          padding: '10px 14px',
                          backgroundColor: '#F9FAFB',
                          border: '1px dashed #D1D5DB',
                          borderRadius: '6px',
                          color: '#6B7280',
                          fontSize: '13px'
                        }}
                      >
                        Tỉnh/thành: <em>(Vui lòng chọn điểm đến ở trên để tự động nhận diện tỉnh/thành)</em>
                      </div>
                    )}
                  </div>

                  {/* 3. "Phường/xã" dropdown and "Địa chỉ" textbox */}
                  <div>
                    <label className="form-label" htmlFor="field-ward" style={{ fontWeight: 600 }}>
                      Phường/xã
                    </label>
                    <select
                      id="field-ward"
                      name="ward"
                      className="filter-select"
                      style={{ width: '100%', height: '40px' }}
                      value={formData.ward || ''}
                      onChange={handleChange}
                      disabled={!formData.location_id || availableWards.length === 0}
                    >
                      <option value="">
                        {!formData.location_id
                          ? '-- Vui lòng chọn điểm đến trước --'
                          : availableWards.length === 0
                          ? '-- Không có dữ liệu phường/xã --'
                          : '-- Chọn phường/xã --'}
                      </option>
                      {availableWards.map((w) => (
                        <option key={w.id} value={w.name}>
                          {w.name}
                        </option>
                      ))}
                      {/* Preserve custom ward if not in pre-defined list */}
                      {formData.ward && !availableWards.some((w) => w.name === formData.ward) && (
                        <option value={formData.ward}>{formData.ward}</option>
                      )}
                    </select>
                    <span style={{ fontSize: '11.5px', color: '#6B7280', marginTop: '4px', display: 'block' }}>
                      Danh sách phường/xã phụ thuộc vào Tỉnh/thành của điểm đến đã chọn.
                    </span>
                  </div>

                  <FormInput
                    label="Địa chỉ đường phố cụ thể"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="VD: 268 Đường Võ Nguyên Giáp"
                    required
                    error={errors.address}
                  />

                  {/* 4. "Vĩ độ" and "Kinh độ" inputs */}
                  <FormInput
                    label="Vĩ độ (Latitude)"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    placeholder="VD: 16.0748"
                    helperText="Tọa độ GPS độc lập của cơ sở lưu trú."
                  />

                  <FormInput
                    label="Kinh độ (Longitude)"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    placeholder="VD: 108.2467"
                    helperText="Tọa độ GPS độc lập của cơ sở lưu trú."
                  />
                </div>
              </div>
            </div>

            {/* 5. "Điểm tham quan lân cận" Section WITHIN THIS SAME TAB */}
            <div className="admin-card">
              <div
                className="admin-card-header"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}
              >
                <div>
                  <div className="admin-card-title">Điểm tham quan lân cận</div>
                  <div style={{ fontSize: '12.5px', color: '#6B7280' }}>
                    Chọn các điểm du lịch, danh lam thắng cảnh xung quanh cơ sở lưu trú và thiết lập cự ly di chuyển độc lập.
                  </div>
                </div>
                <span className="badge badge-success">
                  {(formData.attractions || []).length} điểm đã liên kết
                </span>
              </div>

              <div className="admin-card-body">
                {!formData.location_id ? (
                  <div
                    style={{
                      padding: '36px 16px',
                      textAlign: 'center',
                      backgroundColor: '#F9FAFB',
                      borderRadius: '6px',
                      border: '1px dashed #D1D5DB',
                      color: '#6B7280'
                    }}
                  >
                    <Landmark size={28} color="#9CA3AF" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontWeight: 600, color: '#374151' }}>
                      Chưa chọn Điểm đến
                    </div>
                    <div style={{ fontSize: '12.5px', marginTop: '4px' }}>
                      Vui lòng chọn <strong>Điểm đến</strong> ở phần thông tin phía trên để tải và cấu hình danh sách các điểm tham quan lân cận.
                    </div>
                  </div>
                ) : locationAttractions.length === 0 ? (
                  <div
                    style={{
                      padding: '36px 16px',
                      textAlign: 'center',
                      backgroundColor: '#F9FAFB',
                      borderRadius: '6px',
                      border: '1px dashed #D1D5DB',
                      color: '#6B7280'
                    }}
                  >
                    <Info size={28} color="#9CA3AF" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontWeight: 600, color: '#374151' }}>
                      Chưa có điểm tham quan nào cho điểm đến này
                    </div>
                    <div style={{ fontSize: '12.5px', marginTop: '4px' }}>
                      Hiện chưa có điểm tham quan nào trong hệ thống thuộc điểm đến đã chọn. Bạn có thể bổ sung trong mục <strong>Điểm tham quan</strong> tại thanh menu bên trái.
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {locationAttractions.map((att) => {
                      const linkedItem = (formData.attractions || []).find(
                        (a) => Number(a.attraction_id) === Number(att.id)
                      );
                      const isChecked = Boolean(linkedItem);

                      return (
                        <div
                          key={att.id}
                          style={{
                            border: isChecked ? '1.5px solid #287A4B' : '1px solid #E5E7EB',
                            borderRadius: '6px',
                            backgroundColor: isChecked ? '#FBFDFB' : '#FFFFFF',
                            padding: '14px 16px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {/* Row Header: Checkbox + Thumbnail + Name + Address + Status */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '12px'
                            }}
                          >
                            <label
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                cursor: 'pointer',
                                flex: 1,
                                minWidth: '240px'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleAttractionToggle(att.id)}
                                style={{
                                  width: '18px',
                                  height: '18px',
                                  accentColor: '#287A4B',
                                  cursor: 'pointer'
                                }}
                              />

                              {/* Thumbnail */}
                              <div
                                style={{
                                  width: '56px',
                                  height: '42px',
                                  borderRadius: '4px',
                                  overflow: 'hidden',
                                  backgroundColor: '#F3F4F6',
                                  border: '1px solid #D9DDE2',
                                  flexShrink: 0
                                }}
                              >
                                <img
                                  src={att.image || resortDanangImg}
                                  alt={att.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = resortDanangImg;
                                  }}
                                  referrerPolicy="no-referrer"
                                />
                              </div>

                              <div>
                                <div
                                  style={{
                                    fontWeight: 600,
                                    color: '#1F2937',
                                    fontSize: '13.5px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                  }}
                                >
                                  <span>{att.name}</span>
                                  {!att.is_active && (
                                    <span
                                      className="badge badge-danger"
                                      style={{ fontSize: '10.5px', padding: '1px 6px' }}
                                    >
                                      Ngừng hoạt động
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                                  {att.address || 'Chưa có địa chỉ chi tiết'}
                                </div>
                              </div>
                            </label>

                            <div>
                              {isChecked ? (
                                <span
                                  className="badge badge-success"
                                  style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <CheckCircle2 size={12} /> Đã liên kết ({linkedItem.distance} {linkedItem.distance_unit || 'km'})
                                </span>
                              ) : (
                                <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                                  Chưa liên kết
                                </span>
                              )}
                            </div>
                          </div>

                          {/* 6. EXPAND THAT SAME ROW when checked: distance, unit, notes */}
                          {isChecked && linkedItem && (
                            <div
                              style={{
                                marginTop: '12px',
                                paddingTop: '12px',
                                borderTop: '1px dashed #CBD5E1',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '14px',
                                alignItems: 'flex-start'
                              }}
                            >
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <div style={{ flex: 1 }}>
                                  <label
                                    className="form-label"
                                    style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}
                                  >
                                    Khoảng cách:
                                  </label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    className="filter-input"
                                    style={{ width: '100%', height: '36px' }}
                                    value={linkedItem.distance ?? ''}
                                    onChange={(e) =>
                                      handleAttractionFieldChange(att.id, 'distance', e.target.value)
                                    }
                                    placeholder="VD: 3.5 hoặc 350"
                                  />
                                </div>
                                <div style={{ width: '85px' }}>
                                  <label
                                    className="form-label"
                                    style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}
                                  >
                                    Đơn vị:
                                  </label>
                                  <select
                                    className="filter-select"
                                    style={{ width: '100%', height: '36px' }}
                                    value={linkedItem.distance_unit || 'km'}
                                    onChange={(e) =>
                                      handleAttractionFieldChange(att.id, 'distance_unit', e.target.value)
                                    }
                                  >
                                    <option value="km">km</option>
                                    <option value="m">m</option>
                                  </select>
                                </div>
                              </div>

                              <div style={{ gridColumn: 'span 2' }}>
                                <label
                                  className="form-label"
                                  style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}
                                >
                                  Ghi chú:
                                </label>
                                <textarea
                                  className="filter-input"
                                  style={{
                                    width: '100%',
                                    minHeight: '36px',
                                    height: '36px',
                                    resize: 'vertical',
                                    fontSize: '12.5px'
                                  }}
                                  rows={1}
                                  value={linkedItem.notes || ''}
                                  onChange={(e) =>
                                    handleAttractionFieldChange(att.id, 'notes', e.target.value)
                                  }
                                  placeholder="VD: Cách resort 10 phút lái xe dọc cung đường Hoàng Sa..."
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Amenities */}
        {activeTab === 'amenities' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <div className="admin-card-title">Tiện nghi & Dịch vụ cơ sở lưu trú</div>
              <span style={{ fontSize: '12px', color: '#6B7280' }}>
                Đã chọn {formData.amenity_ids.length} tiện nghi
              </span>
            </div>
            <div className="admin-card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {Object.entries(amenitiesByCategory).map(([category, items]) => (
                  <div key={category} style={{ borderBottom: '1px solid #F3F4F6', paddingBottom: '14px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#292D32', marginBottom: '8px' }}>
                      {category}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px' }}>
                      {items.map((amenity) => {
                        const isChecked = formData.amenity_ids.includes(amenity.id);
                        return (
                          <label
                            key={amenity.id}
                            className="form-checkbox-label"
                            style={{
                              padding: '6px 10px',
                              backgroundColor: isChecked ? '#FEFBE8' : '#F9FAFB',
                              border: isChecked ? '1px solid #F4C542' : '1px solid #E5E7EB',
                              borderRadius: '4px'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleAmenityToggle(amenity.id)}
                            />
                            <span style={{ fontSize: '12.5px' }}>{amenity.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Photos & Media */}
        {activeTab === 'media' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <div className="admin-card-title">Hình ảnh & Bộ sưu tập ảnh</div>
            </div>
            <div className="admin-card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <ImageUpload
                  label="Ảnh bìa chính (Hero Banner)"
                  images={formData.cover_image ? [formData.cover_image] : []}
                  onChange={(imgs) => setFormData((prev) => ({ ...prev, cover_image: imgs[0] || '' }))}
                  multiple={false}
                  helperText="Ảnh chất lượng cao hiển thị ở đầu trang chi tiết, danh sách tìm kiếm và hóa đơn."
                />

                <ImageUpload
                  label="Bộ sưu tập ảnh khuôn viên (Nhiều ảnh)"
                  images={formData.gallery_images || []}
                  onChange={(imgs) => setFormData((prev) => ({ ...prev, gallery_images: imgs }))}
                  multiple={true}
                  helperText="Tải lên ảnh ngoại cảnh, sảnh đón tiếp, hồ bơi, nhà hàng và cảnh quan xung quanh."
                />
              </div>
            </div>
          </div>
        )}

        {/* Form Actions footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
          <Link to="/admin/accommodations" className="btn btn-secondary">
            Hủy
          </Link>
          <button type="submit" className="btn btn-primary">
            <Save size={14} /> {isEdit ? 'Lưu thay đổi' : 'Tạo cơ sở lưu trú'}
          </button>
        </div>
      </form>
    </div>
  );
}
