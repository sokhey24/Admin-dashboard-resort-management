import { useEffect, useState } from "react";
import { Layout, Menu, Dropdown, Badge, Button, Tooltip, Modal, ConfigProvider, theme as antTheme } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  MdDashboard, MdCalendarMonth, MdPeople, MdBarChart,
  MdRestaurantMenu, MdAccountBalance, MdSettings, MdLogout,
  MdKeyboardArrowDown, MdWarningAmber, MdNotifications,
  MdLightMode, MdDarkMode, MdPerson, MdOutlineBedroomParent,
} from "react-icons/md";
import { ProfileStore } from "../../store/ProfileStore";
import logoResort from "../../assets/image/LogoResort.jpg";
import useRole, { ROLES } from "../../util/useRole";
import config from "../../util/config";
import { DarkModeContext } from "../../util/DarkModeContext";
import "../../App.css";

const { Sider, Content } = Layout;

function item(label, key, icon, children) {
  return { key, icon, children, label };
}

const adminMenu = [
  item("Dashboard", "/dashboard", <MdDashboard size={18} />),
  item("Room Management", "room", <MdOutlineBedroomParent size={18} />, [
    item("Room Types",     "/room/room"),
    item("Room Status",    "/room/status"),
    item("Occupancy Rate", "/room/occupancy"),
  ]),
  item("Booking Management", "booking", <MdCalendarMonth size={18} />, [
    item("Check-in Today",  "/booking/checkin"),
    item("Check-out Today", "/booking/checkout"),
    item("Pending Booking", "/booking/pending"),
  ]),
  item("Resort Management", "resort", <MdAccountBalance size={18} />, [
    item("Resort Dashboard", "/resort/dashboard"),
    item("Branch",      "/resort/branch"),
    item("Check-in Today",  "/booking/checkin"),
    item("Check-out Today", "/booking/checkout"),
    item("Pending Booking", "/booking/pending"),
    item("Facilities",  "/resort/facilities"),
    item("Gallery",     "/resort/gallery"),
  ]),
  item("Restaurant Management", "restaurant", <MdRestaurantMenu size={18} />, [
    item("Menu",              "/restaurant/menu"),
    item("Food Category",     "/restaurant/category"),
    item("Table Reservation", "/restaurant/table"),
    item("Food Order",        "/restaurant/order"),
    item("Billing",           "/restaurant/billing"),
  ]),
  item("Customer Management", "/customer", <MdPeople size={18} />),
  item("Setting Management", "settings", <MdSettings size={18} />, [
    item("General Settings",      "/settings/general"),
    item("Payment Settings",      "/settings/payment"),
    item("Notification Settings", "/settings/notification"),
    item("Role Permissions",      "/settings/roles"),
    item("User Management",       "/settings/users"),
  ]),
];

const resortMenu = [
  item("Resort Dashboard", "/resort/dashboard", <MdDashboard size={18} />),
  item("Room Management", "room", <MdOutlineBedroomParent size={18} />, [
    item("Villa Room",     "/room/villa"),
    item("Room Status",    "/room/status"),
    item("Occupancy Rate", "/room/occupancy"),
  ]),
  item("Booking Management", "booking", <MdCalendarMonth size={18} />, [
    item("Check-in Today",  "/booking/checkin"),
    item("Check-out Today", "/booking/checkout"),
    item("Pending Booking", "/booking/pending"),
  ]),
  item("Revenue Analytics", "/revenue", <MdBarChart size={18} />),
  item("Resort Info", "resort", <MdAccountBalance size={18} />, [
    item("Resort Info", "/resort/info"),
    item("Branch",      "/resort/branch"),
    item("Facilities",  "/resort/facilities"),
    item("Gallery",     "/resort/gallery"),
  ]),
];

const restaurantMenu = [
  item("Restaurant Management", "restaurant", <MdRestaurantMenu size={18} />, [
    item("Menu",              "/restaurant/menu"),
    item("Food Category",     "/restaurant/category"),
    item("Table Reservation", "/restaurant/table"),
    item("Food Order",        "/restaurant/order"),
    item("Billing",           "/restaurant/billing"),
  ]),
  item("Revenue Analytics", "/revenue", <MdBarChart size={18} />),
];

const menuByRole = {
  [ROLES.ADMIN]:      adminMenu,
  [ROLES.RESORT]:     resortMenu,
  [ROLES.RESTAURANT]: restaurantMenu,
};

const notifications = [
  { key: "1", label: "New booking from John Doe" },
  { key: "2", label: "Room 05 needs maintenance" },
  { key: "3", label: "Payment received #INV-0021" },
  { key: "4", label: "Table reservation at 7 PM" },
];

export default function MainLayout() {
  const { profile, logout } = ProfileStore();
  const { role, isAdmin, isResort } = useRole();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [collapsed,  setCollapsed]  = useState(false);
  const [darkMode,   setDarkMode]   = useState(false);
  const [notifCount, setNotifCount] = useState(notifications.length);
  const [openKeys,   setOpenKeys]   = useState([]);

  useEffect(() => {
    if (!profile) navigate("/login");
  }, [profile, navigate]);

  if (!profile) return null;

  const handleLogout = () => {
    Modal.confirm({
      title: "Logout",
      icon: <MdWarningAmber size={22} color="#faad14" />,
      content: "Do you want to logout?",
      okText: "Yes", cancelText: "No",
      onOk() { logout(); navigate("/login"); },
    });
  };

  const userMenuItems = [
    { key: "profile", label: "My Profile", icon: <MdPerson size={16} /> },
    { key: "setting", label: "Settings",   icon: <MdSettings size={16} /> },
    { type: "divider" },
    { key: "logout",  label: "Logout",     icon: <MdLogout size={16} />, danger: true },
  ];

  const notifItems = [
    ...notifications.map((n) => ({ key: n.key, label: n.label })),
    { type: "divider" },
    { key: "clear", label: <span className="text-blue-500">Clear all</span> },
  ];

  const roleLabel   = isAdmin ? "Admin" : isResort ? "Resort Manager" : "Restaurant Manager";
  const siderBg     = darkMode ? "#141414" : "#0f2744";
  const currentMenu = menuByRole[role] || adminMenu;

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
                menu={{
                  items: notifItems,
                  onClick: ({ key }) => { if (key === "clear") setNotifCount(0); },
                }}
                placement="bottomRight" arrow
              >
                <Badge count={notifCount} size="small">
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
                      src={`${config.image_path}${profile.profile_image_url}?v=${profile.updated_at || profile.id}`}
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
          <Content className={`flex-1 overflow-y-auto px-5 pb-5 pt-0 transition-colors duration-200 ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
    </DarkModeContext.Provider>
  );
}
