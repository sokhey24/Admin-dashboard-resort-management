import { useEffect, useMemo, useState } from "react";
import { MdEdit, MdDelete, MdSearch, MdUnfoldMore, MdKeyboardArrowUp, MdKeyboardArrowDown, MdClose, MdPerson } from "react-icons/md";
import { request } from "../../util/request";
import { useDarkMode } from "../../util/DarkModeContext";
import { Button } from "antd";


const SAMPLE_USERS = [
  { id: 1,  name: "Sophea Meas",     email: "sophea@example.com",    phone: "0961234501", gender: "female", status: "active",   roles: [{ name: "customer" }], created_at: "2024-01-05" },
  { id: 2,  name: "Dara Chann",      email: "dara@example.com",      phone: "0961234502", gender: "male",   status: "active",   roles: [{ name: "customer" }], created_at: "2024-01-10" },
  { id: 3,  name: "Bopha Keo",       email: "bopha@example.com",     phone: "0961234503", gender: "female", status: "inactive", roles: [{ name: "customer" }], created_at: "2024-02-03" },
  { id: 4,  name: "Virak Sok",       email: "virak@example.com",     phone: "0961234504", gender: "male",   status: "active",   roles: [{ name: "customer" }], created_at: "2024-02-14" },
  { id: 5,  name: "Sreymom Pich",    email: "sreymom@example.com",   phone: "0961234505", gender: "female", status: "active",   roles: [{ name: "customer" }], created_at: "2024-03-01" },
  { id: 6,  name: "Kosal Heng",      email: "kosal@example.com",     phone: "0961234506", gender: "male",   status: "banned",   roles: [{ name: "customer" }], created_at: "2024-03-18" },
  { id: 7,  name: "Chanthy Lim",     email: "chanthy@example.com",   phone: "0961234507", gender: "female", status: "active",   roles: [{ name: "customer" }], created_at: "2024-04-07" },
  { id: 8,  name: "Piseth Noun",     email: "piseth@example.com",    phone: "0961234508", gender: "male",   status: "inactive", roles: [{ name: "customer" }], created_at: "2024-04-22" },
  { id: 9,  name: "Ratana Chhun",    email: "ratana@example.com",    phone: "0961234509", gender: "female", status: "active",   roles: [{ name: "customer" }], created_at: "2024-05-09" },
  { id: 10, name: "Makara Ung",      email: "makara@example.com",    phone: "0961234510", gender: "male",   status: "active",   roles: [{ name: "customer" }], created_at: "2024-05-30" },
  { id: 11, name: "Leakhena Ros",    email: "leakhena@example.com",  phone: "0961234511", gender: "female", status: "active",   roles: [{ name: "customer" }], created_at: "2024-06-11" },
  { id: 12, name: "Bunthoeun Yim",   email: "bunthoeun@example.com", phone: "0961234512", gender: "male",   status: "inactive", roles: [{ name: "customer" }], created_at: "2024-06-25" },
  { id: 13, name: "Sokunthea Pen",   email: "sokunthea@example.com", phone: "0961234513", gender: "female", status: "active",   roles: [{ name: "customer" }], created_at: "2024-07-04" },
  { id: 14, name: "Veasna Tep",      email: "veasna@example.com",    phone: "0961234514", gender: "male",   status: "active",   roles: [{ name: "customer" }], created_at: "2024-07-19" },
  { id: 15, name: "Channary Seng",   email: "channary@example.com",  phone: "0961234515", gender: "female", status: "banned",   roles: [{ name: "customer" }], created_at: "2024-08-02" },
];

const STATUSES = ["all", "active", "inactive", "banned"];

const STATUS_STYLE = {
  active:   { dot: "bg-green-500",  light: "bg-green-50 text-green-700 ring-green-200",   dark: "bg-green-900/40 text-green-400 ring-green-700"  },
  inactive: { dot: "bg-yellow-500", light: "bg-yellow-50 text-yellow-700 ring-yellow-200", dark: "bg-yellow-900/40 text-yellow-400 ring-yellow-700" },
  banned:   { dot: "bg-red-500",    light: "bg-red-50 text-red-700 ring-red-200",          dark: "bg-red-900/40 text-red-400 ring-red-700"         },
};

const PAGE_SIZE = 10;

function Avatar({ name, src }) {
  if (src) return <img src={src} alt={name} className="w-9 h-9 rounded-full object-cover shrink-0" />;
  return (
    <div className="w-9 h-9 rounded-full bg-[#0f2744] flex items-center justify-center text-white font-semibold text-sm shrink-0">
      {name?.charAt(0).toUpperCase() ?? <MdPerson />}
    </div>
  );
}

function BadgeWithDot({ status, dark }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.inactive;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? s.dark : s.light}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
}

function SortIcon({ column, sortCol, sortDir, dark }) {
  const cls = dark ? "text-gray-500" : "text-gray-400";
  const activeClass = dark ? "text-gray-200" : "text-gray-700";
  if (sortCol !== column) return <MdUnfoldMore className={`text-base ${cls}`} />;
  return sortDir === "asc"
    ? <MdKeyboardArrowUp className={`text-base ${activeClass}`} />
    : <MdKeyboardArrowDown className={`text-base ${activeClass}`} />;
}

function EditModal({ user, onClose, onSaved, dark }) {
  const [form, setForm] = useState({ name: user.name, email: user.email, phone: user.phone ?? "", gender: user.gender ?? "", status: user.status });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const res = await request(`admin/users/${user.id}`, "put", form);
    setSaving(false);
    if (res?.message) { onSaved(); onClose(); }
  };

  const inputCls = `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
    dark ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400" : "bg-white border-gray-300 text-gray-900"
  }`;
  const labelCls = `block text-sm font-medium mb-1 ${dark ? "text-gray-300" : "text-gray-700"}`;

  const field = (label, key, type = "text", options = null) => (
    <div>
      <label className={labelCls}>{label}</label>
      {options ? (
        <select value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className={inputCls}>
          {options.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
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
          <h3 className={`text-base font-semibold ${dark ? "text-gray-100" : "text-gray-900"}`}>Edit User</h3>
          <Button onClick={onClose} className={`${dark ? "text-gray-400 hover:text-gray-200" : "text-gray-400 hover:text-gray-600"}`}>
            <MdClose size={20} />
          </Button>
        </div>
        <div className="space-y-4">
          {field("Name",   "name")}
          {field("Email",  "email", "email")}
          {field("Phone",  "phone")}
          {field("Gender", "gender", "text", ["male", "female", "other"])}
          {field("Status", "status", "text", ["active", "inactive", "banned"])}
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

function DeleteConfirm({ user, onClose, onDeleted, dark }) {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    const res = await request(`admin/users/${user.id}`, "delete");
    setLoading(false);
    if (res?.message) { onDeleted(); onClose(); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className={`rounded-2xl shadow-2xl w-full max-w-sm p-6 ${dark ? "bg-gray-800 border border-gray-700" : "bg-white"}`}>
        <h3 className={`text-base font-semibold mb-2 ${dark ? "text-gray-100" : "text-gray-900"}`}>Delete User</h3>
        <p className={`text-sm mb-6 ${dark ? "text-gray-400" : "text-gray-500"}`}>
          Are you sure you want to delete {" "}
          <span className={`font-medium ${dark ? "text-gray-200" : "text-gray-800"}`}>{user.name}</span>?
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}
            className={`px-4 py-2 text-sm rounded-lg border transition-colors ${dark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}>
            Cancel
          </Button>
          <Button onClick={handleDelete} disabled={loading}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 transition-colors">
            {loading ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CustomerManagement() {
  const dark = useDarkMode();

  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [status,   setStatus]   = useState("all");
  const [sortCol,  setSortCol]  = useState("name");
  const [sortDir,  setSortDir]  = useState("asc");
  const [page,     setPage]     = useState(1);
  const [editing,  setEditing]  = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = () => {
    setLoading(true);
    request("admin/users", "get").then((res) => {
      setUsers(res?.data?.length ? res.data : SAMPLE_USERS);
      setLoading(false);
    }).catch(() => {
      setUsers(SAMPLE_USERS);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
    setPage(1);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users
      .filter(u => (status === "all" || u.status === status) &&
        (!q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)))
      .sort((a, b) => {
        const av = a[sortCol] ?? "", bv = b[sortCol] ?? "";
        const cmp = String(av).localeCompare(String(bv));
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [users, search, status, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── dynamic classes ──────────────────────────────────────────
  const card      = dark ? "bg-gray-800 border-gray-700"  : "bg-white border-gray-200";
  const cardHdr   = dark ? "border-gray-700"               : "border-gray-200";
  const title     = dark ? "text-gray-100"                 : "text-gray-900";
  const subText   = dark ? "text-gray-400"                 : "text-gray-500";
  const thead     = dark ? "bg-gray-700/60"                : "bg-gray-50";
  const thText    = dark ? "text-gray-400"                 : "text-gray-500";
  const thHover   = dark ? "hover:bg-gray-700"             : "hover:bg-gray-100";
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
  const pageNum   = (active) => active
    ? "w-8 h-8 rounded-lg text-xs font-medium bg-[#0f2744] text-white"
    : `w-8 h-8 rounded-lg text-xs font-medium transition-colors ${dark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-600"}`;

  const HeadCell = ({ col, label, className = "" }) => (
    <th onClick={() => handleSort(col)}
      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer select-none whitespace-nowrap ${thText} ${thHover} ${className}`}>
      <span className="inline-flex items-center gap-1">
        {label}
        <SortIcon column={col} sortCol={sortCol} sortDir={sortDir} dark={dark} />
      </span>
    </th>
  );

  return (
    <div>
      <h2 className={`text-xl font-bold mb-5 ${title}`}>Customer Management</h2>

      <div className={`rounded-2xl shadow-sm border overflow-hidden ${card}`}>

        {/* ── Header ── */}
        <div className={`px-6 py-4 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${cardHdr}`}>
          <div className="flex items-center gap-2">
            <span className={`text-base font-semibold ${title}`}>Customer List</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? "bg-blue-900/40 text-blue-400 ring-blue-700" : "bg-blue-50 text-blue-700 ring-blue-200"}`}>
              {filtered.length} users
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status tabs */}
            <div className={`flex gap-1 rounded-lg p-1 ${filterBg}`}>
              {STATUSES.map(s => (
                <Button key={s} onClick={() => { setStatus(s); setPage(1); }}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${status === s ? filterAct : filterBtn}`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Button>
              ))}
            </div>
            {/* Search */}
            <div className="relative">
              <MdSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg ${dark ? "text-gray-400" : "text-gray-400"}`} />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search…" className={searchCls} />
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${divider}`}>
            <thead className={thead}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-12 ${thText}`}>No.</th>
                <HeadCell col="name"       label="Name"          className="w-1/4" />
                <HeadCell col="status"     label="Status" />
                <HeadCell col="role"       label="Role" />
                <HeadCell col="email"      label="Email address" className="hidden xl:table-cell" />
                <HeadCell col="phone"      label="Phone" />
                <HeadCell col="created_at" label="Joined" />
                <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${thText}`}>Action</th>
              </tr>
            </thead>
            <tbody className={`${tbody} divide-y`}>
              {loading ? (
                <tr><td colSpan={8} className={`py-16 text-center text-sm ${subText}`}>Loading…</td></tr>
              ) : pageItems.length === 0 ? (
                <tr><td colSpan={8} className={`py-16 text-center text-sm ${subText}`}>No users found</td></tr>
              ) : pageItems.map((user, idx) => (
                <tr key={user.id} className={`transition-colors ${rowHover}`}>
                  {/* # */}
                  <td className={`px-4 py-4 text-sm font-medium ${cellMuted}`}>
                    {(page - 1) * PAGE_SIZE + idx + 1}
                  </td>
                  {/* Name + Avatar */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.name} src={user.profile_image_url} />
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${title}`}>{user.name}</p>
                        <p className={`text-xs truncate ${subText}`}>{user.email}</p>
                      </div>
                    </div>
                  </td>
                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <BadgeWithDot status={user.status} dark={dark} />
                  </td>
                  {/* Role */}
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${cellText}`}>
                    {user.roles?.[0]?.name ?? "Customer"}
                  </td>
                  {/* Email */}
                  <td className={`px-6 py-4 whitespace-nowrap text-sm hidden xl:table-cell ${cellText}`}>
                    {user.email}
                  </td>
                  {/* Phone */}
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${cellText}`}>
                    {user.phone ?? "—"}
                  </td>
                  {/* Joined */}
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${cellMuted}`}>
                    {user.created_at?.slice(0, 10)}
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button onClick={() => setEditing(user)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                          dark ? "bg-blue-900/40 text-blue-400 hover:bg-blue-900/70" : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                        }`}>
                        <MdEdit size={14} /> Edit
                      </Button>
                      <Button onClick={() => setDeleting(user)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
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

        {/* ── Pagination ── */}
        <div className={`px-6 py-3 border-t flex items-center justify-between text-sm ${cardHdr} ${subText}`}>
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={pageBtn}>
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce((acc, p, i, arr) => {
                if (i > 0 && p - arr[i - 1] > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) => p === "…" ? (
                <span key={`e-${i}`} className={`px-2 ${cellMuted}`}>…</span>
              ) : (
                <Button key={p} onClick={() => setPage(p)} className={pageNum(page === p)}>{p}</Button>
              ))}
            <Button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={pageBtn}>
              Next
            </Button>
          </div>
        </div>
      </div>

      {editing  && <EditModal     user={editing}  onClose={() => setEditing(null)}  onSaved={load} dark={dark} />}
      {deleting && <DeleteConfirm user={deleting} onClose={() => setDeleting(null)} onDeleted={load} dark={dark} />}
    </div>
  );
}
