import React, { useState, useMemo } from 'react';
import { useAdmin } from '../../context/AdminContext.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import FormInput from '../../components/forms/FormInput.jsx';
import FormSelect from '../../components/forms/FormSelect.jsx';
import FormTextarea from '../../components/forms/FormTextarea.jsx';
import { Plus, Edit2, Trash2, Sparkles, X, Save, Search, RotateCcw } from 'lucide-react';

export default function AmenitiesPage() {
  const { amenities, amenityCategories, addAmenity, updateAmenity, toggleAmenityStatus } = useAdmin();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [scopeFilter, setScopeFilter] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [nameError, setNameError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [scopeError, setScopeError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    amenity_scope: '',
    icon: 'Sparkles',
    description: '',
    status: 'Active'
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    setNameError('');
    setCategoryError('');
    setScopeError('');

    setFormData({
        name: '',
        category: '',
        amenity_scope: '',
        icon: 'Sparkles',
        description: '',
        status: 'Active'
    });

    setModalOpen(true);
};

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setNameError('');
    setCategoryError('');
    setScopeError('');

    setFormData({
      name: item.name,
      category: item.category_code || item.category || '',
      amenity_scope: item.amenity_scope || '',
      icon: item.icon || 'Sparkles',
      description: item.description || '',
      status: item.status || 'Active'
    });
    setModalOpen(true);
  };

const handleSave = async (e) => {
    e.preventDefault();

    let hasError = false;

    // Kiểm tra tên tiện nghi
    if (!formData.name.trim()) {
        setNameError('Yêu cầu nhập tiện nghi');
        hasError = true;
    } else {
        setNameError('');
    }

    // Kiểm tra nhóm tiện nghi
    if (!formData.category) {
        setCategoryError('Yêu cầu chọn nhóm tiện nghi');
        hasError = true;
    } else {
        setCategoryError('');
    }

    // Kiểm tra phạm vi áp dụng
    if (!formData.amenity_scope) {
        setScopeError('Yêu cầu chọn phạm vi áp dụng');
        hasError = true;
    } else {
        setScopeError('');
    }

    // Nếu có lỗi thì không lưu
    if (hasError) return;

    // Giữ nguyên xử lý thêm và chỉnh sửa
    if (editingItem) {
        const success = await updateAmenity(editingItem.id, formData);
        if (success) setModalOpen(false);
    } else {
        const success = await addAmenity(formData);
        if (success) setModalOpen(false);
    }
};

const handleToggleStatus = async (item) => {
    const nextStatus = !item.is_active;

    await toggleAmenityStatus(item.id, nextStatus);
};


  const filteredAmenities = useMemo(() => {
    return amenities.filter((item) => {
        const keyword = searchTerm.trim().toLowerCase();

        const name = (item.name || '').toLowerCase();
        const description = (item.description || '').toLowerCase();

        // Lọc theo tên và mô tả
        const matchSearch =
            !keyword ||
            name.includes(keyword) ||
            description.includes(keyword);

        // Lọc theo nhóm tiện nghi
        const matchCat =
            !categoryFilter || item.category === categoryFilter;

        // Lọc theo phạm vi áp dụng
        const matchScope =
            !scopeFilter ||
            item.amenity_scope === scopeFilter ||
            item.amenity_scope === 'both';

        return matchSearch && matchCat && matchScope;
    });
}, [amenities, searchTerm, categoryFilter, scopeFilter]);

  return (
    <div>
      <PageHeader
        title="Quản lý tiện nghi & Dịch vụ"
        description="Danh mục các dịch vụ chăm sóc khách hàng, trang thiết bị trong phòng, tiện ích chăm sóc sức khỏe và ẩm thực."
        actions={
          <button type="button" onClick={handleOpenCreate} className="btn btn-primary">
            <Plus size={15} /> Thêm tiện nghi
          </button>
        }
      />

      {/* Filter Toolbar */}
      <div className="filter-panel amenities-filter-panel">
        <div className="filter-group filter-group-wide">
          <label className="filter-label">Tìm kiếm tiện nghi</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="filter-input"
              style={{ width: '100%', paddingLeft: '28px' }}
              placeholder="Tìm theo tên tiện nghi hoặc mô tả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={14} style={{ position: 'absolute', left: '8px', top: '9px', color: '#6B7280' }} />
          </div>
        </div>

        <div className="filter-group">
          <label className="filter-label">Nhóm tiện nghi</label>
          <select
            className="filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Tất cả các nhóm</option>
            {amenityCategories.map((category) => (
            <option key={category.code} value={category.code}>
            {category.name}
            </option>
        ))}
          </select>
        </div>

        <div className="filter-group">
            <label className="filter-label">Phạm vi áp dụng</label>

            <select
                className="filter-select"
                value={scopeFilter}
                onChange={(e) => setScopeFilter(e.target.value)}
            >
                <option value="">Tất cả phạm vi</option>
                <option value="accommodation">Cơ sở lưu trú</option>
                <option value="room">Phòng</option>
            </select>
        </div>

        <div className="filter-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('');
              setScopeFilter('');
            }}
          >
            <RotateCcw size={13} /> Đặt lại
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table
            className="data-table"
            style={{
                width: '100%',
                tableLayout: 'fixed'
            }}
        >
            <colgroup>
                <col style={{ width: '5%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '17%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '12%' }} />
            </colgroup>

            <thead>
              <tr>
                <th>ID</th>
                <th>Tên tiện nghi</th>
                <th>Nhóm tiện nghi</th>
                <th>Phạm vi áp dụng</th>
                <th style={{ textAlign: 'center' }}>
                    Mô tả chi tiết
                </th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
          <tbody>
            {filteredAmenities.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '30px' }}>
                  Không tìm thấy tiện nghi nào phù hợp với bộ lọc tìm kiếm.
                </td>
              </tr>
            ) : (
            filteredAmenities.map((item) => (
                <tr key={item.id}>
                    {/* ID */}
                    <td className="code-badge">
                        #{item.id}
                    </td>

                    {/* Tên tiện nghi */}
                    <td style={{ fontWeight: 600, color: '#292D32' }}>
                        {item.name}
                    </td>

                    {/* Nhóm tiện nghi */}
                    <td>
                        <span className="badge badge-neutral">
                            {amenityCategories.find(
                                (category) => category.code === item.category
                            )?.name || item.category}
                        </span>
                    </td>

                    {/* Phạm vi áp dụng */}
                    <td>
                        <span className="badge badge-neutral">
                            {{
                                accommodation: 'Cơ sở lưu trú',
                                room: 'Phòng',
                                both: 'Cả 2'
                            }[item.amenity_scope] || 'Chưa xác định'}
                        </span>
                    </td>

                    {/* Mô tả chi tiết */}
                    <td style={{
                        color: '#4B5563',
                        fontSize: '12.5px',
                        textAlign: 'center'
                    }}>
                        {item.description || ''}
                    </td>

                    {/* Trạng thái */}
                    <td>
                        <StatusBadge status={item.status} />
                    </td>

                    {/* Thao tác */}
                    <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center' }}>

                            {/* Nút chỉnh sửa */}
                            <button
                                type="button"
                                className="row-action-btn"
                                title="Chỉnh sửa tiện nghi"
                                onClick={() => handleOpenEdit(item)}
                            >
                                <Edit2 size={13} />
                            </button>

                            {/* Nút ON/OFF */}
                            <button
                                type="button"
                                className={`amenity-toggle ${item.is_active ? 'is-on' : 'is-off'}`}
                                title={item.is_active ? 'Tắt tiện nghi' : 'Bật tiện nghi'}
                                onClick={() => handleToggleStatus(item)}
                                aria-label={item.is_active ? 'Tắt tiện nghi' : 'Bật tiện nghi'}
                                aria-pressed={Boolean(item.is_active)}
                            >
                                <span className="toggle-label">
                                    {item.is_active ? 'ON' : 'OFF'}
                                </span>

                                <span className="toggle-circle"></span>
                            </button>

                        </div>
                    </td>
                </tr>
            ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">
                {editingItem ? `Chỉnh sửa tiện nghi: ${editingItem.name}` : 'Thêm tiện nghi hoặc dịch vụ mới'}
              </span>
              <button className="modal-close" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <FormInput
                  label="Tên tiện nghi"
                  value={formData.name}
                  onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });

                  if (e.target.value.trim()) {
                  setNameError('');
                }
                }}
                  placeholder="Ví dụ: Bể bơi vô cực hướng biển, Bữa sáng buffet..."
                />

                {nameError && (
                    <p style={{
                        color: '#DC2626',
                        fontSize: '12px',
                        marginTop: '-10px',
                        marginBottom: '0'
                    }}>
                        {nameError}
                    </p>
                  )}

                  <FormSelect
                    label="Nhóm tiện nghi"
                    value={formData.category}
                    onChange={(e) => {
                        setFormData({
                            ...formData,
                            category: e.target.value
                        });

                        if (e.target.value) {
                            setCategoryError('');
                        }
                    }}
                    options={amenityCategories.map((category) => ({
                        value: category.code,
                        label: category.name
                    }))}
                    placeholder="Select option..."
                />

                {categoryError && (
                    <p style={{
                        color: '#DC2626',
                        fontSize: '12px',
                        marginTop: '-10px',
                        marginBottom: '0'
                    }}>
                        {categoryError}
                    </p>
                )}

                  <FormSelect
                    label="Phạm vi áp dụng"
                    value={formData.amenity_scope}
                    onChange={(e) => {
                        setFormData({
                            ...formData,
                            amenity_scope: e.target.value
                        });

                        if (e.target.value) {
                            setScopeError('');
                        }
                    }}
                    options={[
                        { value: 'accommodation', label: 'Cơ sở lưu trú' },
                        { value: 'room', label: 'Phòng' },
                        { value: 'both', label: 'Cả 2' }
                    ]}
                    placeholder="Select option..."
                />
                {scopeError && (
                      <p style={{
                          color: '#DC2626',
                          fontSize: '12px',
                          marginTop: '-10px',
                          marginBottom: '0'
                      }}>
                          {scopeError}
                      </p>
                  )}

                  <FormSelect
                    label="Trạng thái"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    options={[
                      { value: 'Active', label: 'Đang hoạt động' },
                      { value: 'Inactive', label: 'Ngừng hoạt động' }
                    ]}
                  />

                  <FormInput
                      label="Icon Key"
                      value={formData.icon}
                      onChange={(e) =>
                          setFormData({
                              ...formData,
                              icon: e.target.value
                          })
                      }
                      placeholder="Ví dụ: Wifi, Sparkles, Car, Waves..."
                  />

                  <FormTextarea
                    label="Mô tả chi tiết"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="Mô tả các thông số kỹ thuật, quy định phục vụ và tiêu chuẩn chất lượng..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={14} /> {editingItem ? 'Lưu thay đổi' : 'Thêm tiện nghi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
