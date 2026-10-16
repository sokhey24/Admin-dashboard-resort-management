import { useEffect, useMemo, useState } from "react";
import {
  MdAdd, MdEdit, MdDelete, MdUnfoldMore, MdKeyboardArrowUp,
  MdKeyboardArrowDown, MdSearch, MdClose,
} from "react-icons/md";
import { useDarkMode } from "../../util/DarkModeContext";
import { Button } from "antd";
import ConfirmDialog from "../../components/ConfirmDialog";
import { request } from "../../util/request";
import useCatalogData from "../../hooks/useCatalogData";
import { asList } from "../../util/asList";

const PAGE_SIZE = 10;

const STATUS_STYLE = {
  active:   { dot: "bg-green-500",  light: "bg-green-50 text-green-700 ring-green-200",    dark: "bg-green-900/40 text-green-400 ring-green-700"   },
  inactive: { dot: "bg-yellow-500", light: "bg-yellow-50 text-yellow-700 ring-yellow-200", dark: "bg-yellow-900/40 text-yellow-400 ring-yellow-700" },
};

function BadgeWithDot({ status, dark }) {
  const active = status === "active";
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.inactive;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? s.dark : s.light}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function SortIcon({ column, sortCol, sortDir, dark }) {
  if (sortCol !== column) return <MdUnfoldMore className={`text-base ${dark ? "text-[#829AB1]" : "text-gray-400"}`} />;
  return sortDir === "asc"
    ? <MdKeyboardArrowUp className={`text-base ${dark ? "text-gray-200" : "text-[#486581]"}`} />
    : <MdKeyboardArrowDown className={`text-base ${dark ? "text-gray-200" : "text-[#486581]"}`} />;
}

function FacilityModal({ facility, resorts, onClose, onSaved, dark }) {
  const isEdit = !!facility;
  const [form, setForm] = useState(
    isEdit
      ? {
          resort_id: facility.resort_id,
          name: facility.name ?? "",
          description: facility.description ?? "",
          icon: facility.icon ?? "",
          status: facility.status ?? "active",
        }
      : {
          resort_id: resorts[0]?.id ?? "",
          name: "",
          description: "",
          icon: "",
          status: "active",
        }
  );
  const [saving, setSaving] = useState(false);
  const [errs, setErrs] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Facility name is required.";
    if (!form.resort_id) e.resort_id = "Resort is required.";
    setErrs(e);
    return !Object.keys(e).length;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const payload = {
      resort_id: Number(form.resort_id),
      name: form.name.trim(),
      description: form.description.trim() || null,
      icon: form.icon.trim() || null,
      status: form.status,
    };
    const res = isEdit
      ? await request(`admin/facilities/${facility.id}`, "put", payload)
      : await request("admin/facilities", "post", payload);
    setSaving(false);
    if (!res?.errors) {
      onSaved();
      onClose();
    } else {
      setErrs({ _: res.errors.message ?? "Failed to save." });
    }
  };

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrs((p) => ({ ...p, [key]: undefined }));
  };

  const inputCls = (key) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
      errs[key] ? "border-red-400 focus:ring-red-400/40" : "focus:ring-[#FF6B00]/30 " + (dark ? "border-gray-600" : "border-[#D9E2EC]")
    } ${dark ? "bg-gray-700 text-gray-100 placeholder-[#829AB1]" : "bg-white text-[#102A43]"}`;
  const labelCls = `block text-[14px] font-semibold mb-1 ${dark ? "text-gray-300" : "text-[#486581]"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className={`rounded-xl shadow-2xl w-full max-w-md p-6 ${dark ? "bg-gray-800 border border-gray-700" : "bg-white"}`}>
        <div className="flex items-center justify-between mb-5">
          <h3 className={`text-base font-semibold ${dark ? "text-gray-100" : "text-[#102A43]"}`}>
            {isEdit ? "Edit Facility" : "Add Facility"}
          </h3>
          <Button onClick={onClose} className={dark ? "text-[#829AB1]" : "text-[#829AB1]"}>
            <MdClose size={14} />
          </Button>
        </div>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Resort</label>
            <select value={form.resort_id} onChange={set("resort_id")} className={inputCls("resort_id")}>
              <option value="">Select resort</option>
              {resorts.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            {errs.resort_id && <p className="mt-1 text-xs text-red-500">{errs.resort_id}</p>}
          </div>
          <div>
            <label className={labelCls}>Name <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={set("name")} className={inputCls("name")} />
            {errs.name && <p className="mt-1 text-xs text-red-500">{errs.name}</p>}
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={form.description} onChange={set("description")} rows={3} className={inputCls("description")} />
          </div>
          <div>
            <label className={labelCls}>Icon (optional label)</label>
            <input value={form.icon} onChange={set("icon")} placeholder="e.g. pool, spa" className={inputCls("icon")} />
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
          <Button onClick={onClose} className={`px-4 py-2 text-sm rounded-lg border ${dark ? "border-gray-600 text-gray-300" : "border-[#D9E2EC] text-[#486581]"}`}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm rounded-[8px] bg-[#FF6B00] text-white hover:bg-[#e05e00] disabled:opacity-60">
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Facilities() {
  const dark = useDarkMode();
  const { resorts, refreshFacilities } = useCatalogData({ autoFetch: true });

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [page, setPage] = useState(1);
  const [sortCol, setSortCol] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);

  const load = () => {
    setLoading(true);
    setLoadError(null);
    request("admin/facilities", "get")
      .then((res) => {
        setList(asList(res?.data ?? res));
        setLoading(false);
      })
      .catch(() => {
        setList([]);
        setLoadError("Could not load facilities from the server.");
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const onSaved = () => {
    load();
    refreshFacilities();
  };

  const handleSort = (col) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortCol(col);
      setSortDir("asc");
    }
    setPage(1);
  };

  const sorted = useMemo(() => {
    const q = search.toLowerCase();
    return [...list]
      .filter(
        (f) =>
          !q ||
          f.name?.toLowerCase().includes(q) ||
          f.description?.toLowerCase().includes(q) ||
          f.icon?.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const cmp = String(a[sortCol] ?? "").localeCompare(String(b[sortCol] ?? ""));
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [list, search, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageItems = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resortName = (id) => resorts.find((r) => Number(r.id) === Number(id))?.name ?? "—";

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
  const searchCls = dark
    ? "pl-9 pr-3 py-1.5 text-sm border border-gray-600 bg-gray-700 text-gray-100 placeholder-[#829AB1] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-48"
    : "pl-9 pr-3 py-1.5 text-sm border border-[#D9E2EC] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-48";
  const pageBtn = dark
    ? "px-3 py-1.5 rounded-[10px] border border-gray-600 text-xs font-medium hover:bg-gray-700 disabled:opacity-40 text-gray-300"
    : "px-3 py-1.5 rounded-[10px] border border-[#D9E2EC] text-xs font-medium hover:bg-[#F5F8FC] disabled:opacity-40";
  const pageNum = (isActive) =>
    isActive
      ? "w-8 h-8 rounded-[10px] text-xs font-medium bg-[#FF6B00] text-white"
      : `w-8 h-8 rounded-[10px] text-xs font-medium ${dark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-[#F5F8FC] text-[#486581]"}`;
  const actionBtn = `inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
    dark ? "bg-blue-900/40 text-blue-400 hover:bg-blue-900/70" : "bg-[#FFF3E8] text-[#FF6B00] hover:bg-orange-100"
  }`;

  const HeadCell = ({ col, label }) => (
    <th
      onClick={() => handleSort(col)}
      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer select-none whitespace-nowrap ${thText} ${thHover}`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <SortIcon column={col} sortCol={sortCol} sortDir={sortDir} dark={dark} />
      </span>
    </th>
  );

  const handleDelete = async () => {
    if (!confirm) return;
    const res = await request(`admin/facilities/${confirm.facility.id}`, "delete");
    if (!res?.errors) {
      onSaved();
    }
    setConfirm(null);
  };

  return (
    <div className={`min-h-full rounded-xl p-4 transition-colors duration-200 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`} style={{ fontFamily: "Inter, Poppins, sans-serif" }}>
      <h2 className={`text-[26px] font-bold mb-5 ${titleCls}`}>Facilities</h2>

      {loadError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          <span>{loadError}</span>
          <Button onClick={load} className="text-red-700 font-medium">Retry</Button>
        </div>
      )}

      <div className={`rounded-xl shadow-sm border overflow-hidden ${card}`}>
        <div className={`px-6 py-4 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${cardHdr}`}>
          <div className="flex items-center gap-2">
            <span className={`text-[18px] font-semibold ${titleCls}`}>Facility List</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? "bg-blue-900/40 text-blue-400 ring-blue-700" : "bg-[#FF6B00]/10 text-[#102A43] ring-[#FF6B00]/20"}`}>
              {sorted.length} facilities
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <MdSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg ${dark ? "text-gray-400" : "text-gray-400"}`} />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search…" className={searchCls} />
            </div>
            <Button onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[10px] bg-[#FF6B00] text-white hover:bg-[#e05e00]">
              <MdAdd size={14} /> Add Facility
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${divider}`}>
            <thead className={thead}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-12 ${thText}`}>No</th>
                <HeadCell col="name" label="Facility Name" />
                <HeadCell col="resort_id" label="Resort" />
                <HeadCell col="description" label="Description" />
                <HeadCell col="status" label="Status" />
                <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${thText}`}>Action</th>
              </tr>
            </thead>
            <tbody className={`${tbody} divide-y`}>
              {loading ? (
                <tr><td colSpan={6} className={`py-16 text-center text-sm ${subText}`}>Loading…</td></tr>
              ) : pageItems.length === 0 ? (
                <tr><td colSpan={6} className={`py-16 text-center text-sm ${subText}`}>No facilities found</td></tr>
              ) : (
                pageItems.map((f, idx) => (
                  <tr key={f.id} className={`transition-colors ${rowHover}`}>
                    <td className={`px-4 py-4 text-sm font-medium ${cellMuted}`}>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${titleCls}`}>{f.name}</span>
                      {f.icon && <span className={`ml-2 text-xs ${cellMuted}`}>({f.icon})</span>}
                    </td>
                    <td className={`px-6 py-4 text-sm ${cellText}`}>{resortName(f.resort_id)}</td>
                    <td className={`px-6 py-4 text-sm ${cellText} max-w-xs truncate`}>{f.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><BadgeWithDot status={f.status} dark={dark} /></td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button onClick={() => setEditing(f)} className={actionBtn}><MdEdit size={14} /> Edit</Button>
                        <Button onClick={() => setConfirm({ facility: f })} className={actionBtn}><MdDelete size={14} /> Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={`px-6 py-3 border-t flex items-center justify-between text-sm ${cardHdr} ${subText}`}>
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <Button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className={pageBtn}>Previous</Button>
            <Button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={pageBtn}>Next</Button>
          </div>
        </div>
      </div>

      {(adding || editing) && (
        <FacilityModal
          facility={editing}
          resorts={resorts}
          onClose={() => { setAdding(false); setEditing(null); }}
          onSaved={onSaved}
          dark={dark}
        />
      )}

      <ConfirmDialog
        open={!!confirm}
        dark={dark}
        title="Delete Facility"
        message={confirm ? `Delete "${confirm.facility.name}"?` : ""}
        sub="This removes the record from resort_api."
        confirmText="Yes, Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
