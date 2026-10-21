import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminProvider } from './context/AdminContext.jsx';
import AdminLayout from './components/layouts/AdminLayout.jsx';

// Auth Pages
import LoginPage from './pages/auth/LoginPage.jsx';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/auth/ResetPasswordPage.jsx';

// Dashboard
import DashboardPage from './pages/dashboard/DashboardPage.jsx';

// Accommodations
import AccommodationListPage from './pages/accommodations/AccommodationListPage.jsx';
import AccommodationFormPage from './pages/accommodations/AccommodationFormPage.jsx';
import AccommodationDetailPage from './pages/accommodations/AccommodationDetailPage.jsx';
import AttractionListPage from './pages/attractions/AttractionListPage.jsx';
import AttractionFormPage from './pages/attractions/AttractionFormPage.jsx';

// Room Types
import RoomTypeListPage from './pages/roomTypes/RoomTypeListPage.jsx';
import RoomTypeFormPage from './pages/roomTypes/RoomTypeFormPage.jsx';

// Locations
import LocationManagementPage from './pages/locations/LocationManagementPage.jsx';

// Amenities
import AmenitiesPage from './pages/amenities/AmenitiesPage.jsx';

// Bookings
import BookingListPage from './pages/bookings/BookingListPage.jsx';
import BookingDetailPage from './pages/bookings/BookingDetailPage.jsx';

// Pricing & Availability
import RatePeriodsPage from './pages/pricing/RatePeriodsPage.jsx';
import RatePeriodFormPage from './pages/pricing/RatePeriodFormPage.jsx';
import RoomRatesPage from './pages/pricing/RoomRatesPage.jsx';
import RoomAvailabilityPage from './pages/pricing/RoomAvailabilityPage.jsx';

// Promotions
import PromotionsPage from './pages/promotions/PromotionsPage.jsx';

// Customers
import CustomerListPage from './pages/customers/CustomerListPage.jsx';
import CustomerDetailPage from './pages/customers/CustomerDetailPage.jsx';

// Admin Users & Roles
import AdminUsersPage from './pages/users/AdminUsersPage.jsx';
import RolesPermissionsPage from './pages/users/RolesPermissionsPage.jsx';

// Reports
import RevenueReportPage from './pages/reports/RevenueReportPage.jsx';
import BookingReportPage from './pages/reports/BookingReportPage.jsx';
import OccupancyReportPage from './pages/reports/OccupancyReportPage.jsx';

// Settings
import GeneralSettingsPage from './pages/settings/GeneralSettingsPage.jsx';
import WebsiteSettingsPage from './pages/settings/WebsiteSettingsPage.jsx';

export default function App() {
  return (
    <AdminProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Admin Protected Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />

            {/* Bookings */}
            <Route path="bookings" element={<BookingListPage />} />
            <Route path="bookings/:id" element={<BookingDetailPage />} />

            {/* Accommodations */}
            <Route path="accommodations" element={<AccommodationListPage />} />
            <Route path="accommodations/create" element={<AccommodationFormPage />} />
            <Route path="accommodations/:id" element={<AccommodationDetailPage />} />
            <Route path="accommodations/:id/edit" element={<AccommodationFormPage />} />

            {/* Attractions */}
            <Route path="attractions" element={<AttractionListPage />} />
            <Route path="attractions/create" element={<AttractionFormPage />} />
            <Route path="attractions/:id/edit" element={<AttractionFormPage />} />

            {/* Room Types */}
            <Route path="room-types" element={<RoomTypeListPage />} />
            <Route path="room-types/create" element={<RoomTypeFormPage />} />
            <Route path="room-types/:id/edit" element={<RoomTypeFormPage />} />

            {/* Locations */}
            <Route path="locations" element={<LocationManagementPage />} />

            {/* Amenities */}
            <Route path="amenities" element={<AmenitiesPage />} />

            {/* Pricing & Availability */}
            <Route path="rate-periods" element={<RatePeriodsPage />} />
            <Route path="rate-periods/create" element={<RatePeriodFormPage />} />
            <Route path="rate-periods/:id/edit" element={<RatePeriodFormPage />} />
            <Route path="room-rates" element={<RoomRatesPage />} />
            <Route path="room-availability" element={<RoomAvailabilityPage />} />

            {/* Promotions */}
            <Route path="promotions" element={<PromotionsPage />} />

            {/* Customers */}
            <Route path="customers" element={<CustomerListPage />} />
            <Route path="customers/:id" element={<CustomerDetailPage />} />

            {/* Users & Roles */}
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="roles" element={<RolesPermissionsPage />} />

            {/* Reports */}
            <Route path="reports/revenue" element={<RevenueReportPage />} />
            <Route path="reports/bookings" element={<BookingReportPage />} />
            <Route path="reports/occupancy" element={<OccupancyReportPage />} />

            {/* Settings */}
            <Route path="settings/general" element={<GeneralSettingsPage />} />
            <Route path="settings/website" element={<WebsiteSettingsPage />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AdminProvider>
  );
}
