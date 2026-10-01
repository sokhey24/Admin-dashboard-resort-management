import { useMemo, useState } from "react";
import { MdSearch, MdAdd, MdEdit, MdDelete, MdClose } from "react-icons/md";
import { useDarkMode } from "../../util/DarkModeContext";
import { Button } from "antd";

const PAGE_SIZE = 8;

const INIT_DATA = [
  { key: 1, name: "Starter",     items: 8,  status: "Active"   },
  { key: 2, name: "Main Course", items: 15, status: "Active"   },
  { key: 3, name: "Dessert",     items: 6,  status: "Active"   },
  { key: 4, name: "Beverage",    items: 12, status: "Active"   },
  { key: 5, name: "Seafood",     items: 9,  status: "Active"   },
  { key: 6, name: "Vegetarian",  items: 7,  status: "Inactive" },
];

const STATUS_STYLE = {
  Active:   { dot: "bg-green-500", light: "bg-green-50 text-green-700 ring-green-200",    dark: "bg-green-900/40 text-green-400 ring-green-700"   },
  Inactive: { dot: "bg-red-500",   light: "bg-red-50 text-red-700 ring-red-200",           dark: "bg-red-900/40 text-red-400 ring-red-700"         },
};

function BadgeWithDot({ status, dark }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.Inactive;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? s.dark : s.light}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

function CategoryModal({ category, onClose, onSaved, dark }) {
  const isEdit = !!category;
  const [form, setForm] = useState(
    isEdit ? { name: category.name, status: category.status } : { name: "", status: "Active" }
  );
  const [errs, setErrs] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Category name is required.";
    setErrs(e);
    return !Object.keys(e).length;
  };

  const set = (key) => (ev) => {
    setForm(f => ({ ...f, [key]: ev.target.value }));
    setErrs(p => ({ ...p, [key]: undefined }));
  };

  const handleSave = () => {
    if (!validate()) return;
    onSaved({ ...form, key: category?.key ?? Date.now() });
    onClose();
  };

  const inputCls = (key) => `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
    errs[key] ? "border-red-400 focus:ring-red-400/40" : "focus:ring-[#FF6B00]/30 " + (dark ? "border-gray-600" : "border-[#D9E2EC]")
  } ${dark ? "bg-gray-700 text-gray-100" : "bg-white text-[#102A43]"}`;
  const labelCls = `block text-[14px] font-semibold mb-1 ${dark ? "text-gray-300" : "text-[#486581]"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className={`rounded-xl shadow-2xl w-full max-w-sm p-6 ${dark ? "bg-gray-800 border border-gray-700" : "bg-white"}`}>
        <div className="flex items-center justify-between mb-5">
          <h3 className={`text-base font-semibold ${dark ? "text-gray-100" : "text-[#102A43]"}`}>
            {isEdit ? "Edit Category" : "Add Category"}
          </h3>
          <Button onClick={onClose}><MdClose size={14} /></Button>
        </div>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Category Name <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={set("name")} className={inputCls("name")} placeholder="e.g. Starter" />
            {errs.name && <p className="mt-1 text-xs text-red-500">{errs.name}</p>}
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select value={form.status} onChange={set("status")} className={inputCls("status")}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button onClick={onClose} className={`px-4 py-2 text-sm rounded-lg border ${dark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-[#D9E2EC] text-[#486581] hover:bg-[#F5F8FC]"}`}>Cancel</Button>
          <Button onClick={handleSave} className="px-4 py-2 text-sm rounded-[8px] bg-[#FF6B00] text-white hover:bg-[#e05e00]">Save</Button>
        </div>
      </div>
    </div>
  );
}

export default function FoodCategory() {
  const dark = useDarkMode();
  const [search,  setSearch]  = useState("");
  const [page,    setPage]    = useState(1);
  const [data,    setData]    = useState(INIT_DATA);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);

  const handleSaved = (item) => {
    setData(prev => {
      const idx = prev.findIndex(d => d.key === item.key);
      if (idx >= 0) { const next = [...prev]; next[idx] = { ...next[idx], ...item }; return next; }
      return [...prev, { ...item, items: 0 }];
    });
  };

  const handleDelete = (key) => setData(prev => prev.filter(d => d.key !== key));

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter(d => !q || d.name.toLowerCase().includes(q) || d.status.toLowerCase().includes(q));
  }, [data, search]);

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

  return (
    <div className={`min-h-full rounded-xl p-4 transition-colors duration-200 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`} style={{ fontFamily: "Inter, Poppins, sans-serif" }}>
      <div className="flex justify-between items-center mb-5">
        <h2 className={`text-[26px] font-bold ${titleCls}`}>Food Categories</h2>
        <Button onClick={() => { setEditing(null); setModal(true); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[8px] bg-[#FF6B00] text-white hover:bg-[#e05e00]">
          <MdAdd size={14} /> Add Category
        </Button>
      </div>

      <div className={`rounded-xl shadow-sm border overflow-hidden ${card}`}>
        <div className={`px-6 py-4 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${cardHdr}`}>
          <div className="flex items-center gap-2">
            <span className={`text-[18px] font-semibold ${titleCls}`}>Category List</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? "bg-blue-900/40 text-blue-400 ring-blue-700" : "bg-[#FF6B00]/10 text-[#102A43] ring-[#FF6B00]/20"}`}>
              {filtered.length} categories
            </span>
          </div>
          <div className="relative">
            <MdSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg ${dark ? "text-gray-400" : "text-gray-400"}`} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search category…" className={searchCls} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${divider}`}>
            <thead className={thead}>
              <tr>
                {["No.", "Category", "Items", "Status", "Action"].map(h => (
                  <th key={h} className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText} ${h === "No." ? "w-12 px-4" : ""} ${h === "Action" ? "text-center" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`${tbody} divide-y`}>
              {pageItems.length === 0 ? (
                <tr><td colSpan={5} className={`py-16 text-center text-sm ${subText}`}>No categories found</td></tr>
              ) : pageItems.map((cat, idx) => (
                <tr key={cat.key} className={`transition-colors ${rowHover}`}>
                  <td className={`px-4 py-4 text-sm font-medium ${cellMuted}`}>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className={`px-6 py-4 text-sm font-medium ${titleCls}`}>{cat.name}</td>
                  <td className={`px-6 py-4 text-sm ${cellText}`}>{cat.items}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><BadgeWithDot status={cat.status} dark={dark} /></td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button onClick={() => { setEditing(cat); setModal(true); }} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${dark ? "bg-blue-900/40 text-blue-400 hover:bg-blue-900/70" : "bg-[#FFF3E8] text-[#FF6B00] hover:bg-orange-100"}`}>
                        <MdEdit size={14} /> Edit
                      </Button>
                      <Button onClick={() => handleDelete(cat.key)} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${dark ? "bg-red-900/40 text-red-400 hover:bg-red-900/70" : "bg-red-50 text-red-600 hover:bg-red-100"}`}>
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
            <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={pageBtn}>Previous</Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <Button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${page === p ? "bg-[#FF6B00] text-white" : dark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-[#F5F8FC] text-[#486581]"}`}>{p}</Button>
            ))}
            <Button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={pageBtn}>Next</Button>
          </div>
        </div>
      </div>

      {modal && (
        <CategoryModal
          category={editing}
          onClose={() => { setModal(false); setEditing(null); }}
          onSaved={handleSaved}
          dark={dark}
        />
      )}
    </div>
  );
}
