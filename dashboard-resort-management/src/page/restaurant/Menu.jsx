import { useEffect, useMemo, useState } from "react";
import { MdSearch, MdAdd, MdEdit, MdClose, MdDelete } from "react-icons/md";
import { Button, message } from "antd";
import { useDarkMode } from "../../util/DarkModeContext";
import ConfirmDialog from "../../components/ConfirmDialog";
import { request } from "../../util/request";
import { asList } from "../../util/asList";
import config from "../../util/config";
import wokBeefChili from "../../assets/images/dining/wok_beef_chili.png";
import thaiRedCurry from "../../assets/images/dining/thai_red_curry.png";
import goldenHerbSoup from "../../assets/images/dining/golden_herb_soup.png";
import savoryCongee from "../../assets/images/dining/savory_congee.png";
import latteArt from "../../assets/images/dining/latte_art.png";
import tropicalBlueCocktail from "../../assets/images/dining/tropical_blue_cocktail.png";

const PAGE_SIZE = 8;

const DINING_GALLERY = [
  { src: wokBeefChili, alt: "Wok-seared beef with chili and herbs" },
  { src: thaiRedCurry, alt: "Thai red curry with coconut and basil" },
  { src: goldenHerbSoup, alt: "Golden herb broth" },
  { src: savoryCongee, alt: "Savory rice porridge with greens" },
  { src: latteArt, alt: "Artisan latte" },
  { src: tropicalBlueCocktail, alt: "Tropical blue refreshment" },
];

const STATUS_STYLE = {
  Available: { dot: "bg-green-500", light: "bg-green-50 text-green-700 ring-green-200", dark: "bg-green-900/40 text-green-400 ring-green-700" },
  "Out of Stock": { dot: "bg-red-500", light: "bg-red-50 text-red-700 ring-red-200", dark: "bg-red-900/40 text-red-400 ring-red-700" },
};

function photoUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = config.image_path.replace(/\/$/, "");
  return `${base}/${path.replace(/^\//, "")}`;
}

function availabilityLabel(item) {
  return item?.is_available === false ? "Out of Stock" : "Available";
}

function mapMenuRow(row) {
  return {
    id: row.id,
    name: row.name ?? "",
    description: row.description ?? "",
    food_category_id: row.food_category_id ?? row.category?.id ?? "",
    category: row.category?.name ?? "—",
    price: Number(row.price ?? 0),
    is_available: row.is_available !== false,
    status: row.status ?? "active",
    image: row.image ?? "",
  };
}

function BadgeWithDot({ status, dark }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.Available;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? s.dark : s.light}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

function MenuItemModal({ item, categories, onClose, onSaved, dark }) {
  const isEdit = !!item;
  const [form, setForm] = useState(
    isEdit
      ? {
          name: item.name,
          food_category_id: String(item.food_category_id || ""),
          price: item.price,
          description: item.description || "",
          availability: item.is_available ? "Available" : "Out of Stock",
        }
      : {
          name: "",
          food_category_id: categories[0] ? String(categories[0].id) : "",
          price: "",
          description: "",
          availability: "Available",
        }
  );
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(item?.image ? photoUrl(item.image) : "");
  const [errs, setErrs] = useState({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Item name is required.";
    if (!form.food_category_id) e.food_category_id = "Category is required.";
    if (!String(form.price).trim()) e.price = "Price is required.";
    else if (isNaN(form.price) || Number(form.price) < 0) e.price = "Price must be zero or greater.";
    setErrs(e);
    return !Object.keys(e).length;
  };

  const set = (key) => (ev) => {
    setForm((f) => ({ ...f, [key]: ev.target.value }));
    setErrs((p) => ({ ...p, [key]: undefined, _: undefined }));
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const available = form.availability === "Available";
    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("food_category_id", form.food_category_id);
    fd.append("price", String(Number(form.price)));
    fd.append("description", form.description.trim());
    fd.append("is_available", available ? "1" : "0");
    fd.append("status", "active");
    if (imageFile) fd.append("image", imageFile);

    let res;
    if (isEdit) {
      fd.append("_method", "PUT");
      res = await request(`admin/menu-items/${item.id}`, "post", fd);
    } else {
      res = await request("admin/menu-items", "post", fd);
    }
    setSaving(false);
    if (res?.errors) {
      setErrs({ _: res.errors.message ?? "Failed to save menu item." });
      message.error(res.errors.message ?? "Failed to save menu item.");
      return;
    }
    message.success(isEdit ? "Menu item updated." : "Menu item created.");
    onSaved();
    onClose();
  };

  const inputCls = (key) => `w-full border rounded-[10px] px-5 py-2.5 text-[15px] focus:outline-none focus:ring-2 ${
    errs[key] ? "border-red-400 focus:ring-red-400/40" : "focus:ring-[#FF6B00]/30 " + (dark ? "border-gray-600" : "border-[#D9E2EC]")
  } ${dark ? "bg-gray-700 text-gray-100" : "bg-white text-[#102A43]"}`;
  const labelCls = `block text-[14px] font-semibold mb-1 ${dark ? "text-gray-300" : "text-[#486581]"}`;
  const errMsg = (key) => errs[key] && <p className="mt-1 text-xs text-red-500">{errs[key]}</p>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className={`rounded-xl shadow-2xl w-full max-w-sm p-6 max-h-[90vh] overflow-y-auto ${dark ? "bg-gray-800 border border-gray-700" : "bg-white"}`}>
        <div className="flex items-center justify-between mb-5">
          <h3 className={`text-[18px] font-bold ${dark ? "text-gray-100" : "text-[#102A43]"}`}>
            {isEdit ? "Edit Menu Item" : "Add Menu Item"}
          </h3>
          <Button onClick={onClose}><MdClose size={14} /></Button>
        </div>
        {errs._ && <p className="mb-3 text-xs text-red-500">{errs._}</p>}
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Item Name <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={set("name")} className={inputCls("name")} placeholder="e.g. Grilled Salmon" />
            {errMsg("name")}
          </div>
          <div>
            <label className={labelCls}>Category <span className="text-red-500">*</span></label>
            <select value={form.food_category_id} onChange={set("food_category_id")} className={inputCls("food_category_id")}>
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errMsg("food_category_id")}
          </div>
          <div>
            <label className={labelCls}>Price ($) <span className="text-red-500">*</span></label>
            <input type="number" min="0" step="0.01" value={form.price} onChange={set("price")} className={inputCls("price")} placeholder="e.g. 25" />
            {errMsg("price")}
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={form.description} onChange={set("description")} rows={3} className={inputCls("description")} placeholder="Optional description" />
          </div>
          <div>
            <label className={labelCls}>Availability</label>
            <select value={form.availability} onChange={set("availability")} className={inputCls("availability")}>
              <option value="Available">Available</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setImageFile(file);
                setPreview(URL.createObjectURL(file));
              }}
              className={`block w-full text-xs ${dark ? "text-gray-300" : "text-[#486581]"}`}
            />
            {preview ? (
              <img src={preview} alt="" className="mt-2 w-20 h-20 rounded-lg object-cover ring-1 ring-black/5" />
            ) : null}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button onClick={onClose} className={`px-4 py-2 text-sm rounded-[8px] border font-semibold ${dark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-[#D9E2EC] text-[#486581] hover:bg-[#F5F8FC]"}`}>Cancel</Button>
          <Button disabled={saving} onClick={handleSave} className="px-4 py-2 text-sm rounded-[8px] bg-[#FF6B00] text-white hover:bg-[#e05e00] font-semibold disabled:opacity-60">
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Menu() {
  const dark = useDarkMode();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = () => {
    setLoading(true);
    setLoadError(null);
    Promise.all([
      request("admin/menu-items", "get"),
      request("admin/food-categories", "get"),
    ]).then(([menuRes, catRes]) => {
      if (menuRes?.errors) {
        setData([]);
        setLoadError(menuRes.errors.message ?? "Could not load menu items.");
        message.error(menuRes.errors.message ?? "Could not load menu items.");
      } else {
        setData(asList(menuRes).map(mapMenuRow));
      }
      if (catRes?.errors) {
        setCategories([]);
      } else {
        setCategories(asList(catRes));
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async () => {
    if (!confirm) return;
    const res = await request(`admin/menu-items/${confirm.id}`, "delete");
    if (res?.errors) {
      message.error(res.errors.message ?? "Failed to delete menu item.");
    } else {
      message.success("Menu item deleted.");
      load();
    }
    setConfirm(null);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter((d) =>
      !q
      || d.name.toLowerCase().includes(q)
      || d.category.toLowerCase().includes(q)
      || availabilityLabel(d).toLowerCase().includes(q)
    );
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const card = dark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC]";
  const cardHdr = dark ? "border-gray-700" : "border-[#D9E2EC]";
  const titleCls = dark ? "text-gray-100" : "text-[#102A43]";
  const subText = dark ? "text-gray-400" : "text-[#486581]";
  const thead = dark ? "bg-gray-700/60" : "bg-[#F5F8FC]";
  const thText = dark ? "text-gray-400" : "text-[#486581]";
  const tbody = dark ? "bg-gray-800 divide-gray-700" : "bg-white divide-[#D9E2EC]";
  const rowHover = dark ? "hover:bg-gray-700/50" : "hover:bg-[#F5F8FC]";
  const cellText = dark ? "text-gray-300" : "text-[#486581]";
  const cellMuted = dark ? "text-[#829AB1]" : "text-[#829AB1]";
  const divider = dark ? "divide-gray-700" : "divide-[#D9E2EC]";
  const searchCls = dark
    ? "pl-9 pr-3 py-1.5 text-sm border border-gray-600 bg-gray-700 text-gray-100 placeholder-[#829AB1] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-48"
    : "pl-9 pr-3 py-1.5 text-sm border border-[#D9E2EC] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-48 placeholder:text-[#829AB1]";
  const pageBtn = dark
    ? "px-3 py-1.5 rounded-[8px] border border-gray-600 text-xs font-semibold hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300"
    : "px-3 py-1.5 rounded-[8px] border border-[#D9E2EC] text-xs font-semibold text-[#486581] hover:bg-[#F5F8FC] disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className={`min-h-full rounded-xl p-4 transition-colors duration-200 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`} style={{ fontFamily: "Inter, Poppins, sans-serif" }}>
      <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-5 rounded-xl overflow-hidden border shadow-sm ${card}`}>
        {DINING_GALLERY.map((photo) => (
          <div key={photo.alt} className="aspect-[4/3] overflow-hidden">
            <img src={photo.src} alt={photo.alt} className="w-full h-full object-cover" loading="lazy" />
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mb-5">
        <h2 className={`text-[26px] font-bold ${titleCls}`}>Restaurant Menu</h2>
        <Button
          disabled={!categories.length}
          onClick={() => { setEditing(null); setModal(true); }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[8px] bg-[#FF6B00] text-white hover:bg-[#e05e00] disabled:opacity-60"
        >
          <MdAdd size={14} /> Add Item
        </Button>
      </div>

      {loadError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          <span>{loadError}</span>
          <Button onClick={load} className="text-red-700 font-medium">Retry</Button>
        </div>
      )}

      {!loading && !categories.length && !loadError && (
        <p className={`mb-4 text-sm ${subText}`}>Create a food category before adding menu items.</p>
      )}

      <div className={`rounded-xl shadow-sm border overflow-hidden ${card}`}>
        <div className={`px-6 py-4 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${cardHdr}`}>
          <div className="flex items-center gap-2">
            <span className={`text-[18px] font-bold ${titleCls}`}>Menu Items</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ${dark ? "bg-blue-900/40 text-blue-400 ring-blue-700" : "bg-[#FFF3E8] text-[#FF6B00] ring-[#FFD4A8]"}`}>
              {filtered.length} items
            </span>
          </div>
          <div className="relative">
            <MdSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg ${dark ? "text-gray-400" : "text-gray-400"}`} />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search item, category…" className={searchCls} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${divider}`}>
            <thead className={thead}>
              <tr>
                {["No.", "Photo", "Item", "Category", "Price", "Status", "Action"].map((h) => (
                  <th key={h} className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText} ${h === "No." ? "w-12 px-4" : ""} ${h === "Photo" ? "w-20 px-4" : ""} ${h === "Action" ? "text-center" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`${tbody} divide-y`}>
              {loading ? (
                <tr><td colSpan={7} className={`py-16 text-center text-sm ${subText}`}>Loading menu…</td></tr>
              ) : pageItems.length === 0 ? (
                <tr><td colSpan={7} className={`py-16 text-center text-sm ${subText}`}>No items found</td></tr>
              ) : pageItems.map((item, idx) => (
                <tr key={item.id} className={`transition-colors ${rowHover}`}>
                  <td className={`px-4 py-4 text-sm font-medium ${cellMuted}`}>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className="px-4 py-3">
                    {item.image ? (
                      <img
                        src={photoUrl(item.image)}
                        alt={item.name}
                        className="w-14 h-14 rounded-lg object-cover ring-1 ring-black/5"
                        loading="lazy"
                      />
                    ) : (
                      <div className={`w-14 h-14 rounded-lg ring-1 ring-black/5 ${dark ? "bg-gray-700" : "bg-[#F5F8FC]"}`} />
                    )}
                  </td>
                  <td className={`px-6 py-4 text-sm font-medium ${titleCls}`}>{item.name}</td>
                  <td className={`px-6 py-4 text-sm ${cellText}`}>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? "bg-gray-700 text-gray-300 ring-gray-600" : "bg-[#F5F8FC] text-[#486581] ring-gray-200"}`}>{item.category}</span>
                  </td>
                  <td className={`px-6 py-4 text-sm ${cellText}`}>${item.price}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><BadgeWithDot status={availabilityLabel(item)} dark={dark} /></td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button onClick={() => { setEditing(item); setModal(true); }} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[8px] text-xs font-semibold transition-colors ${dark ? "bg-blue-900/40 text-blue-400 hover:bg-blue-900/70" : "bg-[#FFF3E8] text-[#FF6B00] hover:bg-orange-100"}`}>
                        <MdEdit size={14} /> Edit
                      </Button>
                      <Button onClick={() => setConfirm(item)} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[8px] text-xs font-semibold transition-colors ${dark ? "bg-red-900/40 text-red-400 hover:bg-red-900/70" : "bg-red-50 text-red-600 hover:bg-red-100"}`}>
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
          <span>Page {page} of {totalPages} · {filtered.length} records</span>
          <div className="flex items-center gap-1">
            <Button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className={pageBtn}>Previous</Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-[8px] text-xs font-semibold transition-colors ${page === p ? "bg-[#FF6B00] text-white" : dark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-[#F5F8FC] text-[#486581]"}`}>{p}</Button>
            ))}
            <Button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={pageBtn}>Next</Button>
          </div>
        </div>
      </div>

      {modal && (
        <MenuItemModal
          item={editing}
          categories={categories}
          onClose={() => { setModal(false); setEditing(null); }}
          onSaved={load}
          dark={dark}
        />
      )}

      <ConfirmDialog
        open={!!confirm}
        dark={dark}
        title="Delete Menu Item"
        message={confirm ? `Remove “${confirm.name}” from the menu?` : ""}
        sub="This cannot be undone."
        confirmText="Yes, Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
