import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext.jsx';
import { Hotel, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('thao.nguyen@vietpeacestay.vn');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const { login } = useAdmin();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    login(email, password);
    navigate('/admin/dashboard');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-icon-box" style={{ width: '38px', height: '38px' }}>
            <Hotel size={22} strokeWidth={2.2} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#292D32' }}>
              VietPeace Stay
            </div>
            <div style={{ fontSize: '11px', color: '#6B7280' }}>
              HỆ THỐNG QUẢN TRỊ NGHỈ DƯỠNG
            </div>
          </div>
        </div>

        <h1 className="auth-title">Cổng thông tin quản trị</h1>
        <p className="auth-subtitle">
          Đăng nhập bằng tài khoản nhân sự nội bộ để quản lý đặt phòng và các cơ sở lưu trú.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Địa chỉ Email nội bộ <span className="required">*</span>
            </label>
            <input
              id="login-email"
              type="email"
              required
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ten@vietpeacestay.vn"
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="login-password">
                Mật khẩu <span className="required">*</span>
              </label>
              <Link
                to="/forgot-password"
                style={{ fontSize: '12px', color: '#6C4200', textDecoration: 'underline' }}
              >
                Quên mật khẩu?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                className="form-input"
                style={{ paddingRight: '36px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu của bạn"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6B7280'
                }}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 0' }}>
            <label className="form-checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span style={{ fontSize: '12.5px' }}>Ghi nhớ phiên đăng nhập</span>
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', height: '38px', fontSize: '14px', marginTop: '6px' }}
          >
            Đăng nhập hệ thống
          </button>
        </form>

        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #E5E7EB', textAlign: 'center', fontSize: '11.5px', color: '#6B7280' }}>
          Hệ thống hạ tầng quản trị lưu trú nội bộ. Chỉ dành cho nhân sự được phân quyền.
        </div>
      </div>
    </div>
  );
}
