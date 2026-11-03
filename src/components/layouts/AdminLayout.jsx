import React, { useEffect, useContext } from 'react';
import { Outlet, Navigate } from 'react-router-dom';


import AuthContext from "../../context/AuthContext";
import { useAdmin } from '../../context/AdminContext.jsx';

import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import NotificationToast from '../common/NotificationToast.jsx';

export default function AdminLayout({ breadcrumbs = [] }) {
	const { isMobileSidebarOpen, setIsMobileSidebarOpen } = useAdmin();

	console.log("[AdminLayout] Vừa vào hàm component AdminLayout !");

    const { currentLoggedInUser, isCheckingAuthen, authError, currentUrl, logout } = useContext(AuthContext);

    useEffect(() => {
        console.log("[AdminLayout] đang chạy useEffect() của component AdminLayout !");
        
        // hàm cleanup
        return () => {
            console.log("[AdminLayout] đang chạy hàm cleanup của useEffect() !");
        };
    });

    console.log("[AdminLayout] useState AuthProvider.isCheckingAuthen : ", isCheckingAuthen);

    // Chỉ chặn khi đang check auth. Trước đây còn chặn theo isRouteUrlChanged
    // (biến mutate trong render của AuthContext) — sau khi bỏ refetch auth
    // mỗi navigation, không còn state update ép re-render sau nhịp đổi URL
    // nên app kẹt vĩnh viễn ở màn này. Điều kiện đó không bảo vệ gì, đã gỡ.
    if (isCheckingAuthen === true) {
        console.log("[AdminLayout] useState AuthProvider.isCheckingAuthen = true ! Return JSX Element thông báo đang check đăng nhập !");
        return (
            <div>
                <p>Đang kiểm tra đăng nhập...</p>
            </div>
        );
    }

    // Nếu authError !== null : có lỗi về network
    if (authError) {
        console.log("[RequireUserLoggedIn] useState AuthProvider.authError khac NULL ! Return JSX Element thông báo vui lòng check lại kết nối !");
        return (
            <div>
                <h2>Không thể xác minh đăng nhập</h2>
                <p>
                    Vui lòng kiểm tra kết nối và thử lại.
                </p>
            </div>
        );
    }

    // Session dang nhap cua user khong ton tai
    if (!currentLoggedInUser) {
        console.log("[AdminLayout] useState AuthProvider.currentLoggedInUser = NULL ! Session đăng nhập của user không tồn tại ! Chuyển qua trang login !");
        return (
            <Navigate to="/login" replace state={{ from: currentUrl }}/>
        );
    }

    // Session còn tồn tại. Tức là còn đang trong phiên login
    console.log("[AdminLayout] useState AuthProvider.currentLoggedInUser khác NULL : ", currentLoggedInUser);
    console.log("[AdminLayout] Session còn tồn tại ! Tiếp tục đi đến route con bên trong AdminLayout !");

	return (
		<div className="app-container">
			{/* Mobile Backdrop */}
			{isMobileSidebarOpen && (
				<div onClick={() => setIsMobileSidebarOpen(false)}
				style={{
					position: 'fixed',
					inset: 0,
					backgroundColor: 'rgba(0,0,0,0.4)',
					zIndex: 42
				}}/>
			)}

			{/* Main Sidebar */}
			<Sidebar />

			{/* Layout Body */}
			<div className="main-layout">
				<Header breadcrumbItems={breadcrumbs} />
				<main className="content-body">
				<Outlet />
				</main>
				<NotificationToast />
			</div>
		</div>
	);
}
