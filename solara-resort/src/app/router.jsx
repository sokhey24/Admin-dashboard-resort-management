import React, { Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout.jsx';
import { CustomerRoute } from '../components/auth/CustomerRoute.jsx';
import { RoutePageFallback } from '../components/common/RoutePageFallback.jsx';
import {
  HomePage,
  BranchesPage,
  BranchDetailPage,
  RoomsPage,
  RoomDetailPage,
  AboutPage,
  ActivitiesPage,
  ServicesPage,
  DiningPage,
  MenuListPage,
  MenuDetailPage,
  GalleryPage,
  ContactPage,
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  VerifyOtpPage,
  ResetPasswordPage,
  BookingPage,
  PaymentPage,
  ConfirmationPage,
  AccountPage,
  NotFoundPage,
} from './lazyPages.js';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

export function AppRouter() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<RoutePageFallback />}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="branches" element={<BranchesPage />} />
            <Route path="resorts" element={<BranchesPage />} />
            <Route path="locations" element={<BranchesPage />} />
            <Route path="branches/:id" element={<BranchDetailPage />} />
            <Route path="branch/:id" element={<BranchDetailPage />} />
            <Route path="locations/:slug" element={<BranchDetailPage />} />
            <Route path="resort/:id" element={<BranchDetailPage />} />
            <Route path="rooms" element={<RoomsPage />} />
            <Route path="room/:id" element={<RoomDetailPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="activities" element={<ActivitiesPage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="dining" element={<DiningPage />} />
            <Route path="dining/menu" element={<MenuListPage />} />
            <Route path="dining/menu/:dishId" element={<MenuDetailPage />} />
            <Route path="gallery" element={<GalleryPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="verify-otp" element={<VerifyOtpPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
            <Route path="booking" element={<BookingPage />} />
            <Route element={<CustomerRoute />}>
              <Route path="payment" element={<PaymentPage />} />
              <Route path="booking-confirm" element={<ConfirmationPage />} />
              <Route path="account" element={<AccountPage />} />
              <Route path="account/bookings" element={<AccountPage />} />
              <Route path="account/notifications" element={<AccountPage />} />
              <Route path="account/settings" element={<AccountPage />} />
              <Route path="account/favorites" element={<AccountPage />} />
              <Route path="account/orders" element={<AccountPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
