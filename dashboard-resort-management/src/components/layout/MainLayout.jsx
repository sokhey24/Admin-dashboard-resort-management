import { useEffect, useState, useMemo } from "react";
import { Layout, Menu, Modal, ConfigProvider } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  MdDashboard, MdCalendarMonth, MdPeople,
  MdRestaurantMenu, MdAccountBalance, MdSettings,
  MdWarningAmber,
  MdOutlineBedroomParent, MdBarChart,
  MdAddHomeWork, MdInventory2,
} from "react-icons/md";
import { ProfileStore } from "../../store/ProfileStore";
import { clearAuth } from "../../util/auth";
import { useBranchStore } from "../../store/useBranchStore";
import { useCatalogStore } from "../../store/CatalogStore";
import { useNotificationStore } from "../../store/NotificationStore";
import { safeNotificationRoute } from "../../util/safeNotificationRoute";
import { useTranslation } from "../../i18n";
import { antdKhmerLocale } from "../../i18n/antdKhmerLocale";
import logoResort from "../../assets/image/LogoResort.jpg";
import useRole, { ROLES } from "../../util/useRole";
import usePermission from "../../util/usePermission";
import { DarkModeContext } from "../../util/DarkModeContext";
import { FaHome } from "react-icons/fa";
import { BsShopWindow } from "react-icons/bs";
import { Navbar } from "./Navbar";
import NotificationPanel from "./NotificationPanel";
import { getAntdTheme, SIDER_BG } from "../../theme/antdTheme";
import { applyHtmlDarkClass } from "../../theme/syncDarkClass";

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
      item(t("nav.manageResort", "Manage Resort"), "/manager/resort"),
      item(t("nav.manageRestaurant", "Manage Restaurant"), "/manager/restaurant"),
      item(t("nav.websiteContent", "Website Content"),   "/manager/website"),
      item(t("nav.solaraActivities", "Solara Activities"), "/manager/solara-activities"),
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
    menu.push(item(t("nav.guestInbox", "Guest Inbox"), "/resort/guest-inbox", <MdPeople size={14} />));
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
  if (can("restaurant.categories.view"))    restaurantItems.push(item(t("nav.foodCategory", "Categories Menu"),     "/restaurant/category"));
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
  const notifications = useNotificationStore((s) => s.notifications);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const markRead = useNotificationStore((s) => s.markRead);
  const clearAll = useNotificationStore((s) => s.clearAll);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const branches = useCatalogStore((s) => s.branches);
  const selectedBranchId = useCatalogStore((s) => s.selectedBranchId);
  const branchScopeLocked = useCatalogStore((s) => s.branchScopeLocked);
  const setSelectedBranchId = useCatalogStore((s) => s.setSelectedBranchId);
  const initBranchScopeFromProfile = useCatalogStore((s) => s.initBranchScopeFromProfile);
  const canViewAllBranches = can("admin.dashboard.view") || can("admin.resorts.view") || isAdmin;
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const [notifSearch,       setNotifSearch]       = useState("");
  const [notifActionFilter, setNotifActionFilter] = useState("all");

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

  useEffect(() => {
    applyHtmlDarkClass(darkMode);
  }, [darkMode]);
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

  useEffect(() => {
    const onSessionExpired = () => {
      useCatalogStore.getState().reset();
    };
    window.addEventListener("admin:session-expired", onSessionExpired);
    return () => window.removeEventListener("admin:session-expired", onSessionExpired);
  }, []);

  useEffect(() => {
    if (!profile) return;
    fetchNotifications({ silent: true });
    const timer = window.setInterval(() => {
      fetchNotifications({ silent: true });
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [profile, fetchNotifications]);

  const handleNotificationClick = (n) => {
    if (!n?.read) markRead(n.id);
    const path = safeNotificationRoute(n.url);
    if (path) navigate(path);
  };

  if (!profile) return null;

  const handleLogout = () => {
    Modal.confirm({
      title: t("nav.logout", "Logout"),
      icon: <MdWarningAmber size={14} color="#faad14" />,
      content: t("messages.logoutConfirm", "Do you want to logout?"),
      okText: t("button.confirm", "Confirm"),
      cancelText: t("button.cancel", "Cancel"),
      onOk() {
        useCatalogStore.getState().reset();
        logout();
        clearAuth();
        navigate("/login");
      },
    });
  };

  const notifPanel = (
    <NotificationPanel
      darkMode={darkMode}
      notifications={notifications}
      clearAll={clearAll}
      onNotificationClick={handleNotificationClick}
      search={notifSearch}
      onSearchChange={setNotifSearch}
      actionFilter={notifActionFilter}
      onActionFilterChange={setNotifActionFilter}
    />
  );

  const getRoleLabel = () => {
    if (role === ROLES.ADMIN)             return t("roles.admin", "Admin");
    if (role === ROLES.RESORT)            return t("roles.resortManager", "Resort Manager");
    if (role === ROLES.RESTAURANT)        return t("roles.restaurantManager", "Restaurant Manager");
    if (role === ROLES.RESORT_STAFF)      return t("roles.resortStaff", "Resort Staff");
    if (role === ROLES.RESTAURANT_STAFF)  return t("roles.restaurantStaff", "Restaurant Staff");
    return t("roles.staff", "Staff");
  };
  const roleLabel = getRoleLabel();
  const siderBg   = SIDER_BG;

  const currentMenu = useMemo(
    () => buildMenu(t, can, isAdmin, canViewReports, canViewDashboard, role),
    [t, can, isAdmin, canViewReports, canViewDashboard, role],
  ); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <DarkModeContext.Provider value={darkMode}>
    <ConfigProvider
      locale={language === "km" ? antdKhmerLocale : undefined}
      theme={getAntdTheme(darkMode)}
    >
      <Layout className="h-screen overflow-hidden">

        {/* ── Sidebar ── */}
        <Sider
          collapsible collapsed={collapsed} onCollapse={setCollapsed}
          width={230}
          style={{ background: siderBg }}
          className="!fixed !left-0 !top-0 !bottom-0 !h-screen z-[100] overflow-hidden rms-sider shadow-xl"
        >
          {/* Logo */}
          <div className="px-4 py-3 text-center border-b border-white/10 bg-gradient-to-b from-slate-900/40 to-transparent">
            {!collapsed ? (
              <>
                <img src={logoResort} alt="Resort Logo" className="w-16 h-16 rounded-full object-cover mx-auto mb-1 border-2 border-sky-400/30 shadow-md" />
                <div className="text-white font-semibold text-sm tracking-wide">{t("brand.name", "Solara Resort & Spa")}</div>
                <div className="text-sky-300/90 text-xs">{t("brand.systemTitle", "Resort Management System")}</div>
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
              theme="dark"
              mode="inline"
              selectedKeys={[location.pathname]}
              openKeys={collapsed ? [] : openKeys}
              onOpenChange={setOpenKeys}
              items={currentMenu}
              onClick={({ key }) => {
                if (String(key).startsWith("/")) navigate(key);
              }}
              className="rms-sider-menu !border-r-0"
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
          <Content className={`flex-1 overflow-y-auto px-5 pb-5 pt-4 transition-colors duration-200 ${darkMode ? "bg-brand-surface-dark" : "bg-brand-surface-light"}`}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
    </DarkModeContext.Provider>
  );
}
