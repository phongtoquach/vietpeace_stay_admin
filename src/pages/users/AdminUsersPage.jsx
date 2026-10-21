import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import FormInput from '../../components/forms/FormInput.jsx';
import FormSelect from '../../components/forms/FormSelect.jsx';
import { formatDateVN } from '../../data/mockData.js';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';

export default function AdminUsersPage() {
  const { adminUsers, roles, addAdminUser, updateAdminUser, deleteAdminUser } = useAdmin();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Front Desk Supervisor',
    status: 'Active',
    password: ''
  });

  const roleNameMap = {
    'Super Admin': 'Quản trị viên cấp cao (Super Admin)',
    'Accommodation Manager': 'Người quản lý cơ sở lưu trú',
    'Front Desk Supervisor': 'Giám sát lễ tân',
    'Pricing & Revenue Analyst': 'Chuyên viên phân tích doanh thu & giá'
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'Front Desk Supervisor',
      status: 'Active',
      password: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      status: user.status,
      password: ''
    });
    setModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;

    if (editingUser) {
      updateAdminUser(editingUser.id, formData);
    } else {
      addAdminUser(formData);
    }
    setModalOpen(false);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteAdminUser(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Tài khoản nhân sự quản trị"
        description="Quản lý định danh nhân sự nội bộ, phân quyền vai trò vận hành và kiểm soát quyền truy cập hệ thống."
        actions={
          <button type="button" onClick={handleOpenCreate} className="btn btn-primary">
            <Plus size={15} /> Thêm nhân sự quản trị
          </button>
        }
      />

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>ID</th>
              <th>Họ và tên</th>
              <th>Email nội bộ</th>
              <th>Số điện thoại</th>
              <th>Vai trò phân quyền</th>
              <th>Ngày tham gia</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'center', width: '90px' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {adminUsers.map((user) => (
              <tr key={user.id}>
                <td className="code-badge">#{user.id}</td>
                <td>
                  <div style={{ fontWeight: 600, color: '#292D32' }}>{user.name}</div>
                </td>
                <td>{user.email}</td>
                <td className="tabular-nums">{user.phone}</td>
                <td>
                  <span className="badge badge-warning">{roleNameMap[user.role] || user.role}</span>
                </td>
                <td className="tabular-nums" style={{ fontSize: '12px' }}>
                  {formatDateVN(user.created_date)}
                </td>
                <td>
                  <StatusBadge status={user.status} />
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="row-action-btn"
                      title="Chỉnh sửa tài khoản"
                      onClick={() => handleOpenEdit(user)}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      className="row-action-btn delete"
                      title="Xóa tài khoản"
                      onClick={() => setDeleteTarget(user)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">
                {editingUser ? `Chỉnh sửa nhân sự: ${editingUser.name}` : 'Thêm tài khoản nhân sự mới'}
              </span>
              <button className="modal-close" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <FormInput
                    label="Họ và tên"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ví dụ: Trần Bảo Ngọc"
                    required
                  />

                  <FormInput
                    label="Email công việc"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ten@vietpeacestay.vn"
                    required
                  />

                  <FormInput
                    label="Số điện thoại liên hệ"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0908 123 456"
                  />

                  <FormSelect
                    label="Vai trò quản trị"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    options={roles.map((r) => ({ value: r.name, label: roleNameMap[r.name] || r.name }))}
                    required
                  />

                  <FormSelect
                    label="Trạng thái tài khoản"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    options={[
                      { value: 'Active', label: 'Đang hoạt động (Cho phép đăng nhập)' },
                      { value: 'Inactive', label: 'Ngừng hoạt động (Tạm khóa)' }
                    ]}
                  />

                  {!editingUser && (
                    <FormInput
                      label="Mật khẩu khởi tạo ban đầu"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Tối thiểu 8 ký tự"
                      required
                      helperText="Mật khẩu tạm thời cho nhân viên mới đăng nhập lần đầu."
                    />
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={14} /> {editingUser ? 'Lưu thay đổi' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Xóa tài khoản quản trị"
        message={`Bạn có chắc chắn muốn thu hồi quyền và xóa tài khoản của "${deleteTarget?.name}"?`}
        confirmLabel="Xác nhận xóa"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
