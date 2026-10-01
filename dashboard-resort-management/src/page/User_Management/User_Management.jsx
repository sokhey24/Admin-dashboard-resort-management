import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdEdit, MdDelete, MdSearch, MdAdd, MdClose, MdPerson, MdManageAccounts } from "react-icons/md";
import { request } from "../../util/request";
import { useDarkMode } from "../../util/DarkModeContext";
import { Button } from "antd";
import usePermission from "../../util/usePermission";
import { ProfileStore } from "../../store/ProfileStore";

const PAGE_SIZE = 8;

const STATUS_STYLE = {
  active:   { dot: "bg-green-500",  light: "bg-green-50 text-green-700 ring-green-200",    dark: "bg-green-900/40 text-green-400 ring-green-700"   },
  inactive: { dot: "bg-yellow-500", light: "bg-yellow-50 text-yellow-700 ring-yellow-200", dark: "bg-yellow-900/40 text-yellow-400 ring-yellow-700" },
};

const ROLE_STYLE = {
  admin:               { light: "bg-purple-50 text-purple-700 ring-purple-200",    dark: "bg-purple-900/40 text-purple-400 ring-purple-700"   },
  resort_manager:      { light: "bg-blue-50 text-blue-700 ring-blue-200",          dark: "bg-blue-900/40 text-blue-400 ring-blue-700"         },
  restaurant_manager:  { light: "bg-orange-50 text-orange-700 ring-orange-200",    dark: "bg-orange-900/40 text-orange-400 ring-orange-700"   },
  resort_staff:        { light: "bg-teal-50 text-teal-700 ring-teal-200",          dark: "bg-teal-900/40 text-teal-400 ring-teal-700"         },
  restaurant_staff:    { light: "bg-yellow-50 text-yellow-700 ring-yellow-200",    dark: "bg-yellow-900/40 text-yellow-400 ring-yellow-700"   },
  customer:            { light: "bg-[#F5F8FC] text-[#486581] ring-gray-200",          dark: "bg-gray-700/40 text-[#829AB1] ring-gray-600"         },
};

const ROLE_FALLBACK = { light: "bg-[#F5F8FC] text-[#486581] ring-gray-200", dark: "bg-gray-700/40 text-[#829AB1] ring-gray-600" };

function BadgeStatus({ status, dark }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.inactive;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? s.dark : s.light}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
}

function BadgeRole({ role, dark }) {
  const s = ROLE_STYLE[role] ?? ROLE_FALLBACK;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? s.dark : s.light}`}>
      {role?.replaceAll("_", " ") ?? "—"}
    </span>
  );
}

function UserModal({ user, onClose, onSaved, dark, availableRoles }) {
  const isEdit = !!user;
  const [form, setForm] = useState(
    isEdit
      ? { name: user.name, email: user.email, phone: user.phone ?? "", role: user.roles?.[0]?.name ?? "", status: user.status }
      : { name: "", email: "", phone: "", password: "", role: availableRoles[0]?.name ?? "", status: "active" }
  );
  const [saving, setSaving] = useState(false);
  const [errs,   setErrs]   = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = "Full name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Please enter a valid email.";
    if (!isEdit && form.password.length < 8) e.password = "Password must be at least 8 characters.";
    setErrs(e);
    return !Object.keys(e).length;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const payload = isEdit
      ? { name: form.name, email: form.email, phone: form.phone, status: form.status, role: form.role }
      : form;
    const res = isEdit
      ? await request(`admin/users/${user.id}`, "put", payload)
      : await request("admin/users", "post", payload);
    setSaving(false);
    if (res?.errors) { setErrs({ _: res.errors.message ?? "Failed to save." }); return; }
    if (res?.data) { onSaved(); onClose(); }
  };

  const set = (key) => (e) => {
    setForm(f => ({ ...f, [key]: e.target.value }));
    setErrs(p => ({ ...p, [key]: undefined }));
  };

  const inputCls = (key) => `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
    errs[key] ? "border-red-400 focus:ring-red-400/40" : "focus:ring-[#FF6B00]/30 " + (dark ? "border-gray-600" : "border-[#D9E2EC]")
  } ${dark ? "bg-gray-700 text-gray-100 placeholder-[#829AB1]" : "bg-white text-[#102A43]"}`;
  const labelCls = `block text-[14px] font-semibold mb-1 ${dark ? "text-gray-300" : "text-[#486581]"}`;
  const errMsg   = (key) => errs[key] && <p className="mt-1 text-xs text-red-500">{errs[key]}</p>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className={`rounded-xl shadow-2xl w-full max-w-md p-6 ${dark ? "bg-gray-800 border border-gray-700" : "bg-white"}`}>
        <div className="flex items-center justify-between mb-5">
          <h3 className={`text-base font-semibold ${dark ? "text-gray-100" : "text-[#102A43]"}`}>
            {isEdit ? "Edit User" : "Add User"}
          </h3>
          <Button onClick={onClose} className={`${dark ? "text-[#829AB1] hover:text-gray-200" : "text-[#829AB1] hover:text-[#486581]"}`}>
            <MdClose size={14} />
          </Button>
        </div>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Full Name <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={set("name")} className={inputCls("name")} />
            {errMsg("name")}
          </div>
          <div>
            <label className={labelCls}>Email <span className="text-red-500">*</span></label>
            <input type="email" value={form.email} onChange={set("email")} className={inputCls("email")} />
            {errMsg("email")}
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input value={form.phone} onChange={set("phone")} className={inputCls("phone")} />
          </div>
          {!isEdit && (
            <div>
              <label className={labelCls}>Password <span className="text-red-500">*</span></label>
              <input type="password" value={form.password} onChange={set("password")} className={inputCls("password")} />
              {errMsg("password")}
            </div>
          )}
          <div>
            <label className={labelCls}>Role</label>
            <select value={form.role} onChange={set("role")} className={inputCls("role")}>
              {availableRoles.map(r => <option key={r.name} value={r.name}>{r.display_name || r.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select value={form.status} onChange={set("status")} className={inputCls("status")}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          {errs._ && <p className="text-xs text-red-500">{errs._}</p>}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button onClick={onClose}
            className={`px-4 py-2 text-sm rounded-lg border transition-colors ${dark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-[#D9E2EC] text-[#486581] hover:bg-[#F5F8FC]"}`}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm rounded-[8px] bg-[#FF6B00] text-white hover:bg-[#e05e00] disabled:opacity-60 transition-colors">
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function UserManagement() {
  const dark     = useDarkMode();
  const navigate = useNavigate();
  const { can }  = usePermission();
  const [users,         setUsers]         = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [roleFilter,    setRoleFilter]    = useState("all");
  const [page,          setPage]          = useState(1);
  const [editing,       setEditing]       = useState(null);
  const [adding,        setAdding]        = useState(false);

  const { profile } = ProfileStore();

  const load = () => {
    setLoading(true);
    Promise.all([
      request("admin/users", "get"),
      request("admin/roles", "get"),
    ]).then(([usersRes, rolesRes]) => {
      const data  = Array.isArray(usersRes) ? usersRes : usersRes?.data ?? [];
      const roles = Array.isArray(rolesRes) ? rolesRes : rolesRes?.data ?? [];
      setUsers(data.filter(u => u.id !== profile?.id && u.roles?.every(r => r.name !== "admin")));
      setAvailableRoles(roles.filter(r => r.name !== "customer"));
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const roleNames = ["all", ...availableRoles.map(r => r.name)];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u =>
      (roleFilter === "all" || u.roles?.[0]?.name === roleFilter) &&
      (!q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
    );
  }, [users, search, roleFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    await request(`admin/users/${id}`, "delete");
    load();
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const card      = dark ? "bg-gray-800 border-gray-700"  : "bg-white border-[#D9E2EC]";
  const cardHdr   = dark ? "border-gray-700"               : "border-[#D9E2EC]";
  const titleCls  = dark ? "text-gray-100"                 : "text-[#102A43]";
  const subText   = dark ? "text-gray-400"                 : "text-[#829AB1]";
  const thead     = dark ? "bg-gray-700/60"                : "bg-[#F5F8FC]";
  const thText    = dark ? "text-gray-400"                 : "text-[#829AB1]";
  const tbody     = dark ? "bg-gray-800 divide-gray-700"   : "bg-white divide-gray-100";
  const rowHover  = dark ? "hover:bg-gray-700/50"          : "hover:bg-[#F5F8FC]";
  const cellText  = dark ? "text-gray-300"                 : "text-[#486581]";
  const cellMuted = dark ? "text-[#829AB1]"                 : "text-[#829AB1]";
  const divider   = dark ? "divide-gray-700"               : "divide-gray-200";
  const filterBg  = dark ? "bg-gray-700"                   : "bg-[#F5F8FC]";
  const filterBtn = dark ? "text-[#829AB1] hover:text-gray-200" : "text-[#829AB1] hover:text-[#486581]";
  const filterAct = dark ? "bg-gray-600 text-gray-100 shadow" : "bg-white text-[#102A43] shadow";
  const searchCls = dark
    ? "pl-9 pr-3 py-1.5 text-sm border border-gray-600 bg-gray-700 text-gray-100 placeholder-[#829AB1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-48"
    : "pl-9 pr-3 py-1.5 text-sm border border-[#D9E2EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-48";
  const pageBtn   = dark
    ? "px-3 py-1.5 rounded-[8px] border border-gray-600 text-xs font-semibold hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300"
    : "px-3 py-1.5 rounded-[8px] border border-[#D9E2EC] text-xs font-semibold hover:bg-[#F5F8FC] disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className={`min-h-full rounded-xl p-4 transition-colors duration-200 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`} style={{ fontFamily: "Inter, Poppins, sans-serif" }}>
      <h2 className={`text-[26px] font-bold mb-5 ${titleCls}`}>User Management</h2>

      <div className={`rounded-xl shadow-sm border overflow-hidden ${card}`}>
        <div className={`px-6 py-4 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${cardHdr}`}>
          <div className="flex items-center gap-2">
            <span className={`text-[18px] font-semibold ${titleCls}`}>System Users</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? "bg-blue-900/40 text-blue-400 ring-blue-700" : "bg-[#FF6B00]/10 text-[#102A43] ring-[#FF6B00]/20"}`}>
              {filtered.length} users
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`flex gap-1 rounded-lg p-1 ${filterBg}`}>
              {roleNames.map(r => (
                <Button key={r} onClick={() => { setRoleFilter(r); setPage(1); }}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${roleFilter === r ? filterAct : filterBtn}`}>
                  {r === "all" ? "All" : r.replaceAll("_", " ")}
                </Button>
              ))}
            </div>
            <div className="relative">
              <MdSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg ${dark ? "text-gray-400" : "text-gray-400"}`} />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search…" className={searchCls} />
            </div>
            {can("admin.users.create") && (
              <Button onClick={() => setAdding(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[8px] bg-[#FF6B00] text-white hover:bg-[#e05e00] transition-colors">
                <MdAdd size={14} /> Add User
              </Button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${divider}`}>
            <thead className={thead}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-12 ${thText}`}>No.</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>User</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>Role</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>Phone</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>Status</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>Created</th>
                <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${thText}`}>Action</th>
              </tr>
            </thead>
            <tbody className={`${tbody} divide-y`}>
              {loading ? (
                <tr><td colSpan={7} className={`py-16 text-center text-sm ${subText}`}>Loading…</td></tr>
              ) : pageItems.length === 0 ? (
                <tr><td colSpan={7} className={`py-16 text-center text-sm ${subText}`}>No users found</td></tr>
              ) : pageItems.map((user, idx) => (
                <tr key={user.id} className={`transition-colors ${rowHover}`}>
                  <td className={`px-4 py-4 text-sm font-medium ${cellMuted}`}>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0 ${dark ? "bg-[#1a3a5c]" : "bg-[#FF6B00]"}`}>
                        {user.name?.charAt(0).toUpperCase() ?? <MdPerson />}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${titleCls}`}>{user.name}</p>
                        <p className={`text-xs truncate ${subText}`}>{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <BadgeRole role={user.roles?.[0]?.name} dark={dark} />
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${cellText}`}>{user.phone ?? "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><BadgeStatus status={user.status} dark={dark} /></td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${cellMuted}`}>{user.created_at?.slice(0, 10)}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1.5">
                      {can("admin.users.update") && (
                        <Button onClick={() => setEditing(user)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                            dark ? "bg-blue-900/40 text-blue-400 hover:bg-blue-900/70" : "bg-[#FFF3E8] text-[#FF6B00] hover:bg-orange-100"
                          }`}>
                          <MdEdit size={14} /> Edit
                        </Button>
                      )}
                      {can("admin.permissions.view") && (
                        <Button onClick={() => navigate(`/user_management/users/${user.id}/permissions`)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                            dark ? "bg-purple-900/40 text-purple-400 hover:bg-purple-900/70" : "bg-purple-50 text-purple-600 hover:bg-purple-100"
                          }`}>
                          <MdManageAccounts size={14} /> Manage
                        </Button>
                      )}
                      {can("admin.users.delete") && (
                        <Button onClick={() => handleDelete(user.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                            dark ? "bg-red-900/40 text-red-400 hover:bg-red-900/70" : "bg-red-50 text-red-600 hover:bg-red-100"
                          }`}>
                          <MdDelete size={14} /> Delete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={`px-6 py-3 border-t flex items-center justify-between text-sm ${cardHdr} ${subText}`}>
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={pageBtn}>Previous</Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <Button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                  page === p ? "bg-[#FF6B00] text-white" : dark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-[#F5F8FC] text-[#486581]"
                }`}>{p}</Button>
            ))}
            <Button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={pageBtn}>Next</Button>
          </div>
        </div>
      </div>

      {(editing || adding) && (
        <UserModal
          user={editing}
          onClose={() => { setEditing(null); setAdding(false); }}
          onSaved={load}
          dark={dark}
          availableRoles={availableRoles}
        />
      )}
    </div>
  );
}
