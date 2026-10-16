import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout.jsx';
import { CustomerRoute } from '../components/auth/CustomerRoute.jsx';
import { HomePage } from '../pages/HomePage.jsx';
import { BranchesPage } from '../pages/BranchesPage.jsx';
import { BranchDetailPage } from '../pages/BranchDetailPage.jsx';
import { RoomsPage } from '../pages/RoomsPage.jsx';
import { RoomDetailPage } from '../pages/RoomDetailPage.jsx';
import { AboutPage } from '../pages/AboutPage.jsx';
import { ActivitiesPage } from '../pages/ActivitiesPage.jsx';
import { ServicesPage } from '../pages/ServicesPage.jsx';
import { DiningPage } from '../pages/DiningPage.jsx';
import { MenuListPage } from '../pages/MenuListPage.jsx';
import { MenuDetailPage } from '../pages/MenuDetailPage.jsx';
import { GalleryPage } from '../pages/GalleryPage.jsx';
import { ContactPage } from '../pages/ContactPage.jsx';
import { LoginPage } from '../pages/LoginPage.jsx';
import { RegisterPage } from '../pages/RegisterPage.jsx';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage.jsx';
import { VerifyOtpPage } from '../pages/VerifyOtpPage.jsx';
import { ResetPasswordPage } from '../pages/ResetPasswordPage.jsx';
import { BookingPage } from '../pages/BookingPage.jsx';
import { PaymentPage } from '../pages/PaymentPage.jsx';
import { ConfirmationPage } from '../pages/ConfirmationPage.jsx';
import { AccountPage } from '../pages/AccountPage.jsx';
import { NotFoundPage } from '../pages/NotFoundPage.jsx';

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
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  );
}
