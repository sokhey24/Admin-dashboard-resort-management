import { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout        from "./components/layout/MainLayout";
import { ProtectedRoute, GuestRoute, getHomeByRole } from "./components/layout/ProtectedRoute";
import PermissionRoute   from "./components/layout/PermissionRoute";
import ReportsPermissionRoute from "./components/layout/ReportsPermissionRoute";
import DashboardPermissionRoute from "./components/layout/DashboardPermissionRoute";
import RouteFallback from "./components/layout/RouteFallback";
import { RouteErrorBoundary } from "./components/layout/RouteErrorBoundary";
import useRole           from "./util/useRole";

import {
  LoginPage,
  RegisterPage,
  ProfileSetting,
  ForgotPassword,
  VerifyOtp,
  ResetPassword,
  DashboardOverview,
  PaymentRoom,
  PaymentRestuarand,
  InvoiceList,
  Room,
  RoomStatus,
  OccupancyRate,
  RoomTypes,
  CustomerReviewRoom,
  Booking,
  CheckinToday,
  CheckoutToday,
  PendingBooking,
  CustomerManagement,
  ResortDashboard,
  ResortInfo,
  Branch,
  Facilities,
  Gallery,
  GuestInbox,
  RestaurantDashboard,
  Menu,
  FoodCategory,
  TableReservation,
  FoodOrder,
  Billing,
  Employees,
  UserManagement,
  Role,
  Permission,
  UserPermissionPanel,
  ResortStaff,
  RestaurantStaff,
  GeneralSettings,
  Notification,
  Manage_Resort,
  Manage_restaurand,
  Manage_WebContent,
  Manage_SolaraActivities,
  ProductsAdd,
  Reports,
  AccessDenied,
} from "./routes/lazyPages";

function RoleHome() {
  const { role } = useRole();
  return <Navigate to={getHomeByRole(role)} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <RouteErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/login"           element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="/register"         element={<GuestRoute><RegisterPage /></GuestRoute>} />
            <Route path="/forgot-password"  element={<GuestRoute><ForgotPassword /></GuestRoute>} />
            <Route path="/verify-otp"       element={<GuestRoute><VerifyOtp /></GuestRoute>} />
            <Route path="/reset-password"   element={<GuestRoute><ResetPassword /></GuestRoute>} />

            <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route index element={<RoleHome />} />
              <Route path="profile" element={<ProfileSetting />} />
              <Route path="403" element={<AccessDenied />} />

              {/* Admin Dashboard */}
              <Route path="dashboard" element={
                <DashboardPermissionRoute>
                  <DashboardOverview />
                </DashboardPermissionRoute>
              } />

              <Route path="reports" element={
                <ReportsPermissionRoute>
                  <Reports />
                </ReportsPermissionRoute>
              } />

              <Route path="payments" element={<Navigate to="/resort/payments" replace />} />

              {/* Manage system */}
              <Route path="manager/resort" element={
                <PermissionRoute requires="admin.resorts.view">
                  <Manage_Resort />
                </PermissionRoute>
              }/>
              <Route path="settings/brand-profile" element={
                <PermissionRoute requires="admin.resorts.view">
                  <Manage_Resort />
                </PermissionRoute>
              }/>

              <Route path="manager/restaurant" element={
              <PermissionRoute requires="admin.resorts.view">
                <Manage_restaurand />
              </PermissionRoute>
              }/>

              <Route path="manager/website" element={
                <PermissionRoute requires="admin.resorts.view">
                  <Manage_WebContent />
                </PermissionRoute>
              }/>

              <Route path="manager/solara-activities" element={
                <PermissionRoute requires="admin.resorts.view">
                  <Manage_SolaraActivities />
                </PermissionRoute>
              }/>

              {/* Admin User Management */}
              <Route path="customer" element={
                <PermissionRoute requires="admin.users.view">
                  <CustomerManagement />
                </PermissionRoute>
              } />
              <Route path="user_management/employees" element={
                <PermissionRoute requires="admin.users.view">
                  <Employees />
                </PermissionRoute>
              } />
              <Route path="user_management/users_management" element={
                <PermissionRoute requires="admin.users.view">
                  <UserManagement />
                </PermissionRoute>
              } />
              <Route path="user_management/users/:id/permissions" element={
                <PermissionRoute requires="admin.permissions.view">
                  <UserPermissionPanel />
                </PermissionRoute>
              } />
              <Route path="user_management/role" element={
                <PermissionRoute requires="admin.roles.view">
                  <Role />
                </PermissionRoute>
              } />
              <Route path="user_management/permission" element={
                <PermissionRoute requires="admin.permissions.view">
                  <Permission />
                </PermissionRoute>
              } />

              {/* Resort — resort.dashboard.view required */}
              <Route path="resort/dashboard" element={
                <PermissionRoute requires="resort.dashboard.view">
                  <ResortDashboard />
                </PermissionRoute>
              } />
              <Route path="resort/guests" element={
                <PermissionRoute requires="resort.guests.view">
                  <ResortStaff />
                </PermissionRoute>
              } />
              <Route path="resort/staff" element={
                <PermissionRoute requires="resort.guests.view">
                  <ResortStaff />
                </PermissionRoute>
              } />
              <Route path="resort/inform" element={
                <PermissionRoute requires={["admin.resorts.view", "resort.dashboard.view"]}>
                  <ResortInfo />
                </PermissionRoute>
              } />
              <Route path="resort/branch" element={
                <PermissionRoute requires={["admin.resorts.view", "resort.dashboard.view"]}>
                  <Branch />
                </PermissionRoute>
              } />
              <Route path="resort/facilities" element={
                <PermissionRoute requires={["admin.resorts.view", "resort.dashboard.view"]}>
                  <Facilities />
                </PermissionRoute>
              } />
              <Route path="resort/gallery" element={
                <PermissionRoute requires={["admin.resorts.view", "resort.dashboard.view"]}>
                  <Gallery />
                </PermissionRoute>
              } />
              <Route path="resort/guest-inbox" element={
                <PermissionRoute requires={["resort.guests.view", "resort.bookings.view", "admin.resorts.view"]}>
                  <GuestInbox />
                </PermissionRoute>
              } />

              {/* Rooms — menu: /room/list = Rooms, /room/room = Room Types */}
              <Route path="room" element={<Navigate to="/room/list" replace />} />
              <Route path="room/type" element={<Navigate to="/room/list" replace />} />
              <Route path="room/list" element={
                <PermissionRoute requires={["admin.resorts.view", "resort.dashboard.view", "resort.rooms.view"]}>
                  <Room />
                </PermissionRoute>
              } />
              <Route path="room/room" element={
                <PermissionRoute requires={["admin.resorts.view", "resort.dashboard.view"]}>
                  <RoomTypes />
                </PermissionRoute>
              } />
             
              <Route path="room/status" element={
                <PermissionRoute requires={["admin.resorts.view", "resort.dashboard.view"]}>
                  <RoomStatus />
                </PermissionRoute>
              } />
              <Route path="room/occupancy" element={
                <PermissionRoute requires={["admin.resorts.view", "resort.dashboard.view"]}>
                  <OccupancyRate />
                </PermissionRoute>
              } />
              <Route path="room/reviews" element={
                <PermissionRoute requires={["admin.resorts.view", "resort.dashboard.view", "resort.rooms.view"]}>
                  <CustomerReviewRoom />
                </PermissionRoute>
              } />

              {/* Bookings */}
              <Route path="booking/bookings" element={
                <PermissionRoute requires={["admin.resorts.view", "resort.bookings.view", "resort.dashboard.view"]}>
                  <Booking />
                </PermissionRoute>
              } />
              <Route path="booking/checkin" element={
                <PermissionRoute requires={["admin.resorts.view", "resort.checkin.manage", "resort.dashboard.view"]}>
                  <CheckinToday />
                </PermissionRoute>
              } />
              <Route path="booking/checkout" element={
                <PermissionRoute requires={["admin.resorts.view", "resort.checkout.manage", "resort.dashboard.view"]}>
                  <CheckoutToday />
                </PermissionRoute>
              } />
              <Route path="booking/pending" element={
                <PermissionRoute requires={["admin.resorts.view", "resort.bookings.view", "resort.dashboard.view"]}>
                  <PendingBooking />
                </PermissionRoute>
              } />
              <Route path="resort/payments" element={
                <PermissionRoute requires={["payments.view", "resort.payments.view", "admin.reports.view"]}>
                  <PaymentRoom />
                </PermissionRoute>
              } />
              <Route path="resort/invoices" element={
                <PermissionRoute requires={["resort.invoices.view", "admin.reports.view", "payments.view"]}>
                  <InvoiceList />
                </PermissionRoute>
              } />

              {/* Restaurant — restaurant.dashboard.view required */}
              <Route path="restaurant/dashboard" element={
                <PermissionRoute requires="restaurant.dashboard.view">
                  <RestaurantDashboard />
                </PermissionRoute>
              } />
              <Route path="restaurant/staff" element={
                <PermissionRoute requires="restaurant.staff.view">
                  <RestaurantStaff />
                </PermissionRoute>
              } />
              <Route path="restaurant/menu" element={
                <PermissionRoute requires={["admin.resorts.view", "restaurant.dashboard.view"]}>
                  <Menu />
                </PermissionRoute>
              } />
              <Route path="restaurant/category" element={
                <PermissionRoute requires={["admin.resorts.view", "restaurant.dashboard.view"]}>
                  <FoodCategory />
                </PermissionRoute>
              } />
              <Route path="restaurant/table" element={
                <PermissionRoute requires={["admin.resorts.view", "restaurant.dashboard.view"]}>
                  <TableReservation />
                </PermissionRoute>
              } />
              <Route path="restaurant/order" element={
                <PermissionRoute requires={["admin.resorts.view", "restaurant.dashboard.view"]}>
                  <FoodOrder />
                </PermissionRoute>
              } />
              <Route path="restaurant/billing" element={
                <PermissionRoute requires={["admin.resorts.view", "restaurant.dashboard.view"]}>
                  <Billing />
                </PermissionRoute>
              } />
              <Route path="restaurant/payments" element={
                <PermissionRoute requires={["payments.view", "restaurant.billing.view", "restaurant.payments.view", "admin.reports.view"]}>
                  <PaymentRestuarand />
                </PermissionRoute>
              } />

              {/* Products */}
              <Route path="products/add" element={
                <PermissionRoute requires={["admin.dashboard.view", "admin.resorts.view"]}>
                  <ProductsAdd />
                </PermissionRoute>
              } />

              {/* Settings — any authenticated user */}
              <Route path="settings/general_settings" element={<GeneralSettings />} />
              <Route path="settings/notification"     element={<Notification />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </RouteErrorBoundary>
    </BrowserRouter>
  );
}
