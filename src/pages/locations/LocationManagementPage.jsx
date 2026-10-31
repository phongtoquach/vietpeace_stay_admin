import React, { useState, useMemo } from 'react';
import { useAdmin } from '../../context/AdminContext.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import LocationFormModal from './LocationFormModal.jsx';
import {
  MapPin,
  Plus,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Edit2,
  Trash2,
  Table as TableIcon,
  Network,
  Search,
  RotateCcw,
  Building
} from 'lucide-react';

// Hàm chuẩn hóa chuỗi: bỏ dấu tiếng Việt, chuyển chữ thường và đổi gạch nối '-' thành khoảng trắng
const normalizeText = (str) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export default function LocationManagementPage() {
  const { locations, accommodations, addLocation, updateLocation, deleteLocation } = useAdmin();

  // View Mode: 'tree' or 'table'
  const [viewMode, setViewMode] = useState('tree');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [parentFilter, setParentFilter] = useState('');

  // Expand / collapse map for tree nodes
  const [expandedNodes, setExpandedNodes] = useState({ 4: true, 14: true, 31: true, 1: true, 2: true });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [parentForChild, setParentForChild] = useState(null);

  // Delete Dialog State
  const [deleteTargetLocation, setDeleteTargetLocation] = useState(null);

  // Calculate accommodation count per location
  const accCountMap = useMemo(() => {
    const map = {};
    accommodations.forEach((acc) => {
      map[acc.location_id] = (map[acc.location_id] || 0) + 1;
    });
    return map;
  }, [accommodations]);

  const toggleNode = (id) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleOpenCreateRoot = () => {
    setEditingLocation(null);
    setParentForChild(null);
    setModalOpen(true);
  };

  const handleOpenAddChild = (parentId) => {
    setEditingLocation(null);
    setParentForChild(parentId);
    setModalOpen(true);
  };

  const handleOpenEdit = (loc) => {
    setEditingLocation(loc);
    setParentForChild(null);
    setModalOpen(true);
  };

  const handleSaveModal = (data) => {
    if (editingLocation) {
      updateLocation(editingLocation.id, data);
    } else {
      addLocation(data);
    }
    setModalOpen(false);
  };

  const confirmDelete = () => {
    if (deleteTargetLocation) {
      deleteLocation(deleteTargetLocation.id);
      setDeleteTargetLocation(null);
    }
  };

  // Sắp xếp danh sách điểm đến theo thứ tự phân cấp (Cha đứng trước, các Con thụt lề đứng ngay sau)
  const hierarchicalLocations = useMemo(() => {
    const buildHierarchy = (items, parentId = null, depth = 0) => {
      let result = [];
      const children = items.filter((item) => item.parent_location_id === parentId);
      children.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
      for (const child of children) {
        result.push({ ...child, depth });
        result = result.concat(buildHierarchy(items, child.id, depth + 1));
      }
      return result;
    };

    const ordered = buildHierarchy(locations, null, 0);

    // Bổ sung các điểm đến chưa nằm trong cây (dự phòng)
    const listedIds = new Set(ordered.map((l) => l.id));
    locations.forEach((l) => {
      if (!listedIds.has(l.id)) {
        ordered.push({ ...l, depth: 0 });
      }
    });

    // Lọc theo từ khóa tìm kiếm và trạng thái
    return ordered.filter((loc) => {
      const normSearch = normalizeText(searchTerm);
      const matchSearch =
        !searchTerm ||
        normalizeText(loc.name).includes(normSearch) ||
        normalizeText(loc.code).includes(normSearch) ||
        normalizeText(loc.province_name).includes(normSearch);

      const matchStatus = !statusFilter || loc.status === statusFilter;
      const matchParent = !parentFilter || String(loc.parent_location_id) === String(parentFilter);
      return matchSearch && matchStatus && matchParent;
    });
  }, [locations, searchTerm, statusFilter, parentFilter]);

  // Build recursive tree nodes
  const buildTree = (parentId = null) => {
    return locations
      .filter((loc) => loc.parent_location_id === parentId)
      .map((loc) => ({
        ...loc,
        children: buildTree(loc.id)
      }));
  };

  const rootNodes = useMemo(() => buildTree(null), [locations]);

  // Recursive Tree Node Renderer
  const renderTreeNode = (node, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = Boolean(expandedNodes[node.id]);
    const accCount = accCountMap[node.id] || 0;

    // Filter check if searching in tree view
    const isSearchActive = searchTerm || statusFilter;
    const normSearch = normalizeText(searchTerm);
    const matchesFilter =
      (!searchTerm || normalizeText(node.name).includes(normSearch) || normalizeText(node.code).includes(normSearch)) &&
      (!statusFilter || node.status === statusFilter);

    return (
      <div key={node.id} className="tree-node">
        <div
          className="tree-node-content"
          style={{
            paddingLeft: `${14 + depth * 22}px`,
            backgroundColor: matchesFilter && isSearchActive ? '#FEFBE8' : undefined
          }}
        >
          <div className="tree-node-left">
            {hasChildren ? (
              <button
                type="button"
                className="tree-toggle-btn"
                onClick={() => toggleNode(node.id)}
                aria-label={isExpanded ? 'Thu gọn' : 'Mở rộng'}
              >
                {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </button>
            ) : (
              <span style={{ width: '22px', display: 'inline-block' }} />
            )}

            <span style={{ color: '#F4C542' }}>
              {hasChildren ? (
                isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />
              ) : (
                <MapPin size={15} color="#6B7280" />
              )}
            </span>

            <span className="tree-node-title">{node.name}</span>
          </div>

          <div className="tree-node-meta">

            {accCount > 0 && (
              <span
                style={{
                  fontSize: '11px',
                  backgroundColor: '#EAF5EE',
                  color: '#287A4B',
                  border: '1px solid #BAE2C8',
                  borderRadius: '3px',
                  padding: '1px 6px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Building size={11} /> {accCount} Cơ sở lưu trú
              </span>
            )}

            <StatusBadge status={node.status} />

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', marginLeft: '6px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ height: '24px', fontSize: '11px', padding: '0 6px' }}
                onClick={() => handleOpenAddChild(node.id)}
                title="Thêm điểm đến con"
              >
                <Plus size={11} /> Thêm cấp con
              </button>
              <button
                type="button"
                className="row-action-btn"
                style={{ width: '24px', height: '24px' }}
                onClick={() => handleOpenEdit(node)}
                title="Chỉnh sửa điểm đến"
              >
                <Edit2 size={12} />
              </button>
              <button
                type="button"
                className="row-action-btn delete"
                style={{ width: '24px', height: '24px' }}
                onClick={() => setDeleteTargetLocation(node)}
                title="Xóa điểm đến"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Render child nodes if expanded */}
        {hasChildren && isExpanded && (
          <div>{node.children.map((child) => renderTreeNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title="Quản lý điểm đến phân cấp"
        description="Hệ thống cơ sở dữ liệu địa lý đa cấp: Tỉnh/thành phố và các khu vực, điểm đến trực thuộc."
        actions={
          <button type="button" onClick={handleOpenCreateRoot} className="btn btn-primary">
            <Plus size={15} /> Thêm điểm đến
          </button>
        }
      />

      {/* Toolbar & Filters */}
      <div className="filter-panel">
        <div className="filter-group filter-group-wide">
          <label className="filter-label">Tìm kiếm tên điểm đến, tỉnh thành...</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="filter-input"
              style={{ width: '100%', paddingLeft: '28px' }}
              placeholder="Ví dụ: Đà Nẵng, Sa Pa, Cà Mau, Nha Trang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={14} style={{ position: 'absolute', left: '8px', top: '9px', color: '#6B7280' }} />
          </div>
        </div>

        <div className="filter-group">
          <label className="filter-label">Trạng thái</label>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Active">Đang hoạt động</option>
            <option value="Inactive">Ngừng hoạt động</option>
          </select>
        </div>

        <div className="filter-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('');
              setParentFilter('');
            }}
          >
            <RotateCcw size={13} /> Đặt lại
          </button>
        </div>
      </div>

      {/* Bảng điểm đến phân cấp */}
      <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên điểm đến</th>
                <th>Tỉnh / Thành phố</th>
                <th>Điểm đến cha</th>
                <th style={{ textAlign: 'center' }}>Cơ sở lưu trú</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {hierarchicalLocations.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px' }}>
                    Không tìm thấy điểm đến nào phù hợp.
                  </td>
                </tr>
              ) : (
                hierarchicalLocations.map((loc) => {
                  const parent = locations.find((l) => l.id === loc.parent_location_id);
                  const count = accCountMap[loc.id] || 0;
                  return (
                    <tr
                      key={loc.id}
                      style={{
                        backgroundColor: loc.depth > 0 ? '#F9FAFB' : undefined
                      }}
                    >
                      <td className="code-badge">#{loc.id}</td>
                      <td style={{ fontWeight: loc.depth === 0 ? 600 : 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', paddingLeft: `${loc.depth * 24}px` }}>
                          {loc.depth > 0 && (
                            <span style={{ color: '#9CA3AF', marginRight: '6px', fontSize: '13px', fontWeight: 400 }}>↳</span>
                          )}
                          <span>{loc.name}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 500, color: '#374151' }}>
                          {loc.province_name || (parent ? parent.province_name || parent.name : loc.name)}
                        </span>
                      </td>
                      <td>
                        {parent ? (
                          <span style={{ color: '#4B5563', fontSize: '12.5px' }}>{parent.name}</span>
                        ) : (
                          <span style={{ color: '#9CA3AF', fontSize: '12px', fontStyle: 'italic' }}>— (Cấp cao nhất)</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="tabular-nums" style={{ fontWeight: 600 }}>
                          {count}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={loc.status} />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="row-action-btn"
                            title="Thêm điểm đến con"
                            onClick={() => handleOpenAddChild(loc.id)}
                          >
                            <Plus size={12} />
                          </button>
                          <button
                            type="button"
                            className="row-action-btn"
                            title="Chỉnh sửa điểm đến"
                            onClick={() => handleOpenEdit(loc)}
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            type="button"
                            className="row-action-btn delete"
                            title="Xóa điểm đến"
                            onClick={() => setDeleteTargetLocation(loc)}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      {/* Location Create/Edit Modal */}
      <LocationFormModal
        isOpen={modalOpen}
        locationToEdit={editingLocation}
        parentLocationIdForChild={parentForChild}
        locations={locations}
        onSave={handleSaveModal}
        onClose={() => setModalOpen(false)}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetLocation)}
        title="Xóa điểm đến"
        message={`Bạn có chắc chắn muốn xóa "${deleteTargetLocation?.name}"? Bạn sẽ không thể xóa nếu điểm đến này có điểm đến con trực thuộc hoặc có cơ sở lưu trú liên kết.`}
        confirmLabel="Xác nhận xóa"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetLocation(null)}
      />
    </div>
  );
}
