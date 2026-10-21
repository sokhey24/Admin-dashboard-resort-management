import { lazy } from "react";

// Auth
export const LoginPage = lazy(() => import("../page/auth/LoginPage"));
export const RegisterPage = lazy(() => import("../page/auth/RegisterPage"));
export const ProfileSetting = lazy(() => import("../page/auth/ProfileAccount"));
export const ForgotPassword = lazy(() => import("../page/auth/ForgotPassword"));
export const VerifyOtp = lazy(() => import("../page/auth/VerifyOtp"));
export const ResetPassword = lazy(() => import("../page/auth/ResetPassword"));

// Dashboard & reports
export const DashboardOverview = lazy(() => import("../page/dashboard/DashboardOverview"));
export const Reports = lazy(() => import("../page/reports/Reports"));

// Payments
export const PaymentRoom = lazy(() => import("../page/Payment/PaymentRoom"));
export const PaymentRestuarand = lazy(() => import("../page/Payment/PaymentRestuarand"));
export const InvoiceList = lazy(() => import("../page/Payment/InvoiceList"));

// Room
export const Room = lazy(() => import("../page/Room/Room"));
export const RoomStatus = lazy(() => import("../page/Room/RoomStatus"));
export const OccupancyRate = lazy(() => import("../page/Room/OccupancyRate"));
export const RoomTypes = lazy(() => import("../page/Room/RoomTypes"));
export const CustomerReviewRoom = lazy(() => import("../page/Room/CustomerReviewRoom"));

// Booking
export const Booking = lazy(() => import("../page/booking/Booking"));
export const CheckinToday = lazy(() => import("../page/booking/CheckinToday"));
export const CheckoutToday = lazy(() => import("../page/booking/CheckoutToday"));
export const PendingBooking = lazy(() => import("../page/booking/PendingBooking"));

// Customer
export const CustomerManagement = lazy(() => import("../page/customer/CustomerManagement"));

// Resort
export const ResortDashboard = lazy(() => import("../page/resort/ResortDashboard"));
export const ResortInfo = lazy(() => import("../page/resort/ResortInfo"));
export const Branch = lazy(() => import("../page/resort/Branch"));
export const Facilities = lazy(() => import("../page/resort/Facilities"));
export const Gallery = lazy(() => import("../page/resort/Gallery"));
export const GuestInbox = lazy(() => import("../page/resort/GuestInbox"));
export const ResortStaff = lazy(() => import("../page/resort/ResortStaff"));

// Restaurant
export const RestaurantDashboard = lazy(() => import("../page/restaurant/RestaurantDashboard"));
export const Menu = lazy(() => import("../page/restaurant/Menu"));
export const FoodCategory = lazy(() => import("../page/restaurant/FoodCategory"));
export const TableReservation = lazy(() => import("../page/restaurant/TableReservation"));
export const FoodOrder = lazy(() => import("../page/restaurant/FoodOrder"));
export const Billing = lazy(() => import("../page/restaurant/Billing"));
export const RestaurantStaff = lazy(() => import("../page/restaurant/RestaurantStaff"));

// User management
export const Employees = lazy(() => import("../page/User_Management/Employess"));
export const UserManagement = lazy(() => import("../page/User_Management/User_Management"));
export const Role = lazy(() => import("../page/User_Management/Role"));
export const Permission = lazy(() => import("../page/User_Management/Permission"));
export const UserPermissionPanel = lazy(() => import("../page/User_Management/UserPermissionPanel"));

// Manager system
export const Manage_Resort = lazy(() => import("../page/ManagerSystem/Manage_Resort"));
export const Manage_restaurand = lazy(() => import("../page/ManagerSystem/Manage_restaurand"));
export const Manage_WebContent = lazy(() => import("../page/ManagerSystem/Manage_WebContent"));
export const Manage_SolaraActivities = lazy(() => import("../page/ManagerSystem/Manage_SolaraActivities"));

// Settings & products
export const GeneralSettings = lazy(() => import("../page/Settings/General_Settings"));
export const Notification = lazy(() => import("../page/Settings/Notification"));
export const ProductsAdd = lazy(() => import("../page/products/ProductsAdd"));
export const AccessDenied = lazy(() => import("../page/errors/AccessDenied"));
