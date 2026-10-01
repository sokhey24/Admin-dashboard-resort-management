import { useEffect, useState } from "react";
import { MdShield, MdCheck, MdClose, MdAdd, MdDelete } from "react-icons/md";
import { useDarkMode } from "../../util/DarkModeContext";
import { Button } from "antd";
import { request } from "../../util/request";
import usePermission from "../../util/usePermission";

export default function Permission() {
  const dark = useDarkMode();
  const { can } = usePermission();
  const [roles,       setRoles]       = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [activeRole,  setActiveRole]  = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);

  const load = async () => {
    setLoading(true);
    const [rolesRes, permsRes] = await Promise.all([
      request("admin/roles", "get"),
      request("admin/permissions", "get"),
    ]);
    const rolesData = Array.isArray(rolesRes?.data) ? rolesRes.data : [];
    const permsData = Array.isArray(permsRes) ? permsRes : (Array.isArray(permsRes?.data) ? permsRes.data : []);
    setRoles(rolesData);
    setPermissions(permsData);
    if (rolesData.length && !activeRole) setActiveRole(rolesData[0].id);
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const currentRole = roles.find(r => r.id === activeRole);
  const assignedIds = new Set((currentRole?.permissions ?? []).map(p => p.id));

  const toggle = async (permId) => {
    if (!can("admin.roles.update")) return;
    const isAssigned = assignedIds.has(permId);
    setSaving(true);
    if (isAssigned) {
      await request(`admin/roles/${activeRole}/permissions`, "delete", { permissions: [permId] });
    } else {
      await request(`admin/roles/${activeRole}/permissions`, "post", { permissions: [permId] });
    }
    await load();
    setSaving(false);
  };

  const handleDeletePermission = async (permId) => {
    if (!window.confirm("Delete this permission?")) return;
    await request(`admin/permissions/${permId}`, "delete");
    load();
  };

  // Group permissions by module prefix (e.g. "admin", "resort", "restaurant")
  const grouped = permissions.reduce((acc, p) => {
    const module = p.name.split(".")[0] ?? "other";
    (acc[module] = acc[module] ?? []).push(p);
    return acc;
  }, {});

  const COLORS = ["bg-purple-500", "bg-blue-500", "bg-orange-500", "bg-green-500", "bg-pink-500", "bg-teal-500"];

  const card     = dark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC]";
  const titleCls = dark ? "text-gray-100" : "text-[#102A43]";
  const subText  = dark ? "text-gray-400" : "text-[#829AB1]";
  const thead    = dark ? "bg-gray-700/60" : "bg-[#F5F8FC]";
  const thText   = dark ? "text-gray-400" : "text-[#829AB1]";
  const rowHover = dark ? "hover:bg-gray-700/30" : "hover:bg-[#F5F8FC]";
  const divider  = dark ? "divide-gray-700" : "divide-gray-200";

  if (loading) return <p className={`p-4 text-sm ${subText}`}>Loading…</p>;

  return (
    <div className={`min-h-full rounded-xl p-4 transition-colors duration-200 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`} style={{ fontFamily: "Inter, Poppins, sans-serif" }}>
      <div className="flex items-center justify-between mb-5">
        <h2 className={`text-xl font-bold ${titleCls}`}>Permission Management</h2>
        {saving && <span className={`text-xs ${subText}`}>Saving…</span>}
      </div>

      {/* Role Tabs */}
      <div className="flex gap-3 mb-5 flex-wrap">
        {roles.map((r, i) => (
          <Button key={r.id} onClick={() => setActiveRole(r.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              activeRole === r.id
                ? `${COLORS[i % COLORS.length]} text-white border-transparent shadow-md`
                : dark ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700" : "bg-white border-[#D9E2EC] text-[#486581] hover:bg-[#F5F8FC]"
            }`}>
            <MdShield size={14} />
            {r.display_name ?? r.name}
          </Button>
        ))}
      </div>

      {/* Permissions Table */}
      <div className={`rounded-xl border shadow-sm overflow-hidden ${card}`}>
        <div className={`px-6 py-4 border-b ${dark ? "border-gray-700" : "border-[#D9E2EC]"}`}>
          <p className={`text-sm font-medium ${titleCls}`}>
            Permissions for: <span className="font-bold">{currentRole?.display_name ?? currentRole?.name}</span>
          </p>
          <p className={`text-xs mt-0.5 ${subText}`}>
            {can("admin.roles.update") ? "Click a permission to toggle it for this role." : "View-only mode."}
          </p>
        </div>

        <div className="overflow-x-auto">
          {Object.entries(grouped).map(([module, perms]) => (
            <div key={module}>
              <div className={`px-6 py-2 text-xs font-semibold uppercase tracking-wider ${dark ? "bg-gray-700/40 text-gray-400" : "bg-[#F5F8FC] text-[#829AB1]"}`}>
                {module}
              </div>
              <table className={`min-w-full divide-y ${divider}`}>
                <tbody className={`divide-y ${divider}`}>
                  {perms.map(perm => {
                    const has = assignedIds.has(perm.id);
                    return (
                      <tr key={perm.id} className={`transition-colors ${rowHover}`}>
                        <td className={`px-6 py-3 text-sm font-mono ${titleCls}`}>{perm.name}</td>
                        <td className={`px-4 py-3 text-xs ${subText}`}>{perm.description}</td>
                        <td className="px-4 py-3 text-center w-20">
                          <Button
                            onClick={() => toggle(perm.id)}
                            disabled={!can("admin.roles.update") || saving}
                            className={`w-7 h-7 rounded flex items-center justify-center mx-auto transition-colors disabled:opacity-50 ${
                              has
                                ? "bg-[#FF6B00] text-white"
                                : dark ? "bg-gray-700 border border-gray-600" : "bg-white border border-[#D9E2EC]"
                            }`}>
                            {has ? <MdCheck size={14} /> : <MdClose size={14} className={dark ? "text-[#486581]" : "text-gray-300"} />}
                          </Button>
                        </td>
                        {can("admin.permissions.delete") && (
                          <td className="px-4 py-3 text-center w-16">
                            <Button onClick={() => handleDeletePermission(perm.id)}
                              className={`w-7 h-7 rounded flex items-center justify-center mx-auto transition-colors ${
                                dark ? "text-red-400 hover:bg-red-900/40" : "text-red-500 hover:bg-red-50"
                              }`}>
                              <MdDelete size={14} />
                            </Button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
