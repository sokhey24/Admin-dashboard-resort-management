import { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 8;

/**
 * Filterable paginated audit-log activity list for the admin overview.
 */
export default function RecentActivityFeed({ activities = [], dark }) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState(null);
  const [page, setPage] = useState(1);

  const actionOptions = useMemo(() => {
    const unique = [...new Set(activities.map((a) => a.action).filter(Boolean))];
    return unique.map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }));
  }, [activities]);

  const filtered = useMemo(() => {
    let list = activities;
    if (actionFilter) list = list.filter((a) => a.action === actionFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.user?.toLowerCase().includes(q) ||
          a.action?.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q) ||
          a.model_type?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activities, search, actionFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, actionFilter]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const actionBadge = (action) => {
    if (action === "created") return dark ? "bg-green-900/40 text-green-400" : "bg-green-100 text-green-700";
    if (action === "deleted") return dark ? "bg-red-900/40 text-red-400" : "bg-red-100 text-red-700";
    if (action === "updated") return dark ? "bg-blue-900/40 text-blue-400" : "bg-blue-100 text-blue-700";
    return dark ? "bg-gray-700 text-gray-300" : "bg-[#F5F8FC] text-[#486581]";
  };

  const moduleIcon = (model_type) => {
    const m = model_type?.toLowerCase() ?? "";
    if (m.includes("booking")) return { icon: "🏨", bg: dark ? "bg-blue-900/40" : "bg-blue-100" };
    if (m.includes("food") || m.includes("order")) return { icon: "🍽️", bg: dark ? "bg-orange-900/40" : "bg-orange-100" };
    if (m.includes("room")) return { icon: "🛏️", bg: dark ? "bg-purple-900/40" : "bg-purple-100" };
    if (m.includes("user")) return { icon: "👤", bg: dark ? "bg-gray-700" : "bg-[#F5F8FC]" };
    if (m.includes("menu")) return { icon: "📋", bg: dark ? "bg-yellow-900/40" : "bg-yellow-100" };
    return { icon: "🔔", bg: dark ? "bg-gray-700" : "bg-[#F5F8FC]" };
  };

  const card = dark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC]";
  const titleCls = dark ? "text-gray-100" : "text-[#102A43]";
  const subCls = dark ? "text-gray-400" : "text-[#486581]";
  const borderCls = dark ? "border-gray-700" : "border-[#D9E2EC]";

  return (
    <div className={`rounded-xl border shadow-sm overflow-hidden ${card}`}>
      <div className={`px-4 py-3 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${borderCls}`}>
        <div>
          <h3 className={`text-sm font-semibold ${titleCls}`}>Recent activity</h3>
          <p className={`text-xs ${subCls}`}>From system audit log</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className={`text-xs px-3 py-1.5 rounded-lg border min-w-[140px] ${dark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-[#D9E2EC]"}`}
          />
          <select
            value={actionFilter ?? ""}
            onChange={(e) => setActionFilter(e.target.value || null)}
            className={`text-xs px-2 py-1.5 rounded-lg border ${dark ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-[#D9E2EC]"}`}
          >
            <option value="">All actions</option>
            {actionOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className={`py-12 text-center text-sm ${subCls}`}>No activity records for this period.</div>
      ) : (
        <>
          <ul className={`divide-y ${borderCls}`}>
            {paged.map((a) => {
              const mod = moduleIcon(a.model_type);
              return (
                <li key={a.id} className={`px-4 py-3 flex gap-3 ${dark ? "hover:bg-gray-700/40" : "hover:bg-[#F5F8FC]"}`}>
                  <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${mod.bg}`}>{mod.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className={`text-sm font-medium ${titleCls}`}>{a.user ?? "System"}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${actionBadge(a.action)}`}>{a.action}</span>
                    </div>
                    <p className={`text-xs ${subCls} truncate`}>{a.description ?? a.model_type ?? "—"}</p>
                  </div>
                  <time className={`text-[10px] whitespace-nowrap ${subCls}`}>
                    {a.created_at ? new Date(a.created_at).toLocaleString() : "—"}
                  </time>
                </li>
              );
            })}
          </ul>
          {filtered.length > PAGE_SIZE && (
            <div className={`px-4 py-2 flex justify-between items-center text-xs ${subCls} border-t ${borderCls}`}>
              <span>Page {page} of {Math.ceil(filtered.length / PAGE_SIZE)}</span>
              <div className="flex gap-1">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-2 py-1 rounded border disabled:opacity-40">Prev</button>
                <button type="button" disabled={page >= Math.ceil(filtered.length / PAGE_SIZE)} onClick={() => setPage((p) => p + 1)} className="px-2 py-1 rounded border disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
