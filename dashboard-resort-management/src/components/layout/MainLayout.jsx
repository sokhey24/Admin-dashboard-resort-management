import { useEffect, useState, useMemo } from "react";
import { Layout, Menu, Modal, ConfigProvider, theme as antTheme, Button } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  MdDashboard, MdCalendarMonth, MdPeople,
  MdRestaurantMenu, MdAccountBalance, MdSettings,
  MdWarningAmber,
  MdOutlineBedroomParent, MdBarChart,
  MdAddHomeWork, MdInventory2,
  MdPerson, MdLogout
} from "react-icons/md";
import { ProfileStore } from "../../store/ProfileStore";
import { useBranchStore } from "../../store/useBranchStore";
import { useCatalogStore } from "../../store/CatalogStore";
import { useNotificationStore } from "../../store/NotificationStore";
import { useTranslation } from "../../i18n";
import { antdKhmerLocale } from "../../i18n/antdKhmerLocale";
import logoResort from "../../assets/image/LogoResort.jpg";
import useRole, { ROLES } from "../../util/useRole";
import usePermission from "../../util/usePermission";
import { DarkModeContext } from "../../util/DarkModeContext";
import { FaHome } from "react-icons/fa";
import { BsShopWindow } from "react-icons/bs";
import { Navbar } from "./Navbar";

const { Sider, Content } = Layout;

function item(label, key, icon, children) {
  return { key, icon, children, label };
}

// Permission-driven menu builder — single brand multi-branch architecture
function buildMenu(t, can, isAdmin, canViewReports, canViewDashboard, role) {
  const menu = [];

  const isOperationalManager =
    role === ROLES.RESORT || role === ROLES.RESTAURANT;

  if (canViewDashboard() && !isOperationalManager) {
    menu.push(item(t("nav.dashboard", "Dashboard"), "/dashboard", <MdDashboard size={14} />));
  }
  // Resort section
  if (can("resort.dashboard.view")) {
    menu.push(item(t("nav.resortDashboard", "Resort Dashboard"), "/resort/dashboard", <MdDashboard size={14} />));
  }

  if (isAdmin) {
    const Manager_system = [
      item(t("nav.manageRestaurant", "Manage Restaurant"), "/manager/restaurant"),
      item(t("nav.websiteContent", "Website Content"),   "/manager/website"),
    ];
    menu.push(item(t("nav.managerSystem", "Manager System"), "manager", <MdAddHomeWork size={14} />, Manager_system));
  }

  // User Management group
  const userMgmt = [];
  if (can("admin.users.view"))       userMgmt.push(item(t("nav.employees", "Employees"),           "/user_management/employees"));
  if (can("admin.users.view"))       userMgmt.push(item(t("nav.users", "User Management"),     "/user_management/users_management"));
  if (can("admin.roles.view"))       userMgmt.push(item(t("nav.roles", "Role Management"),     "/user_management/role"));
  if (can("admin.permissions.view")) userMgmt.push(item(t("nav.permissions", "Permission Management"),"/user_management/permission"));
  if (userMgmt.length) menu.push(item(t("nav.userManagement", "User Management"), "user_management", <MdPeople size={14} />, userMgmt));

  if (can("resort.guests.view")) {
    menu.push(item(t("nav.userGuests", "User Guest"), "/resort/guests", <MdPeople size={14} />));
  }

  // Resort sub-groups
  const roomItems = [];
  if (can("resort.rooms.view") || can("admin.resorts.view") || isAdmin) {
    roomItems.push(item(t("nav.rooms", "Rooms"), "/room/list"));
    roomItems.push(item(t("nav.roomTypes", "Room Types"), "/room/room"));
    roomItems.push(item(t("nav.roomStatus", "Room Status"), "/room/status"));
    roomItems.push(item(t("nav.occupancyRate", "Occupancy Rate"), "/room/occupancy"));
    roomItems.push(item(t("nav.customerReviews", "Customer Reviews"), "/room/reviews"));
  }
  if (roomItems.length) menu.push(item(t("nav.roomManagement", "Room Management"), "room", <MdOutlineBedroomParent size={14} />, roomItems));

  const bookingItems = [];
  if (can("resort.bookings.view"))    bookingItems.push(item(t("nav.allBookings", "All Bookings"),     "/booking/bookings"));
  if (can("resort.bookings.view"))    bookingItems.push(item(t("nav.pendingBooking", "Pending Booking"),  "/booking/pending"));
  if (can("resort.checkin.manage"))   bookingItems.push(item(t("nav.checkinToday", "Check-in"),   "/booking/checkin"));
  if (can("resort.checkout.manage"))  bookingItems.push(item(t("nav.checkoutToday", "Check-out"),  "/booking/checkout"));
  if (bookingItems.length) menu.push(item(t("nav.bookingManagement", "Booking Management"), "booking", <MdCalendarMonth size={14} />, bookingItems));

  if (can("resort.payments.view") || can("payments.view") || can("admin.reports.view")) {
    menu.push(item(t("nav.payment", "Payment"), "/resort/payments", <MdAccountBalance size={14} />));
  }
  if (can("resort.invoices.view") || can("admin.reports.view") || can("payments.view")) {
    menu.push(item(t("nav.invoices", "Invoices"), "/resort/invoices", <MdAccountBalance size={14} />));
  }

  const resortInfoItems = [];
  if (can("admin.resorts.view") || can("resort.dashboard.view")) {
    resortInfoItems.push(item(t("nav.brandOverview", "Brand Overview"),  "/resort/inform"));
    resortInfoItems.push(item(t("nav.gallery", "Gallery"),      "/resort/gallery"));
  }
  if (can("resort.branches.view"))    resortInfoItems.push(item(t("nav.branchManagement", "Branches Management"), "/resort/branch"));
  if (can("resort.facilities.view"))  resortInfoItems.push(item(t("nav.facilities", "Facilities"),  "/resort/facilities"));
  if (resortInfoItems.length) menu.push(item(t("nav.resort", "Resort"), "resort", <FaHome size={14} />, resortInfoItems));

  // Restaurant section
  if (can("restaurant.dashboard.view")) {
    menu.push(item(t("nav.restaurantDashboard", "Restaurant Dashboard"), "/restaurant/dashboard", <MdDashboard size={14} />));
  }
  if (can("restaurant.staff.view")) {
    menu.push(item(t("nav.restaurantStaff", "Restaurant Staff"), "/restaurant/staff", <MdPeople size={14} />));
  }

  const restaurantItems = [];
  if (can("restaurant.menu.view"))          restaurantItems.push(item(t("nav.menu", "Menu"),              "/restaurant/menu"));
  if (can("restaurant.categories.view"))    restaurantItems.push(item(t("nav.foodCategory", "Food Category"),     "/restaurant/category"));
  if (can("restaurant.tables.view"))        restaurantItems.push(item(t("nav.tableReservation", "Table Reservation"), "/restaurant/table"));
  if (can("restaurant.orders.view"))        restaurantItems.push(item(t("nav.foodOrder", "Food Order"),        "/restaurant/order"));
  if (can("restaurant.billing.view"))       restaurantItems.push(item(t("nav.billing", "Billing"),           "/restaurant/billing"));
  if (can("restaurant.billing.view") || can("restaurant.payments.view") || can("payments.view")) {
      restaurantItems.push(item(t("nav.payment", "Payment"), "/restaurant/payments"));
  }
  if (restaurantItems.length) menu.push(item(t("nav.restaurant", "Restaurant"), "restaurant", <BsShopWindow size={14} />, restaurantItems));

  // Products
  if (isAdmin) {
    menu.push(item(t("nav.products", "Products"), "products", <MdInventory2 size={14} />, [
      item(t("nav.addProduct", "Add Product"), "/products/add"),
    ]));
  }

  // Reports / Logs
  if (canViewReports()) {
    menu.push(item(t("nav.reports", "Reports"), "/reports", <MdBarChart size={14} />));
  }

  // Settings (always visible for authenticated users)
  const settingsItems = [
    item(t("nav.profileAccount", "Profile Account"), "/profile"),
  ];
  if (isAdmin || can("admin.resorts.view")) {
    settingsItems.push(item(t("nav.resortBrandProfile", "Resort Brand Profile"), "/settings/brand-profile"));
  }
  settingsItems.push(item(t("nav.generalSettings", "General Settings"), "/settings/general_settings"));
  settingsItems.push(item(t("nav.notificationSettings", "Notification Settings"), "/settings/notification"));

  menu.push(item(t("nav.settings", "Settings"), "settings", <MdSettings size={14} />, settingsItems));

  return menu;
}

export default function MainLayout() {
  const { t, language } = useTranslation();
  const { profile, logout } = ProfileStore();
  const { role, isAdmin } = useRole();
  const { can, canViewReports, canViewDashboard } = usePermission();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { notifications, markAllRead, clearAll } = useNotificationStore();
  const branches = useCatalogStore((s) => s.branches);
  const selectedBranchId = useCatalogStore((s) => s.selectedBranchId);
  const branchScopeLocked = useCatalogStore((s) => s.branchScopeLocked);
  const setSelectedBranchId = useCatalogStore((s) => s.setSelectedBranchId);
  const initBranchScopeFromProfile = useCatalogStore((s) => s.initBranchScopeFromProfile);
  const canViewAllBranches = can("admin.dashboard.view") || can("admin.resorts.view") || isAdmin;
  const unreadCount = useNotificationStore((s) => s.notifications.filter((n) => !n.read).length);
  const [notifSearch,       setNotifSearch]       = useState("");
  const [notifActionFilter, setNotifActionFilter] = useState("all");
  const [notifPage,         setNotifPage]         = useState(1);
  const NOTIF_PAGE_SIZE = 5;

  const notifActionOptions = [
    { value: "all",     label: "All Actions" },
    { value: "created", label: "Created" },
    { value: "updated", label: "Updated" },
    { value: "deleted", label: "Deleted" },
  ];

  const filteredNotifs = notifications.filter((a) => {
    const kw = notifSearch.toLowerCase().trim();
    const matchSearch =
      !kw ||
      a.user_name?.toLowerCase().includes(kw) ||
      a.action?.toLowerCase().includes(kw) ||
      a.booking_code?.toLowerCase().includes(kw) ||
      a.status?.toLowerCase().includes(kw);
    const matchAction =
      !notifActionFilter ||
      notifActionFilter === "all" ||
      a.action?.toLowerCase() === notifActionFilter;
    return matchSearch && matchAction;
  });

  const pagedNotifs = filteredNotifs.slice(
    (notifPage - 1) * NOTIF_PAGE_SIZE,
    notifPage * NOTIF_PAGE_SIZE
  );
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode,  setDarkMode]  = useState(() => {
    const saved = localStorage.getItem("rms-theme");
    if (saved === "dark") return true;
    if (saved === "light") return false;
    if (saved === "auto") return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
    return false;
  });

  useEffect(() => {
    const applyTheme = (theme) => {
      if (theme === "dark") setDarkMode(true);
      else if (theme === "light") setDarkMode(false);
      else if (theme === "auto") {
        setDarkMode(window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false);
      }
    };
    const onTheme = (e) => applyTheme(e.detail);
    window.addEventListener("rms-theme-change", onTheme);
    return () => window.removeEventListener("rms-theme-change", onTheme);
  }, []);
  const [openKeys,  setOpenKeys]  = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    if (!profile) navigate("/login");
  }, [profile, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (profile) {
      useCatalogStore.getState().fetchCatalog();
      initBranchScopeFromProfile(profile, canViewAllBranches);
    }
  }, [profile, canViewAllBranches, initBranchScopeFromProfile]);

  if (!profile) return null;

  const handleLogout = () => {
    Modal.confirm({
      title: "Logout",
      icon: <MdWarningAmber size={14} color="#faad14" />,
      content: "Do you want to logout?",
      okText: "Yes", cancelText: "No",
      onOk() {
        useCatalogStore.getState().reset();
        logout();
        navigate("/login");
      },
    });
  };

  const userMenuItems = [
    { key: "profile", label: "My Profile", icon: <MdPerson size={14} /> },
    { key: "setting", label: "Settings",   icon: <MdSettings size={14} /> },
    { type: "divider" },
    { key: "logout",  label: "Logout",     icon: <MdLogout size={14} />, danger: true },
  ];

  const notifPanel = (
    <div
      className={`w-[360px] rounded-xl border overflow-hidden shadow-xl ${
        darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC]"
      }`}
    >
      {/* Header */}
      <div className={`px-4 py-3 border-b flex items-center justify-between ${
        darkMode ? "border-gray-700" : "border-[#D9E2EC]"
      }`}>
        <div>
          <h3 className={`text-sm font-semibold ${darkMode ? "text-gray-200" : "text-[#102A43]"}`}>
            Notifications
          </h3>
          <p className={`text-xs mt-0.5 ${darkMode ? "text-[#829AB1]" : "text-gray-400"}`}>
            Recent system activities
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          darkMode ? "bg-blue-900/40 text-blue-400" : "bg-blue-100 text-blue-700"
        }`}>
          {filteredNotifs.length}
        </span>
      </div>

      {/* Search + Filter */}
      <div className={`px-3 py-2 flex gap-2 border-b ${
        darkMode ? "border-gray-700" : "border-[#D9E2EC]"
      }`}>
        <input
          type="text"
          placeholder="Search notification..."
          value={notifSearch}
          onChange={(e) => { setNotifSearch(e.target.value); setNotifPage(1); }}
          className={`flex-1 text-xs px-2 py-1 rounded border outline-none ${
            darkMode
              ? "bg-gray-700 border-gray-600 text-gray-200 placeholder-[#829AB1]"
              : "bg-[#F5F8FC] border-[#D9E2EC] text-[#102A43] placeholder-[#829AB1]"
          }`}
        />
        <select
          value={notifActionFilter}
          onChange={(e) => { setNotifActionFilter(e.target.value); setNotifPage(1); }}
          className={`text-xs px-2 py-1 rounded border outline-none ${
            darkMode
              ? "bg-gray-700 border-gray-600 text-gray-200"
              : "bg-[#F5F8FC] border-[#D9E2EC] text-[#102A43]"
          }`}
        >
          {notifActionOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className="max-h-[320px] overflow-y-auto">
        {pagedNotifs.length === 0 ? (
          <div className={`py-10 text-center text-xs ${
            darkMode ? "text-[#829AB1]" : "text-gray-400"
          }`}>
            No notifications found
          </div>
        ) : (
          pagedNotifs.map((n, index) => {
            const action = n.action?.toLowerCase();
            let icon = "🔔";
            let iconStyle = darkMode ? "bg-gray-700" : "bg-[#F5F8FC]";
            if (action === "created") { icon = "➕"; iconStyle = darkMode ? "bg-green-900/40" : "bg-green-100"; }
            else if (action === "updated") { icon = "✏️"; iconStyle = darkMode ? "bg-blue-900/40" : "bg-blue-100"; }
            else if (action === "deleted") { icon = "🗑️"; iconStyle = darkMode ? "bg-red-900/40" : "bg-red-100"; }
            return (
              <div
                key={n.id ?? index}
                className={`px-4 py-3 flex gap-3 border-b ${
                  darkMode
                    ? "border-gray-700 hover:bg-gray-700/40"
                    : "border-gray-100 hover:bg-[#F5F8FC]"
                } ${
                  !n.read
                    ? darkMode ? "bg-blue-900/10" : "bg-blue-50/50"
                    : ""
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${iconStyle}`}>
                  <span className="text-sm">{icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium truncate ${
                          darkMode ? "text-gray-200" : "text-[#102A43]"
                        }`}>
                          {n.user_name ?? "System"}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${
                          action === "created" ? darkMode ? "bg-green-900/40 text-green-400" : "bg-green-100 text-green-700"
                          : action === "updated" ? darkMode ? "bg-blue-900/40 text-blue-400" : "bg-blue-100 text-blue-700"
                          : action === "deleted" ? darkMode ? "bg-red-900/40 text-red-400" : "bg-red-100 text-red-700"
                          : darkMode ? "bg-gray-700 text-gray-300" : "bg-[#F5F8FC] text-[#486581]"
                        }`}>
                          {n.action ?? "system"}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 truncate ${
                        darkMode ? "text-gray-400" : "text-[#829AB1]"
                      }`}>
                        {n.booking_code ?? "—"} · {n.status?.replace("_", " ") ?? ""}
                      </p>
                    </div>
                    <span className={`text-[10px] whitespace-nowrap ${
                      darkMode ? "text-[#829AB1]" : "text-gray-400"
                    }`}>
                      {n.created_at
                        ? new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {filteredNotifs.length > 0 && (
        <div className={`px-4 py-2.5 flex items-center justify-between border-t ${
          darkMode ? "border-gray-700" : "border-gray-100"
        }`}>
          <span className={`text-xs ${darkMode ? "text-gray-400" : "text-[#829AB1]"}`}>
            {(notifPage - 1) * NOTIF_PAGE_SIZE + 1}–{Math.min(notifPage * NOTIF_PAGE_SIZE, filteredNotifs.length)} of {filteredNotifs.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              disabled={notifPage === 1}
              onClick={() => setNotifPage((p) => p - 1)}
              className={`text-xs px-2 py-0.5 rounded ${
                notifPage === 1
                  ? "opacity-40 cursor-not-allowed"
                  : darkMode ? "hover:bg-gray-700" : "hover:bg-[#F5F8FC]"
              } ${darkMode ? "text-gray-400" : "text-[#829AB1]"}`}
            >
              Prev
            </Button>
            <span className={`text-xs ${darkMode ? "text-gray-400" : "text-[#829AB1]"}`}>
              {notifPage} / {Math.ceil(filteredNotifs.length / NOTIF_PAGE_SIZE)}
            </span>
            <Button
              disabled={notifPage >= Math.ceil(filteredNotifs.length / NOTIF_PAGE_SIZE)}
              onClick={() => setNotifPage((p) => p + 1)}
              className={`text-xs px-2 py-0.5 rounded ${
                notifPage >= Math.ceil(filteredNotifs.length / NOTIF_PAGE_SIZE)
                  ? "opacity-40 cursor-not-allowed"
                  : darkMode ? "hover:bg-gray-700" : "hover:bg-[#F5F8FC]"
              } ${darkMode ? "text-gray-400" : "text-[#829AB1]"}`}
            >
              Next
            </Button>
          </div>
          <Button
            onClick={() => { clearAll(); setNotifPage(1); }}
            className="text-ms text-red-400 hover:text-red-500"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );

  const getRoleLabel = () => {
    if (role === ROLES.ADMIN)             return "Admin";
    if (role === ROLES.RESORT)            return "Resort Manager";
    if (role === ROLES.RESTAURANT)        return "Restaurant Manager";
    if (role === ROLES.RESORT_STAFF)      return "Resort Staff";
    if (role === ROLES.RESTAURANT_STAFF)  return "Restaurant Staff";
    return "Staff";
  };
  const roleLabel = getRoleLabel();
  const siderBg   = darkMode ? "#141414" : "#0f2744";

  const currentMenu = useMemo(
    () => buildMenu(t, can, isAdmin, canViewReports, canViewDashboard, role),
    [t, can, isAdmin, canViewReports, canViewDashboard, role],
  ); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <DarkModeContext.Provider value={darkMode}>
    <ConfigProvider
      locale={language === "km" ? antdKhmerLocale : undefined}
      theme={{ algorithm: darkMode ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm }}
    >
      <Layout className="h-screen overflow-hidden">

        {/* ── Sidebar ── */}
        <Sider
          collapsible collapsed={collapsed} onCollapse={setCollapsed}
          width={230}
          style={{ background: siderBg }}
          className="!fixed !left-0 !top-0 !bottom-0 !h-screen z-[100] overflow-hidden"
        >
          {/* Logo */}
          <div className="px-4 py-3 text-center border-b border-white/10">
            {!collapsed ? (
              <>
                <img src={logoResort} alt="Resort Logo" className="w-16 h-16 rounded-full object-cover mx-auto mb-1 border-2 border-white/30" />
                <div className="text-white font-bold text-sm">Resort</div>
                <div className="text-blue-300 text-xs">Management System</div>
                <div className="mt-1.5 text-[10px] text-white bg-white/15 rounded-full px-2 py-0.5 inline-block">
                  {roleLabel}
                </div>
              </>
            ) : (
              <img src={logoResort} alt="Resort Logo" className="w-9 h-9 rounded-full object-cover mx-auto border-2 border-white/30" />
            )}
          </div>

          {/* Scrollable Menu */}
          <div
            className={`absolute left-0 right-0 bottom-12 overflow-y-auto overflow-x-hidden [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent] ${collapsed ? "top-[60px]" : "top-[145px]"}`}
          >
            <Menu
              theme="dark" mode="inline"
              selectedKeys={[location.pathname]}
              openKeys={collapsed ? [] : openKeys}
              onOpenChange={setOpenKeys}
              items={currentMenu}
              onClick={({ key }) => {
                if (String(key).startsWith("/")) navigate(key);
              }}
              className="!border-r-0"
            style={{ background: siderBg }}
            />
          </div>
        </Sider>

        {/* ── Main area ── */}
        <Layout
          className={`flex flex-col h-screen overflow-hidden transition-all duration-200 ${collapsed ? "ml-20" : "ml-[230px]"}`}
        >
          {/* ── Navbar and Global Branch Switcher ── */}
          <Navbar
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            notifPanel={notifPanel}
            unreadCount={unreadCount}
            markAllRead={markAllRead}
            handleLogout={handleLogout}
            roleLabel={roleLabel}
          />

          {/* ── Content ── */}
          <Content className={`flex-1 overflow-y-auto px-5 pb-5 pt-0 transition-colors duration-200 ${darkMode ? "bg-gray-900" : "bg-[#F5F8FC]"}`}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
    </DarkModeContext.Provider>
  );
}
