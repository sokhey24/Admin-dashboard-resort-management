import { Tooltip } from "antd";
import { FaMoneyBillWave } from "react-icons/fa";
import { buildComparisonTooltip, comparisonAriaLabel } from "../../util/revenueComparison";

function formatRevenueAmount(value) {
  return `$${Number(value ?? 0).toLocaleString("en-US")}`;
}

const toneClasses = (tone, dark) => {
  if (tone === "positive") {
    return dark ? "text-emerald-400" : "text-emerald-700";
  }
  if (tone === "negative") {
    return dark ? "text-red-400" : "text-red-600";
  }
  return dark ? "text-slate-400" : "text-slate-500";
};

export default function RevenueStatCard({
  title = "Total Revenue",
  revenue,
  loading,
  dark,
  icon = <FaMoneyBillWave />,
  color = "#52c41a",
  comparison,
  comparisonLoading,
  comparisonError,
  periodLabel,
  canCompare,
}) {
  const showValue = loading ? null : formatRevenueAmount(revenue);

  const tooltipTitle =
    comparison && periodLabel
      ? buildComparisonTooltip(comparison, periodLabel)
      : undefined;

  const aria = comparisonAriaLabel(comparison, periodLabel);

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
        <div className="space-y-2">
          <div className={`h-8 w-28 rounded-lg animate-pulse ${dark ? "bg-slate-800" : "bg-slate-100"}`} />
          <div className={`h-4 w-36 rounded animate-pulse ${dark ? "bg-slate-800" : "bg-slate-100"}`} />
        </div>
      ) : (
        <>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {showValue}
          </div>
          <div className="mt-2 min-h-[1.25rem]">
            {comparisonLoading ? (
              <div className={`h-4 w-40 rounded animate-pulse ${dark ? "bg-slate-800" : "bg-slate-100"}`} />
            ) : comparisonError ? (
              <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
                Comparison unavailable
              </p>
            ) : !canCompare ? (
              <p className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>
                Select day, month, or year to compare
              </p>
            ) : comparison ? (
              <Tooltip title={tooltipTitle} placement="bottom">
                <p
                  className={`text-xs font-medium flex flex-wrap items-center gap-x-1.5 gap-y-0.5 ${toneClasses(comparison.tone, dark)}`}
                  aria-label={aria}
                >
                  <span className="tabular-nums">{comparison.displayHeadline}</span>
                  <span className={dark ? "text-slate-500" : "text-slate-400"}>{periodLabel}</span>
                </p>
              </Tooltip>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
