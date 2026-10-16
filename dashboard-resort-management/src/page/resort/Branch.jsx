import { useEffect, useMemo, useState } from "react";
import {
  MdEdit, MdDelete, MdSearch, MdUnfoldMore, MdKeyboardArrowUp,
  MdKeyboardArrowDown, MdClose, MdAdd, MdLocationOn,
} from "react-icons/md";
import { request } from "../../util/request";
import { useDarkMode } from "../../util/DarkModeContext";
import { Button } from "antd";
import ConfirmDialog from "../../components/ConfirmDialog";
import useCatalogData from "../../hooks/useCatalogData";
import { asList } from "../../util/asList";
import { BRANCH_AMENITY_PRESETS, normalizeAmenityList } from "../../constants/branchAmenities";

const STATUSES = ["all", "active", "inactive", "maintenance"];

const STATUS_STYLE = {
  active: { dot: "bg-green-500", light: "bg-green-50 text-green-700 ring-green-200", dark: "bg-green-900/40 text-green-400 ring-green-700" },
  inactive: { dot: "bg-yellow-500", light: "bg-yellow-50 text-yellow-700 ring-yellow-200", dark: "bg-yellow-900/40 text-yellow-400 ring-yellow-700" },
  maintenance: { dot: "bg-orange-500", light: "bg-orange-50 text-orange-700 ring-orange-200", dark: "bg-orange-900/40 text-orange-400 ring-orange-700" },
};

const PAGE_SIZE = 10;

function BranchAvatar({ name, dark }) {
  const initials = name?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() ?? "B";
  return (
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0 ${dark ? "bg-[#1a3a5c]" : "bg-[#FF6B00]"}`}>
      {initials}
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
  if (sortCol !== column) return <MdUnfoldMore className={`text-base ${dark ? "text-[#829AB1]" : "text-gray-400"}`} />;
  return sortDir === "asc"
    ? <MdKeyboardArrowUp className={`text-base ${dark ? "text-gray-200" : "text-[#486581]"}`} />
    : <MdKeyboardArrowDown className={`text-base ${dark ? "text-gray-200" : "text-[#486581]"}`} />;
}

function BranchAmenitiesField({ amenities, onChange, dark, labelCls }) {
  const [custom, setCustom] = useState("");
  const selected = normalizeAmenityList(amenities);

  const toggle = (label) => {
    const next = selected.includes(label)
      ? selected.filter((a) => a !== label)
      : [...selected, label];
    onChange(next);
  };

  const addCustom = () => {
    const value = custom.trim();
    if (!value) return;
    if (!selected.includes(value)) onChange([...selected, value]);
    setCustom("");
  };

  const chipCls = (active) =>
    `px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
      active
        ? dark
          ? "bg-[#FF6B00]/20 border-[#FF6B00]/50 text-orange-300"
          : "bg-[#FFF3E8] border-[#FF6B00]/40 text-[#102A43]"
        : dark
          ? "border-gray-600 text-gray-400 hover:border-gray-500"
          : "border-[#D9E2EC] text-[#486581] hover:border-[#FF6B00]/30"
    }`;

  return (
    <div>
      <label className={labelCls}>Branch amenities</label>
      <p className={`text-xs mb-2 ${dark ? "text-gray-500" : "text-[#829AB1]"}`}>
        Shown on the guest resort site (WiFi, pool, breakfast, etc.).
      </p>
      <div className="flex flex-wrap gap-2 mb-3">
        {BRANCH_AMENITY_PRESETS.map((label) => (
          <button key={label} type="button" onClick={() => toggle(label)} className={chipCls(selected.includes(label))}>
            {label}
          </button>
        ))}
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {selected.map((label) => (
            <span
              key={label}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs ${
                dark ? "bg-gray-700 text-gray-200" : "bg-[#F5F8FC] text-[#486581]"
              }`}
            >
              {label}
              <button
                type="button"
                onClick={() => toggle(label)}
                className="opacity-70 hover:opacity-100"
                aria-label={`Remove ${label}`}
              >
                <MdClose size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
          placeholder="Custom amenity…"
          className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 ${
            dark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-[#D9E2EC]"
          }`}
        />
        <Button type="button" onClick={addCustom} className="shrink-0 text-sm">
          Add
        </Button>
      </div>
    </div>
  );
}

function BranchModal({ branch, resorts, onClose, onSaved, dark }) {
  const isEdit = !!branch;
  const [form, setForm] = useState(
    isEdit
      ? {
          resort_id: branch.resort_id,
          name: branch.name,
          address: branch.address,
          manager_name: branch.manager_name,
          phone: branch.phone,
          status: branch.status,
          amenities: normalizeAmenityList(branch.amenities),
          description: branch.description ?? "",
          description_km: branch.description_km ?? "",
        }
      : {
          resort_id: resorts[0]?.id ?? "",
          name: "",
          address: "",
          manager_name: "",
          phone: "",
          status: "active",
          amenities: [],
          description: "",
          description_km: "",
        }
  );
  const [saving, setSaving] = useState(false);
  const [errs, setErrs] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Branch name is required.";
    if (!form.address.trim()) e.address = "Address is required.";
    if (form.phone && !/^[0-9+\-\s]{6,20}$/.test(form.phone)) e.phone = "Phone number is invalid.";
    setErrs(e);
    return !Object.keys(e).length;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const payload = {
      ...form,
      amenities: normalizeAmenityList(form.amenities),
    };
    const res = isEdit
      ? await request(`admin/branches/${branch.id}`, "put", payload)
      : await request("admin/branches", "post", payload);
    setSaving(false);
    if (!res?.errors) { onSaved(); onClose(); }
    else setErrs({ _: res.errors.message ?? "Failed to save." });
  };

  const set = (key) => (e) => {
    setForm(f => ({ ...f, [key]: e.target.value }));
    setErrs(p => ({ ...p, [key]: undefined }));
  };

  const inputCls = (key) => `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${errs[key] ? "border-red-400 focus:ring-red-400/40" : "focus:ring-[#FF6B00]/30 " + (dark ? "border-gray-600" : "border-[#D9E2EC]")
    } ${dark ? "bg-gray-700 text-gray-100 placeholder-[#829AB1]" : "bg-white text-[#102A43]"}`;
  const labelCls = `block text-[14px] font-semibold mb-1 ${dark ? "text-gray-300" : "text-[#486581]"}`;
  const errMsg = (key) => errs[key] && <p className="mt-1 text-xs text-red-500">{errs[key]}</p>;

  const textareaCls = (key) =>
    `${inputCls(key)} min-h-[88px] resize-y leading-relaxed`;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-12 sm:pt-16 pb-6 sm:pb-8">
      <div
        className={`rounded-xl shadow-2xl w-full max-w-4xl max-h-[calc(100vh-5.5rem)] flex flex-col ${
          dark ? "bg-gray-800 border border-gray-700" : "bg-white"
        }`}
      >
        <div className={`flex items-center justify-between shrink-0 px-6 py-4 border-b ${dark ? "border-gray-700" : "border-[#D9E2EC]"}`}>
          <h3 className={`text-lg font-semibold ${dark ? "text-gray-100" : "text-[#102A43]"}`}>
            {isEdit ? "Edit Branch" : "Add Branch"}
          </h3>
          <Button onClick={onClose} className={dark ? "text-[#829AB1] hover:text-gray-200" : "text-[#829AB1] hover:text-[#486581]"}>
            <MdClose size={18} />
          </Button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-5 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4 mb-6">
            <div className="md:col-span-2">
              <label className={labelCls}>Resort</label>
              <select value={form.resort_id} onChange={set("resort_id")} className={inputCls("resort_id")}>
                {resorts.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Branch Name <span className="text-red-500">*</span></label>
              <input value={form.name} onChange={set("name")} className={inputCls("name")} />
              {errMsg("name")}
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select value={form.status} onChange={set("status")} className={inputCls("status")}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Address <span className="text-red-500">*</span></label>
              <input value={form.address} onChange={set("address")} className={inputCls("address")} />
              {errMsg("address")}
            </div>
            <div>
              <label className={labelCls}>Manager Name</label>
              <input value={form.manager_name} onChange={set("manager_name")} className={inputCls("manager_name")} />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input value={form.phone} onChange={set("phone")} className={inputCls("phone")} />
              {errMsg("phone")}
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>About this branch (English)</label>
              <p className={`text-xs mb-2 ${dark ? "text-gray-500" : "text-[#829AB1]"}`}>
                Shown on the guest site — overview text on branch cards and detail page.
              </p>
              <textarea
                value={form.description}
                onChange={set("description")}
                rows={4}
                placeholder="Describe the resort experience at this location…"
                className={textareaCls("description")}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>About this branch (Khmer)</label>
              <textarea
                value={form.description_km}
                onChange={set("description_km")}
                rows={3}
                placeholder="ពិពណ៌នាអំពីរមណីយដ្ឋាននៅទីតាំងនេះ…"
                className={textareaCls("description_km")}
              />
            </div>
            <div className="md:col-span-2">
              <BranchAmenitiesField
                amenities={form.amenities}
                onChange={(list) => setForm((f) => ({ ...f, amenities: list }))}
                dark={dark}
                labelCls={labelCls}
              />
            </div>
            {errs._ && <p className="md:col-span-2 text-xs text-red-500">{errs._}</p>}
          </div>
        </div>
        <div className={`flex justify-end gap-2 shrink-0 px-6 py-4 border-t ${dark ? "border-gray-700" : "border-[#D9E2EC]"}`}>
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

export default function Branch() {
  const dark = useDarkMode();
  const { resorts, refreshBranches } = useCatalogData({ autoFetch: false });

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sortCol, setSortCol] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = () => {
    setLoading(true);
    request("admin/branches", "get")
      .then((branchRes) => {
        setBranches(branchRes?.data ?? asList(branchRes));
        setLoading(false);
      })
      .catch(() => {
        setBranches([]);
        setLoading(false);
      });
  };

  const onBranchSaved = () => {
    load();
    refreshBranches();
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
    setPage(1);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return branches
      .filter(b => (status === "all" || b.status === status) &&
        (!q || b.name?.toLowerCase().includes(q) || b.address?.toLowerCase().includes(q) || b.manager_name?.toLowerCase().includes(q)))
      .sort((a, b) => {
        const av = a[sortCol] ?? "", bv = b[sortCol] ?? "";
        const cmp = String(av).localeCompare(String(bv));
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [branches, search, status, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const card = dark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC]";
  const cardHdr = dark ? "border-gray-700" : "border-[#D9E2EC]";
  const titleCls = dark ? "text-gray-100" : "text-[#102A43]";
  const subText = dark ? "text-gray-400" : "text-[#829AB1]";
  const thead = dark ? "bg-gray-700/60" : "bg-[#F5F8FC]";
  const thText = dark ? "text-gray-400" : "text-[#829AB1]";
  const thHover = dark ? "hover:bg-gray-700" : "hover:bg-[#F5F8FC]";
  const tbody = dark ? "bg-gray-800 divide-gray-700" : "bg-white divide-gray-100";
  const rowHover = dark ? "hover:bg-gray-700/50" : "hover:bg-[#F5F8FC]";
  const cellText = dark ? "text-gray-300" : "text-[#486581]";
  const cellMuted = dark ? "text-[#829AB1]" : "text-[#829AB1]";
  const divider = dark ? "divide-gray-700" : "divide-gray-200";
  const filterBg = dark ? "bg-gray-700" : "bg-[#F5F8FC]";
  const filterBtn = dark ? "text-[#829AB1] hover:text-gray-200" : "text-[#829AB1] hover:text-[#486581]";
  const filterAct = dark ? "bg-gray-600 text-gray-100 shadow" : "bg-white text-[#102A43] shadow";
  const searchCls = dark
    ? "pl-9 pr-3 py-1.5 text-sm border border-gray-600 bg-gray-700 text-gray-100 placeholder-[#829AB1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-48"
    : "pl-9 pr-3 py-1.5 text-sm border border-[#D9E2EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-48";
  const pageBtn = dark
    ? "px-3 py-1.5 rounded-[8px] border border-gray-600 text-xs font-semibold hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300"
    : "px-3 py-1.5 rounded-[8px] border border-[#D9E2EC] text-xs font-semibold hover:bg-[#F5F8FC] disabled:opacity-40 disabled:cursor-not-allowed";
  const pageNum = (active) => active
    ? "w-8 h-8 rounded-[8px] text-xs font-semibold bg-[#FF6B00] text-white"
    : `w-8 h-8 rounded-lg text-xs font-medium transition-colors ${dark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-[#F5F8FC] text-[#486581]"}`;
  const actionBtn = `inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${dark ? "bg-blue-900/40 text-blue-400 hover:bg-blue-900/70" : "bg-[#FFF3E8] text-[#FF6B00] hover:bg-orange-100"
    }`;

  const handleDelete = async () => {
    if (!confirm) return;
    const id = confirm.branch.id;
    setConfirm((c) => ({ ...c, loading: true }));
    const res = await request(`admin/branches/${id}`, "delete");
    setConfirm(null);
    if (!res?.errors) {
      load();
      refreshBranches();
    }
  };

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
    <div className={`min-h-full rounded-xl p-4 transition-colors duration-200 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`} style={{ fontFamily: "Inter, Poppins, sans-serif" }}>
      <h2 className={`text-[26px] font-bold mb-5 ${titleCls}`}>Branch Management</h2>

      <div className={`rounded-xl shadow-sm border overflow-hidden ${card}`}>

        {/* ── Header ── */}
        <div className={`px-6 py-4 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${cardHdr}`}>
          <div className="flex items-center gap-2">
            <span className={`text-[18px] font-semibold ${titleCls}`}>Branch List</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? "bg-blue-900/40 text-blue-400 ring-blue-700" : "bg-[#FF6B00]/10 text-[#102A43] ring-[#FF6B00]/20"
              }`}>
              {filtered.length} branches
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[8px] bg-[#FF6B00] text-white hover:bg-[#e05e00] transition-colors">
              <MdAdd size={14} /> Add Branch
            </Button>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${divider}`}>
            <thead className={thead}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-12 ${thText}`}>#</th>
                <HeadCell col="name" label="Branch Name" className="w-1/4" />
                <HeadCell col="address" label="Address" />
                <HeadCell col="manager_name" label="Manager" />
                <HeadCell col="phone" label="Phone" />
                <HeadCell col="resort" label="Resort" />
                <HeadCell col="status" label="Status" />
                <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${thText}`}>Action</th>
              </tr>
            </thead>
            <tbody className={`${tbody} divide-y`}>
              {loading ? (
                <tr><td colSpan={8} className={`py-16 text-center text-sm ${subText}`}>Loading…</td></tr>
              ) : pageItems.length === 0 ? (
                <tr><td colSpan={8} className={`py-16 text-center text-sm ${subText}`}>No branches found</td></tr>
              ) : pageItems.map((branch, idx) => (
                <tr key={branch.id} className={`transition-colors ${rowHover}`}>
                  <td className={`px-4 py-4 text-sm font-medium ${cellMuted}`}>
                    {(page - 1) * PAGE_SIZE + idx + 1}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <BranchAvatar name={branch.name} dark={dark} />
                      <span className={`text-sm font-medium ${titleCls}`}>{branch.name}</span>
                    </div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${cellText}`}>
                    <span className="inline-flex items-center gap-1">
                      <MdLocationOn className="text-[#102A43] opacity-60" size={14} />
                      {branch.address}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${cellText}`}>{branch.manager_name ?? "—"}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${cellText}`}>{branch.phone ?? "—"}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${cellText}`}>{branch.resort?.name ?? "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <BadgeWithDot status={branch.status} dark={dark} />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button onClick={() => setEditing(branch)} className={actionBtn}>
                        <MdEdit size={14} /> Edit
                      </Button>
                      <Button onClick={() => setConfirm({ branch, loading: false })} className={actionBtn}>
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

      {(editing || adding) && (
        <BranchModal
          branch={editing}
          resorts={resorts}
          onClose={() => { setEditing(null); setAdding(false); }}
          onSaved={onBranchSaved}
          dark={dark}
        />
      )}
      <ConfirmDialog
        open={!!confirm}
        dark={dark}
        title="Delete Branch"
        message={confirm ? `Are you sure you want to delete ${confirm.branch.name}?` : ""}
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
