import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout    from "./components/layout/MainLayout";
import { ProtectedRoute, GuestRoute } from "./components/layout/ProtectedRoute";
import RoleRoute     from "./components/layout/RoleRoute";
import { ROLES }     from "./util/useRole";

import LoginPage    from "./page/auth/LoginPage";
import RegisterPage from "./page/auth/RegisterPage";
import ProfileSetting from "./page/auth/Profile_Setting";

// Dashboard
import DashboardOverview from "./page/dashboard/DashboardOverview";

// Room
import Room from "./page/Room/Room"
import RoomStatus    from "./page/Room/RoomStatus";
import OccupancyRate from "./page/Room/OccupancyRate";

// Booking
import CheckinToday  from "./page/booking/CheckinToday";
import CheckoutToday from "./page/booking/CheckoutToday";
import PendingBooking from "./page/booking/PendingBooking";

// Customer (admin only)
import CustomerManagement from "./page/customer/CustomerManagement";

// Revenue

// Resort
import ResortDashboard from "./page/resort/ResortDashboard";
import ResortInfo      from "./page/resort/ResortInfo";
import Branch          from "./page/resort/Branch";
import Facilities      from "./page/resort/Facilities";
import Gallery         from "./page/resort/Gallery";

// Restaurant
import RestaurantDashboard from "./page/restaurant/RestaurantDashboard";
import Menu              from "./page/restaurant/Menu";
import FoodCategory      from "./page/restaurant/FoodCategory";
import TableReservation  from "./page/restaurant/TableReservation";
import FoodOrder         from "./page/restaurant/FoodOrder";
import Billing           from "./page/restaurant/Billing";

const ALL   = [ROLES.ADMIN, ROLES.RESORT, ROLES.RESTAURANT];
const ADMIN = [ROLES.ADMIN];
const ADMIN_RESORT      = [ROLES.ADMIN, ROLES.RESORT];
const ADMIN_RESTAURANT  = [ROLES.ADMIN, ROLES.RESTAURANT];

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>

          {/* Default redirect handled in LoginPage by role */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="profile" element={<ProfileSetting />} />

          {/* ── Admin only ── */}
          <Route path="dashboard" element={<RoleRoute allowedRoles={ADMIN}><DashboardOverview /></RoleRoute>} />
          <Route path="customer"  element={<RoleRoute allowedRoles={ADMIN}><CustomerManagement /></RoleRoute>} />

          {/* ── Admin + Resort ── */}
          <Route path="room/room"   element={<RoleRoute allowedRoles={ADMIN_RESORT}><Room /></RoleRoute>} />
          <Route path="room/status"      element={<RoleRoute allowedRoles={ADMIN_RESORT}><RoomStatus /></RoleRoute>} />
          <Route path="room/occupancy"   element={<RoleRoute allowedRoles={ADMIN_RESORT}><OccupancyRate /></RoleRoute>} />
          <Route path="booking/checkin"  element={<RoleRoute allowedRoles={ADMIN_RESORT}><CheckinToday /></RoleRoute>} />
          <Route path="booking/checkout" element={<RoleRoute allowedRoles={ADMIN_RESORT}><CheckoutToday /></RoleRoute>} />
          <Route path="booking/pending"  element={<RoleRoute allowedRoles={ADMIN_RESORT}><PendingBooking /></RoleRoute>} />
          <Route path="resort/dashboard" element={<RoleRoute allowedRoles={ADMIN_RESORT}><ResortDashboard /></RoleRoute>} />
          <Route path="resort/info"      element={<RoleRoute allowedRoles={ADMIN_RESORT}><ResortInfo /></RoleRoute>} />
          <Route path="resort/branch"    element={<RoleRoute allowedRoles={ADMIN_RESORT}><Branch /></RoleRoute>} />
          <Route path="resort/facilities" element={<RoleRoute allowedRoles={ADMIN_RESORT}><Facilities /></RoleRoute>} />
          <Route path="resort/gallery"   element={<RoleRoute allowedRoles={ADMIN_RESORT}><Gallery /></RoleRoute>} />

          {/* ── Admin + Restaurant ── */}
          <Route path="restaurant/dashboard" element={<RoleRoute allowedRoles={ADMIN_RESTAURANT}><RestaurantDashboard /></RoleRoute>} />
          <Route path="restaurant/menu"      element={<RoleRoute allowedRoles={ADMIN_RESTAURANT}><Menu /></RoleRoute>} />
          <Route path="restaurant/category"  element={<RoleRoute allowedRoles={ADMIN_RESTAURANT}><FoodCategory /></RoleRoute>} />
          <Route path="restaurant/table"     element={<RoleRoute allowedRoles={ADMIN_RESTAURANT}><TableReservation /></RoleRoute>} />
          <Route path="restaurant/order"     element={<RoleRoute allowedRoles={ADMIN_RESTAURANT}><FoodOrder /></RoleRoute>} />
          <Route path="restaurant/billing"   element={<RoleRoute allowedRoles={ADMIN_RESTAURANT}><Billing /></RoleRoute>} />

          {/* ── All roles — Revenue Analytics ── */}

        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
