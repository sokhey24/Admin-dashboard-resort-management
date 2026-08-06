import { useState, useMemo } from "react";
import { MdAdd, MdEdit, MdDelete, MdUnfoldMore, MdKeyboardArrowUp, MdKeyboardArrowDown, MdSearch } from "react-icons/md";
import { useDarkMode } from "../../util/DarkModeContext";
import { Button } from "antd";
import { IoEyeOutline } from "react-icons/io5";

const facilities = [
  { id: 1,  name: "Swimming Pool",    category: "Outdoor",  description: "Olympic-size outdoor swimming pool for adults and children.",        active: true,  imageSrc: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzeaMPwkVax3KT0WjfK89Fy3Brxd4ulCWGep2adVZihGLd56R2-6N-lXJX&s=10" },
  { id: 2,  name: "Restaurant",       category: "Dining",   description: "International restaurant serving breakfast, lunch, and dinner.",      active: true,  imageSrc: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTH3KA150BdtwWYsHnHe-Ca-MrwXhLAfSY-trZLT9U7CcLJlj-fFyEtA7M&s=10" },
  { id: 3,  name: "Executive Lounge", category: "Indoor",   description: "Comfortable lounge for guests to relax, work, or enjoy refreshments.", active: true,  imageSrc: "https://www.royalwingsuites.com/wp-content/uploads/2025/06/RC_Majestic-Lounge-12-min-scaled-1000x667.jpg" },
  { id: 4,  name: "Spa & Wellness",   category: "Wellness", description: "Professional spa offering massage, sauna, and wellness treatments.",   active: false, imageSrc: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTRwL9bYNDt16bDN6AlkZrjWBFXvxGnC05F4Y6zpkwVx1ijNm-_7KgW6Sg&s=10" },
  { id: 5,  name: "Gym & Fitness",    category: "Wellness", description: "Fully equipped gym with modern fitness equipment.",                    active: true,  imageSrc: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR2e1234gymfitness&s=10" },
  { id: 6,  name: "Kids Club",        category: "Indoor",   description: "Supervised play area and activities for children.",                    active: true,  imageSrc: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzeaMPwkVax3KT0WjfK89Fy3Brxd4ulCWGep2adVZihGLd56R2-6N-lXJX&s=10" },
  { id: 7,  name: "Tennis Court",     category: "Outdoor",  description: "Professional tennis courts available for guests.",                     active: false, imageSrc: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTH3KA150BdtwWYsHnHe-Ca-MrwXhLAfSY-trZLT9U7CcLJlj-fFyEtA7M&s=10" },
  { id: 8,  name: "Business Center",  category: "Indoor",   description: "Meeting rooms and workstations for business travelers.",               active: true,  imageSrc: "https://www.royalwingsuites.com/wp-content/uploads/2025/06/RC_Majestic-Lounge-12-min-scaled-1000x667.jpg" },
  { id: 9,  name: "Beach Bar",        category: "Outdoor",  description: "Beachside bar serving cocktails and light snacks.",                    active: true,  imageSrc: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzeaMPwkVax3KT0WjfK89Fy3Brxd4ulCWGep2adVZihGLd56R2-6N-lXJX&s=10" },
  { id: 10, name: "Yoga Pavilion",    category: "Wellness", description: "Open-air pavilion for yoga and meditation sessions.",                  active: false, imageSrc: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTRwL9bYNDt16bDN6AlkZrjWBFXvxGnC05F4Y6zpkwVx1ijNm-_7KgW6Sg&s=10" },
  { id: 11, name: "Water Sports",     category: "Outdoor",  description: "Kayaking, snorkeling, and jet ski rentals available.",                 active: true,  imageSrc: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTH3KA150BdtwWYsHnHe-Ca-MrwXhLAfSY-trZLT9U7CcLJlj-fFyEtA7M&s=10" },
];

const PAGE_SIZE = 10;

const STATUS_STYLE = {
  true:  { dot: "bg-green-500",  light: "bg-green-50 text-green-700 ring-green-200",    dark: "bg-green-900/40 text-green-400 ring-green-700"   },
  false: { dot: "bg-yellow-500", light: "bg-yellow-50 text-yellow-700 ring-yellow-200", dark: "bg-yellow-900/40 text-yellow-400 ring-yellow-700" },
};

function BadgeWithDot({ active, dark }) {
  const s = STATUS_STYLE[active];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? s.dark : s.light}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function SortIcon({ column, sortCol, sortDir, dark }) {
  if (sortCol !== column) return <MdUnfoldMore className={`text-base ${dark ? "text-gray-500" : "text-gray-400"}`} />;
  return sortDir === "asc"
    ? <MdKeyboardArrowUp className={`text-base ${dark ? "text-gray-200" : "text-gray-700"}`} />
    : <MdKeyboardArrowDown className={`text-base ${dark ? "text-gray-200" : "text-gray-700"}`} />;
}

export default function Facilities() {
  const dark = useDarkMode();
  const [page,    setPage]    = useState(1);
  const [sortCol, setSortCol] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [search,  setSearch]  = useState("");

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
    setPage(1);
  };

  const sorted = useMemo(() => {
    const q = search.toLowerCase();
    return [...facilities]
      .filter(f => !q || f.name?.toLowerCase().includes(q) || f.category?.toLowerCase().includes(q) || f.description?.toLowerCase().includes(q))
      .sort((a, b) => {
        const cmp = String(a[sortCol] ?? "").localeCompare(String(b[sortCol] ?? ""));
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [search, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageItems  = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const searchCls = dark
    ? "pl-9 pr-3 py-1.5 text-sm border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 w-48"
    : "pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2744]/30 w-48";
  const card      = dark ? "bg-gray-800 border-gray-700"  : "bg-white border-gray-200";
  const cardHdr   = dark ? "border-gray-700"               : "border-gray-200";
  const titleCls  = dark ? "text-gray-100"                 : "text-gray-900";
  const subText   = dark ? "text-gray-400"                 : "text-gray-500";
  const thead     = dark ? "bg-gray-700/60"                : "bg-gray-50";
  const thText    = dark ? "text-gray-400"                 : "text-gray-500";
  const thHover   = dark ? "hover:bg-gray-700"             : "hover:bg-gray-100";
  const tbody     = dark ? "bg-gray-800 divide-gray-700"   : "bg-white divide-gray-100";
  const rowHover  = dark ? "hover:bg-gray-700/50"          : "hover:bg-gray-50";
  const cellText  = dark ? "text-gray-300"                 : "text-gray-600";
  const cellMuted = dark ? "text-gray-500"                 : "text-gray-500";
  const divider   = dark ? "divide-gray-700"               : "divide-gray-200";
  const pageBtn   = dark
    ? "px-3 py-1.5 rounded-lg border border-gray-600 text-xs font-medium hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300"
    : "px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed";
  const pageNum   = (isActive) => isActive
    ? "w-8 h-8 rounded-lg text-xs font-medium bg-[#0f2744] text-white"
    : `w-8 h-8 rounded-lg text-xs font-medium transition-colors ${dark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-600"}`;

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
    <div className={`min-h-full rounded-xl p-4 transition-colors duration-200 ${dark ? "bg-gray-900" : "bg-gray-100"}`}>
      <h2 className={`text-xl font-bold mb-5 ${titleCls}`}>Facilities</h2>

      <div className={`rounded-2xl shadow-sm border overflow-hidden ${card}`}>

        {/* Header */}
        <div className={`px-6 py-4 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${cardHdr}`}>
          <div className="flex items-center gap-2">
            <span className={`text-base font-semibold ${titleCls}`}>Facility List</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${
              dark ? "bg-blue-900/40 text-blue-400 ring-blue-700" : "bg-[#0f2744]/10 text-[#0f2744] ring-[#0f2744]/20"
            }`}>
              {sorted.length} facilities
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <MdSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg ${dark ? "text-gray-400" : "text-gray-400"}`} />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search…" className={searchCls} />
            </div>
            {/* Add Button */}
            <Button onClick={() => {}}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#0f2744] text-white hover:bg-[#1a3a5c] transition-colors">
              <MdAdd size={16} /> Add Facility
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${divider}`}>
            <thead className={thead}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-12 ${thText}`}>No</th>
                <HeadCell col="name"        label="Facility Name" />
                <HeadCell col="category"    label="Category" />
                <HeadCell col="description" label="Description" />
                <HeadCell col="active"      label="Status" />
                <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${thText}`}>Action</th>
              </tr>
            </thead>
            <tbody className={`${tbody} divide-y`}>
              {pageItems.length === 0 ? (
                <tr><td colSpan={6} className={`py-16 text-center text-sm ${subText}`}>No facilities found</td></tr>
              ) : pageItems.map((f, idx) => (
                <tr key={`${f.id}-${idx}`} className={`transition-colors ${rowHover}`}>
                  <td className={`px-4 py-4 text-sm font-medium ${cellMuted}`}>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={f.imageSrc} alt={f.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      <span className={`text-sm font-medium ${titleCls}`}>{f.name}</span>
                    </div>
                  </td>
                  <td className={`px-6 py-4 text-sm ${cellText}`}>{f.category}</td>
                  <td className={`px-6 py-4 text-sm ${cellText} max-w-xs truncate`}>{f.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><BadgeWithDot active={f.active} dark={dark} /></td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        dark ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}><IoEyeOutline size={14} /> View</Button>
                      <Button className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        dark ? "bg-blue-900/40 text-blue-400 hover:bg-blue-900/70" : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                      }`}><MdEdit size={14} /> Edit</Button>
                      <Button className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        dark ? "bg-red-900/40 text-red-400 hover:bg-red-900/70" : "bg-red-50 text-red-600 hover:bg-red-100"
                      }`}><MdDelete size={14} /> Delete</Button>
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
            <Button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={pageBtn}>Next</Button>
          </div>
        </div>

      </div>
    </div>
  );
}
