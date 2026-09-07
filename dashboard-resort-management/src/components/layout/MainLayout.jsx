import { useEffect, useState, useMemo } from "react";
import { Layout, Menu, Dropdown, Badge, Button, Tooltip, Modal, ConfigProvider, theme as antTheme } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  MdDashboard, MdCalendarMonth, MdPeople,
  MdRestaurantMenu, MdAccountBalance, MdSettings, MdLogout,
  MdKeyboardArrowDown, MdWarningAmber, MdNotifications,
  MdLightMode, MdDarkMode, MdPerson, MdOutlineBedroomParent, MdBarChart,
  MdSearch, MdLanguage, MdFullscreen, MdFullscreenExit, MdAddHomeWork, MdInventory2
} from "react-icons/md";
import { ProfileStore } from "../../store/ProfileStore";
import { useNotificationStore } from "../../store/NotificationStore";
import logoResort from "../../assets/image/LogoResort.jpg";
import useRole, { ROLES } from "../../util/useRole";
import usePermission from "../../util/usePermission";
import config from "../../util/config";
import { DarkModeContext } from "../../util/DarkModeContext";
import { FaHome} from "react-icons/fa";
import { BsShopWindow } from "react-icons/bs";



const { Sider, Content } = Layout;

function item(label, key, icon, children) {
  return { key, icon, children, label };
}

// Permission-driven menu builder — no hardcoded role menus
function buildMenu(can, isAdmin) {
  const menu = [];

  // Admin section — only visible to admin role
  if (isAdmin && can("admin.dashboard.view")) {
    menu.push(item("Dashboard", "/dashboard", <MdDashboard size={14} />));
  }

 
if (isAdmin) {
  const Manager_system = [
    item("Manage Resort",     "/manager/resort"),
    item("Manage Restaurant", "/manager/restaurant"),
    item("Website Content",   "/manager/website"),
  ];
  menu.push(item("Manager System", "manager", <MdAddHomeWork size={14} />, Manager_system));
}


  // Resort section
  if (can("resort.dashboard.view")) {
    menu.push(item("Resort Dashboard", "/resort/dashboard", <MdDashboard size={14} />));
  }

  // User Management group
  const userMgmt = [];
  if (can("admin.users.view"))       userMgmt.push(item("Employees",           "/user_management/employees"));
  if (can("admin.users.view"))       userMgmt.push(item("User Management",     "/user_management/users_management"));
  if (can("admin.roles.view"))       userMgmt.push(item("Role Management",     "/user_management/role"));
  if (can("admin.permissions.view")) userMgmt.push(item("Permission Management","/user_management/permission"));
  if (userMgmt.length) menu.push(item("User Management", "user_management", <MdPeople size={14} />, userMgmt));

  if (can("resort.staff.view")) {
    menu.push(item("Resort Staff", "/resort/staff", <MdPeople size={14} />));
  }

  // Resort sub-groups
  const roomItems = [];
  if (can("resort.rooms.view")) {
    roomItems.push(item("Room Types", "/room/room"));
    roomItems.push(item("Room Status", "/room/status"));
    roomItems.push(item("Occupancy Rate", "/room/occupancy"));
  }
  if (roomItems.length) menu.push(item("Room Management", "room", <MdOutlineBedroomParent size={14} />, roomItems));

  const bookingItems = [];
  if (can("resort.bookings.view"))    bookingItems.push(item("All Bookings",     "/booking/bookings"));
  if (can("resort.bookings.view"))    bookingItems.push(item("Pending Booking",  "/booking/pending"));
  if (can("resort.checkin.manage"))   bookingItems.push(item("Check-in ",   "/booking/checkin"));
  if (can("resort.checkout.manage"))  bookingItems.push(item("Check-out ",  "/booking/checkout"));
  if (bookingItems.length) menu.push(item("Booking Management", "booking", <MdCalendarMonth size={14} />, bookingItems));

  const resortInfoItems = [];
  if (can("admin.resorts.view") || can("resort.dashboard.view")) {
    resortInfoItems.push(item("Resort Inform",  "/resort/inform"));
    resortInfoItems.push(item("Gallery",      "/resort/gallery"));
  }
  if (can("resort.branches.view"))    resortInfoItems.push(item("Branch",      "/resort/branch"));
  if (can("resort.facilities.view"))  resortInfoItems.push(item("Facilities",  "/resort/facilities"));
  if (resortInfoItems.length) menu.push(item("Resort ", "resort", <FaHome size={14} />, resortInfoItems));

  // Restaurant section
  if (can("restaurant.dashboard.view")) {
    menu.push(item("Restaurant Dashboard", "/restaurant/dashboard", <MdDashboard size={14} />));
  }
  if (can("restaurant.staff.view")) {
    menu.push(item("Restaurant Staff", "/restaurant/staff", <MdPeople size={14} />));
  }

  const restaurantItems = [];
  if (can("restaurant.menu.view"))          restaurantItems.push(item("Menu",              "/restaurant/menu"));
  if (can("restaurant.categories.view"))    restaurantItems.push(item("Food Category",     "/restaurant/category"));
  if (can("restaurant.tables.view"))        restaurantItems.push(item("Table Reservation", "/restaurant/table"));
  if (can("restaurant.orders.view"))        restaurantItems.push(item("Food Order",        "/restaurant/order"));
  if (can("restaurant.billing.view"))       restaurantItems.push(item("Billing",           "/restaurant/billing"));
  if (restaurantItems.length) menu.push(item("Restaurant", "restaurant", <BsShopWindow size={14} />, restaurantItems));

  // Products
  if (isAdmin) {
    menu.push(item("Products", "products", <MdInventory2 size={14} />, [
      item("Add Product", "/products/add"),
    ]));
  }

  // Reports / Logs
  if (can("admin.reports.view")) {
    menu.push(item("Reports", "/reports", <MdBarChart size={14} />));
  }

  // Settings (always visible for authenticated users)
  menu.push(item("Settings", "settings", <MdSettings size={14} />, [
    item("General Settings",      "/settings/general_settings"),
    item("Notification Settings", "/settings/notification"),
  ]));

  return menu;
}

export default function MainLayout() {
  const { profile, logout } = ProfileStore();
  const { role, isAdmin } = useRole();
  const { can } = usePermission();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { notifications, markAllRead, clearAll } = useNotificationStore();
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
  const [darkMode,  setDarkMode]  = useState(false);
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

  if (!profile) return null;

  const handleLogout = () => {
    Modal.confirm({
      title: "Logout",
      icon: <MdWarningAmber size={14} color="#faad14" />,
      content: "Do you want to logout?",
      okText: "Yes", cancelText: "No",
      onOk() { logout(); navigate("/login"); },
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
            className="text-xs text-red-400 hover:text-red-500"
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

  const currentMenu = useMemo(() => buildMenu(can, isAdmin), [can, isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <DarkModeContext.Provider value={darkMode}>
    <ConfigProvider theme={{ algorithm: darkMode ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm }}>
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
              onClick={({ key }) => navigate(key)}
              className="!border-r-0"
            style={{ background: siderBg }}
            />
          </div>
        </Sider>

        {/* ── Main area ── */}
        <Layout
          className={`flex flex-col h-screen overflow-hidden transition-all duration-200 ${collapsed ? "ml-20" : "ml-[230px]"}`}
        >
          {/* ── Navbar  and full screen layout── */}
          <div
            className="flex items-center justify-between px-5 h-16 shrink-0 sticky top-0 mb-4 z-[99] shadow-md"
            style={{ background: darkMode ? "#1f1f1f" : "linear-gradient(135deg, #1a3c5e 0%, #2d6a9f 100%)" }}
          >
            {/* Left */}
            <div className="flex items-center gap-3">
              <img src={logoResort} alt="logo" className="w-9 h-9 rounded-full object-cover border-2 border-white/30" />
              <div>
                <div className="text-white font-bold text-base">Resort Management System</div>
                <div className="text-blue-200 text-xs">{roleLabel} Dashboard</div>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
              <Tooltip title={darkMode ? "Light Mode" : "Dark Mode"}>
                <Button
                  type="text" shape="circle"
                  icon={darkMode
                    ? <MdLightMode className="text-yellow-300 text-xl" />
                    : <MdDarkMode  className="text-white text-xl" />}
                  onClick={() => setDarkMode(!darkMode)}
                  className="!bg-white/10 hover:!bg-white/20"
                />
              </Tooltip>

              <Dropdown
                popupRender={() => notifPanel}
                trigger={["click"]}
                placement="bottomRight"
                onOpenChange={(open) => { if (open) markAllRead(); }}
              >
                <Badge count={unreadCount} size="small">
                  <Button
                    type="text" shape="circle"
                    icon={<MdNotifications className="text-white text-xl" />}
                    className="!bg-white/10 hover:!bg-white/20"
                  />
                </Badge>
              </Dropdown>

              <Dropdown
                menu={{
                  items: userMenuItems,
                  onClick: ({ key }) => {
                    if (key === "logout")  handleLogout();
                    if (key === "profile") navigate("/profile");
                  },
                }}
                placement="bottomRight" arrow
              >
                <a onClick={(e) => e.preventDefault()} className="flex items-center gap-2 cursor-pointer">
                  <div className="text-right">
                    <div className="text-white font-semibold text-sm leading-tight">{profile?.name}</div>
                    <div className="text-blue-200 text-xs">{roleLabel}</div>
                  </div>
                  {profile?.profile_image_url ? (
                    <img
                      src={`${profile.profile_image_url}?v=${profile.updated_at || profile.id}`}
                      alt="avatar"
                      className="w-9 h-9 rounded-full object-cover border-2 border-white/40"
                      onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                    />
                  ) : null}
                  <div
                    className="w-9 h-9 rounded-full bg-blue-700 border-2 border-white/40 items-center justify-center text-white font-bold text-sm"
                    style={{ display: profile?.profile_image_url ? "none" : "flex" }}
                  >
                    {profile?.name?.charAt(0).toUpperCase()}
                  </div>
                  <MdKeyboardArrowDown className="text-white text-lg" />
                </a>
              </Dropdown>
            </div>
          </div>

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
