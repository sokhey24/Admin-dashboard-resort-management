import React, { useEffect, useMemo } from "react";
import { Select, Tooltip, Button, Dropdown, Badge, Tag } from "antd";
import {
  MdLightMode,
  MdDarkMode,
  MdNotifications,
  MdPerson,
  MdSettings,
  MdLogout,
  MdKeyboardArrowDown,
  MdLock,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";
import logoResort from "../../assets/image/LogoResort.jpg";
import { useBranchStore } from "../../store/useBranchStore";
import { ProfileStore } from "../../store/ProfileStore";
import { useTranslation } from "../../i18n";
import usePermission from "../../util/usePermission";
import useRole from "../../util/useRole";

export const Navbar = ({
  darkMode,
  setDarkMode,
  notifPanel,
  unreadCount = 0,
  markAllRead,
  handleLogout,
  roleLabel = "Staff",
}) => {
  const navigate = useNavigate();
  const { profile } = ProfileStore();
  const { role, isAdmin } = useRole();
  const { can } = usePermission();
  const { t, language, setLanguage } = useTranslation();

  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const branches = useBranchStore((s) => s.branches);
  const branchScopeLocked = useBranchStore((s) => s.branchScopeLocked);
  const scopedBranchName = useBranchStore((s) => s.scopedBranchName);
  const setSelectedBranchId = useBranchStore((s) => s.setSelectedBranchId);
  const initBranchScope = useBranchStore((s) => s.initBranchScope);
  const fetchBranches = useBranchStore((s) => s.fetchBranches);

  const canBypassAll = can("admin.dashboard.view") || can("admin.resorts.view") || isAdmin;

  // Initialize branches and scope on mount or profile change
  useEffect(() => {
    if (branches.length === 0) {
      fetchBranches();
    }
  }, [branches.length, fetchBranches]);

  useEffect(() => {
    if (profile) {
      initBranchScope(profile, canBypassAll);
    }
  }, [profile, canBypassAll, initBranchScope]);

  // Build options for Ant Design select
  const branchOptions = useMemo(() => {
    const active = (branches || []).filter(
      (b) => b.status === "active" || b.status === "maintenance" || !b.status
    );

    const mapped = active.map((b) => ({
      value: b.id,
      label: `📍 ${b.name}${b.city ? ` · ${b.city}` : ""}`,
    }));

    if (!branchScopeLocked) {
      return [
        {
          value: null,
          label: `🏢 ${t("brand.selectBranch")}: ${t("brand.allBranches")}`,
        },
        ...mapped,
      ];
    }

    return mapped;
  }, [branches, branchScopeLocked, t]);

  const userMenuItems = [
    { key: "profile", label: t("nav.profileAccount", "My Profile"), icon: <MdPerson size={14} /> },
    { key: "setting", label: t("nav.settings", "Settings"), icon: <MdSettings size={14} /> },
    { type: "divider" },
    { key: "logout", label: t("nav.logout", "Logout"), icon: <MdLogout size={14} />, danger: true },
  ];

  return (
    <div
      className="flex items-center justify-between px-5 h-16 shrink-0 sticky top-0 z-[99] shadow-md transition-colors"
      style={{
        background: darkMode
          ? "#1f1f1f"
          : "linear-gradient(135deg, #1a3c5e 0%, #2d6a9f 100%)",
      }}
    >
      {/* Left Brand Identity */}
      <div className="flex items-center gap-3">
        <img
          src={logoResort}
          alt="logo"
          className="w-9 h-9 rounded-full object-cover border-2 border-white/30"
        />
        <div>
          <div className="text-white font-bold text-base leading-tight font-sans">
            {t("brand.systemTitle", "Resort Management System")}
          </div>
          <div className="text-blue-200 text-xs font-medium">
            {roleLabel} Dashboard • {t("brand.name", "Solara Resort & Spa")}
          </div>
        </div>
      </div>

      {/* Right Controls: Branch Switcher, Language Toggle, Theme, Notifications, Profile */}
      <div className="flex items-center gap-3">
        {/* Global Branch Switcher */}
        <div className="flex items-center">
          <Tooltip
            title={
              branchScopeLocked
                ? `${t("brand.assignedBranch")}: ${scopedBranchName || ""}`
                : t("brand.selectBranch")
            }
          >
            <div className="flex items-center gap-1.5">
              <Select
                size="middle"
                className="w-64 [&_.ant-select-selector]:!bg-white/10 [&_.ant-select-selector]:!border-white/30 [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selection-item]:!text-white [&_.ant-select-arrow]:!text-white font-medium text-xs hover:[&_.ant-select-selector]:!border-white/60 focus:[&_.ant-select-selector]:!border-white transition-all shadow-inner"
                placeholder={`🏢 ${t("brand.selectBranch")}: ${t("brand.allBranches")}`}
                value={selectedBranchId}
                disabled={branchScopeLocked}
                options={branchOptions}
                onChange={(value) => setSelectedBranchId(value)}
                popupMatchSelectWidth={300}
                suffixIcon={
                  branchScopeLocked ? (
                    <MdLock className="text-amber-300 text-sm" />
                  ) : (
                    <MdKeyboardArrowDown className="text-white text-base" />
                  )
                }
              />
              {branchScopeLocked && (
                <Tag color="gold" className="!mr-0 text-[11px] font-semibold flex items-center gap-1">
                  <MdLock size={12} /> {t("brand.assignedBranch", "Assigned")}
                </Tag>
              )}
            </div>
          </Tooltip>
        </div>

        {/* Global Language Toggle [ 🇰🇭 ខ្មែរ | 🇬🇧 English ] */}
        <div className="flex items-center bg-white/10 rounded-lg p-0.5 border border-white/20">
          <button
            type="button"
            onClick={() => setLanguage("km")}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
              language === "km"
                ? "bg-white text-navy-950 font-bold shadow-sm"
                : "text-white/80 hover:text-white"
            }`}
            title="ភាសាខ្មែរ (Khmer)"
          >
            🇰🇭 ខ្មែរ
          </button>
          <button
            type="button"
            onClick={() => setLanguage("en")}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
              language === "en"
                ? "bg-white text-navy-950 font-bold shadow-sm"
                : "text-white/80 hover:text-white"
            }`}
            title="English"
          >
            🇬🇧 English
          </button>
        </div>

        {/* Dark/Light mode toggle */}
        <Tooltip title={darkMode ? "Light Mode" : "Dark Mode"}>
          <Button
            type="text"
            shape="circle"
            icon={
              darkMode ? (
                <MdLightMode className="text-yellow-300 text-xl" />
              ) : (
                <MdDarkMode className="text-white text-xl" />
              )
            }
            onClick={() =>
              setDarkMode((d) => {
                const next = !d;
                localStorage.setItem("rms-theme", next ? "dark" : "light");
                return next;
              })
            }
            className="!bg-white/10 hover:!bg-white/20"
          />
        </Tooltip>

        {/* Notifications */}
        <Dropdown
          popupRender={() => notifPanel}
          trigger={["click"]}
          placement="bottomRight"
          onOpenChange={(open) => {
            if (open && markAllRead) markAllRead();
          }}
        >
          <Badge count={unreadCount} size="small">
            <Button
              type="text"
              shape="circle"
              icon={<MdNotifications className="text-white text-xl" />}
              className="!bg-white/10 hover:!bg-white/20"
            />
          </Badge>
        </Dropdown>

        {/* User Profile Menu */}
        <Dropdown
          menu={{
            items: userMenuItems,
            onClick: ({ key }) => {
              if (key === "logout" && handleLogout) handleLogout();
              if (key === "profile") navigate("/profile");
              if (key === "setting") navigate("/settings/general_settings");
            },
          }}
          placement="bottomRight"
          arrow
        >
          <a
            onClick={(e) => e.preventDefault()}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <div className="text-right hidden sm:block">
              <div className="text-white font-semibold text-sm leading-tight">
                {profile?.name}
              </div>
              <div className="text-blue-200 text-xs">{roleLabel}</div>
            </div>
            {profile?.profile_image_url ? (
              <img
                src={`${profile.profile_image_url}?v=${profile.updated_at || profile.id}`}
                alt="avatar"
                className="w-9 h-9 rounded-full object-cover border-2 border-white/40"
                onError={(e) => {
                  e.target.style.display = "none";
                  if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                }}
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
  );
};

export default Navbar;
