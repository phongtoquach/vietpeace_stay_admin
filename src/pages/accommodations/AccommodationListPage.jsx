import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext.jsx';
import { lookupsApi } from '../../api/lookups.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import { Plus, Eye, Edit2, Trash2, Search, RotateCcw, Star } from 'lucide-react';

// Whitelist các cột thực sự bấm sort được trên UI (khớp `accessor` của columns).
// Dùng để chặn URL rác kiểu ?sortBy=abc — URL do người dùng sửa tay được, không tin.
const SORTABLE_FIELDS = [
  'id',
  'cover_image',
  'name',
  'type',
  'location_id',
  'room_types_count',
  'star_rating',
  'status'
];

// Khớp `pageSizeOptions` mặc định của Pagination để URL không khôi phục cỡ trang lạ.
const ALLOWED_PAGE_SIZES = [5, 10, 20, 50];

export default function AccommodationListPage() {
  const {
    accommodations,
    deleteAccommodation,
    fetchAccommodations,
    accommodationsLoading,
    accommodationsError,
    accommodationsPagination
  } = useAdmin();



  const [searchParams, setSearchParams] = useSearchParams();

  // Filters state
  // Mỗi useState nhận MỘT HÀM khởi tạo: hàm chỉ chạy ở lần render đầu tiên.
  // Nhờ vậy khi F5, state được dựng lại từ query string thay vì giá trị mặc định.
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');
  // Từ khóa "chờ" (dùng để gọi API) cũng khôi phục từ URL,
  // để lần fetch đầu tiên sau F5 dùng đúng từ khóa cũ.
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(
    () => searchParams.get('search') || ''
  );
  const [typeFilter, setTypeFilter] = useState(() => searchParams.get('typeId') || '');
  const [locationFilter, setLocationFilter] = useState(
    () => searchParams.get('locationId') || ''
  );
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || '');
  const [featuredFilter, setFeaturedFilter] = useState(
    () => searchParams.get('isFeatured') || ''
  );

  // Table state
  const [sortField, setSortField] = useState(() => {
    const value = searchParams.get('sortBy');
    return SORTABLE_FIELDS.includes(value) ? value : 'id';
  });
  const [sortDirection, setSortDirection] = useState(() =>
    searchParams.get('sortDir') === 'desc' ? 'desc' : 'asc'
  );
  // parseInt('abc') trả NaN → Number.isInteger(NaN) = false → rơi về mặc định.
  const [currentPage, setCurrentPage] = useState(() => {
    const page = Number.parseInt(searchParams.get('page'), 10);
    return Number.isInteger(page) && page >= 1 ? page : 1;
  });
  // limit lạ (ví dụ ?limit=9999) bị kẹp về 10 để khớp dropdown của Pagination.
  const [pageSize, setPageSize] = useState(() => {
    const size = Number.parseInt(searchParams.get('limit'), 10);
    return ALLOWED_PAGE_SIZES.includes(size) ? size : 10;
  });
  const [selectedIds, setSelectedIds] = useState([]);

  // Danh sách điểm đến cho dropdown, lấy từ bảng dbo.locations thật.
  // Không dùng `locations` của context vì đó vẫn là dữ liệu mock,
  // id mock không khớp id thật nên filter sẽ gửi sai locationId.
  const [locations, setLocations] = useState([]);

  // Context vẫn khởi tạo `accommodations` bằng mock (các trang khác còn dùng),
  // nên lần render đầu tiên bảng sẽ lóe dữ liệu mock trước khi request thật chạy.
  // Cờ này giữ skeleton cho tới khi request đầu tiên kết thúc, list không bao giờ
  // hiển thị dữ liệu giả; nếu request lỗi thì thôi chặn để hiện bảng rỗng + lỗi.
  const [firstLoadSettled, setFirstLoadSettled] = useState(false);

  // Confirm delete dialog
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLocations() {
      console.group('[AccommodationListPage] Tải điểm đến cho filter');
      console.log('[1] Bắt đầu gọi /lookup/locations');
      try {
        const items = await lookupsApi.getLocations();
        if (cancelled) {
          console.warn('[2] Component đã unmount, bỏ qua kết quả.');
          return;
        }
        setLocations(items);
        console.log('[3] Đã set state locations:', items.length);
      } catch (error) {
        if (!cancelled) {
          console.error('[ERROR] Không tải được điểm đến:', error);
        }
      } finally {
        if (!cancelled) {
          console.log('[4] Kết thúc tải điểm đến.');
        }
        console.groupEnd();
      }
    }

    loadLocations();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Hủy timer cũ nếu người dùng tiếp tục gõ trước 300ms.
    const timerId = window.setTimeout(() => {
      console.log(
        '[AccommodationListPage] Debounce hoàn tất, từ khóa mới:',
        searchTerm
      );
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [searchTerm]);

  // Log MỘT lần khi mount để đối chiếu: F5 xong, các giá trị dưới đây
  // phải giống hệt trước khi reload — nếu khác, lỗi nằm ở bước đọc URL.
  useEffect(() => {
    console.group('[AccommodationListPage] [URL] Khôi phục bộ lọc khi mount/F5');
    console.log('[1] Query string hiện tại:', searchParams.toString() || '(rỗng)');
    console.log('[2] State sau khi khôi phục:', {
      search: debouncedSearchTerm,
      typeId: typeFilter,
      locationId: locationFilter,
      status: statusFilter,
      isFeatured: featuredFilter,
      sortBy: sortField,
      sortDir: sortDirection,
      page: currentPage,
      limit: pageSize
    });
    console.groupEnd();
    // Chỉ chạy ở lần mount đầu; các lần đổi URL sau do effect đồng bộ bên dưới xử lý.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Đồng bộ state -> URL. Nhờ effect này, F5 luôn dựng lại được màn hình.
  // Ghi bằng debouncedSearchTerm (không phải searchTerm) để không ghi URL mỗi phím gõ.
  useEffect(() => {
    // Chỉ đưa lên URL các giá trị KHÁC mặc định → URL ngắn, dễ đọc.
    const nextParams = {};
    if (debouncedSearchTerm) nextParams.search = debouncedSearchTerm;
    if (typeFilter) nextParams.typeId = typeFilter;
    if (locationFilter) nextParams.locationId = locationFilter;
    if (statusFilter) nextParams.status = statusFilter;
    if (featuredFilter) nextParams.isFeatured = featuredFilter;
    if (sortField !== 'id') nextParams.sortBy = sortField;
    if (sortDirection !== 'asc') nextParams.sortDir = sortDirection;
    if (currentPage > 1) nextParams.page = String(currentPage);
    if (pageSize !== 10) nextParams.limit = String(pageSize);

    // Thứ tự key cố định vì object dựng theo cùng một thứ tự mỗi lần,
    // nên so sánh chuỗi là đủ để biết URL có thay đổi thật hay không.
    const nextQuery = new URLSearchParams(nextParams).toString();
    const currentQuery = searchParams.toString();

    console.log('[AccommodationListPage] [URL] So sánh query:', {
      nextQuery: nextQuery || '(rỗng)',
      currentQuery: currentQuery || '(rỗng)'
    });

    // Chốt chặn vòng lặp: setSearchParams làm searchParams đổi -> effect chạy lại.
    // Lần chạy thứ hai thấy chuỗi giống hệt thì dừng, không ghi nữa.
    if (nextQuery === currentQuery) {
      console.log('[AccommodationListPage] [URL] Không đổi → bỏ qua ghi URL');
      return;
    }

    console.log('[AccommodationListPage] [URL] Ghi URL (replace: true):', nextParams);

    // replace: true -> thay entry hiện tại thay vì đẩy thêm entry mới.
    // Mục đích: bấm Back không phải "lùi từng lần lọc", mà về trang trước đó.
    setSearchParams(nextParams, { replace: true });
  }, [
    debouncedSearchTerm,
    typeFilter,
    locationFilter,
    statusFilter,
    featuredFilter,
    sortField,
    sortDirection,
    currentPage,
    pageSize,
    searchParams,
    setSearchParams
  ]);

  useEffect(() => {
    let cancelled = false;
    async function loadAccommodations() {
      // Backend chịu trách nhiệm filter, sort và pagination trên toàn bộ dữ liệu.
      const requestParams = {
        q: debouncedSearchTerm || undefined,
        typeId: typeFilter || undefined,
        locationId: locationFilter || undefined,
        status: statusFilter || undefined,
        isFeatured: featuredFilter || undefined,
        sortBy: sortField,
        sortDir: sortDirection,
        page: currentPage,
        limit: pageSize
      };
      console.group(
        `[AccommodationListPage] Tải trang ${currentPage}`
      );
      console.log('[1] Params filter gửi lên API:', {
        search: debouncedSearchTerm,
        typeId: typeFilter,
        locationId: locationFilter,
        status: statusFilter,
        isFeatured: featuredFilter,
        sortBy: sortField,
        sortDir: sortDirection,
        page: currentPage,
        limit: pageSize,
        requestParams
      });
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
          // Đánh dấu đã có kết quả thật (kể cả lỗi) để bỏ chặn skeleton.
          setFirstLoadSettled(true);
        }
        console.groupEnd();
      }
    }
    loadAccommodations();
    return () => {
      cancelled = true;
    };
  }, [
    fetchAccommodations,
    debouncedSearchTerm,
    typeFilter,
    locationFilter,
    statusFilter,
    featuredFilter,
    sortField,
    sortDirection,
    currentPage,
    pageSize
  ]);

  // Theo dõi luồng loading: context bật/tắt cờ này trong fetchAccommodations,
  // trang chỉ đọc lại và chuyển tiếp xuống DataTable.
  useEffect(() => {
    console.log(
      '[AccommodationListPage] accommodationsLoading đổi thành:',
      accommodationsLoading
    );
    return () => {
      console.log(
        '[AccommodationListPage] cleanup effect loading, giá trị cũ:',
        accommodationsLoading
      );
    };
  }, [accommodationsLoading]);

  // Backend đã filter, sort và paginate toàn bộ dữ liệu.
  // Frontend chỉ render trang hiện tại, không lọc lại lần thứ hai.
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
      // DTO list trả location: { id, name }; adapter giữ nguyên object này.
      // Đọc thẳng tên từ API, không tra map mock nên không còn rơi về "Việt Nam".
      render: (row) => <span>{row.location?.name || '—'}</span>
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
      render: (row) => {
        // star_rating NULL = chưa xếp hạng, không phải 0 sao.
        // Nếu không tách nhánh, chuỗi `${null}.0` sẽ render thành ".0".
        if (row.star_rating === null || row.star_rating === undefined) {
          // Chỉ log dòng thật sự thiếu hạng sao, tránh spam 10 dòng mỗi lần render.
          console.log(
            '[AccommodationListPage] Cơ sở chưa có hạng sao:',
            { id: row.id, name: row.name }
          );
          return <span style={{ color: '#6B7280' }}>—</span>;
        }

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#F4C542' }}>
            <Star size={13} fill="#F4C542" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#292D32' }}>
              {row.star_rating}.0
            </span>
          </div>
        );
      }
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
              const value = e.target.value;
              console.log('[AccommodationListPage] Filter loại hình thay đổi:', value || '(tất cả)');
              setTypeFilter(value);
              setCurrentPage(1);
            }}
          >
            <option value="">Tất cả loại hình</option>
            <option value="1">Khách sạn (Hotel)</option>
            <option value="2">Khu nghỉ dưỡng (Resort)</option>
            <option value="3">Homestay</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label" htmlFor="filter-loc">Điểm đến:</label>
          <select
            id="filter-loc"
            className="filter-select"
            value={locationFilter}
            onChange={(e) => {
              const value = e.target.value;
              console.log('[AccommodationListPage] Filter điểm đến thay đổi:', value || '(tất cả)');
              setLocationFilter(value);
              setCurrentPage(1);
            }}
          >
            <option value="">Tất cả điểm đến</option>
            {locations.map((loc) => (
              // Hiển thị đúng name trong DB; bảng locations không có cột type
              // nên bỏ các nhãn ★ / lọc Country của dữ liệu mock cũ.
              <option key={loc.id} value={loc.id}>
                {loc.name}
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
              const value = e.target.value;
              console.log('[AccommodationListPage] Filter trạng thái thay đổi:', value || '(tất cả)');
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="0">Bản nháp</option>
            <option value="1">Đang hoạt động</option>
            <option value="2">Ngừng hoạt động</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label" htmlFor="filter-featured">Nổi bật:</label>
          <select
            id="filter-featured"
            className="filter-select"
            value={featuredFilter}
            onChange={(e) => {
              const value = e.target.value;
              console.log('[AccommodationListPage] Filter nổi bật thay đổi:', value || '(tất cả)');
              setFeaturedFilter(value);
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

      {/* Chỉ còn MỘT quyết định render: DataTable tự vẽ skeleton khi loading,
          nên không còn hai chữ "Đang tải" chồng nhau và header bảng không mất. */}
      <DataTable
        columns={columns}
        data={paginatedData}
        loading={accommodationsLoading || (!firstLoadSettled && !accommodationsError)}
        skeletonRows={pageSize}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        selectedRows={selectedIds}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
        emptyMessage="Không tìm thấy cơ sở lưu trú nào."
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={totalItems}
        pageSizeOptions={ALLOWED_PAGE_SIZES}
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
