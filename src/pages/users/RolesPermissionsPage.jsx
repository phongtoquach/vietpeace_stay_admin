import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import { Save } from 'lucide-react';

export default function RolesPermissionsPage() {
  const { roles, showToast } = useAdmin();

  // Role permissions matrix state
  const [rolePermissions, setRolePermissions] = useState(() => {
    const map = {};
    roles.forEach((r) => {
      map[r.id] = new Set(r.permissions || []);
    });
    return map;
  });

  const roleNameMap = {
    'Super Admin': 'Quản trị viên cấp cao',
    'Accommodation Manager': 'Người quản lý cơ sở lưu trú',
    'Front Desk Supervisor': 'Giám sát lễ tân',
    'Pricing & Revenue Analyst': 'Chuyên viên doanh thu & giá'
  };

  const permissionModules = [
    { key: 'accommodations', label: 'Cơ sở lưu trú & Loại phòng', actions: ['read', 'write', 'delete'] },
    { key: 'bookings', label: 'Đặt phòng & Nhận/Trả phòng', actions: ['read', 'write', 'delete'] },
    { key: 'pricing', label: 'Bảng giá & Kỳ giá đặc biệt', actions: ['read', 'write'] },
    { key: 'locations', label: 'Phân cấp điểm đến', actions: ['read', 'write', 'delete'] },
    { key: 'promotions', label: 'Khuyến mãi & Mã giảm giá', actions: ['read', 'write'] },
    { key: 'customers', label: 'Hồ sơ khách hàng', actions: ['read', 'write'] },
    { key: 'users', label: 'Nhân sự & Phân quyền', actions: ['read', 'write', 'delete'] },
    { key: 'reports', label: 'Báo cáo doanh thu & Công suất', actions: ['view_all'] },
    { key: 'settings', label: 'Cấu hình hệ thống', actions: ['manage'] }
  ];

  const actionLabels = {
    'read': 'Quyền xem (Read)',
    'write': 'Quyền thêm & sửa (Write)',
    'delete': 'Quyền xóa (Delete)',
    'view_all': 'Xem toàn bộ báo cáo',
    'manage': 'Quản lý toàn diện'
  };

  const handleToggle = (roleId, permissionKey) => {
    setRolePermissions((prev) => {
      const currentSet = new Set(prev[roleId]);
      if (currentSet.has(permissionKey)) {
        currentSet.delete(permissionKey);
      } else {
        currentSet.add(permissionKey);
      }
      return {
        ...prev,
        [roleId]: currentSet
      };
    });
  };

  const handleSave = () => {
    showToast('Đã lưu ma trận phân quyền vai trò người dùng thành công.');
  };

  return (
    <div>
      <PageHeader
        title="Vai trò & Ma trận phân quyền (RBAC)"
        description="Ma trận kiểm soát quyền truy cập dựa trên vai trò (RBAC) điều chỉnh quyền xem, tạo, sửa và xóa trên các phân hệ quản trị."
        actions={
          <button type="button" onClick={handleSave} className="btn btn-primary">
            <Save size={14} /> Lưu ma trận phân quyền
          </button>
        }
      />

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '240px' }}>Phân hệ & Quyền hạn</th>
              {roles.map((r) => (
                <th key={r.id} style={{ textAlign: 'center', minWidth: '150px' }}>
                  <div style={{ fontWeight: 700, color: '#292D32' }}>{roleNameMap[r.name] || r.name}</div>
                  <div style={{ fontSize: '11px', color: '#6B7280' }}>
                    {r.users_count} Nhân sự
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissionModules.map((mod) => (
              <React.Fragment key={mod.key}>
                <tr style={{ backgroundColor: '#F8F9FA' }}>
                  <td colSpan={roles.length + 1} style={{ fontWeight: 700, fontSize: '12px', color: '#4B5563', padding: '8px 14px' }}>
                    {mod.label}
                  </td>
                </tr>
                {mod.actions.map((act) => {
                  const permKey = `${mod.key}:${act}`;
                  return (
                    <tr key={permKey}>
                      <td style={{ paddingLeft: '28px', fontSize: '12.5px' }}>
                        {actionLabels[act] || act}
                      </td>
                      {roles.map((r) => {
                        const isChecked = rolePermissions[r.id]?.has(permKey);
                        const isSuperAdmin = r.id === 1;

                        return (
                          <td key={r.id} style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={isSuperAdmin}
                              onChange={() => handleToggle(r.id, permKey)}
                              style={{ cursor: isSuperAdmin ? 'not-allowed' : 'pointer' }}
                              aria-label={`Bật tắt ${permKey} cho ${r.name}`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '14px', fontSize: '11.5px', color: '#6B7280' }}>
        * Ghi chú: Quản trị viên cấp cao (Super Admin) luôn giữ toàn quyền bất biến trên mọi phân hệ của hệ thống.
      </div>
    </div>
  );
}
