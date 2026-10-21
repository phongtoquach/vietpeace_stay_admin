import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import { formatVND } from '../../data/mockData.js';
import { Plus, Edit2, Trash2, Search, RotateCcw } from 'lucide-react';

export default function RoomTypeListPage() {
  const { roomTypes, accommodations, deleteRoomType } = useAdmin();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [accommodationFilter, setAccommodationFilter] = useState('');
  const [viewFilter, setViewFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Table state
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Accommodation map for easy lookup
  const accMap = useMemo(() => {
    const map = {};
    accommodations.forEach((a) => {
      map[a.id] = a.name;
    });
    return map;
  }, [accommodations]);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return roomTypes.filter((item) => {
      const matchSearch =
        !searchTerm ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.bed_type.toLowerCase().includes(searchTerm.toLowerCase());

      const matchAcc = !accommodationFilter || String(item.accommodation_id) === String(accommodationFilter);
      const matchView = !viewFilter || item.view === viewFilter;
      const matchStatus = !statusFilter || item.status === statusFilter;

      return matchSearch && matchAcc && matchView && matchStatus;
    }).sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [roomTypes, searchTerm, accommodationFilter, viewFilter, statusFilter, sortField, sortDirection]);

  // Pagination
  const totalItems = filteredData.length;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setAccommodationFilter('');
    setViewFilter('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  const handleSort = (field, direction) => {
    setSortField(field);
    setSortDirection(direction);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteRoomType(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const columns = [
    {
      header: 'Mã',
      accessor: 'id',
      sortable: true,
      width: '60px',
      render: (row) => <span className="code-badge">#{row.id}</span>
    },
    {
      header: 'Hình ảnh',
      accessor: 'room_image',
      width: '80px',
      render: (row) => (
        <div style={{ width: '56px', height: '40px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #D9DDE2', backgroundColor: '#F3F4F6' }}>
          <img
            src={row.room_image}
            alt={row.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            referrerPolicy="no-referrer"
          />
        </div>
      )
    },
    {
      header: 'Tên loại phòng',
      accessor: 'name',
      sortable: true,
      render: (row) => (
        <div>
          <Link
            to={`/admin/room-types/${row.id}/edit`}
            style={{ fontWeight: 600, color: '#292D32' }}
          >
            {row.name}
          </Link>
          <div style={{ fontSize: '11px', color: '#6B7280' }} className="code-badge">
            Mã: {row.code} · Diện tích: {row.room_size} m²
          </div>
        </div>
      )
    },
    {
      header: 'Cơ sở lưu trú',
      accessor: 'accommodation_id',
      sortable: true,
      render: (row) => (
        <Link
          to={`/admin/accommodations/${row.accommodation_id}`}
          style={{ color: '#8C5A00', fontWeight: 500 }}
        >
          {accMap[row.accommodation_id] || 'N/A'}
        </Link>
      )
    },
    {
      header: 'Loại giường',
      accessor: 'bed_type',
      sortable: true,
      render: (row) => <span>{row.bed_type}</span>
    },
    {
      header: 'Người lớn',
      accessor: 'included_adults',
      sortable: true,
      width: '105px',
      align: 'center',
      render: (row) => <span className="tabular-nums">{row.included_adults} người lớn</span>
    },
    {
      header: 'Sức chứa tối đa',
      accessor: 'max_occupancy',
      sortable: true,
      width: '115px',
      align: 'center',
      render: (row) => <span className="tabular-nums">{row.max_occupancy} khách</span>
    },
    {
      header: 'Giá gốc / đêm',
      accessor: 'base_price',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span style={{ fontWeight: 600, color: '#292D32' }} className="tabular-nums">
          {formatVND(row.base_price)}
        </span>
      )
    },
    {
      header: 'Trạng thái',
      accessor: 'status',
      sortable: true,
      width: '120px',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Thao tác',
      accessor: 'actions',
      width: '95px',
      align: 'center',
      render: (row) => (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Link
            to={`/admin/room-types/${row.id}/edit`}
            className="row-action-btn"
            title="Chỉnh sửa loại phòng"
          >
            <Edit2 size={13} />
          </Link>
          <button
            type="button"
            className="row-action-btn delete"
            title="Xóa loại phòng"
            onClick={() => setDeleteTarget(row)}
          >
            <Trash2 size={13} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Quản lý loại phòng"
        description="Danh mục phân loại phòng lưu trú, cấu hình giường, sức chứa khách tối đa và giá gốc áp dụng."
        breadcrumb={[
          { label: 'Cơ sở lưu trú', path: '/admin/accommodations' },
          { label: 'Loại phòng' }
        ]}
        actions={
          <Link to="/admin/room-types/create" className="btn btn-primary">
            <Plus size={15} /> Thêm loại phòng
          </Link>
        }
      />

      {/* Filters */}
      <div className="filter-panel">
        <div className="filter-group filter-group-wide">
          <label className="filter-label" htmlFor="search-room-type">Tìm kiếm loại phòng:</label>
          <div style={{ position: 'relative' }}>
            <input
              id="search-room-type"
              type="text"
              className="filter-input"
              style={{ width: '100%', paddingLeft: '28px' }}
              placeholder="Tìm theo tên phòng, mã phòng, loại giường..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            <Search size={14} style={{ position: 'absolute', left: '8px', top: '9px', color: '#6B7280' }} />
          </div>
        </div>

        <div className="filter-group">
          <label className="filter-label" htmlFor="filter-acc-select">Cơ sở lưu trú:</label>
          <select
            id="filter-acc-select"
            className="filter-select"
            value={accommodationFilter}
            onChange={(e) => {
              setAccommodationFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Tất cả cơ sở lưu trú</option>
            {accommodations.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label" htmlFor="filter-view-select">Hướng nhìn:</label>
          <select
            id="filter-view-select"
            className="filter-select"
            value={viewFilter}
            onChange={(e) => {
              setViewFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Tất cả hướng nhìn</option>
            <option value="Sea">Hướng biển (Sea View)</option>
            <option value="Garden">Hướng vườn (Garden View)</option>
            <option value="Mountain">Hướng núi (Mountain View)</option>
            <option value="City">Hướng phố (City View)</option>
            <option value="Other">Khác (Other View)</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label" htmlFor="filter-status-select">Trạng thái:</label>
          <select
            id="filter-status-select"
            className="filter-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
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
            onClick={handleResetFilters}
          >
            <RotateCcw size={13} /> Đặt lại lọc
          </button>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={paginatedData}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        emptyMessage="Không tìm thấy loại phòng nào phù hợp với bộ lọc."
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={(page) => setCurrentPage(page)}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Xác nhận xóa loại phòng"
        message={`Bạn có chắc chắn muốn xóa loại phòng "${deleteTarget?.name}"? Bảng giá ngày trong tuần liên quan cũng sẽ bị gỡ bỏ.`}
        confirmLabel="Xóa loại phòng"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
