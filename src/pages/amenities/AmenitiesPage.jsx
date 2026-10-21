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
  const { amenities, accommodations, addAmenity, updateAmenity, deleteAmenity } = useAdmin();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Room Amenities',
    icon: 'Sparkles',
    description: '',
    status: 'Active'
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'Room Amenities',
      icon: 'Sparkles',
      description: '',
      status: 'Active'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      icon: item.icon || 'Sparkles',
      description: item.description || '',
      status: item.status || 'Active'
    });
    setModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingItem) {
      updateAmenity(editingItem.id, formData);
    } else {
      addAmenity(formData);
    }
    setModalOpen(false);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteAmenity(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const filteredAmenities = useMemo(() => {
    return amenities.filter((item) => {
      const matchSearch =
        !searchTerm ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = !categoryFilter || item.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [amenities, searchTerm, categoryFilter]);

  // Count usage in accommodations
  const usageCountMap = useMemo(() => {
    const map = {};
    accommodations.forEach((acc) => {
      (acc.amenity_ids || []).forEach((amId) => {
        map[amId] = (map[amId] || 0) + 1;
      });
    });
    return map;
  }, [accommodations]);

  const categoryMap = {
    'Room Amenities': 'Tiện nghi trong phòng',
    'Property Facilities': 'Cơ sở vật chất chung',
    'Dining': 'Ẩm thực & Nhà hàng',
    'Recreation': 'Giải trí & Thể thao',
    'Services': 'Dịch vụ lưu trú'
  };

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
      <div className="filter-panel">
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
            <option value="Room Amenities">Tiện nghi trong phòng</option>
            <option value="Property Facilities">Cơ sở vật chất chung</option>
            <option value="Dining">Ẩm thực & Nhà hàng</option>
            <option value="Recreation">Giải trí & Thể thao</option>
            <option value="Services">Dịch vụ lưu trú</option>
          </select>
        </div>

        <div className="filter-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('');
            }}
          >
            <RotateCcw size={13} /> Đặt lại
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>ID</th>
              <th>Tên tiện nghi</th>
              <th>Nhóm tiện nghi</th>
              <th>Mô tả chi tiết</th>
              <th style={{ textAlign: 'center', width: '150px' }}>Số cơ sở đang dùng</th>
              <th style={{ width: '120px' }}>Trạng thái</th>
              <th style={{ textAlign: 'center', width: '90px' }}>Thao tác</th>
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
                  <td className="code-badge">#{item.id}</td>
                  <td style={{ fontWeight: 600, color: '#292D32' }}>{item.name}</td>
                  <td>
                    <span className="badge badge-neutral">{categoryMap[item.category] || item.category}</span>
                  </td>
                  <td style={{ color: '#4B5563', fontSize: '12.5px' }}>{item.description}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="tabular-nums" style={{ fontWeight: 600 }}>
                      {usageCountMap[item.id] || 0} cơ sở
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="row-action-btn"
                        title="Chỉnh sửa tiện nghi"
                        onClick={() => handleOpenEdit(item)}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        className="row-action-btn delete"
                        title="Xóa tiện nghi"
                        onClick={() => setDeleteTarget(item)}
                      >
                        <Trash2 size={13} />
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
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ví dụ: Bể bơi vô cực hướng biển, Bữa sáng buffet..."
                    required
                  />

                  <FormSelect
                    label="Nhóm tiện nghi"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    options={[
                      { value: 'Room Amenities', label: 'Tiện nghi trong phòng' },
                      { value: 'Property Facilities', label: 'Cơ sở vật chất chung' },
                      { value: 'Dining', label: 'Ẩm thực & Nhà hàng' },
                      { value: 'Recreation', label: 'Giải trí & Thể thao' },
                      { value: 'Services', label: 'Dịch vụ lưu trú' }
                    ]}
                    required
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Xác nhận xóa tiện nghi"
        message={`Bạn có chắc chắn muốn xóa tiện nghi "${deleteTarget?.name}"?`}
        confirmLabel="Xác nhận xóa"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
