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
  const { isAdmin } = useRole();
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

  const selectLight =
    "w-64 [&_.ant-select-selector]:!bg-white [&_.ant-select-selector]:!border-slate-200 [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selection-item]:!text-slate-800 [&_.ant-select-arrow]:!text-slate-500";
  const selectDark =
    "w-64 [&_.ant-select-selector]:!bg-slate-800/80 [&_.ant-select-selector]:!border-slate-700 [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selection-item]:!text-slate-100 [&_.ant-select-arrow]:!text-slate-400";

  return (
    <header
      className={`flex items-center justify-between px-5 h-16 shrink-0 sticky top-0 z-[99] border-b backdrop-blur-md transition-colors ${
        darkMode
          ? "bg-slate-900/90 border-slate-800 shadow-sm"
          : "bg-white/90 border-slate-200/80 shadow-sm"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <img
          src={logoResort}
          alt="logo"
          className={`w-9 h-9 rounded-full object-cover border-2 shrink-0 ${
            darkMode ? "border-slate-600" : "border-slate-200"
          }`}
        />
        <div className="min-w-0 hidden sm:block">
          <div className="font-semibold text-base leading-tight truncate text-slate-900 dark:text-white">
            {t("brand.systemTitle", "Resort Management System")}
          </div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
            {roleLabel} · {t("brand.name", "Solara Resort & Spa")}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
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
              className={darkMode ? selectDark : selectLight}
              placeholder={`🏢 ${t("brand.selectBranch")}: ${t("brand.allBranches")}`}
              value={selectedBranchId}
              disabled={branchScopeLocked}
              options={branchOptions}
              onChange={(value) => setSelectedBranchId(value)}
              popupMatchSelectWidth={300}
              suffixIcon={
                branchScopeLocked ? (
                  <MdLock className="text-amber-500 text-sm" />
                ) : (
                  <MdKeyboardArrowDown className={darkMode ? "text-slate-400" : "text-slate-500"} />
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

        <div
          className={`flex items-center rounded-lg p-0.5 border ${
            darkMode ? "bg-slate-800/60 border-slate-700" : "bg-slate-100 border-slate-200"
          }`}
        >
          <button
            type="button"
            onClick={() => setLanguage("km")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              language === "km"
                ? darkMode
                  ? "bg-sky-600 text-white shadow-sm"
                  : "bg-white text-slate-900 font-semibold shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
            title="ភាសាខ្មែរ (Khmer)"
          >
            🇰🇭 ខ្មែរ
          </button>
          <button
            type="button"
            onClick={() => setLanguage("en")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              language === "en"
                ? darkMode
                  ? "bg-sky-600 text-white shadow-sm"
                  : "bg-white text-slate-900 font-semibold shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
            title="English"
          >
            🇬🇧 English
          </button>
        </div>

        <Tooltip title={darkMode ? t("theme.lightMode", "Light Mode") : t("theme.darkMode", "Dark Mode")}>
          <Button
            type="text"
            shape="circle"
            icon={
              darkMode ? (
                <MdLightMode className="text-amber-400 text-xl" />
              ) : (
                <MdDarkMode className="text-slate-600 text-xl" />
              )
            }
            onClick={() =>
              setDarkMode((d) => {
                const next = !d;
                localStorage.setItem("rms-theme", next ? "dark" : "light");
                return next;
              })
            }
            className={
              darkMode
                ? "!bg-slate-800 hover:!bg-slate-700"
                : "!bg-slate-100 hover:!bg-slate-200"
            }
          />
        </Tooltip>

        <Dropdown
          popupRender={() => notifPanel}
          trigger={["click"]}
          placement="bottomRight"
          onOpenChange={(open) => {
            if (open && markAllRead) markAllRead();
          }}
        >
          <Badge count={unreadCount} size="small" offset={[-2, 2]}>
            <Button
              type="text"
              shape="circle"
              icon={
                <MdNotifications
                  className={`text-xl ${darkMode ? "text-slate-200" : "text-slate-700"}`}
                />
              }
              className={
                darkMode
                  ? "!bg-slate-800 hover:!bg-slate-700"
                  : "!bg-slate-100 hover:!bg-slate-200"
              }
            />
          </Badge>
        </Dropdown>

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
            <div className="text-right hidden md:block">
              <div className="font-semibold text-sm leading-tight text-slate-900 dark:text-white">
                {profile?.name}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{roleLabel}</div>
            </div>
            {profile?.profile_image_url ? (
              <img
                src={`${profile.profile_image_url}?v=${profile.updated_at || profile.id}`}
                alt="avatar"
                className={`w-9 h-9 rounded-full object-cover border-2 ${
                  darkMode ? "border-slate-600" : "border-slate-200"
                }`}
                onError={(e) => {
                  e.target.style.display = "none";
                  if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                }}
              />
            ) : null}
            <div
              className={`w-9 h-9 rounded-full items-center justify-center font-bold text-sm border-2 ${
                darkMode
                  ? "bg-sky-900 border-slate-600 text-sky-100"
                  : "bg-sky-800 border-slate-200 text-white"
              }`}
              style={{ display: profile?.profile_image_url ? "none" : "flex" }}
            >
              {profile?.name?.charAt(0).toUpperCase()}
            </div>
            <MdKeyboardArrowDown className="text-slate-500 dark:text-slate-400 text-lg" />
          </a>
        </Dropdown>
      </div>
    </header>
  );
};

export default Navbar;
