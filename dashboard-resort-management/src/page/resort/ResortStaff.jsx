import { useEffect, useMemo, useState } from "react";
import { MdEdit, MdDelete, MdSearch, MdAdd, MdClose, MdPerson } from "react-icons/md";
import { request } from "../../util/request";
import { useDarkMode } from "../../util/DarkModeContext";
import { Button } from "antd";
import usePermission from "../../util/usePermission";
import ConfirmDialog from "../../components/ConfirmDialog";

const PAGE_SIZE = 8;

const STATUS_STYLE = {
  active:   { dot: "bg-green-500",  light: "bg-green-50 text-green-700 ring-green-200",    dark: "bg-green-900/40 text-green-400 ring-green-700"   },
  inactive: { dot: "bg-yellow-500", light: "bg-yellow-50 text-yellow-700 ring-yellow-200", dark: "bg-yellow-900/40 text-yellow-400 ring-yellow-700" },
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

function StaffModal({ staff, onClose, onSaved, dark }) {
  const isEdit = !!staff;
  const [form, setForm] = useState(
    isEdit
      ? { name: staff.name, email: staff.email, phone: staff.phone ?? "", status: staff.status, role: staff.roles?.[0]?.name ?? "resort_staff" }
      : { name: "", email: "", phone: "", password: "", status: "active", role: "resort_staff" }
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

  const set = (key) => (e) => {
    setForm(f => ({ ...f, [key]: e.target.value }));
    setErrs(p => ({ ...p, [key]: undefined }));
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const res = isEdit
      ? await request(`resort/staff/${staff.id}`, "put", form)
      : await request("resort/staff", "post", form);
    setSaving(false);
    if (res?.errors) { setErrs({ _: res.errors.message ?? "Failed to save." }); return; }
    if (res?.data)   { onSaved(); onClose(); }
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
            {isEdit ? "Edit Resort Staff" : "Add Resort Staff"}
          </h3>
          <Button onClick={onClose}><MdClose size={14} /></Button>
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
              <input type="password" value={form.password} onChange={set("password")} className={inputCls("password")} placeholder="Min. 8 characters" />
              {errMsg("password")}
            </div>
          )}
          <div>
            <label className={labelCls}>Role</label>
            <select value={form.role} onChange={set("role")} className={inputCls("role")}>
              <option value="resort_staff">Resort Staff</option>
              <option value="resort_manager">Resort Manager</option>
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
            className={`px-4 py-2 text-sm rounded-lg border ${dark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-[#D9E2EC] text-[#486581] hover:bg-[#F5F8FC]"}`}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm rounded-[8px] bg-[#FF6B00] text-white hover:bg-[#e05e00] disabled:opacity-60">
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ResortStaff() {
  const dark = useDarkMode();
  const { can } = usePermission();
  const [staff,   setStaff]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [page,    setPage]    = useState(1);
  const [editing, setEditing] = useState(null);
  const [adding,  setAdding]  = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = () => {
    setLoading(true);
    request("resort/staff", "get").then(res => {
      setStaff(Array.isArray(res?.data) ? res.data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const handleDelete = async () => {
    if (!confirm) return;
    setConfirm((c) => ({ ...c, loading: true }));
    const res = await request(`resort/staff/${confirm.staff.id}`, "delete");
    setConfirm(null);
    if (res?.errors) return;
    load();
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return staff.filter(s => !q || s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q));
  }, [staff, search]);

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
  const searchCls = dark
    ? "pl-9 pr-3 py-1.5 text-sm border border-gray-600 bg-gray-700 text-gray-100 placeholder-[#829AB1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-48"
    : "pl-9 pr-3 py-1.5 text-sm border border-[#D9E2EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-48";
  const pageBtn   = dark
    ? "px-3 py-1.5 rounded-[8px] border border-gray-600 text-xs font-semibold hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300"
    : "px-3 py-1.5 rounded-[8px] border border-[#D9E2EC] text-xs font-semibold hover:bg-[#F5F8FC] disabled:opacity-40 disabled:cursor-not-allowed";
  const actionBtn = `inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
    dark ? "bg-blue-900/40 text-blue-400 hover:bg-blue-900/70" : "bg-[#FFF3E8] text-[#FF6B00] hover:bg-orange-100"
  }`;

  return (
    <div className={`min-h-full rounded-xl p-4 transition-colors duration-200 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`} style={{ fontFamily: "Inter, Poppins, sans-serif" }}>
      <h2 className={`text-[26px] font-bold mb-5 ${titleCls}`}>User Management</h2>

      <div className={`rounded-xl shadow-sm border overflow-hidden ${card}`}>
        <div className={`px-6 py-4 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${cardHdr}`}>
          <div className="flex items-center gap-2">
            <span className={`text-[18px] font-semibold ${titleCls}`}>User Members : </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? "bg-blue-900/40 text-blue-400 ring-blue-700" : "bg-[#FF6B00]/10 text-[#102A43] ring-[#FF6B00]/20"}`}>
              {filtered.length} members
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <MdSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg ${dark ? "text-gray-400" : "text-gray-400"}`} />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search…" className={searchCls} />
            </div>
            {can("resort.staff.create") && (
              <Button onClick={() => setAdding(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[8px] bg-[#FF6B00] text-white hover:bg-[#e05e00]">
                <MdAdd size={14} /> Add Staff
              </Button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${divider}`}>
            <thead className={thead}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-12 ${thText}`}>No.</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>Staff</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>Role</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>Phone</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>Status</th>
                <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${thText}`}>Action</th>
              </tr>
            </thead>
            <tbody className={`${tbody} divide-y`}>
              {loading ? (
                <tr><td colSpan={6} className={`py-16 text-center text-sm ${subText}`}>Loading…</td></tr>
              ) : pageItems.length === 0 ? (
                <tr><td colSpan={6} className={`py-16 text-center text-sm ${subText}`}>No staff found</td></tr>
              ) : pageItems.map((s, idx) => (
                <tr key={s.id} className={`transition-colors ${rowHover}`}>
                  <td className={`px-4 py-4 text-sm font-medium ${cellMuted}`}>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0 ${dark ? "bg-[#1a3a5c]" : "bg-[#FF6B00]"}`}>
                        {s.name?.charAt(0).toUpperCase() ?? <MdPerson />}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${titleCls}`}>{s.name}</p>
                        <p className={`text-xs truncate ${subText}`}>{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${cellText}`}>
                    {s.roles?.[0]?.display_name ?? s.roles?.[0]?.name ?? "—"}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${cellText}`}>{s.phone ?? "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><BadgeStatus status={s.status} dark={dark} /></td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1.5">
                      {can("resort.staff.update") && (
                        <Button onClick={() => setEditing(s)} className={actionBtn}>
                          <MdEdit size={14} /> Edit
                        </Button>
                      )}
                      {can("resort.staff.delete") && (
                        <Button onClick={() => setConfirm({ staff: s, loading: false })} className={actionBtn}>
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
        <StaffModal
          staff={editing}
          onClose={() => { setEditing(null); setAdding(false); }}
          onSaved={load}
          dark={dark}
        />
      )}
      <ConfirmDialog
        open={!!confirm}
        dark={dark}
        title="Delete Staff"
        message={confirm ? `Are you sure you want to delete ${confirm.staff.name}?` : ""}
        sub="This action cannot be undone."
        confirmText="Yes, Delete"
        danger
        loading={!!confirm?.loading}
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
