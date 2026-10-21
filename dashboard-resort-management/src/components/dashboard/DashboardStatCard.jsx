/** Shared KPI card used on admin dashboard tabs. */
export default function DashboardStatCard({ title, value, icon, color, dark, loading, trend, trendUp }) {
  return (
    <div
      className={`rounded-xl border p-4 transition-shadow hover:shadow-md ${
        dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/80 shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span
          className={`text-xs font-semibold uppercase tracking-wide leading-relaxed ${
            dark ? "text-slate-400" : "text-slate-500"
          }`}
        >
          {title}
        </span>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg ${
            dark ? "bg-slate-800" : "bg-slate-50"
          }`}
          style={{ color }}
        >
          {icon}
        </span>
      </div>
      {loading ? (
        <div className={`h-8 w-24 rounded-lg animate-pulse ${dark ? "bg-slate-800" : "bg-slate-100"}`} />
      ) : (
        <div className="flex items-end justify-between gap-2">
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{value}</div>
          {trend != null && (
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                trendUp
                  ? dark ? "bg-emerald-900/40 text-emerald-400" : "bg-emerald-100 text-emerald-700"
                  : dark ? "bg-red-900/40 text-red-400" : "bg-red-100 text-red-700"
              }`}
            >
              {trendUp ? "▲" : "▼"} {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
