import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MdArrowBack, MdSave, MdPerson, MdShield, MdCheck, MdClose, MdBlock } from "react-icons/md";
import { Button } from "antd";
import { request } from "../../util/request";
import { useDarkMode } from "../../util/DarkModeContext";
import usePermission from "../../util/usePermission";

// ── Helpers ────────────────────────────────────────────────────────────────

const MODULE_LABELS = {
  admin:      "Admin",
  resort:     "Resort",
  restaurant: "Restaurant",
};

const RESOURCE_LABELS = {
  "admin.dashboard":        "Dashboard",
  "admin.users":            "Users",
  "admin.roles":            "Roles",
  "admin.permissions":      "Permissions",
  "admin.resorts":          "Resorts",
  "admin.reports":          "Reports",
  "admin.activity_logs":    "Activity Logs",
  "resort.dashboard":       "Dashboard",
  "resort.staff":           "Staff",
  "resort.rooms":           "Rooms",
  "resort.bookings":        "Bookings",
  "resort.guests":          "Guests",
  "resort.checkin":         "Check-in",
  "resort.checkout":        "Check-out",
  "resort.payments":        "Payments",
  "resort.invoices":        "Invoices",
  "resort.facilities":      "Facilities",
  "resort.branches":        "Branches",
  "restaurant.dashboard":   "Dashboard",
  "restaurant.staff":       "Staff",
  "restaurant.menu":        "Menu",
  "restaurant.categories":  "Food Categories",
  "restaurant.tables":      "Tables",
  "restaurant.reservations":"Table Reservations",
  "restaurant.orders":      "Orders",
  "restaurant.billing":     "Billing",
};

function getResourceKey(permName) {
  const parts = permName.split(".");
  return parts.slice(0, 2).join(".");
}

function getActionLabel(permName) {
  const parts = permName.split(".");
  const action = parts[parts.length - 1];
  return action.charAt(0).toUpperCase() + action.slice(1);
}

// Groups permissions by module → resource → [permissions]
function groupPermissions(permissions) {
  const groups = {};
  for (const perm of permissions) {
    const module   = perm.name.split(".")[0];
    const resource = getResourceKey(perm.name);
    if (!groups[module]) groups[module] = {};
    if (!groups[module][resource]) groups[module][resource] = [];
    groups[module][resource].push(perm);
  }
  return groups;
}

// ── Source Badge ───────────────────────────────────────────────────────────

function SourceBadge({ source, effect, dark }) {
  if (source === "role") {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${
        dark ? "bg-blue-900/40 text-blue-400 ring-blue-700" : "bg-blue-50 text-blue-700 ring-blue-200"
      }`}>
        <MdShield size={14} /> Role
      </span>
    );
  }
  if (source === "user" && effect === "allow") {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${
        dark ? "bg-green-900/40 text-green-400 ring-green-700" : "bg-green-50 text-green-700 ring-green-200"
      }`}>
        <MdCheck size={14} /> Direct
      </span>
    );
  }
  if (source === "user" && effect === "deny") {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${
        dark ? "bg-red-900/40 text-red-400 ring-red-700" : "bg-red-50 text-red-700 ring-red-200"
      }`}>
        <MdBlock size={14} /> Denied
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${
      dark ? "bg-gray-700 text-[#829AB1] ring-gray-600" : "bg-[#F5F8FC] text-[#829AB1] ring-gray-200"
    }`}>
      —
    </span>
  );
}

// ── Toggle Switch ──────────────────────────────────────────────────────────

function Toggle({ enabled, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
      } ${enabled ? "bg-green-500" : "bg-gray-300"}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
        enabled ? "translate-x-4" : "translate-x-0.5"
      }`} />
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function UserPermissionPanel() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const dark      = useDarkMode();
  const { can }   = usePermission();

  const [data,        setData]        = useState(null);
  const [allRoles,    setAllRoles]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [roleSaving,  setRoleSaving]  = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [changes,     setChanges]     = useState({}); // { permId: "allow"|"deny"|"remove" }
  const [saveMsg,     setSaveMsg]     = useState("");
  const [error,       setError]       = useState("");

  const canEditPerms = can("admin.permissions.update");
  const canEditRole  = can("admin.roles.update");

  // Load user permissions + all roles
  const load = async () => {
    setLoading(true);
    const [permRes, rolesRes] = await Promise.all([
      request(`admin/users/${id}/permissions`, "get"),
      request("admin/roles", "get"),
    ]);
    if (permRes?.data) {
      setData(permRes.data);
      setSelectedRole(permRes.data.roles?.[0]?.name ?? "");
    }
    const roles = Array.isArray(rolesRes) ? rolesRes : rolesRes?.data ?? [];
    setAllRoles(roles.filter(r => r.name !== "customer"));
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Merge API permissions with local unsaved changes for display
  const displayPermissions = useMemo(() => {
    if (!data?.permissions) return [];
    return data.permissions.map(perm => {
      const localChange = changes[perm.id];
      if (!localChange) return perm;

      if (localChange === "remove") {
        // Revert to role state
        const fromRole = perm.source === "role" || (perm.source === "user" && perm.effect !== "deny");
        return { ...perm, source: fromRole ? "role" : "none", effect: fromRole ? "allow" : "none", enabled: fromRole };
      }
      return {
        ...perm,
        source:  "user",
        effect:  localChange,
        enabled: localChange === "allow",
      };
    });
  }, [data, changes]);

  const grouped = useMemo(() => groupPermissions(displayPermissions), [displayPermissions]);

  // Handle toggle: determine correct effect to store
  const handleToggle = (perm, newEnabled) => {
    if (!canEditPerms) return;
    setChanges(prev => {
      const next = { ...prev };
      if (perm.source === "role") {
        // Role permission: toggling OFF = user deny, toggling ON = remove deny
        if (!newEnabled) {
          next[perm.id] = "deny";
        } else {
          delete next[perm.id]; // remove any pending change
        }
      } else if (perm.source === "user") {
        if (perm.effect === "deny") {
          // Currently denied: toggling ON = remove the deny (fall back to role or none)
          next[perm.id] = "remove";
        } else {
          // Currently user-allowed: toggling OFF = deny
          next[perm.id] = newEnabled ? "allow" : "deny";
        }
      } else {
        // Not assigned: toggling ON = user allow, OFF = no change needed
        if (newEnabled) {
          next[perm.id] = "allow";
        } else {
          delete next[perm.id];
        }
      }
      return next;
    });
  };

  // Save all pending permission changes
  const handleSavePermissions = async () => {
    if (!Object.keys(changes).length) return;
    setSaving(true);
    setError("");
    const payload = {
      permissions: Object.entries(changes).map(([permId, effect]) => ({
        permission_id: parseInt(permId),
        effect,
      })),
    };
    const res = await request(`admin/users/${id}/permissions`, "put", payload);
    setSaving(false);
    if (res?.errors) { setError(res.errors.message ?? "Failed to save."); return; }
    if (res?.data) {
      setData(res.data);
      setChanges({});
      setSaveMsg("Permissions saved!");
      setTimeout(() => setSaveMsg(""), 3000);
    }
  };

  // Save role change
  const handleSaveRole = async () => {
    if (!selectedRole) return;
    setRoleSaving(true);
    setError("");
    const res = await request(`admin/users/${id}/role`, "put", { role: selectedRole });
    setRoleSaving(false);
    if (res?.errors) { setError(res.errors.message ?? "Failed to change role."); return; }
    if (res?.data) {
      // Reload permissions since role change affects effective permissions
      await load();
      setChanges({});
      setSaveMsg("Role updated!");
      setTimeout(() => setSaveMsg(""), 3000);
    }
  };

  const pendingCount = Object.keys(changes).length;

  // ── Styles ────────────────────────────────────────────────────────────────
  const card     = dark ? "bg-gray-800 border-gray-700"  : "bg-white border-[#D9E2EC]";
  const titleCls = dark ? "text-gray-100"                : "text-[#102A43]";
  const subText  = dark ? "text-gray-400"                : "text-[#829AB1]";
  const thead    = dark ? "bg-gray-700/60"               : "bg-[#F5F8FC]";
  const thText   = dark ? "text-gray-400"                : "text-[#829AB1]";
  const tbody    = dark ? "divide-gray-700"              : "divide-gray-100";
  const rowHover = dark ? "hover:bg-gray-700/30"         : "hover:bg-[#F5F8FC]/60";
  const cellText = dark ? "text-gray-300"                : "text-[#486581]";
  const divider  = dark ? "divide-gray-700"              : "divide-gray-200";
  const modHdr   = dark ? "bg-gray-700/40 text-gray-300" : "bg-[#F5F8FC] text-[#486581]";
  const resHdr   = dark ? "bg-gray-700/20 text-gray-400" : "bg-[#F5F8FC]/80 text-[#829AB1]";
  const inputCls = dark
    ? "border border-gray-600 bg-gray-700 text-gray-100 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30"
    : "border border-[#D9E2EC] bg-white text-[#102A43] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30";

  if (loading) {
    return (
      <div className={`min-h-full rounded-xl p-6 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`}>
        <p className={`text-sm ${subText}`}>Loading…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`min-h-full rounded-xl p-6 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`}>
        <p className="text-sm text-red-500">Failed to load user permissions.</p>
      </div>
    );
  }

  const { user, roles } = data;

  return (
    <div className={`min-h-full rounded-xl p-4 space-y-5 transition-colors duration-200 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`}>

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Button
          icon={<MdArrowBack size={14} />}
          onClick={() => navigate(-1)}
          className={`!p-2 !rounded-lg ${dark ? "!text-[#829AB1] hover:!bg-gray-700" : "!text-[#829AB1] hover:!bg-gray-200"}`}
          type="text"
        />
        <div>
          <h2 className={`text-[26px] font-bold ${titleCls}`}>Permission Management</h2>
          <p className={`text-xs ${subText}`}>Manage individual user permissions and role</p>
        </div>
      </div>

      {/* ── User Info + Role Selector ── */}
      <div className={`rounded-xl shadow-sm border p-5 ${card}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 ${dark ? "bg-[#1a3a5c]" : "bg-[#FF6B00]"}`}>
              {user.name?.charAt(0).toUpperCase() ?? <MdPerson />}
            </div>
            <div>
              <p className={`font-semibold text-base ${titleCls}`}>{user.name}</p>
              <p className={`text-sm ${subText}`}>{user.email}</p>
              <p className={`text-xs mt-0.5 ${subText}`}>
                Current role: <span className={`font-medium ${dark ? "text-blue-400" : "text-blue-600"}`}>
                  {roles?.[0]?.display_name ?? roles?.[0]?.name ?? "—"}
                </span>
              </p>
            </div>
          </div>

          {canEditRole && (
            <div className="flex items-center gap-2 flex-wrap">
              <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)} className={inputCls}>
                {allRoles.map(r => (
                  <option key={r.id} value={r.name}>{r.display_name || r.name}</option>
                ))}
              </select>
              <Button
                onClick={handleSaveRole}
                disabled={roleSaving || selectedRole === roles?.[0]?.name}
                loading={roleSaving}
                type="primary"
                className="!bg-[#FF6B00] !border-[#FF6B00] hover:!bg-[#e05e00]"
              >
                {roleSaving ? "Saving…" : "Save Role"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Messages ── */}
      {saveMsg && (
        <div className="px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-600 text-sm font-medium">
          {saveMsg}
        </div>
      )}
      {error && (
        <div className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* ── Permission Table ── */}
      <div className={`rounded-xl shadow-sm border overflow-hidden ${card}`}>
        <div className={`px-6 py-4 border-b flex items-center justify-between ${dark ? "border-gray-700" : "border-[#D9E2EC]"}`}>
          <div className="flex items-center gap-2">
            <span className={`text-[18px] font-semibold ${titleCls}`}>Effective Permissions</span>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-600 ring-1 ring-amber-500/30">
                {pendingCount} unsaved change{pendingCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
          {canEditPerms && pendingCount > 0 && (
            <Button
              onClick={handleSavePermissions}
              disabled={saving}
              loading={saving}
              type="primary"
              icon={<MdSave size={14} />}
              className="!bg-[#FF6B00] !border-[#FF6B00] hover:!bg-[#e05e00]"
            >
              {saving ? "Saving…" : `Save ${pendingCount} Change${pendingCount > 1 ? "s" : ""}`}
            </Button>
          )}
        </div>

        {/* Legend */}
        <div className={`px-6 py-2 border-b flex items-center gap-4 text-xs ${dark ? "border-gray-700 text-gray-400" : "border-gray-100 text-[#829AB1]"}`}>
          <span className="flex items-center gap-1"><MdShield size={14} className="text-blue-500" /> From Role</span>
          <span className="flex items-center gap-1"><MdCheck size={14} className="text-green-500" /> Direct Grant</span>
          <span className="flex items-center gap-1"><MdBlock size={14} className="text-red-500" /> User Denied</span>
          <span className={`ml-auto ${dark ? "text-[#829AB1]" : "text-gray-400"}`}>Toggle to enable/disable for this user only</span>
        </div>

        <div className="overflow-x-auto">
          {Object.entries(grouped).map(([module, resources]) => (
            <div key={module}>
              {/* Module header */}
              <div className={`px-6 py-2 text-xs font-bold uppercase tracking-widest ${modHdr}`}>
                {MODULE_LABELS[module] ?? module}
              </div>

              {Object.entries(resources).map(([resourceKey, perms]) => (
                <div key={resourceKey}>
                  {/* Resource sub-header */}
                  <div className={`px-6 py-1.5 text-xs font-semibold uppercase tracking-wider ${resHdr}`}>
                    {RESOURCE_LABELS[resourceKey] ?? resourceKey}
                  </div>

                  <table className={`min-w-full divide-y ${divider}`}>
                    <thead className={thead}>
                      <tr>
                        <th className={`px-6 py-2 text-left text-xs font-medium uppercase tracking-wider w-1/3 ${thText}`}>Permission</th>
                        <th className={`px-4 py-2 text-center text-xs font-medium uppercase tracking-wider w-24 ${thText}`}>Role</th>
                        <th className={`px-4 py-2 text-center text-xs font-medium uppercase tracking-wider w-24 ${thText}`}>Direct</th>
                        <th className={`px-4 py-2 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>Source</th>
                        <th className={`px-4 py-2 text-center text-xs font-medium uppercase tracking-wider w-20 ${thText}`}>Access</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${tbody}`}>
                      {perms.map(perm => {
                        const isPending = changes[perm.id] !== undefined;
                        const fromRole  = perm.source === "role";
                        const fromUser  = perm.source === "user";

                        return (
                          <tr key={perm.id} className={`transition-colors ${rowHover} ${isPending ? (dark ? "bg-amber-900/10" : "bg-amber-50/60") : ""}`}>
                            <td className={`px-6 py-3 text-sm ${cellText}`}>
                              <span className="font-medium">{getActionLabel(perm.name)}</span>
                              {isPending && <span className="ml-2 text-xs text-amber-500">●</span>}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {fromRole && perm.effect !== "deny" ? (
                                <MdCheck size={14} className="mx-auto text-blue-500" />
                              ) : (
                                <span className={`text-xs ${dark ? "text-[#486581]" : "text-gray-300"}`}>—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {fromUser && perm.effect === "allow" ? (
                                <MdCheck size={14} className="mx-auto text-green-500" />
                              ) : fromUser && perm.effect === "deny" ? (
                                <MdBlock size={14} className="mx-auto text-red-500" />
                              ) : (
                                <span className={`text-xs ${dark ? "text-[#486581]" : "text-gray-300"}`}>—</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <SourceBadge source={perm.source} effect={perm.effect} dark={dark} />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Toggle
                                enabled={perm.enabled}
                                onChange={(val) => handleToggle(perm, val)}
                                disabled={!canEditPerms}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
