import { useEffect, useMemo, useState } from "react";
import {
  MdEdit, MdDelete, MdSearch, MdUnfoldMore, MdKeyboardArrowUp,
  MdKeyboardArrowDown, MdClose, MdAdd, MdRestaurant,
} from "react-icons/md";
import { Button } from "antd";
import { request } from "../../util/request";
import { useDarkMode } from "../../util/DarkModeContext";

const PAGE_SIZE = 10;
const STATUSES  = ["all", "active", "inactive"];

const STATUS_STYLE = {
  active:   { dot: "bg-green-500",  light: "bg-green-50 text-green-700 ring-green-200",    dark: "bg-green-900/40 text-green-400 ring-green-700"   },
  inactive: { dot: "bg-yellow-500", light: "bg-yellow-50 text-yellow-700 ring-yellow-200", dark: "bg-yellow-900/40 text-yellow-400 ring-yellow-700" },
};

const INIT = { resort_id: "", name: "", slug: "", description: "", phone: "", email: "", address: "", status: "active" };

function BadgeWithDot({ status, dark }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.inactive;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? s.dark : s.light}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
}

function RestaurantAvatar({ name, logoUrl, dark }) {
  if (logoUrl) return <img src={logoUrl} alt={name} className="w-9 h-9 rounded-lg object-cover shrink-0 border border-[#D9E2EC]" />;
  const initials = name?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() ?? "R";
  return (
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0 ${dark ? "bg-orange-800" : "bg-orange-600"}`}>
      {initials}
    </div>
  );
}

function SortIcon({ column, sortCol, sortDir, dark }) {
  if (sortCol !== column) return <MdUnfoldMore className={`text-base ${dark ? "text-[#829AB1]" : "text-gray-400"}`} />;
  return sortDir === "asc"
    ? <MdKeyboardArrowUp className={`text-base ${dark ? "text-gray-200" : "text-[#486581]"}`} />
    : <MdKeyboardArrowDown className={`text-base ${dark ? "text-gray-200" : "text-[#486581]"}`} />;
}

function RestaurantModal({ restaurant, resorts, onClose, onSaved, dark }) {
  const isEdit = !!restaurant;
  const [form, setForm] = useState(
    isEdit
      ? { resort_id: restaurant.resort_id ?? "", name: restaurant.name ?? "", slug: restaurant.slug ?? "", description: restaurant.description ?? "", phone: restaurant.phone ?? "", email: restaurant.email ?? "", address: restaurant.address ?? "", status: restaurant.status ?? "active" }
      : { ...INIT, resort_id: resorts[0]?.id ?? "" }
  );
  const [logoFile,    setLogoFile]    = useState(null);
  const [logoPreview, setLogoPreview] = useState(restaurant?.logo_url ?? null);
  const [errs,   setErrs]   = useState({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.resort_id)       e.resort_id = "Resort is required.";
    if (!form.name.trim())     e.name      = "Name is required.";
    if (!isEdit && !form.slug.trim()) e.slug = "Slug is required.";
    setErrs(e);
    return !Object.keys(e).length;
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v !== "") fd.append(k, v); });
    if (logoFile) fd.append("logo", logoFile);
    let res;
    if (isEdit) {
      fd.append("_method", "PUT");
      res = await request(`admin/restaurants/${restaurant.id}`, "post", fd);
    } else {
      res = await request("admin/restaurants", "post", fd);
    }
    setSaving(false);
    if (!res?.errors) { onSaved(); onClose(); }
    else setErrs({ _: res.errors.message ?? "Failed to save." });
  };

  const set = (key) => (e) => {
    setForm(f => ({ ...f, [key]: e.target.value }));
    setErrs(p => ({ ...p, [key]: undefined }));
  };

  const inputCls = (key) => `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
    errs[key] ? "border-red-400 focus:ring-red-400/40" : "focus:ring-orange-400/40 " + (dark ? "border-gray-600" : "border-[#D9E2EC]")
  } ${dark ? "bg-gray-700 text-gray-100 placeholder-[#829AB1]" : "bg-white text-[#102A43]"}`;
  const labelCls = `block text-[14px] font-semibold mb-1 ${dark ? "text-gray-300" : "text-[#486581]"}`;
  const errMsg   = (key) => errs[key] && <p className="mt-1 text-xs text-red-500">{errs[key]}</p>;

  const fields = [
    { key: "name",        label: "Restaurant Name", req: true },
    ...(!isEdit ? [{ key: "slug", label: "Slug", req: true }] : []),
    { key: "phone",       label: "Phone",            req: false },
    { key: "email",       label: "Email",            req: false },
    { key: "address",     label: "Address",          req: false },
    { key: "description", label: "Description",      req: false, area: true },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className={`rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto mt-20 ${dark ? "bg-gray-800 border border-gray-700" : "bg-white"}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-base font-semibold flex items-center gap-2 ${dark ? "text-gray-100" : "text-[#102A43]"}`}>
            <MdRestaurant className="text-orange-500" /> {isEdit ? "Edit Restaurant" : "Add Restaurant"}
          </h3>
          <Button onClick={onClose} className={dark ? "text-[#829AB1] hover:text-gray-200" : "text-[#829AB1] hover:text-[#486581]"}>
            <MdClose size={14} />
          </Button>
        </div>

        {errs._ && <p className="mb-3 text-xs text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">{errs._}</p>}

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className={labelCls}>Resort <span className="text-red-500">*</span></label>
            <select value={form.resort_id} onChange={set("resort_id")} className={inputCls("resort_id")}>
              <option value="">Select Resort</option>
              {resorts.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            {errMsg("resort_id")}
          </div>

          {fields.map(({ key, label, req, area }) => (
            <div key={key}>
              <label className={labelCls}>{label} {req && <span className="text-red-500">*</span>}</label>
              {area ? (
                <textarea rows={3} value={form[key]} onChange={set(key)} className={inputCls(key)} placeholder={label} />
              ) : (
                <input type="text" value={form[key]} onChange={set(key)} className={inputCls(key)} placeholder={label} />
              )}
              {errMsg(key)}
            </div>
          ))}

          <div>
            <label className={labelCls}>Logo</label>
            {logoPreview && (
              <img src={logoPreview} alt="preview" className="w-16 h-16 rounded-lg object-cover mb-2 border border-[#D9E2EC]" />
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/gif,image/svg+xml"
              onChange={handleLogoChange}
              className={`w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium cursor-pointer ${
                dark
                  ? "text-gray-300 file:bg-orange-900/40 file:text-orange-400 hover:file:bg-orange-900/70"
                  : "text-[#486581] file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100"
              }`}
            />
          </div>

          <div>
            <label className={labelCls}>Status <span className="text-red-500">*</span></label>
            <select value={form.status} onChange={set("status")} className={inputCls("status")}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button onClick={onClose} className={`px-4 py-2 text-sm rounded-lg border transition-colors ${dark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-[#D9E2EC] text-[#486581] hover:bg-[#F5F8FC]"}`}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-60 transition-colors">
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirm({ restaurant, onClose, onDeleted, dark }) {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    await request(`admin/restaurants/${restaurant.id}`, "delete");
    setLoading(false);
    onDeleted();
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className={`rounded-xl shadow-2xl w-full max-w-sm p-6 ${dark ? "bg-gray-800 border border-gray-700" : "bg-white"}`}>
        <h3 className={`text-base font-semibold mb-2 ${dark ? "text-gray-100" : "text-[#102A43]"}`}>Delete Restaurant</h3>
        <p className={`text-sm mb-6 ${dark ? "text-gray-400" : "text-[#829AB1]"}`}>
          Are you sure you want to delete <span className={`font-medium ${dark ? "text-gray-200" : "text-[#102A43]"}`}>{restaurant.name}</span>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} className={`px-4 py-2 text-sm rounded-lg border transition-colors ${dark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-[#D9E2EC] text-[#486581] hover:bg-[#F5F8FC]"}`}>
            Cancel
          </Button>
          <Button onClick={handleDelete} disabled={loading} className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 transition-colors">
            {loading ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Manage_restaurand() {
  const dark = useDarkMode();
  const [restaurants, setRestaurants] = useState([]);
  const [resorts,     setResorts]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [status,      setStatus]      = useState("all");
  const [sortCol,     setSortCol]     = useState("name");
  const [sortDir,     setSortDir]     = useState("asc");
  const [page,        setPage]        = useState(1);
  const [editing,     setEditing]     = useState(null);
  const [adding,      setAdding]      = useState(false);
  const [deleting,    setDeleting]    = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      request("admin/restaurants", "get"),
      request("admin/resorts", "get"),
    ]).then(([rRes, resortRes]) => {
      setRestaurants(rRes?.data ?? []);
      setResorts(resortRes?.data ?? []);
      setLoading(false);
    });
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
    setPage(1);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return restaurants
      .filter(r => (status === "all" || r.status === status) &&
        (!q || r.name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q)))
      .sort((a, b) => {
        const cmp = String(a[sortCol] ?? "").localeCompare(String(b[sortCol] ?? ""));
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [restaurants, search, status, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const resortName = (id) => resorts.find(r => r.id == id)?.name ?? "—";

  const card      = dark ? "bg-gray-800 border-gray-700"  : "bg-white border-[#D9E2EC]";
  const cardHdr   = dark ? "border-gray-700"               : "border-[#D9E2EC]";
  const titleCls  = dark ? "text-gray-100"                 : "text-[#102A43]";
  const subText   = dark ? "text-gray-400"                 : "text-[#829AB1]";
  const thead     = dark ? "bg-gray-700/60"                : "bg-[#F5F8FC]";
  const thText    = dark ? "text-gray-400"                 : "text-[#829AB1]";
  const thHover   = dark ? "hover:bg-gray-700"             : "hover:bg-[#F5F8FC]";
  const tbody     = dark ? "bg-gray-800 divide-gray-700"   : "bg-white divide-gray-100";
  const rowHover  = dark ? "hover:bg-gray-700/50"          : "hover:bg-[#F5F8FC]";
  const cellText  = dark ? "text-gray-300"                 : "text-[#486581]";
  const cellMuted = dark ? "text-[#829AB1]"                 : "text-[#829AB1]";
  const divider   = dark ? "divide-gray-700"               : "divide-gray-200";
  const filterBg  = dark ? "bg-gray-700"                   : "bg-[#F5F8FC]";
  const filterBtn = dark ? "text-[#829AB1] hover:text-gray-200" : "text-[#829AB1] hover:text-[#486581]";
  const filterAct = dark ? "bg-gray-600 text-gray-100 shadow" : "bg-white text-[#102A43] shadow";
  const searchCls = dark
    ? "pl-9 pr-3 py-1.5 text-sm border border-gray-600 bg-gray-700 text-gray-100 placeholder-[#829AB1] rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/40 w-48"
    : "pl-9 pr-3 py-1.5 text-sm border border-[#D9E2EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400/30 w-48";
  const pageBtn   = dark
    ? "px-3 py-1.5 rounded-[8px] border border-gray-600 text-xs font-semibold hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300"
    : "px-3 py-1.5 rounded-[8px] border border-[#D9E2EC] text-xs font-semibold hover:bg-[#F5F8FC] disabled:opacity-40 disabled:cursor-not-allowed";
  const pageNum   = (active) => active
    ? "w-8 h-8 rounded-lg text-xs font-medium bg-orange-600 text-white"
    : `w-8 h-8 rounded-lg text-xs font-medium transition-colors ${dark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-[#F5F8FC] text-[#486581]"}`;

  const HeadCell = ({ col, label }) => (
    <th onClick={() => handleSort(col)}
      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer select-none whitespace-nowrap ${thText} ${thHover}`}>
      <span className="inline-flex items-center gap-1">
        {label}
        <SortIcon column={col} sortCol={sortCol} sortDir={sortDir} dark={dark} />
      </span>
    </th>
  );

  return (
    <div className={`min-h-full rounded-xl p-4 transition-colors duration-200 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`} style={{ fontFamily: "Inter, Poppins, sans-serif" }}>
      <h2 className={`text-[26px] font-bold mb-5 flex items-center gap-2 ${titleCls}`}>
        <MdRestaurant className="text-orange-500" /> Manage Restaurant
      </h2>

      <div className={`rounded-xl shadow-sm border overflow-hidden ${card}`}>

        {/* Header */}
        <div className={`px-6 py-4 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${cardHdr}`}>
          <div className="flex items-center gap-2">
            <span className={`text-[18px] font-semibold ${titleCls}`}>Restaurant List</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${
              dark ? "bg-orange-900/40 text-orange-400 ring-orange-700" : "bg-orange-50 text-orange-700 ring-orange-200"
            }`}>
              {filtered.length} restaurants
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`flex gap-1 rounded-lg p-1 ${filterBg}`}>
              {STATUSES.map(s => (
                <Button key={s} onClick={() => { setStatus(s); setPage(1); }}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${status === s ? filterAct : filterBtn}`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Button>
              ))}
            </div>
            <div className="relative">
              <MdSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg ${dark ? "text-gray-400" : "text-gray-400"}`} />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search…" className={searchCls} />
            </div>
            <Button onClick={() => setAdding(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors">
              <MdAdd size={14} /> Add Restaurant
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${divider}`}>
            <thead className={thead}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-12 ${thText}`}>No.</th>
                <HeadCell col="name"        label="Restaurant Name" />
                <HeadCell col="resort_id"   label="Resort" />
                <HeadCell col="phone"       label="Phone" />
                <HeadCell col="email"       label="Email" />
                <HeadCell col="address"     label="Address" />
                <HeadCell col="description" label="Description" />
                <HeadCell col="status"      label="Status" />
                <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${thText}`}>Action</th>
              </tr>
            </thead>
            <tbody className={`${tbody} divide-y`}>
              {loading ? (
                <tr><td colSpan={9} className={`py-16 text-center text-sm ${subText}`}>Loading…</td></tr>
              ) : pageItems.length === 0 ? (
                <tr><td colSpan={9} className={`py-16 text-center text-sm ${subText}`}>No restaurants found</td></tr>
              ) : pageItems.map((r, idx) => (
                <tr key={r.id} className={`transition-colors ${rowHover}`}>
                  <td className={`px-4 py-4 text-sm font-medium ${cellMuted}`}>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <RestaurantAvatar name={r.name} logoUrl={r.logo_url} dark={dark} />
                      <span className={`text-sm font-medium ${titleCls}`}>{r.name}</span>
                    </div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${cellText}`}>{r.resort?.name ?? resortName(r.resort_id)}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${cellText}`}>{r.phone ?? "—"}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${cellText}`}>{r.email ?? "—"}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${cellText}`}>{r.address ?? "—"}</td>
                  <td className={`px-6 py-4 text-sm ${cellText} max-w-[180px] truncate`}>{r.description ?? "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><BadgeWithDot status={r.status} dark={dark} /></td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button onClick={() => setEditing(r)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                          dark ? "bg-blue-900/40 text-blue-400 hover:bg-blue-900/70" : "bg-[#FFF3E8] text-[#FF6B00] hover:bg-orange-100"
                        }`}>
                        <MdEdit size={14} /> Edit
                      </Button>
                      <Button onClick={() => setDeleting(r)}
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

        {/* Pagination */}
        <div className={`px-6 py-3 border-t flex items-center justify-between text-sm ${cardHdr} ${subText}`}>
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={pageBtn}>Previous</Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce((acc, p, i, arr) => { if (i > 0 && p - arr[i - 1] > 1) acc.push("…"); acc.push(p); return acc; }, [])
              .map((p, i) => p === "…"
                ? <span key={`e-${i}`} className={`px-2 ${cellMuted}`}>…</span>
                : <Button key={p} onClick={() => setPage(p)} className={pageNum(page === p)}>{p}</Button>
              )}
            <Button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={pageBtn}>Next</Button>
          </div>
        </div>
      </div>

      {(editing || adding) && (
        <RestaurantModal
          restaurant={editing}
          resorts={resorts}
          onClose={() => { setEditing(null); setAdding(false); }}
          onSaved={load}
          dark={dark}
        />
      )}
      {deleting && (
        <DeleteConfirm
          restaurant={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={load}
          dark={dark}
        />
      )}
    </div>
  );
}
