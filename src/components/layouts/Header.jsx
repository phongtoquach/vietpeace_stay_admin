import React, { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import AuthContext from "../../context/AuthContext";
import { useAdmin } from '../../context/AdminContext.jsx';

import Breadcrumb from '../common/Breadcrumb.jsx';
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  User,
  KeyRound,
  LogOut
} from 'lucide-react';

export default function Header({ breadcrumbItems = [] }) {

  console.log("[Header] Vừa vào hàm component Header !");

  const {
    currentUser,
    isSidebarOpen,
    setIsSidebarOpen,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    showToast
  } = useAdmin();

  const { currentPathName, currentLoggedInUser, logout } = useContext(AuthContext);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
      console.log("[Header] đang chạy useEffect() của component Header !");
      
      // hàm cleanup
      return () => {
          console.log("[Header] đang chạy hàm cleanup của useEffect() !");
      };
  });

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    navigate(`/admin/accommodations?search=${encodeURIComponent(searchTerm)}`);
  };

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    } else {
      setIsSidebarOpen(!isSidebarOpen);
    }
  };

  const handleLogout = () => {
    logout();
    //navigate('/login');
  };

  return (
    <header className="top-header">
      <div className="header-left">
        <button
          type="button"
          className="header-toggle-btn"
          onClick={toggleSidebar}
          aria-label="Thu gọn hoặc mở rộng thanh điều hướng"
          title="Thanh điều hướng"
        >
          <Menu size={16} />
        </button>

        <Breadcrumb items={breadcrumbItems} />
      </div>

      <div className="header-right">
        {/* Quick Search */}
        <form onSubmit={handleSearchSubmit} className="header-search">
          <Search size={14} className="header-search-icon" />
          <input
            type="search"
            placeholder="Tìm cơ sở lưu trú, đặt phòng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>

        {/* Notifications */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            type="button"
            className="header-notification-btn"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            aria-label="Thông báo hệ thống"
            title="Thông báo hệ thống"
          >
            <Bell size={16} />
            <span className="notification-badge" />
          </button>

          {notificationsOpen && (
            <div
              className="header-user-dropdown"
              style={{ width: '290px', right: 0 }}
            >
              <div
                style={{
                  padding: '8px 14px',
                  fontWeight: 600,
                  fontSize: '12.5px',
                  borderBottom: '1px solid #E5E7EB',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>Thông báo hệ thống</span>
                <span className="badge badge-warning">2 Chưa đọc</span>
              </div>
              <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                <div
                  style={{
                    padding: '8px 14px',
                    borderBottom: '1px solid #F3F4F6',
                    fontSize: '12px'
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#292D32' }}>
                    Đơn đặt phòng mới chờ xử lý
                  </div>
                  <div style={{ color: '#6B7280', marginTop: '2px' }}>
                    Khách hàng Lê Hoàng Long vừa đặt Biệt thự có hồ bơi (Phú Quốc).
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#9CA3AF', marginTop: '3px' }}>
                    30 phút trước
                  </div>
                </div>
                <div
                  style={{
                    padding: '8px 14px',
                    fontSize: '12px'
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#292D32' }}>
                    Nhận phòng thành công
                  </div>
                  <div style={{ color: '#6B7280', marginTop: '2px' }}>
                    Trần Thị Mai đã nhận phòng 302 (Hanoi Heritage).
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#9CA3AF', marginTop: '3px' }}>
                    2 giờ trước
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="header-user-menu" ref={dropdownRef}>
          <button
            type="button"
            className="header-user-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-expanded={dropdownOpen}
            aria-label="Menu tài khoản"
          >
            {currentLoggedInUser?.avatarUrl ? (
              <img
                src={currentLoggedInUser.avatarUrl}
                alt={currentLoggedInUser.displayName}
                className="header-user-avatar"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="header-user-avatar">
                {currentLoggedInUser?.displayName ? currentLoggedInUser.displayName.slice(0, 2).toUpperCase() : 'QT'}
              </div>
            )}
            <span className="header-user-name">{currentLoggedInUser?.displayName || 'Quản trị viên'}</span>
            <ChevronDown size={14} color="#6B7280" />
          </button>

          {dropdownOpen && (
            <div className="header-user-dropdown">
              <div style={{ padding: '8px 14px', borderBottom: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#292D32' }}>
                  {currentLoggedInUser?.name}
                </div>
                <div style={{ fontSize: '11.5px', color: '#6B7280' }}>
                  {currentLoggedInUser?.role === 'ADMIN' ? 'Administrator' : 'Accommodation Manager'}
                </div>
              </div>

              <button
                type="button"
                className="header-user-dropdown-item"
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/admin/users');
                }}
              >
                <User size={14} color="#6B7280" />
                <span>Hồ sơ cá nhân</span>
              </button>

              <button
                type="button"
                className="header-user-dropdown-item"
                onClick={() => {
                  setDropdownOpen(false);
                  showToast('Đã mở hộp thoại đổi mật khẩu tài khoản.');
                }}
              >
                <KeyRound size={14} color="#6B7280" />
                <span>Đổi mật khẩu</span>
              </button>

              <div className="header-user-dropdown-divider" />

              <button
                type="button"
                className="header-user-dropdown-item"
                style={{ color: '#C0392B' }}
                onClick={handleLogout}
              >
                <LogOut size={14} color="#C0392B" />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
