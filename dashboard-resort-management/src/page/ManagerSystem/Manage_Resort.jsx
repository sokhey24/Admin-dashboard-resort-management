import { useEffect, useMemo, useState } from "react";
import {
  MdEdit, MdDelete, MdSearch, MdUnfoldMore, MdKeyboardArrowUp,
  MdKeyboardArrowDown, MdClose, MdAdd, MdAccountBalance,
} from "react-icons/md";
import { Button } from "antd";
import { request } from "../../util/request";
import { useDarkMode } from "../../util/DarkModeContext";
import { PriceWithDiscount } from "../Room/RoomPrice";
import ResortCatalogPreview from "./ResortCatalogPreview";

const PAGE_SIZE = 10;
const STATUSES  = ["all", "active", "inactive"];
const RESORT_TYPES = ["Beachfront", "Riverside", "Island", "Mountain"];

const FACILITY_PRESETS = [
  { name: "Swimming Pool", icon: "fa-person-swimming" },
  { name: "Free Wi-Fi", icon: "fa-wifi" },
  { name: "Restaurant", icon: "fa-utensils" },
  { name: "Spa", icon: "fa-spa" },
  { name: "Airport Transfer", icon: "fa-van-shuttle" },
  { name: "Free Parking", icon: "fa-square-parking" },
  { name: "Fitness Center", icon: "fa-dumbbell" },
  { name: "Breakfast", icon: "fa-mug-saucer" },
  { name: "Beachfront", icon: "fa-umbrella-beach" },
  { name: "Bar", icon: "fa-martini-glass" },
];

function resortFormFromRecord(resort) {
  if (!resort) {
    return {
      name: "", slug: "", email: "", phone: "", address: "", city: "", country: "",
      website: "", description: "", status: "active",
      resort_type: "", stars: "4", promo_tag: "", tagline: "",
      free_cancellation: true, breakfast_options: true, featured: false,
    };
  }
  return {
    name: resort.name ?? "",
    slug: resort.slug ?? "",
    email: resort.email ?? "",
    phone: resort.phone ?? "",
    address: resort.address ?? "",
    city: resort.city ?? "",
    country: resort.country ?? "",
    website: resort.website ?? "",
    description: resort.description ?? "",
    status: resort.status ?? "active",
    resort_type: resort.resort_type ?? "",
    stars: String(resort.stars ?? 4),
    promo_tag: resort.promo_tag ?? "",
    tagline: resort.tagline ?? "",
    free_cancellation: resort.free_cancellation !== false && resort.free_cancellation !== 0,
    breakfast_options: resort.breakfast_options !== false && resort.breakfast_options !== 0,
    featured: !!resort.featured,
  };
}

async function syncResortFacilities(resortId, selectedNames, existing) {
  const names = [...selectedNames];
  const toRemove = (existing || []).filter((f) => !names.includes(f.name));
  const toAdd = names.filter((n) => !(existing || []).some((f) => f.name === n));
  for (const f of toRemove) {
    await request(`admin/facilities/${f.id}`, "delete");
  }
  for (const name of toAdd) {
    const preset = FACILITY_PRESETS.find((p) => p.name === name);
    await request("admin/facilities", "post", {
      resort_id: resortId,
      name,
      icon: preset?.icon ?? null,
      status: "active",
    });
  }
}

const STATUS_STYLE = {
  active:   { dot: "bg-green-500",  light: "bg-green-50 text-green-700 ring-green-200",    dark: "bg-green-900/40 text-green-400 ring-green-700"   },
  inactive: { dot: "bg-yellow-500", light: "bg-yellow-50 text-yellow-700 ring-yellow-200", dark: "bg-yellow-900/40 text-yellow-400 ring-yellow-700" },
};

const INIT = resortFormFromRecord(null);

function BadgeWithDot({ status, dark }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.inactive;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? s.dark : s.light}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
}

function ResortAvatar({ name, logoUrl, dark }) {
  if (logoUrl) return <img src={logoUrl} alt={name} className="w-9 h-9 rounded-lg object-cover shrink-0 border border-[#D9E2EC]" />;
  const initials = name?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() ?? "R";
  return (
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0 ${dark ? "bg-[#1a3a5c]" : "bg-[#FF6B00]"}`}>
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

function ResortModal({ resort, onClose, onSaved, dark }) {
  const isEdit = !!resort;
  const [form, setForm] = useState(isEdit ? resortFormFromRecord(resort) : INIT);
  const [logoFile,    setLogoFile]    = useState(null);
  const [logoPreview, setLogoPreview] = useState(resort?.logo_url ?? null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(resort?.cover_image_url ?? null);
  const [facilityNames, setFacilityNames] = useState([]);
  const [existingFacilities, setExistingFacilities] = useState([]);
  const [errs,   setErrs]   = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit || !resort?.id) return;
    request("admin/facilities", "get").then((res) => {
      const list = Array.isArray(res) ? res : res?.data ?? [];
      const mine = list.filter((f) => Number(f.resort_id) === Number(resort.id));
      setExistingFacilities(mine);
      setFacilityNames(mine.map((f) => f.name));
    });
  }, [isEdit, resort?.id]);

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = "Name is required.";
    if (!isEdit && !form.slug.trim()) e.slug = "Slug is required.";
    if (!form.email.trim())   e.email   = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email.";
    if (!form.phone.trim())   e.phone   = "Phone is required.";
    if (!form.address.trim()) e.address = "Address is required.";
    if (!form.city.trim())    e.city    = "City is required.";
    if (!form.country.trim()) e.country = "Country is required.";
    setErrs(e);
    return !Object.keys(e).length;
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const toggleFacility = (name) => {
    setFacilityNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const previewFacilities = facilityNames.map((name) => ({ name }));

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (typeof v === "boolean") fd.append(k, v ? "1" : "0");
      else if (v !== "") fd.append(k, v);
    });
    if (logoFile) fd.append("logo", logoFile);
    if (coverFile) fd.append("cover_image", coverFile);
    let res;
    if (isEdit) {
      fd.append("_method", "PUT");
      res = await request(`admin/resorts/${resort.id}`, "post", fd);
    } else {
      res = await request("admin/resorts", "post", fd);
    }
    if (!res?.errors) {
      const resortId = res?.resort?.id ?? resort?.id;
      if (resortId) {
        await syncResortFacilities(resortId, facilityNames, existingFacilities);
      }
      setSaving(false);
      onSaved();
      onClose();
    } else {
      setSaving(false);
      setErrs({ _: res.errors.message ?? "Failed to save." });
    }
  };

  const set = (key) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [key]: val }));
    setErrs(p => ({ ...p, [key]: undefined }));
  };

  const inputCls = (key) => `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
    errs[key] ? "border-red-400 focus:ring-red-400/40" : "focus:ring-[#FF6B00]/30 " + (dark ? "border-gray-600" : "border-[#D9E2EC]")
  } ${dark ? "bg-gray-700 text-gray-100 placeholder-[#829AB1]" : "bg-white text-[#102A43]"}`;
  const labelCls = `block text-[14px] font-semibold mb-1 ${dark ? "text-gray-300" : "text-[#486581]"}`;
  const errMsg   = (key) => errs[key] && <p className="mt-1 text-xs text-red-500">{errs[key]}</p>;

  const fields = [
    { key: "name",        label: "Resort Name", req: true },
    ...(!isEdit ? [{ key: "slug", label: "Slug", req: true }] : []),
    { key: "email",       label: "Email",       req: true },
    { key: "phone",       label: "Phone",       req: true },
    { key: "address",     label: "Address",     req: true },
    { key: "city",        label: "City",        req: true },
    { key: "country",     label: "Country",     req: true },
    { key: "website",     label: "Website",     req: false },
    { key: "description", label: "Description", req: false, area: true },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4  ">
      <div className={`rounded-xl shadow-2xl w-full max-w-5xl p-6 max-h-[90vh] overflow-y-auto m-25 mt-20 ${dark ? "bg-gray-800 border border-gray-700" : "bg-white"}`}>
        <div className="flex items-center justify-between ">
          <h3 className={`text-base font-semibold flex items-center gap-2 ${dark ? "text-gray-100" : "text-[#102A43]"}`}>
            <MdAccountBalance className="text-blue-500" /> {isEdit ? "Edit Resort" : "Add Resort"}
          </h3>
          <Button onClick={onClose} className={dark ? "text-[#829AB1] hover:text-gray-200" : "text-[#829AB1] hover:text-[#486581]"}>
            <MdClose size={14} />
          </Button>
        </div>

        {errs._ && <p className="mb-3 text-xs text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">{errs._}</p>}

        <div className="grid lg:grid-cols-2 gap-6 mt-4">
          <div className="space-y-4">
            <p className={`text-xs font-semibold uppercase tracking-wide ${dark ? "text-gray-400" : "text-[#829AB1]"}`}>
              Contact &amp; admin
            </p>
            <div className="grid grid-cols-2 gap-4">
              {fields.map(({ key, label, req, area }) => (
                <div key={key} className={area ? "col-span-2" : ""}>
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
                      ? "text-gray-300 file:bg-blue-900/40 file:text-blue-400 hover:file:bg-blue-900/70"
                      : "text-[#486581] file:bg-[#FF6B00]/10 file:text-[#102A43] hover:file:bg-[#FF6B00]/20"
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

            <p className={`text-xs font-semibold uppercase tracking-wide pt-2 ${dark ? "text-gray-400" : "text-[#829AB1]"}`}>
              Guest search card
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Resort type</label>
                <select value={form.resort_type} onChange={set("resort_type")} className={inputCls("resort_type")}>
                  <option value="">— Select —</option>
                  {RESORT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Star rating (1–5)</label>
                <select value={form.stars} onChange={set("stars")} className={inputCls("stars")}>
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={String(n)}>{n} stars</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Promo badge</label>
                <input type="text" value={form.promo_tag} onChange={set("promo_tag")} className={inputCls("promo_tag")} placeholder="Stay 3, save 12% with STAY3" />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Tagline</label>
                <input type="text" value={form.tagline} onChange={set("tagline")} className={inputCls("tagline")} placeholder="Short line under the title on detail pages" />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Cover image (search card)</label>
                {coverPreview && (
                  <img src={coverPreview} alt="cover" className="w-full max-h-32 rounded-lg object-cover mb-2 border border-[#D9E2EC]" />
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  onChange={handleCoverChange}
                  className={`w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium cursor-pointer ${
                    dark
                      ? "text-gray-300 file:bg-blue-900/40 file:text-blue-400 hover:file:bg-blue-900/70"
                      : "text-[#486581] file:bg-[#FF6B00]/10 file:text-[#102A43] hover:file:bg-[#FF6B00]/20"
                  }`}
                />
              </div>
              <label className={`flex items-center gap-2 text-sm col-span-2 ${dark ? "text-gray-300" : "text-[#486581]"}`}>
                <input type="checkbox" checked={form.free_cancellation} onChange={set("free_cancellation")} className="rounded" />
                Show “Free cancellation” on the card
              </label>
              <label className={`flex items-center gap-2 text-sm col-span-2 ${dark ? "text-gray-300" : "text-[#486581]"}`}>
                <input type="checkbox" checked={form.breakfast_options} onChange={set("breakfast_options")} className="rounded" />
                Show “Breakfast options” on the card
              </label>
              <label className={`flex items-center gap-2 text-sm col-span-2 ${dark ? "text-gray-300" : "text-[#486581]"}`}>
                <input type="checkbox" checked={form.featured} onChange={set("featured")} className="rounded" />
                Featured resort (home highlights)
              </label>
            </div>

            <div>
              <label className={labelCls}>Facilities (shown as chips on the card)</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {FACILITY_PRESETS.map((f) => {
                  const on = facilityNames.includes(f.name);
                  return (
                    <button
                      key={f.name}
                      type="button"
                      onClick={() => toggleFacility(f.name)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        on
                          ? "bg-blue-600 text-white border-blue-600"
                          : dark
                            ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                            : "border-[#D9E2EC] text-[#486581] hover:bg-[#F5F8FC]"
                      }`}
                    >
                      {f.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-0 self-start">
            <ResortCatalogPreview
              form={{ ...form, coverPreview }}
              resort={resort}
              facilities={previewFacilities}
              dark={dark}
            />
            <p className={`text-[11px] mt-2 ${dark ? "text-gray-500" : "text-[#829AB1]"}`}>
              Rating, room types, and “from” price come from live reviews and rooms after you save.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button onClick={onClose} className={`px-4 py-2 text-sm rounded-lg border transition-colors ${dark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-[#D9E2EC] text-[#486581] hover:bg-[#F5F8FC]"}`}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm rounded-[8px] bg-[#FF6B00] text-white hover:bg-[#e05e00] disabled:opacity-60 transition-colors">
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirm({ resort, onClose, onDeleted, dark }) {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    await request(`admin/resorts/${resort.id}`, "delete");
    setLoading(false);
    onDeleted();
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className={`rounded-xl shadow-2xl w-full max-w-sm p-6 ${dark ? "bg-gray-800 border border-gray-700" : "bg-white"}`}>
        <h3 className={`text-base font-semibold mb-2 ${dark ? "text-gray-100" : "text-[#102A43]"}`}>Delete Resort</h3>
        <p className={`text-sm mb-6 ${dark ? "text-gray-400" : "text-[#829AB1]"}`}>
          Are you sure you want to delete <span className={`font-medium ${dark ? "text-gray-200" : "text-[#102A43]"}`}>{resort.name}</span>? This action cannot be undone.
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

export default function Manage_Resort() {
  const dark = useDarkMode();
  const [resorts,  setResorts]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [status,   setStatus]   = useState("all");
  const [sortCol,  setSortCol]  = useState("name");
  const [sortDir,  setSortDir]  = useState("asc");
  const [page,     setPage]     = useState(1);
  const [editing,  setEditing]  = useState(null);
  const [adding,   setAdding]   = useState(false);
  const [deleting, setDeleting] = useState(null);

  const [apiPages, setApiPages] = useState(1);

  const load = () => {
    setLoading(true);
    const qs = new URLSearchParams({ per_page: String(PAGE_SIZE), page: String(page) });
    if (search.trim()) qs.set("search", search.trim());
    if (status !== "all") qs.set("status", status);
    request(`admin/resorts?${qs.toString()}`, "get").then(res => {
      setResorts(res?.data ?? []);
      setApiPages(Math.max(1, Number(res?.last_page) || 1));
      setLoading(false);
    });
  };
  useEffect(() => { load(); }, [page, status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(); }, 350);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
    setPage(1);
  };

  const pageItems = useMemo(() => {
    return [...resorts].sort((a, b) => {
      const cmp = String(a[sortCol] ?? "").localeCompare(String(b[sortCol] ?? ""));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [resorts, sortCol, sortDir]);

  const totalPages = apiPages;

  // ── theme tokens (same as Branch) ──
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
    ? "pl-9 pr-3 py-1.5 text-sm border border-gray-600 bg-gray-700 text-gray-100 placeholder-[#829AB1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-48"
    : "pl-9 pr-3 py-1.5 text-sm border border-[#D9E2EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-48";
  const pageBtn   = dark
    ? "px-3 py-1.5 rounded-[8px] border border-gray-600 text-xs font-semibold hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300"
    : "px-3 py-1.5 rounded-[8px] border border-[#D9E2EC] text-xs font-semibold hover:bg-[#F5F8FC] disabled:opacity-40 disabled:cursor-not-allowed";
  const pageNum   = (active) => active
    ? "w-8 h-8 rounded-[8px] text-xs font-semibold bg-[#FF6B00] text-white"
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
        <MdAccountBalance className="text-blue-500" /> Manage Resort
      </h2>

      <div className={`rounded-xl shadow-sm border overflow-hidden ${card}`}>

        {/* ── Header ── */}
        <div className={`px-6 py-4 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${cardHdr}`}>
          <div className="flex items-center gap-2">
            <span className={`text-[18px] font-semibold ${titleCls}`}>Resort List</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${
              dark ? "bg-blue-900/40 text-blue-400 ring-blue-700" : "bg-[#FF6B00]/10 text-[#102A43] ring-[#FF6B00]/20"
            }`}>
              {pageItems.length} resorts
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
              <MdAdd size={14} /> Add Resort
            </Button>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${divider}`}>
            <thead className={thead}>
              <tr >
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-12 mb-5 ${thText}`}>No.</th>
                <HeadCell col="name"    label="Resort Name" />
                <HeadCell col="email"   label="Email" />
                <HeadCell col="phone"   label="Phone" />
                <HeadCell col="city"    label="City" />
                <HeadCell col="country" label="Country" />
                <HeadCell col="resort_type" label="Type" />
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>Guest rating</th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>Promo</th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>Rooms</th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText}`}>From / night</th>
                <HeadCell col="status"  label="Status" />
                <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${thText}`}>Action</th>
              </tr>
            </thead>
            <tbody className={`${tbody} divide-y`}>
              {loading ? (
                <tr><td colSpan={13} className={`py-16 text-center text-sm ${subText}`}>Loading…</td></tr>
              ) : pageItems.length === 0 ? (
                <tr><td colSpan={13} className={`py-16 text-center text-sm ${subText}`}>No resorts found</td></tr>
              ) : pageItems.map((r, idx) => (
                <tr key={r.id} className={`transition-colors ${rowHover}`}>
                  <td className={`px-4 py-4 text-sm font-medium ${cellMuted}`}>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <ResortAvatar name={r.name} logoUrl={r.logo_url} dark={dark} />
                      <span className={`text-sm font-medium ${titleCls}`}>{r.name}</span>
                    </div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${cellText}`}>{r.email ?? "—"}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${cellText}`}>{r.phone ?? "—"}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${cellText}`}>{r.city ?? "—"}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${cellText}`}>{r.country ?? "—"}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${cellText}`}>{r.resort_type ?? "—"}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${cellText}`}>
                    {Number(r.rating) > 0 ? (
                      <span>{Number(r.rating).toFixed(1)} <span className={cellMuted}>({r.review_count ?? 0})</span></span>
                    ) : (
                      <span className={cellMuted}>—</span>
                    )}
                  </td>
                  <td className={`px-6 py-4 text-sm max-w-[140px] truncate ${cellText}`} title={r.promo_tag ?? ""}>
                    {r.promo_tag || <span className={cellMuted}>—</span>}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${cellText}`}>
                    <span className="block">{r.available_rooms_count ?? 0} avail</span>
                    <span className={`text-xs ${cellMuted}`}>{r.rooms_count ?? 0} total · {r.branch_count ?? 0} branches</span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${cellText}`}>
                    {Number(r.price_from) > 0 ? (
                      <PriceWithDiscount
                        price={Number(r.price_from_original || r.price_from)}
                        percent={Number(r.price_from_discount_percent || 0)}
                        dark={dark}
                        suffix=" / night"
                      />
                    ) : (
                      <span className={cellMuted}>—</span>
                    )}
                  </td>
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

        {/* ── Pagination ── */}
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
        <ResortModal
          resort={editing}
          onClose={() => { setEditing(null); setAdding(false); }}
          onSaved={load}
          dark={dark}
        />
      )}
      {deleting && (
        <DeleteConfirm
          resort={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={load}
          dark={dark}
        />
      )}
    </div>
  );
}
