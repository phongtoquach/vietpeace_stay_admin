import React, { useState, useEffect, useMemo } from 'react';
import FormInput from '../../components/forms/FormInput.jsx';
import FormSelect from '../../components/forms/FormSelect.jsx';
import FormTextarea from '../../components/forms/FormTextarea.jsx';
import { X, Save } from 'lucide-react';

export default function LocationFormModal({
  isOpen,
  locationToEdit,
  parentLocationIdForChild,
  locations = [],
  onSave,
  onClose
}) {
  const isEdit = Boolean(locationToEdit);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'Ward / District',
    parent_location_id: '',
    description: '',
    status: 'Active'
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (locationToEdit) {
      setFormData({
        name: locationToEdit.name || '',
        code: locationToEdit.code || '',
        type: locationToEdit.type || 'Ward / District',
        parent_location_id: locationToEdit.parent_location_id ?? '',
        description: locationToEdit.description || '',
        status: locationToEdit.status || 'Active'
      });
    } else if (parentLocationIdForChild) {
      setFormData({
        name: '',
        code: '',
        type: 'Ward / Commune',
        parent_location_id: parentLocationIdForChild,
        description: '',
        status: 'Active'
      });
    } else {
      setFormData({
        name: '',
        code: '',
        type: 'Province / City',
        parent_location_id: '1', // Default Vietnam parent
        description: '',
        status: 'Active'
      });
    }
  }, [locationToEdit, parentLocationIdForChild, isOpen]);

  // Find all descendant IDs of the current editing location to prevent cyclic parent reference
  const descendantIds = useMemo(() => {
    if (!locationToEdit) return new Set();
    const set = new Set([locationToEdit.id]);
    let added = true;
    while (added) {
      added = false;
      locations.forEach((loc) => {
        if (loc.parent_location_id && set.has(loc.parent_location_id) && !set.has(loc.id)) {
          set.add(loc.id);
          added = true;
        }
      });
    }
    return set;
  }, [locationToEdit, locations]);

  // Valid potential parent locations (exclude self and descendants)
  const availableParents = useMemo(() => {
    return locations.filter((loc) => !descendantIds.has(loc.id));
  }, [locations, descendantIds]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên điểm đến.');
      return;
    }
    if (!formData.code.trim()) {
      setError('Vui lòng nhập mã định danh điểm đến.');
      return;
    }
    setError('');

    const payload = {
      ...formData,
      parent_location_id: formData.parent_location_id ? Number(formData.parent_location_id) : null
    };

    onSave(payload);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <span className="modal-title">
            {isEdit ? `Chỉnh sửa điểm đến: ${locationToEdit.name}` : 'Thêm điểm đến phân cấp mới'}
          </span>
          <button className="modal-close" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ padding: '8px 12px', backgroundColor: '#FDF2F2', border: '1px solid #F8B4B4', borderRadius: '4px', fontSize: '12.5px', color: '#C0392B', marginBottom: '14px' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <FormInput
                label="Tên điểm đến"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ví dụ: Bán đảo Sơn Trà, Đà Nẵng, Phú Quốc..."
                required
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <FormInput
                  label="Mã điểm đến"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Ví dụ: DAD-ST"
                  required
                />

                <FormSelect
                  label="Loại cấp bậc hành chính"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  options={[
                    { value: 'Country', label: 'Quốc gia (Country)' },
                    { value: 'Province / City', label: 'Tỉnh/thành (Province / City)' },
                    { value: 'Ward / District', label: 'Quận/huyện (Ward / District)' },
                    { value: 'Ward / Commune', label: 'Phường/xã (Ward / Commune)' },
                    { value: 'Tourism Area', label: 'Khu du lịch sinh thái (Tourism Area)' }
                  ]}
                  required
                />
              </div>

              <FormSelect
                label="Điểm đến cha"
                value={formData.parent_location_id}
                onChange={(e) => setFormData({ ...formData, parent_location_id: e.target.value })}
                placeholder="-- Không có (Cấp quốc gia / Độc lập) --"
                options={availableParents.map((p) => ({
                  value: p.id,
                  label: `${p.name} (${p.type === 'Province / City' ? 'Tỉnh/thành' : p.type})`
                }))}
                helperText="Ngăn ngừa vòng lặp phân cấp: điểm đến hiện tại và các cấp con trực thuộc bị vô hiệu hóa."
              />

              <FormSelect
                label="Trạng thái"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                options={[
                  { value: 'Active', label: 'Đang hoạt động' },
                  { value: 'Inactive', label: 'Ngừng hoạt động' }
                ]}
              />

              <FormTextarea
                label="Mô tả & Điểm nổi bật du lịch"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="Cảnh quan thiên nhiên, bãi biển, địa hình núi hoặc thông tin địa phương..."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={14} /> {isEdit ? 'Lưu thay đổi' : 'Tạo điểm đến'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
