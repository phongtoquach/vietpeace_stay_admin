import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import { Plus, Eye, Edit2, Trash2, Search, RotateCcw, Star } from 'lucide-react';

export default function AccommodationListPage() {
  const {
    accommodations,
    locations,
    deleteAccommodation,
    fetchAccommodations,
    accommodationsLoading,
    accommodationsError,
    accommodationsPagination
  } = useAdmin();



  const [searchParams, setSearchParams] = useSearchParams();

  // Filters state
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [typeFilter, setTypeFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('');

  // Table state
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState([]);

  // Confirm delete dialog
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function loadAccommodations() {
      const requestParams = {
        page: currentPage,
        limit: pageSize
      };
      console.group(
        `[AccommodationListPage] Tải trang ${currentPage}`
      );
      console.log(
        '[1] Params gửi lên API:',
        requestParams
      );
      try {
        const payload = await fetchAccommodations(requestParams);
        if (cancelled) {
          console.warn(
            '[2] Component đã unmount, bỏ qua response.'
          );
          return;
        }
        console.log(
          '[2] API trả về số item:',
          payload?.data?.items?.length || 0
        );
        console.log(
          '[3] Pagination backend:',
          payload?.data?.pagination
        );
        console.log(
          '[4] Item đầu tiên của trang:',
          payload?.data?.items?.[0] || null
        );
      } catch (error) {
        if (!cancelled) {
          console.error(
            '[ERROR] Tải danh sách thất bại:',
            error
          );
        }
      } finally {
        if (!cancelled) {
          console.log(
            '[5] Hoàn tất request trang:',
            currentPage
          );
        }
        console.groupEnd();
      }
    }
    loadAccommodations();
    return () => {
      cancelled = true;
    };
  }, [fetchAccommodations, currentPage, pageSize]);

  // Map location names for display
  const locationMap = useMemo(() => {
    const map = {};
    locations.forEach((loc) => {
      let fullName = loc.name;
      if (loc.parent_location_id) {
        const parent = locations.find((l) => l.id === loc.parent_location_id);
        if (parent) {
          fullName = `${parent.name} - ${loc.name}`;
        }
      }
      map[loc.id] = fullName;
    });
    return map;
  }, [locations]);

  // Filtered and sorted dataset
  const filteredData = useMemo(() => {
    return accommodations.filter((item) => {
      const matchSearch =
        !searchTerm ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.address.toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = !typeFilter || item.type === typeFilter;
      const matchLocation = !locationFilter || String(item.location_id) === String(locationFilter);
      const matchStatus = !statusFilter || item.status === statusFilter;
      const matchFeatured = !featuredFilter || (featuredFilter === 'true' ? item.featured : !item.featured);

      return matchSearch && matchType && matchLocation && matchStatus && matchFeatured;
    }).sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [accommodations, searchTerm, typeFilter, locationFilter, statusFilter, featuredFilter, sortField, sortDirection]);

  // Dữ liệu đã được backend phân trang sẵn.
  // Không dùng slice() lần nữa vì sẽ cắt nhầm trang hiện tại.
  const paginatedData = accommodations;

  const totalItems = accommodationsPagination.total;

  const handleResetFilters = () => {
    setSearchTerm('');
    setTypeFilter('');
    setLocationFilter('');
    setStatusFilter('');
    setFeaturedFilter('');
    setCurrentPage(1);
    setSearchParams({});
  };

  const handleSort = (field, direction) => {
    setSortField(field);
    setSortDirection(direction);
  };

  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(paginatedData.map((d) => d.id));
    } else {
      setSelectedIds([]);
    }
  };

  const confirmDelete = () => {
    if (deleteTargetId) {
      deleteAccommodation(deleteTargetId);
      setDeleteTargetId(null);
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
      header: 'Ảnh bìa',
      accessor: 'cover_image',
      width: '80px',
      render: (row) => (
        <div style={{ width: '60px', height: '42px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #D9DDE2', backgroundColor: '#F3F4F6' }}>
          <img
            src={row.cover_image}
            alt={row.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            referrerPolicy="no-referrer"
            onLoad={() => {
              console.log(
                '[AccommodationListPage] Ảnh tải thành công:',
                {
                  id: row.id,
                  name: row.name,
                  src: row.cover_image
                }
              );
            }}
            onError={(event) => {
              console.error(
                '[AccommodationListPage] Ảnh tải thất bại:',
                {
                  id: row.id,
                  name: row.name,
                  src: row.cover_image,
                  currentSrc: event.currentTarget.currentSrc
                }
              );
            }}
          />

        </div>
      )
    },
    {
      header: 'Tên cơ sở lưu trú',
      accessor: 'name',
      sortable: true,
      render: (row) => (
        <div>
          <Link
            to={`/admin/accommodations/${row.id}`}
            style={{ fontWeight: 600, color: '#292D32' }}
          >
            {row.name}
          </Link>
          <div style={{ fontSize: '11px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span className="code-badge">{row.code}</span>
            <span>·</span>
            <span>{row.address}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Loại hình',
      accessor: 'type',
      sortable: true,
      width: '120px',
      render: (row) => <StatusBadge status={row.type} />
    },
    {
      header: 'Điểm đến',
      accessor: 'location_id',
      sortable: true,
      render: (row) => <span>{locationMap[row.location_id] || 'Việt Nam'}</span>
    },
    {
      header: 'Loại phòng',
      accessor: 'room_types_count',
      sortable: true,
      width: '110px',
      align: 'center',
      render: (row) => (
        <span className="tabular-nums" style={{ fontWeight: 600 }}>
          {row.room_types_count || 0} loại
        </span>
      )
    },
    {
      header: 'Hạng sao',
      accessor: 'star_rating',
      sortable: true,
      width: '100px',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#F4C542' }}>
          <Star size={13} fill="#F4C542" />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#292D32' }}>
            {row.star_rating}.0
          </span>
        </div>
      )
    },
    {
      header: 'Trạng thái',
      accessor: 'status',
      sortable: true,
      width: '130px',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Thao tác',
      accessor: 'actions',
      width: '115px',
      align: 'center',
      render: (row) => (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Link
            to={`/admin/accommodations/${row.id}`}
            className="row-action-btn"
            title="Xem chi tiết"
            aria-label={`Xem ${row.name}`}
          >
            <Eye size={13} />
          </Link>
          <Link
            to={`/admin/accommodations/${row.id}/edit`}
            className="row-action-btn"
            title="Chỉnh sửa cơ sở lưu trú"
            aria-label={`Chỉnh sửa ${row.name}`}
          >
            <Edit2 size={13} />
          </Link>
          <button
            type="button"
            className="row-action-btn delete"
            title="Xóa cơ sở lưu trú"
            onClick={() => setDeleteTargetId(row.id)}
            aria-label={`Xóa ${row.name}`}
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
        title="Quản lý cơ sở lưu trú"
        description="Quản lý danh sách khách sạn, khu nghỉ dưỡng và homestay trực thuộc hệ thống VietPeace Stay."
        breadcrumb={[
          { label: 'Cơ sở lưu trú' }
        ]}
        actions={
          <Link to="/admin/accommodations/create" className="btn btn-primary">
            <Plus size={15} /> Thêm cơ sở lưu trú
          </Link>
        }
      />

      {/* Filter Panel */}
      <div className="filter-panel">
        <div className="filter-group filter-group-wide">
          <label className="filter-label" htmlFor="search-acc">Từ khóa tìm kiếm:</label>
          <div style={{ position: 'relative' }}>
            <input
              id="search-acc"
              type="text"
              className="filter-input"
              style={{ width: '100%', paddingLeft: '28px' }}
              placeholder="Tìm theo tên cơ sở, mã, địa chỉ..."
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
          <label className="filter-label" htmlFor="filter-type">Loại hình lưu trú:</label>
          <select
            id="filter-type"
            className="filter-select"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Tất cả loại hình</option>
            <option value="Hotel">Khách sạn (Hotel)</option>
            <option value="Resort">Khu nghỉ dưỡng (Resort)</option>
            <option value="Homestay">Homestay</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label" htmlFor="filter-loc">Điểm đến:</label>
          <select
            id="filter-loc"
            className="filter-select"
            value={locationFilter}
            onChange={(e) => {
              setLocationFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Tất cả điểm đến</option>
            {locations.filter((l) => l.type !== 'Country').map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.type === 'Tourism Area' ? `★ ${loc.name}` : loc.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label" htmlFor="filter-status">Trạng thái:</label>
          <select
            id="filter-status"
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

        <div className="filter-group">
          <label className="filter-label" htmlFor="filter-featured">Nổi bật:</label>
          <select
            id="filter-featured"
            className="filter-select"
            value={featuredFilter}
            onChange={(e) => {
              setFeaturedFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Tất cả</option>
            <option value="true">Chỉ cơ sở nổi bật</option>
            <option value="false">Cơ sở tiêu chuẩn</option>
          </select>
        </div>

        <div className="filter-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleResetFilters}
            title="Đặt lại bộ lọc"
          >
            <RotateCcw size={13} /> Đặt lại lọc
          </button>
        </div>
      </div>

      {accommodationsLoading && (
        <div className="empty-state">
          Đang tải danh sách cơ sở lưu trú...
        </div>
      )}

      {accommodationsLoading ? (
        <div className="empty-state">
          Đang tải danh sách cơ sở lưu trú...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={paginatedData}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          selectedRows={selectedIds}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          emptyMessage="Không tìm thấy cơ sở lưu trú nào."
        />
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={(page) => {
          console.log(
            '[Pagination] Người dùng chọn trang:',
            page
          );

          console.log(
            '[Pagination] Trang hiện tại trước khi đổi:',
            currentPage
          );

          setCurrentPage(page);
        }}
        onPageSizeChange={(size) => {
          console.log(
            '[Pagination] Người dùng đổi số dòng:',
            size
          );

          setPageSize(size);
          setCurrentPage(1);
        }}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        title="Xác nhận xóa cơ sở lưu trú"
        message="Bạn có chắc chắn muốn xóa vĩnh viễn cơ sở lưu trú này? Thao tác này cũng sẽ xóa toàn bộ các loại phòng và cấu hình giá liên quan."
        confirmLabel="Xóa cơ sở lưu trú"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
