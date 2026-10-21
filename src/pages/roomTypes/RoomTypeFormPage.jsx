import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import FormInput from '../../components/forms/FormInput.jsx';
import FormSelect from '../../components/forms/FormSelect.jsx';
import FormTextarea from '../../components/forms/FormTextarea.jsx';
import { formatVND, DAYS_OF_WEEK } from '../../data/mockData.js';
import resortDanangImg from '../../assets/images/resort_danang_1790825961463.jpg';
import hotelHanoiImg from '../../assets/images/hotel_hanoi_1790825973601.jpg';
import resortPhuquocImg from '../../assets/images/resort_phuquoc_1790825997319.jpg';
import homestaySapaImg from '../../assets/images/homestay_sapa_1790825984612.jpg';
import {
  ArrowLeft,
  Save,
  Building,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  X,
  UploadCloud,
  Search,
  RotateCcw,
  Wifi,
  Waves,
  Sparkles,
  Utensils,
  Clock,
  Car,
  Wind,
  Tv,
  Coffee,
  Maximize,
  Bath,
  Shield,
  Bike,
  Anchor,
  Flame,
  Briefcase
} from 'lucide-react';

const AMENITY_CATEGORY_LABELS = {
  'Room Amenities': 'Tiện nghi trong phòng',
  'Property Facilities': 'Cơ sở vật chất chung',
  'Dining': 'Ẩm thực & Nhà hàng',
  'Recreation': 'Giải trí & Thể thao',
  'Services': 'Dịch vụ lưu trú'
};

export default function RoomTypeFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [searchParams] = useSearchParams();
  const preselectedAccId = searchParams.get('accommodation_id');
  const navigate = useNavigate();

  const {
    roomTypes,
    accommodations,
    amenities,
    addRoomType,
    updateRoomType,
    getRoomWeekdayRates
  } = useAdmin();

  // 5 Tabs in exact required order
  const [activeTab, setActiveTab] = useState('general');

  // File input refs
  const coverFileInputRef = useRef(null);
  const suppFileInputRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    accommodation_id: preselectedAccId ? Number(preselectedAccId) : (accommodations[0]?.id || ''),
    description: '',
    room_size: 40,
    bed_type: '1 King Bed',
    number_of_beds: 1,
    included_adults: 2,
    included_children: 1,
    max_adults: 3,
    max_children: 2,
    max_occupancy: 4,
    extra_adult_fee: 300000,
    extra_child_fee: 150000,
    base_price: 2500000,
    view: 'Sea',
    balcony: true,
    amenity_ids: [],
    amenities: [],
    room_image: resortDanangImg,
    supplementary_images: [],
    status: 'Active'
  });

  // Weekday Rates state (day 1 to 7)
  const [weekdayRates, setWeekdayRates] = useState({
    1: 2500000,
    2: 2500000,
    3: 2500000,
    4: 2500000,
    5: 2750000,
    6: 2950000,
    7: 2650000
  });

  // Amenity filters
  const [amenityCategoryFilter, setAmenityCategoryFilter] = useState('');
  const [amenitySearchTerm, setAmenitySearchTerm] = useState('');

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNotFound, setIsNotFound] = useState(false);

  // Helper to map existing amenities to amenity_ids
  const resolveAmenityIds = (existing, allAmenities) => {
    if (Array.isArray(existing.amenity_ids) && existing.amenity_ids.length > 0) {
      return existing.amenity_ids;
    }
    if (Array.isArray(existing.amenities)) {
      const ids = [];
      existing.amenities.forEach((item) => {
        if (typeof item === 'number') {
          ids.push(item);
        } else if (typeof item === 'string') {
          const found = allAmenities.find(
            (a) => a.name.toLowerCase().trim() === item.toLowerCase().trim()
          );
          if (found) {
            ids.push(found.id);
          }
        }
      });
      return ids;
    }
    return [];
  };

  // Populate data when in edit mode
  useEffect(() => {
    if (isEdit) {
      const existing = roomTypes.find((r) => r.id === Number(id));
      if (existing) {
        const resolvedAmenityIds = resolveAmenityIds(existing, amenities);
        const resolvedSuppImages = Array.isArray(existing.supplementary_images)
          ? existing.supplementary_images
          : Array.isArray(existing.gallery_images)
          ? existing.gallery_images
          : [];

        setFormData({
          ...existing,
          amenity_ids: resolvedAmenityIds,
          amenities: existing.amenities || [],
          room_image: existing.room_image || resortDanangImg,
          supplementary_images: resolvedSuppImages
        });

        const existingRates = getRoomWeekdayRates(existing.id);
        if (existingRates && existingRates.length > 0) {
          const map = {};
          existingRates.forEach((r) => {
            map[r.day_of_week] = r.price;
          });
          setWeekdayRates(map);
        }
        setIsNotFound(false);
      } else {
        setIsNotFound(true);
      }
    } else if (preselectedAccId) {
      setFormData((prev) => ({ ...prev, accommodation_id: Number(preselectedAccId) }));
    }
  }, [id, isEdit, roomTypes, preselectedAccId, amenities]);

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

  // Toggle amenity selection (belongs strictly to room type)
  const handleAmenityToggle = (amenityId) => {
    setFormData((prev) => {
      const current = prev.amenity_ids || [];
      const updated = current.includes(amenityId)
        ? current.filter((i) => i !== amenityId)
        : [...current, amenityId];
      return { ...prev, amenity_ids: updated };
    });
  };

  // Select all visible amenities
  const handleSelectAllVisibleAmenities = (items) => {
    setFormData((prev) => {
      const current = new Set(prev.amenity_ids || []);
      items.forEach((it) => current.add(it.id));
      return { ...prev, amenity_ids: Array.from(current) };
    });
  };

  // Deselect all visible amenities
  const handleDeselectAllVisibleAmenities = (items) => {
    setFormData((prev) => {
      const idsToRemove = new Set(items.map((it) => it.id));
      const updated = (prev.amenity_ids || []).filter((id) => !idsToRemove.has(id));
      return { ...prev, amenity_ids: updated };
    });
  };

  // Cover Image handlers (accepts ONE image only)
  const handleCoverFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, room_image: 'Kích thước ảnh tối đa là 5MB.' }));
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setFormData((prev) => ({ ...prev, room_image: uploadEvent.target.result }));
    };
    reader.readAsDataURL(file);

    if (errors.room_image) {
      setErrors((prev) => ({ ...prev, room_image: null }));
    }
    if (coverFileInputRef.current) {
      coverFileInputRef.current.value = '';
    }
  };

  const handleSelectPresetCover = (imgSrc) => {
    setFormData((prev) => ({ ...prev, room_image: imgSrc }));
    if (errors.room_image) {
      setErrors((prev) => ({ ...prev, room_image: null }));
    }
  };

  // Supplementary Images handlers (supports MULTIPLE images)
  const handleSupplementaryFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      if (file.size <= 5 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          setFormData((prev) => ({
            ...prev,
            supplementary_images: [...(prev.supplementary_images || []), uploadEvent.target.result]
          }));
        };
        reader.readAsDataURL(file);
      }
    });

    if (suppFileInputRef.current) {
      suppFileInputRef.current.value = '';
    }
  };

  const handleRemoveSupplementaryImage = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      supplementary_images: (prev.supplementary_images || []).filter((_, idx) => idx !== indexToRemove)
    }));
  };

  // Render icon helper
  const renderAmenityIcon = (iconName) => {
    switch (iconName) {
      case 'Wifi': return <Wifi size={16} />;
      case 'Waves': return <Waves size={16} />;
      case 'Sparkles': return <Sparkles size={16} />;
      case 'Utensils': return <Utensils size={16} />;
      case 'Clock': return <Clock size={16} />;
      case 'Car': return <Car size={16} />;
      case 'Wind': return <Wind size={16} />;
      case 'Tv': return <Tv size={16} />;
      case 'Coffee': return <Coffee size={16} />;
      case 'Maximize': return <Maximize size={16} />;
      case 'Bath': return <Bath size={16} />;
      case 'Shield': return <Shield size={16} />;
      case 'Bike': return <Bike size={16} />;
      case 'Anchor': return <Anchor size={16} />;
      case 'Flame': return <Flame size={16} />;
      case 'Briefcase': return <Briefcase size={16} />;
      default: return <Sparkles size={16} />;
    }
  };

  // Filtered amenities grouped by category
  const filteredAmenitiesByCategory = useMemo(() => {
    const grouped = {};
    amenities.forEach((item) => {
      if (amenityCategoryFilter && item.category !== amenityCategoryFilter) {
        return;
      }
      if (amenitySearchTerm.trim()) {
        const query = amenitySearchTerm.toLowerCase();
        const matchName = item.name.toLowerCase().includes(query);
        const matchDesc = (item.description || '').toLowerCase().includes(query);
        if (!matchName && !matchDesc) return;
      }
      const cat = item.category || 'Khác';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });
    return grouped;
  }, [amenities, amenityCategoryFilter, amenitySearchTerm]);

  // Unique categories list
  const uniqueCategories = useMemo(() => {
    const set = new Set();
    amenities.forEach((a) => {
      if (a.category) set.add(a.category);
    });
    return Array.from(set);
  }, [amenities]);

  // Validate fields across all 5 tabs and focus the first tab with an error
  const validate = () => {
    const newErrors = {};

    // Tab 1: General
    if (!formData.name?.trim()) newErrors.name = 'Vui lòng nhập tên loại phòng.';
    if (!formData.code?.trim()) newErrors.code = 'Vui lòng nhập mã loại phòng.';
    if (!formData.accommodation_id) newErrors.accommodation_id = 'Vui lòng chọn cơ sở lưu trú trực thuộc.';

    // Tab 2: Capacity & Dimensions
    if (Number(formData.room_size) <= 0) newErrors.room_size = 'Diện tích phòng phải lớn hơn 0.';
    if (Number(formData.base_price) <= 0) newErrors.base_price = 'Giá gốc phải lớn hơn 0.';
    if (Number(formData.max_occupancy) < Number(formData.included_adults)) {
      newErrors.max_occupancy = 'Sức chứa tối đa không thể nhỏ hơn số người lớn tiêu chuẩn.';
    }
    if (Number(formData.max_adults) < Number(formData.included_adults)) {
      newErrors.max_adults = 'Số người lớn tối đa không thể nhỏ hơn số người lớn tiêu chuẩn.';
    }

    // Tab 3: Weekday Rates
    for (let day = 1; day <= 7; day++) {
      const price = Number(weekdayRates[day]);
      if (isNaN(price) || price < 0) {
        newErrors.weekday_rates = 'Vui lòng nhập giá hợp lệ cho tất cả 7 ngày trong tuần.';
        break;
      }
    }

    // Tab 5: Images
    if (!formData.room_image) {
      newErrors.room_image = 'Vui lòng chọn hoặc tải lên hình đại diện loại phòng.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      // Activate the earliest tab containing an error
      if (newErrors.name || newErrors.code || newErrors.accommodation_id) {
        setActiveTab('general');
      } else if (newErrors.room_size || newErrors.base_price || newErrors.max_occupancy || newErrors.max_adults) {
        setActiveTab('capacity');
      } else if (newErrors.weekday_rates) {
        setActiveTab('pricing');
      } else if (newErrors.room_image) {
        setActiveTab('media');
      }
      return false;
    }

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const selectedAmenityNames = (formData.amenity_ids || []).map((amId) => {
        const am = amenities.find((a) => a.id === amId);
        return am ? am.name : '';
      }).filter(Boolean);

      const payload = {
        ...formData,
        accommodation_id: Number(formData.accommodation_id),
        room_size: Number(formData.room_size),
        number_of_beds: Number(formData.number_of_beds),
        included_adults: Number(formData.included_adults),
        included_children: Number(formData.included_children),
        max_adults: Number(formData.max_adults),
        max_children: Number(formData.max_children),
        max_occupancy: Number(formData.max_occupancy),
        extra_adult_fee: Number(formData.extra_adult_fee),
        extra_child_fee: Number(formData.extra_child_fee),
        base_price: Number(formData.base_price),
        amenity_ids: formData.amenity_ids || [],
        amenities: selectedAmenityNames,
        room_image: formData.room_image,
        supplementary_images: formData.supplementary_images || [],
        gallery_images: formData.supplementary_images || [],
        weekday_rates: weekdayRates
      };

      if (isEdit) {
        updateRoomType(id, payload);
      } else {
        addRoomType(payload);
      }

      if (preselectedAccId) {
        navigate(`/admin/accommodations/${preselectedAccId}`);
      } else {
        navigate('/admin/room-types');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isNotFound) {
    return (
      <div className="admin-page">
        <PageHeader
          title="Không tìm thấy loại phòng"
          breadcrumb={[
            { label: 'Cơ sở lưu trú', path: '/admin/accommodations' },
            { label: 'Loại phòng', path: '/admin/room-types' },
            { label: 'Lỗi' }
          ]}
        />
        <div className="admin-card" style={{ padding: '40px', textAlign: 'center' }}>
          <AlertCircle size={36} color="#DC2626" style={{ margin: '0 auto 12px' }} />
          <h3>Loại phòng không tồn tại hoặc đã bị xóa.</h3>
          <p style={{ color: '#6B7280', marginTop: '6px' }}>
            ID #{id} không có trong cơ sở dữ liệu hệ thống.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: '16px' }}
            onClick={() => navigate('/admin/room-types')}
          >
            Quay lại danh sách loại phòng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? `Chỉnh sửa loại phòng: ${formData.name}` : 'Thêm loại phòng mới'}
        description="Cấu hình thông số kỹ thuật, sức chứa, bảng giá 7 ngày trong tuần, tiện nghi trang bị và hình ảnh phòng."
        breadcrumb={[
          { label: 'Cơ sở lưu trú', path: '/admin/accommodations' },
          { label: 'Loại phòng', path: '/admin/room-types' },
          { label: isEdit ? 'Chỉnh sửa' : 'Thêm mới' }
        ]}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link
              to={preselectedAccId ? `/admin/accommodations/${preselectedAccId}` : '/admin/room-types'}
              className="btn btn-secondary"
            >
              <ArrowLeft size={14} /> Quay lại
            </Link>
            <button
              type="button"
              onClick={handleSubmit}
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              <Save size={14} /> {isEdit ? 'Lưu thay đổi' : 'Tạo loại phòng'}
            </button>
          </div>
        }
      />

      {/* Tabs: Exactly Five Tabs in required order */}
      <div className="admin-tabs" style={{ marginBottom: '16px' }}>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          Thông tin tổng quan loại phòng
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'capacity' ? 'active' : ''}`}
          onClick={() => setActiveTab('capacity')}
        >
          Kích thước, sức chứa
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'pricing' ? 'active' : ''}`}
          onClick={() => setActiveTab('pricing')}
        >
          Bảng giá 7 ngày trong tuần
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'amenities' ? 'active' : ''}`}
          onClick={() => setActiveTab('amenities')}
        >
          Tiện nghi ({(formData.amenity_ids || []).length})
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'media' ? 'active' : ''}`}
          onClick={() => setActiveTab('media')}
        >
          Hình ảnh phòng
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Tab 1: Thông tin tổng quan loại phòng */}
        {activeTab === 'general' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <div className="admin-card-title">Thông tin tổng quan loại phòng</div>
            </div>
            <div className="admin-card-body">
              <div className="form-grid">
                <FormInput
                  label="Tên loại phòng"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="VD: Premier Ocean Suite"
                  required
                  error={errors.name}
                />

                <FormInput
                  label="Mã loại phòng"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="VD: VPD-POS"
                  required
                  error={errors.code}
                />

                <FormSelect
                  label="Cơ sở lưu trú trực thuộc"
                  name="accommodation_id"
                  value={formData.accommodation_id}
                  onChange={handleChange}
                  options={accommodations.map((a) => ({ value: a.id, label: a.name }))}
                  required
                  disabled={Boolean(preselectedAccId)}
                  error={errors.accommodation_id}
                  helperText={preselectedAccId ? 'Đã được chỉ định từ cơ sở lưu trú cha.' : ''}
                />

                <FormSelect
                  label="Trạng thái"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  options={[
                    { value: 'Active', label: 'Đang hoạt động' },
                    { value: 'Inactive', label: 'Ngừng hoạt động' }
                  ]}
                />

                <div className="col-span-full">
                  <FormTextarea
                    label="Mô tả loại phòng"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Mô tả không gian phòng, nội thất, tiện ích đặc trưng và tầm nhìn cảnh quan..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Kích thước, sức chứa */}
        {activeTab === 'capacity' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="admin-card">
              <div className="admin-card-header">
                <div className="admin-card-title">Thông số diện tích & Bố trí giường</div>
              </div>
              <div className="admin-card-body">
                <div className="form-grid">
                  <FormInput
                    label="Diện tích phòng (m²)"
                    name="room_size"
                    type="number"
                    min="1"
                    value={formData.room_size}
                    onChange={handleChange}
                    required
                    error={errors.room_size}
                  />

                  <FormSelect
                    label="Loại giường"
                    name="bed_type"
                    value={formData.bed_type}
                    onChange={handleChange}
                    options={[
                      { value: '1 King Bed', label: '1 Giường King lớn' },
                      { value: '1 Super King Bed', label: '1 Giường Super King' },
                      { value: '1 Queen Bed', label: '1 Giường Queen' },
                      { value: '2 Double Beds', label: '2 Giường đôi' },
                      { value: '2 Queen Beds', label: '2 Giường Queen' },
                      { value: '2 Single / Twin Beds', label: '2 Giường đơn (Twin)' }
                    ]}
                  />

                  <FormInput
                    label="Số lượng giường"
                    name="number_of_beds"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.number_of_beds}
                    onChange={handleChange}
                  />

                  <FormSelect
                    label="Hướng nhìn cảnh quan"
                    name="view"
                    value={formData.view}
                    onChange={handleChange}
                    options={[
                      { value: 'Sea', label: 'Hướng biển (Sea View)' },
                      { value: 'Garden', label: 'Hướng vườn (Garden View)' },
                      { value: 'Mountain', label: 'Hướng núi (Mountain View)' },
                      { value: 'City', label: 'Hướng phố (City View)' },
                      { value: 'Other', label: 'Khác (Other View)' }
                    ]}
                  />

                  <div className="form-group" style={{ justifyContent: 'center' }}>
                    <label className="form-checkbox-label" style={{ marginTop: '16px' }}>
                      <input
                        type="checkbox"
                        name="balcony"
                        checked={formData.balcony}
                        onChange={handleChange}
                      />
                      <span>Có ban công riêng hoặc sân hiên ngoài trời</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <div className="admin-card-title">Quy định sức chứa, khách đi kèm & Phụ phí quá tải</div>
              </div>
              <div className="admin-card-body">
                <div className="form-grid">
                  <FormInput
                    label="Số người lớn đi kèm (tiêu chuẩn)"
                    name="included_adults"
                    type="number"
                    min="1"
                    value={formData.included_adults}
                    onChange={handleChange}
                  />

                  <FormInput
                    label="Số trẻ em đi kèm (tiêu chuẩn)"
                    name="included_children"
                    type="number"
                    min="0"
                    value={formData.included_children}
                    onChange={handleChange}
                  />

                  <FormInput
                    label="Số người lớn tối đa"
                    name="max_adults"
                    type="number"
                    min="1"
                    value={formData.max_adults}
                    onChange={handleChange}
                    error={errors.max_adults}
                  />

                  <FormInput
                    label="Số trẻ em tối đa"
                    name="max_children"
                    type="number"
                    min="0"
                    value={formData.max_children}
                    onChange={handleChange}
                  />

                  <FormInput
                    label="Sức chứa tối đa (tổng số khách)"
                    name="max_occupancy"
                    type="number"
                    min="1"
                    value={formData.max_occupancy}
                    onChange={handleChange}
                    error={errors.max_occupancy}
                    helperText="Tổng số lượng khách lớn nhất phòng có thể tiếp nhận."
                  />

                  <FormInput
                    label="Giá gốc theo đêm (VNĐ)"
                    name="base_price"
                    type="number"
                    step="50000"
                    value={formData.base_price}
                    onChange={handleChange}
                    required
                    error={errors.base_price}
                    helperText="Giá cơ sở tiêu chuẩn dùng để làm mốc tính giá các ngày trong tuần."
                  />

                  <FormInput
                    label="Phụ phí người lớn thêm (VNĐ/đêm)"
                    name="extra_adult_fee"
                    type="number"
                    step="50000"
                    value={formData.extra_adult_fee}
                    onChange={handleChange}
                  />

                  <FormInput
                    label="Phụ phí trẻ em thêm (VNĐ/đêm)"
                    name="extra_child_fee"
                    type="number"
                    step="50000"
                    value={formData.extra_child_fee}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Bảng giá 7 ngày trong tuần */}
        {activeTab === 'pricing' && (
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
                <div className="admin-card-title">Bảng giá 7 ngày trong tuần (room_weekday_rates)</div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>
                  Mỗi loại phòng có đúng 1 mức giá cố định cho từng ngày trong tuần (1 = Thứ Hai ... 7 = Chủ Nhật).
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    const base = Number(formData.base_price) || 1000000;
                    setWeekdayRates({
                      1: base,
                      2: base,
                      3: base,
                      4: base,
                      5: base,
                      6: base,
                      7: base
                    });
                  }}
                  style={{ fontSize: '11.5px' }}
                >
                  Đồng bộ theo giá gốc ({formatVND(Number(formData.base_price) || 0)})
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    const base = Number(formData.base_price) || 1000000;
                    setWeekdayRates({
                      1: base,
                      2: base,
                      3: base,
                      4: base,
                      5: Math.round((base * 1.1) / 10000) * 10000,
                      6: Math.round((base * 1.2) / 10000) * 10000,
                      7: Math.round((base * 1.15) / 10000) * 10000
                    });
                  }}
                  style={{ fontSize: '11.5px' }}
                >
                  + Tăng phụ thu cuối tuần (+10% - 20%)
                </button>
              </div>
            </div>
            <div className="admin-card-body">
              {errors.weekday_rates && (
                <div
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: '4px',
                    color: '#DC2626',
                    fontSize: '12.5px',
                    marginBottom: '14px'
                  }}
                >
                  {errors.weekday_rates}
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '12px'
                }}
              >
                {DAYS_OF_WEEK.map((d) => {
                  const val = weekdayRates[d.day] ?? '';
                  const numVal = Number(val);
                  return (
                    <div
                      key={d.day}
                      style={{
                        padding: '10px 12px',
                        border: d.isWeekend ? '1px solid #FECACA' : '1px solid #E5E7EB',
                        backgroundColor: d.isWeekend ? '#FFFBFB' : '#F9FAFB',
                        borderRadius: '4px'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '6px'
                        }}
                      >
                        <span
                          style={{
                            fontSize: '12.5px',
                            fontWeight: 600,
                            color: d.isWeekend ? '#B91C1C' : '#1F2937'
                          }}
                        >
                          Ngày {d.day}: {d.vietnamese}
                        </span>
                        <span
                          style={{
                            fontSize: '10.5px',
                            padding: '1px 6px',
                            borderRadius: '3px',
                            backgroundColor: d.isWeekend ? '#FEE2E2' : '#E5E7EB',
                            color: d.isWeekend ? '#991B1B' : '#4B5563'
                          }}
                        >
                          {d.isWeekend ? 'Cuối tuần' : 'Ngày thường'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="number"
                          step="50000"
                          min="0"
                          required
                          className="form-input"
                          value={val}
                          onChange={(e) => {
                            const v = e.target.value;
                            setWeekdayRates((prev) => ({ ...prev, [d.day]: v }));
                          }}
                          placeholder="Giá theo đêm (VNĐ)"
                          style={{
                            textAlign: 'right',
                            fontWeight: 600,
                            borderColor: d.isWeekend ? '#FCA5A5' : '#D1D5DB'
                          }}
                        />
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>VNĐ</span>
                      </div>

                      <div
                        style={{
                          fontSize: '11.5px',
                          textAlign: 'right',
                          marginTop: '4px',
                          color: '#4B5563',
                          fontWeight: 500
                        }}
                        className="tabular-nums"
                      >
                        {numVal >= 0 ? formatVND(numVal) : 'Không hợp lệ'}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                style={{
                  marginTop: '14px',
                  fontSize: '12px',
                  color: '#6B7280',
                  padding: '8px 12px',
                  backgroundColor: '#F3F4F6',
                  borderRadius: '4px'
                }}
              >
                * Mức giá cấu hình tại đây sẽ được lưu trữ trực tiếp vào bảng <code>room_weekday_rates</code> và làm giá mặc định khi bán phòng cho từng thứ trong tuần.
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Tiện nghi */}
        {activeTab === 'amenities' && (
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
                <div className="admin-card-title">Tiện nghi & Dịch vụ trang bị trong loại phòng</div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>
                  Lựa chọn các tiện ích, trang thiết bị đi kèm riêng biệt của loại phòng này (độc lập với tiện nghi chung của cơ sở lưu trú).
                </div>
              </div>
              <span className="badge badge-success" style={{ fontSize: '12px', padding: '4px 10px' }}>
                Đã chọn {(formData.amenity_ids || []).length} tiện nghi
              </span>
            </div>

            <div className="admin-card-body">
              {/* Filter Toolbar: Category dropdown & Search */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  paddingBottom: '16px',
                  marginBottom: '16px',
                  borderBottom: '1px solid #E5E7EB'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>
                    Nhóm tiện nghi:
                  </label>
                  <select
                    className="filter-select"
                    style={{ minWidth: '220px', height: '36px' }}
                    value={amenityCategoryFilter}
                    onChange={(e) => setAmenityCategoryFilter(e.target.value)}
                  >
                    <option value="">Tất cả danh mục</option>
                    {uniqueCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {AMENITY_CATEGORY_LABELS[cat] || cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '360px' }}>
                  <input
                    type="text"
                    className="filter-input"
                    style={{ width: '100%', height: '36px', paddingLeft: '30px' }}
                    placeholder="Tìm kiếm tiện nghi theo tên hoặc mô tả..."
                    value={amenitySearchTerm}
                    onChange={(e) => setAmenitySearchTerm(e.target.value)}
                  />
                  <Search
                    size={14}
                    style={{ position: 'absolute', left: '10px', top: '11px', color: '#6B7280' }}
                  />
                </div>

                {(amenityCategoryFilter || amenitySearchTerm) && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setAmenityCategoryFilter('');
                      setAmenitySearchTerm('');
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <RotateCcw size={13} /> Đặt lại bộ lọc
                  </button>
                )}
              </div>

              {/* Grouped Amenities List */}
              {Object.keys(filteredAmenitiesByCategory).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 16px', color: '#6B7280' }}>
                  Không tìm thấy tiện nghi nào phù hợp với bộ lọc tìm kiếm.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                  {Object.entries(filteredAmenitiesByCategory).map(([category, items]) => {
                    const categoryTitle = AMENITY_CATEGORY_LABELS[category] || category;
                    const selectedCountInCategory = items.filter((it) =>
                      (formData.amenity_ids || []).includes(it.id)
                    ).length;

                    return (
                      <div
                        key={category}
                        style={{
                          border: '1px solid #E5E7EB',
                          borderRadius: '6px',
                          padding: '14px 16px',
                          backgroundColor: '#FAFAFA'
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '12px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#1F2937', margin: 0 }}>
                              {categoryTitle}
                            </h4>
                            <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                              {selectedCountInCategory} / {items.length} đã chọn
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '11px', padding: '2px 8px' }}
                              onClick={() => handleSelectAllVisibleAmenities(items)}
                            >
                              Chọn tất cả
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '11px', padding: '2px 8px' }}
                              onClick={() => handleDeselectAllVisibleAmenities(items)}
                            >
                              Bỏ chọn
                            </button>
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                            gap: '10px'
                          }}
                        >
                          {items.map((amenity) => {
                            const isChecked = (formData.amenity_ids || []).includes(amenity.id);
                            return (
                              <label
                                key={amenity.id}
                                className="form-checkbox-label"
                                style={{
                                  padding: '10px 12px',
                                  backgroundColor: isChecked ? '#FEFBE8' : '#FFFFFF',
                                  border: isChecked ? '1.5px solid #F4C542' : '1px solid #E5E7EB',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '10px',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleAmenityToggle(amenity.id)}
                                  style={{
                                    accentColor: '#287A4B',
                                    width: '16px',
                                    height: '16px',
                                    marginTop: '2px',
                                    cursor: 'pointer'
                                  }}
                                />
                                <div
                                  style={{
                                    color: isChecked ? '#92400E' : '#4B5563',
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginTop: '2px'
                                  }}
                                >
                                  {renderAmenityIcon(amenity.icon)}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div
                                    style={{
                                      fontSize: '13px',
                                      fontWeight: isChecked ? 600 : 500,
                                      color: isChecked ? '#92400E' : '#1F2937'
                                    }}
                                  >
                                    {amenity.name}
                                  </div>
                                  {amenity.description && (
                                    <div
                                      style={{
                                        fontSize: '11.5px',
                                        color: '#6B7280',
                                        marginTop: '2px',
                                        lineHeight: 1.35
                                      }}
                                    >
                                      {amenity.description}
                                    </div>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Hình ảnh phòng (TWO clearly separated upload controls) */}
        {activeTab === 'media' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* A. Cover image: Hình đại diện loại phòng */}
            <div className="admin-card">
              <div className="admin-card-header">
                <div className="admin-card-title">Hình đại diện loại phòng</div>
                <span className="badge badge-success" style={{ fontSize: '11.5px' }}>
                  Ảnh chính hiển thị đại diện (Chỉ chọn 1 ảnh)
                </span>
              </div>
              <div className="admin-card-body">
                <p style={{ fontSize: '13px', color: '#4B5563', marginBottom: '14px' }}>
                  Đây là ảnh bìa lớn nhất của loại phòng, được hiển thị ở thẻ danh sách đặt phòng và trên đầu trang thông tin chi tiết phòng.
                </p>

                {formData.room_image ? (
                  <div style={{ maxWidth: '440px' }}>
                    <div
                      style={{
                        width: '100%',
                        height: '240px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        border: '2px solid #287A4B',
                        backgroundColor: '#F3F4F6',
                        position: 'relative'
                      }}
                    >
                      <img
                        src={formData.room_image}
                        alt="Hình đại diện loại phòng"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        referrerPolicy="no-referrer"
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: '10px',
                          left: '10px',
                          backgroundColor: 'rgba(40, 122, 75, 0.92)',
                          color: '#fff',
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <CheckCircle2 size={12} /> Hình đại diện chính
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => coverFileInputRef.current?.click()}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      >
                        <ImageIcon size={13} /> Thay đổi hình đại diện
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setFormData((prev) => ({ ...prev, room_image: '' }))}
                        style={{ color: '#DC2626', borderColor: '#FECACA' }}
                      >
                        <Trash2 size={13} /> Gỡ ảnh đại diện
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="image-upload-zone"
                    onClick={() => coverFileInputRef.current?.click()}
                    tabIndex={0}
                    role="button"
                    aria-label="Tải ảnh đại diện lên"
                    style={{ maxWidth: '520px' }}
                  >
                    <UploadCloud size={32} color="#287A4B" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#1F2937' }}>
                      Nhấp hoặc kéo thả hình đại diện loại phòng vào đây
                    </div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '3px' }}>
                      Định dạng JPG, PNG hoặc WEBP (Chỉ 1 ảnh, tối đa 5MB).
                    </div>
                  </div>
                )}

                <input
                  ref={coverFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple={false}
                  style={{ display: 'none' }}
                  onChange={handleCoverFileChange}
                />
                {errors.room_image && (
                  <p className="form-error" style={{ marginTop: '8px' }}>
                    {errors.room_image}
                  </p>
                )}

                {/* Preset suggestions */}
                <div style={{ marginTop: '16px', borderTop: '1px solid #E5E7EB', paddingTop: '12px', maxWidth: '440px' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#6B7280', marginBottom: '8px' }}>
                    Hoặc chọn ảnh phòng mẫu có sẵn trong thư viện:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    {[
                      { img: resortDanangImg, label: 'Resort Đà Nẵng' },
                      { img: hotelHanoiImg, label: 'Hotel Hà Nội' },
                      { img: resortPhuquocImg, label: 'Resort Phú Quốc' },
                      { img: homestaySapaImg, label: 'Homestay Sa Pa' }
                    ].map((sample, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => handleSelectPresetCover(sample.img)}
                        style={{
                          border: formData.room_image === sample.img ? '2px solid #287A4B' : '1px solid #D1D5DB',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          padding: 0,
                          cursor: 'pointer',
                          background: 'none'
                        }}
                        title={sample.label}
                      >
                        <img
                          src={sample.img}
                          alt={sample.label}
                          style={{ width: '100%', height: '48px', objectFit: 'cover', display: 'block' }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* B. Supplementary images: Hình ảnh phụ */}
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
                  <div className="admin-card-title">Hình ảnh phụ</div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>
                    Tải lên nhiều hình ảnh bổ sung minh họa góc nhìn phòng, phòng tắm, ban công, nội thất và dịch vụ kèm theo.
                  </div>
                </div>
                <span className="badge badge-neutral" style={{ fontSize: '11.5px' }}>
                  {(formData.supplementary_images || []).length} ảnh phụ đã chọn
                </span>
              </div>
              <div className="admin-card-body">
                {/* Upload Zone */}
                <div
                  className="image-upload-zone"
                  onClick={() => suppFileInputRef.current?.click()}
                  tabIndex={0}
                  role="button"
                  aria-label="Tải thêm ảnh phụ"
                  style={{ marginBottom: '16px' }}
                >
                  <UploadCloud size={28} color="#6B7280" style={{ margin: '0 auto 6px' }} />
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#292D32' }}>
                    Nhấp hoặc kéo thả để tải thêm nhiều ảnh phụ
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#6B7280', marginTop: '2px' }}>
                    Hỗ trợ chọn nhiều ảnh cùng lúc. Khi chọn thêm, các ảnh mới sẽ được thêm vào danh sách ảnh hiện có mà không bị ghi đè.
                  </div>
                  <input
                    ref={suppFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple={true}
                    style={{ display: 'none' }}
                    onChange={handleSupplementaryFileChange}
                  />
                </div>

                {/* Thumbnail grid */}
                {(formData.supplementary_images || []).length > 0 ? (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                      gap: '12px'
                    }}
                  >
                    {formData.supplementary_images.map((imgSrc, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: 'relative',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          border: '1px solid #D9DDE2',
                          backgroundColor: '#F3F4F6',
                          height: '95px'
                        }}
                      >
                        <img
                          src={imgSrc}
                          alt={`Ảnh phụ ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveSupplementaryImage(idx);
                          }}
                          title="Gỡ ảnh này"
                          aria-label={`Xóa ảnh phụ ${idx + 1}`}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            color: '#fff',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <X size={12} />
                        </button>
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '3px',
                            left: '4px',
                            backgroundColor: 'rgba(0,0,0,0.65)',
                            color: '#fff',
                            fontSize: '9.5px',
                            padding: '1px 5px',
                            borderRadius: '3px'
                          }}
                        >
                          Ảnh #{idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '24px 16px',
                      color: '#6B7280',
                      backgroundColor: '#F9FAFB',
                      borderRadius: '4px',
                      border: '1px dashed #D1D5DB',
                      fontSize: '12.5px'
                    }}
                  >
                    Chưa có ảnh phụ nào được thêm. Nhấp vào khung ở trên để tải lên các hình ảnh góc phòng, ban công hoặc phòng tắm.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form Actions Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
          <Link
            to={preselectedAccId ? `/admin/accommodations/${preselectedAccId}` : '/admin/room-types'}
            className="btn btn-secondary"
          >
            Hủy
          </Link>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            <Save size={14} /> {isEdit ? 'Lưu thay đổi' : 'Tạo loại phòng'}
          </button>
        </div>
      </form>
    </div>
  );
}
