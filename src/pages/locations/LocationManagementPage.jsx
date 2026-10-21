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

export default function LocationManagementPage() {
  const { locations, accommodations, addLocation, updateLocation, deleteLocation } = useAdmin();

  // View Mode: 'tree' or 'table'
  const [viewMode, setViewMode] = useState('tree');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [parentFilter, setParentFilter] = useState('');

  // Expand / collapse map for tree nodes
  const [expandedNodes, setExpandedNodes] = useState({ 1: true, 2: true, 6: true, 9: true, 13: true, 17: true });

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

  // Filtered locations for search/filter
  const filteredFlatLocations = useMemo(() => {
    return locations.filter((loc) => {
      const matchSearch =
        !searchTerm ||
        loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = !typeFilter || loc.type === typeFilter;
      const matchStatus = !statusFilter || loc.status === statusFilter;
      const matchParent = !parentFilter || String(loc.parent_location_id) === String(parentFilter);
      return matchSearch && matchType && matchStatus && matchParent;
    });
  }, [locations, searchTerm, typeFilter, statusFilter, parentFilter]);

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
    const isSearchActive = searchTerm || typeFilter || statusFilter;
    const matchesFilter =
      (!searchTerm || node.name.toLowerCase().includes(searchTerm.toLowerCase()) || node.code.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!typeFilter || node.type === typeFilter) &&
      (!statusFilter || node.status === statusFilter);

    const typeLabel = node.type === 'Province / City' ? 'Tỉnh/thành' : node.type === 'Country' ? 'Quốc gia' : node.type;

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
            <span style={{ fontSize: '11px', color: '#6B7280' }} className="code-badge">
              ({node.code})
            </span>
          </div>

          <div className="tree-node-meta">
            <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
              {typeLabel}
            </span>

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
        description="Hệ thống cơ sở dữ liệu địa lý đa cấp: Quốc gia, Tỉnh/thành, Quận/huyện, Phường/xã và Khu du lịch sinh thái."
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            {/* View Mode Toggle */}
            <div style={{ display: 'inline-flex', border: '1px solid #D9DDE2', borderRadius: '4px', overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => setViewMode('tree')}
                className={`btn btn-sm ${viewMode === 'tree' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ border: 'none', borderRadius: 0 }}
              >
                <Network size={13} /> Dạng cây
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ border: 'none', borderRadius: 0 }}
              >
                <TableIcon size={13} /> Dạng bảng
              </button>
            </div>

            <button type="button" onClick={handleOpenCreateRoot} className="btn btn-primary">
              <Plus size={15} /> Thêm điểm đến
            </button>
          </div>
        }
      />

      {/* Toolbar & Filters */}
      <div className="filter-panel">
        <div className="filter-group filter-group-wide">
          <label className="filter-label">Tìm kiếm tên hoặc mã điểm đến</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="filter-input"
              style={{ width: '100%', paddingLeft: '28px' }}
              placeholder="Ví dụ: Đà Nẵng, Sa Pa, Sơn Trà..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={14} style={{ position: 'absolute', left: '8px', top: '9px', color: '#6B7280' }} />
          </div>
        </div>

        <div className="filter-group">
          <label className="filter-label">Loại điểm đến</label>
          <select
            className="filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">Tất cả loại cấp bậc</option>
            <option value="Country">Quốc gia</option>
            <option value="Province / City">Tỉnh/thành</option>
            <option value="Ward / District">Quận/huyện</option>
            <option value="Ward / Commune">Phường/xã</option>
            <option value="Tourism Area">Khu du lịch sinh thái</option>
          </select>
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
              setTypeFilter('');
              setStatusFilter('');
              setParentFilter('');
            }}
          >
            <RotateCcw size={13} /> Đặt lại
          </button>
        </div>
      </div>

      {/* View 1: Hierarchical Tree View */}
      {viewMode === 'tree' ? (
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title">Cấu trúc cây địa lý</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  const allOpen = {};
                  locations.forEach((l) => (allOpen[l.id] = true));
                  setExpandedNodes(allOpen);
                }}
              >
                Mở rộng tất cả
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setExpandedNodes({})}
              >
                Thu gọn tất cả
              </button>
            </div>
          </div>

          <div className="location-tree" style={{ border: 'none' }}>
            {rootNodes.map((root) => renderTreeNode(root, 0))}
          </div>
        </div>
      ) : (
        /* View 2: Flat Table View */
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên điểm đến</th>
                <th>Mã</th>
                <th>Loại cấp bậc</th>
                <th>Điểm đến cha</th>
                <th style={{ textAlign: 'center' }}>Cơ sở lưu trú</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredFlatLocations.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '30px' }}>
                    Không tìm thấy điểm đến nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredFlatLocations.map((loc) => {
                  const parent = locations.find((l) => l.id === loc.parent_location_id);
                  const count = accCountMap[loc.id] || 0;
                  return (
                    <tr key={loc.id}>
                      <td className="code-badge">#{loc.id}</td>
                      <td style={{ fontWeight: 600 }}>{loc.name}</td>
                      <td className="code-badge">{loc.code}</td>
                      <td>
                        <span className="badge badge-neutral">
                          {loc.type === 'Province / City' ? 'Tỉnh/thành' : loc.type}
                        </span>
                      </td>
                      <td>{parent ? `${parent.name} (${parent.type === 'Province / City' ? 'Tỉnh/thành' : parent.type})` : '— (Cấp cao nhất)'}</td>
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
      )}

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
