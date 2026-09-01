import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout        from "./components/layout/MainLayout";
import { ProtectedRoute, GuestRoute, getHomeByRole } from "./components/layout/ProtectedRoute";
import PermissionRoute   from "./components/layout/PermissionRoute";
import useRole           from "./util/useRole";

function RoleHome() {
  const { role } = useRole();
  return <Navigate to={getHomeByRole(role)} replace />;
}

// Auth
import LoginPage         from "./page/auth/LoginPage";
import RegisterPage      from "./page/auth/RegisterPage";
import ProfileSetting    from "./page/auth/Profile_Setting";
import ForgotPassword    from "./page/auth/ForgotPassword";
import VerifyOtp         from "./page/auth/VerifyOtp";
import ResetPassword     from "./page/auth/ResetPassword";

// Dashboard
import DashboardOverview from "./page/dashboard/DashboardOverview";

// Room
import Room              from "./page/Room/Room";
import RoomStatus        from "./page/Room/RoomStatus";
import OccupancyRate     from "./page/Room/OccupancyRate";

// Booking
import Booking           from "./page/booking/Booking";
import CheckinToday      from "./page/booking/CheckinToday";
import CheckoutToday     from "./page/booking/CheckoutToday";
import PendingBooking    from "./page/booking/PendingBooking";

// Customer
import CustomerManagement from "./page/customer/CustomerManagement";

// Resort
import ResortDashboard   from "./page/resort/ResortDashboard";
import ResortInfo        from "./page/resort/ResortInfo";
import Branch            from "./page/resort/Branch";
import Facilities        from "./page/resort/Facilities";
import Gallery           from "./page/resort/Gallery";

// Restaurant
import RestaurantDashboard from "./page/restaurant/RestaurantDashboard";
import Menu              from "./page/restaurant/Menu";
import FoodCategory      from "./page/restaurant/FoodCategory";
import TableReservation  from "./page/restaurant/TableReservation";
import FoodOrder         from "./page/restaurant/FoodOrder";
import Billing           from "./page/restaurant/Billing";

// User Management
import Employees         from "./page/User_Management/Employess";
import UserManagement    from "./page/User_Management/User_Management";
import Role              from "./page/User_Management/Role";
import Permission        from "./page/User_Management/Permission";
import UserPermissionPanel from "./page/User_Management/UserPermissionPanel";
import ResortStaff       from "./page/resort/ResortStaff";
import RestaurantStaff   from "./page/restaurant/RestaurantStaff";

// Settings
import GeneralSettings   from "./page/Settings/General_Settings";
import Notification      from "./page/Settings/Notification";
import Manage_Resort from "./page/ManagerSystem/Manage_Resort";
import Manage_restaurand from "./page/ManagerSystem/Manage_restaurand";
import Manage_WebContent from "./page/ManagerSystem/Manage_WebContent";
import ProductsAdd      from "./page/products/ProductsAdd";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"           element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register"         element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot-password"  element={<GuestRoute><ForgotPassword /></GuestRoute>} />
        <Route path="/verify-otp"       element={<GuestRoute><VerifyOtp /></GuestRoute>} />
        <Route path="/reset-password"   element={<GuestRoute><ResetPassword /></GuestRoute>} />

        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<RoleHome />} />
          <Route path="profile" element={<ProfileSetting />} />

          {/* Admin Dashboard */}
          <Route path="dashboard" element={
            <PermissionRoute requires="admin.dashboard.view">
              <DashboardOverview />
            </PermissionRoute>
          } />

          {/* Manage system */}
          <Route path="manager/resort" element={
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
          <Route path="resort/staff" element={
            <PermissionRoute requires="resort.staff.view">
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

          {/* Rooms */}
          <Route path="room/room" element={
            <PermissionRoute requires={["admin.resorts.view", "resort.dashboard.view"]}>
              <Room />
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

          {/* Bookings */}
          <Route path="booking/bookings" element={
            <PermissionRoute requires={["admin.resorts.view", "resort.dashboard.view"]}>
              <Booking />
            </PermissionRoute>
          } />
          <Route path="booking/checkin" element={
            <PermissionRoute requires={["admin.resorts.view", "resort.dashboard.view"]}>
              <CheckinToday />
            </PermissionRoute>
          } />
          <Route path="booking/checkout" element={
            <PermissionRoute requires={["admin.resorts.view", "resort.dashboard.view"]}>
              <CheckoutToday />
            </PermissionRoute>
          } />
          <Route path="booking/pending" element={
            <PermissionRoute requires={["admin.resorts.view", "resort.dashboard.view"]}>
              <PendingBooking />
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

          {/* Products */}
          <Route path="products/add" element={<ProductsAdd />} />

          {/* Settings — any authenticated user */}
          <Route path="settings/general_settings" element={<GeneralSettings />} />
          <Route path="settings/notification"     element={<Notification />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
