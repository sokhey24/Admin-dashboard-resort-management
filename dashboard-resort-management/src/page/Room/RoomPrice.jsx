import { clampPercent, discountedPrice, formatMoney, formatPercent } from "./roomHelpers";

/**
 * Presentational only. Kept in its own module so both RoomFeature and
 * RoomStatus can use it without an import cycle between them.
 */
export function PriceWithDiscount({ price, percent, dark, className = "", suffix = "" }) {
  const pct = clampPercent(percent);
  const net = discountedPrice(price, pct);
  const muted = dark ? "text-gray-500" : "text-[#829AB1]";

  if (pct <= 0) {
    return <span className={className}>{formatMoney(price)}{suffix}</span>;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 flex-wrap ${className}`}>
      <span className={`line-through font-normal ${muted}`}>{formatMoney(price)}</span>
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FFF3E8] text-[#FF6B00] whitespace-nowrap">
        {formatPercent(pct)}% OFF
      </span>
      <span>{formatMoney(net)}{suffix}</span>
    </span>
  );
}

/**
 * Live preview under a discount input. Labelled as a preview because the API
 * recalculates every booking figure server-side.
 */
export function DiscountPreview({ price, percent, dark, label = "Discounted price" }) {
  const pct = clampPercent(percent);
  const net = discountedPrice(price, pct);
  const box = dark ? "bg-gray-700/50 border-gray-600" : "bg-[#F5F8FC] border-[#D9E2EC]";
  const muted = dark ? "text-gray-400" : "text-[#829AB1]";
  const body = dark ? "text-gray-100" : "text-[#102A43]";

  return (
    <div className={`rounded-lg border px-3 py-2 ${box}`}>
      <div className="flex items-center justify-between text-xs">
        <span className={muted}>Price</span>
        <span className={body}>{formatMoney(price)}</span>
      </div>
      <div className="flex items-center justify-between text-xs mt-1">
        <span className={muted}>Discount</span>
        <span className={body}>{formatPercent(pct)}%</span>
      </div>
      <div className={`flex items-center justify-between text-sm mt-1.5 pt-1.5 border-t font-semibold ${dark ? "border-gray-600" : "border-[#D9E2EC]"}`}>
        <span className={body}>{label}</span>
        <span className="text-[#FF6B00]">{formatMoney(net)}</span>
      </div>
      <p className={`text-[10px] mt-1.5 ${muted}`}>Preview only — the API recalculates every booking total.</p>
    </div>
  );
}
