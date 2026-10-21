import { lazy } from 'react';

/** Lazy-load a module that exports a named page component. */
function lazyNamed(importer, exportName) {
  return lazy(() => importer().then((m) => ({ default: m[exportName] })));
}

export const HomePage = lazyNamed(() => import('../pages/Home/HomePage.jsx'), 'HomePage');
export const BranchesPage = lazy(() => import('../pages/Branch/BranchesPage.jsx'));
export const BranchDetailPage = lazy(() => import('../pages/Branch/BranchDetailPage.jsx'));
export const RoomsPage = lazyNamed(() => import('../pages/Room/RoomsPage.jsx'), 'RoomsPage');
export const RoomDetailPage = lazyNamed(() => import('../pages/Room/RoomDetailPage.jsx'), 'RoomDetailPage');
export const AboutPage = lazyNamed(() => import('../pages/About/AboutPage.jsx'), 'AboutPage');
export const ActivitiesPage = lazyNamed(() => import('../pages/Activity/ActivitiesPage.jsx'), 'ActivitiesPage');
export const ServicesPage = lazyNamed(() => import('../pages/Service/ServicesPage.jsx'), 'ServicesPage');
export const DiningPage = lazyNamed(() => import('../pages/Dining/DiningPage.jsx'), 'DiningPage');
export const MenuListPage = lazyNamed(() => import('../pages/Dining/MenuListPage.jsx'), 'MenuListPage');
export const MenuDetailPage = lazyNamed(() => import('../pages/Dining/MenuDetailPage.jsx'), 'MenuDetailPage');
export const GalleryPage = lazyNamed(() => import('../pages/Gallery/GalleryPage.jsx'), 'GalleryPage');
export const ContactPage = lazyNamed(() => import('../pages/ContactUs/ContactPage.jsx'), 'ContactPage');
export const LoginPage = lazyNamed(() => import('../pages/AuthPage/LoginPage.jsx'), 'LoginPage');
export const RegisterPage = lazyNamed(() => import('../pages/AuthPage/RegisterPage.jsx'), 'RegisterPage');
export const ForgotPasswordPage = lazyNamed(
  () => import('../pages/AuthPage/ForgotPasswordPage.jsx'),
  'ForgotPasswordPage'
);
export const VerifyOtpPage = lazyNamed(() => import('../pages/AuthPage/VerifyOtpPage.jsx'), 'VerifyOtpPage');
export const ResetPasswordPage = lazyNamed(
  () => import('../pages/AuthPage/ResetPasswordPage.jsx'),
  'ResetPasswordPage'
);
export const BookingPage = lazyNamed(() => import('../pages/Booking/BookingPage.jsx'), 'BookingPage');
export const PaymentPage = lazyNamed(() => import('../pages/Payment/PaymentPage.jsx'), 'PaymentPage');
export const ConfirmationPage = lazyNamed(
  () => import('../pages/ConfirmationPage/ConfirmationPage.jsx'),
  'ConfirmationPage'
);
export const AccountPage = lazyNamed(() => import('../pages/AuthPage/AccountPage.jsx'), 'AccountPage');
export const NotFoundPage = lazyNamed(() => import('../pages/NotfoundPage/NotFoundPage.jsx'), 'NotFoundPage');
