import { useEffect, useMemo, useState } from "react";
import { MdEdit, MdDelete, MdSearch, MdAdd, MdClose, MdPerson } from "react-icons/md";
import { request } from "../../util/request";
import { useDarkMode } from "../../util/DarkModeContext";
import { Button } from "antd";

const SAMPLE = [
  { id: 1,  name: "Admin User",      email: "admin@resort.com",      phone: "0961234501", roles: [{ name: "admin" }],              status: "active",   created_at: "2023-01-01" },
  { id: 2,  name: "Resort Manager",  email: "resort@resort.com",     phone: "0961234502", roles: [{ name: "resort_manager" }],     status: "active",   created_at: "2023-02-15" },
  { id: 3,  name: "Restaurant Mgr",  email: "restaurant@resort.com", phone: "0961234503", roles: [{ name: "restaurant_manager" }], status: "active",   created_at: "2023-03-10" },
  { id: 4,  name: "Branch Manager",  email: "branch@resort.com",     phone: "0961234504", roles: [{ name: "resort_manager" }],     status: "inactive", created_at: "2023-04-20" },
  { id: 5,  name: "Staff Member",    email: "staff@resort.com",      phone: "0961234505", roles: [{ name: "admin" }],              status: "active",   created_at: "2023-05-05" },
];

const ROLES_LIST = ["all", "admin", "resort_manager", "restaurant_manager"];
const PAGE_SIZE  = 8;

const STATUS_STYLE = {
  active:   { dot: "bg-green-500",  light: "bg-green-50 text-green-700 ring-green-200",    dark: "bg-green-900/40 text-green-400 ring-green-700"   },
  inactive: { dot: "bg-yellow-500", light: "bg-yellow-50 text-yellow-700 ring-yellow-200", dark: "bg-yellow-900/40 text-yellow-400 ring-yellow-700" },
};

const ROLE_STYLE = {
  admin:               { light: "bg-purple-50 text-purple-700 ring-purple-200",    dark: "bg-purple-900/40 text-purple-400 ring-purple-700"   },
  resort_manager:      { light: "bg-blue-50 text-blue-700 ring-blue-200",          dark: "bg-blue-900/40 text-blue-400 ring-blue-700"         },
  restaurant_manager:  { light: "bg-orange-50 text-orange-700 ring-orange-200",    dark: "bg-orange-900/40 text-orange-400 ring-orange-700"   },
};

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
  const s = ROLE_STYLE[role] ?? ROLE_STYLE.admin;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? s.dark : s.light}`}>
      {role?.replaceAll("_", " ")}
    </span>
  );
}

function UserModal({ user, onClose, onSaved, dark }) {
  const isEdit = !!user;
  const [form, setForm] = useState(
    isEdit
      ? { name: user.name, email: user.email, phone: user.phone ?? "", role: user.roles?.[0]?.name ?? "admin", status: user.status }
      : { name: "", email: "", phone: "", role: "admin", status: "active" }
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const res = isEdit
      ? await request(`admin/users/${user.id}`, "put", form)
      : await request("admin/users", "post", form);
    setSaving(false);
    if (res?.message || res?.data) { onSaved(); onClose(); }
  };

  const inputCls = `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2744]/40 ${
    dark ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400" : "bg-white border-gray-300 text-gray-900"
  }`;
  const labelCls = `block text-sm font-medium mb-1 ${dark ? "text-gray-300" : "text-gray-700"}`;

  const field = (label, key, type = "text", options = null) => (
    <div>
      <label className={labelCls}>{label}</label>
      {options ? (
        <select value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className={inputCls}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className={inputCls} />
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className={`rounded-2xl shadow-2xl w-full max-w-md p-6 ${dark ? "bg-gray-800 border border-gray-700" : "bg-white"}`}>
        <div className="flex items-center justify-between mb-5">
          <h3 className={`text-base font-semibold ${dark ? "text-gray-100" : "text-gray-900"}`}>
            {isEdit ? "Edit User" : "Add User"}
          </h3>
          <Button onClick={onClose} className={`${dark ? "text-gray-400 hover:text-gray-200" : "text-gray-400 hover:text-gray-600"}`}>
            <MdClose size={20} />
          </Button>
        </div>
        <div className="space-y-4">
          {field("Full Name", "name")}
          {field("Email",     "email", "email")}
          {field("Phone",     "phone")}
          {field("Role",      "role", "text", [
            { value: "admin",              label: "Admin" },
            { value: "resort_manager",     label: "Resort Manager" },
            { value: "restaurant_manager", label: "Restaurant Manager" },
          ])}
          {field("Status", "status", "text", [
            { value: "active",   label: "Active" },
            { value: "inactive", label: "Inactive" },
          ])}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button onClick={onClose}
            className={`px-4 py-2 text-sm rounded-lg border transition-colors ${dark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-[#0f2744] text-white hover:bg-[#1a3a5c] disabled:opacity-60 transition-colors">
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function UserManagement() {
  const dark = useDarkMode();
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [role,    setRole]    = useState("all");
  const [page,    setPage]    = useState(1);
  const [editing, setEditing] = useState(null);
  const [adding,  setAdding]  = useState(false);

  const load = () => {
    setLoading(true);
    request("admin/staff", "get").then(res => {
      setUsers(res?.data?.length ? res.data : SAMPLE);
      setLoading(false);
    }).catch(() => { setUsers(SAMPLE); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u =>
      (role === "all" || u.roles?.[0]?.name === role) &&
      (!q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
    );
  }, [users, search, role]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const card      = dark ? "bg-gray-800 border-gray-700"  : "bg-white border-gray-200";
  const cardHdr   = dark ? "border-gray-700"               : "border-gray-200";
  const titleCls  = dark ? "text-gray-100"                 : "text-gray-900";
  const subText   = dark ? "text-gray-400"                 : "text-gray-500";
  const thead     = dark ? "bg-gray-700/60"                : "bg-gray-50";
  const thText    = dark ? "text-gray-400"                 : "text-gray-500";
  const tbody     = dark ? "bg-gray-800 divide-gray-700"   : "bg-white divide-gray-100";
  const rowHover  = dark ? "hover:bg-gray-700/50"          : "hover:bg-gray-50";
  const cellText  = dark ? "text-gray-300"                 : "text-gray-600";
  const cellMuted = dark ? "text-gray-500"                 : "text-gray-500";
  const divider   = dark ? "divide-gray-700"               : "divide-gray-200";
  const filterBg  = dark ? "bg-gray-700"                   : "bg-gray-100";
  const filterBtn = dark ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700";
  const filterAct = dark ? "bg-gray-600 text-gray-100 shadow" : "bg-white text-gray-900 shadow";
  const searchCls = dark
    ? "pl-9 pr-3 py-1.5 text-sm border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 w-48"
    : "pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2744]/30 w-48";
  const pageBtn   = dark
    ? "px-3 py-1.5 rounded-lg border border-gray-600 text-xs font-medium hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300"
    : "px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className={`min-h-full rounded-xl p-4 transition-colors duration-200 ${dark ? "bg-gray-900" : "bg-gray-100"}`}>
      <h2 className={`text-xl font-bold mb-5 ${titleCls}`}>User Management</h2>

      <div className={`rounded-2xl shadow-sm border overflow-hidden ${card}`}>
        <div className={`px-6 py-4 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${cardHdr}`}>
          <div className="flex items-center gap-2">
            <span className={`text-base font-semibold ${titleCls}`}>System Users</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? "bg-blue-900/40 text-blue-400 ring-blue-700" : "bg-[#0f2744]/10 text-[#0f2744] ring-[#0f2744]/20"}`}>
              {filtered.length} users
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`flex gap-1 rounded-lg p-1 ${filterBg}`}>
              {ROLES_LIST.map(r => (
                <Button key={r} onClick={() => { setRole(r); setPage(1); }}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${role === r ? filterAct : filterBtn}`}>
                  {r === "all" ? "All" : r.replaceAll("_", " ")}
                </Button>
              ))}
            </div>
            <div className="relative">
              <MdSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg ${dark ? "text-gray-400" : "text-gray-400"}`} />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search…" className={searchCls} />
            </div>
            <Button onClick={() => setAdding(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#0f2744] text-white hover:bg-[#1a3a5c] transition-colors">
              <MdAdd size={16} /> Add User
            </Button>
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
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0 ${dark ? "bg-[#1a3a5c]" : "bg-[#0f2744]"}`}>
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
                      <Button onClick={() => setEditing(user)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                          dark ? "bg-blue-900/40 text-blue-400 hover:bg-blue-900/70" : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                        }`}>
                        <MdEdit size={14} /> Edit
                      </Button>
                      <Button className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        dark ? "bg-red-900/40 text-red-400 hover:bg-red-900/70" : "bg-red-50 text-red-600 hover:bg-red-100"
                      }`}>
                        <MdDelete size={14} /> Delete
                      </Button>
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
                  page === p ? "bg-[#0f2744] text-white" : dark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-600"
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
        />
      )}
    </div>
  );
}
