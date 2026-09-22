import { PriceWithDiscount } from "../Room/RoomPrice";

const FACILITY_ICONS = {
  pool: "🏊",
  wifi: "📶",
  restaurant: "🍽",
  parking: "🅿",
  spa: "💆",
  gym: "🏋",
  transfer: "🚌",
  breakfast: "☕",
  beach: "🏖",
  bar: "🍸",
};

function ratingWord(score) {
  if (score >= 4.7) return "Exceptional";
  if (score >= 4.4) return "Excellent";
  if (score >= 4.0) return "Very good";
  if (score >= 3.5) return "Good";
  return "Pleasant";
}

function facilityLabel(name) {
  const key = String(name || "").toLowerCase();
  const hit = Object.entries(FACILITY_ICONS).find(([id]) => key.includes(id.replace(/-/g, " ")) || key.includes(id));
  return { icon: hit ? hit[1] : "✓", name: name || "Facility" };
}

/**
 * Live preview of the guest-site resort search card (resorts.js layout).
 */
export default function ResortCatalogPreview({ form, resort, facilities, dark }) {
  const stars = Math.min(5, Math.max(1, Number(form.stars) || 4));
  const rating = Number(resort?.rating) > 0 ? Number(resort.rating) : 4.5;
  const reviewCount = Number(resort?.review_count) || 0;
  const roomTypes = Number(resort?.room_type_count) || Number(resort?.rooms_count) || 0;
  const price = Number(resort?.price_from) || 0;
  const priceOriginal = Number(resort?.price_from_original || price);
  const discount = Number(resort?.price_from_discount_percent || 0);

  const imageSrc =
    form.coverPreview ||
    resort?.cover_image_url ||
    resort?.logo_url ||
    "https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=800&q=80";

  const border = dark ? "border-gray-600" : "border-[#D9E2EC]";
  const muted = dark ? "text-gray-400" : "text-[#829AB1]";
  const text = dark ? "text-gray-100" : "text-[#102A43]";

  const chips = (facilities || []).slice(0, 5);

  return (
    <div className={`rounded-xl border overflow-hidden ${border} ${dark ? "bg-gray-900/40" : "bg-white"}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide px-3 py-2 border-b ${border} ${muted}`}>
        Guest site preview
      </p>
      <article className="flex flex-col sm:flex-row">
        <div className="relative sm:w-56 shrink-0 aspect-[4/3] sm:aspect-auto sm:min-h-[220px]">
          <img src={imageSrc} alt="" className="absolute inset-0 w-full h-full object-cover" />
          {form.promo_tag ? (
            <span className="absolute top-2 left-2 bg-amber-400 text-[#102A43] text-[10px] font-bold px-2 py-1 rounded-md max-w-[90%] leading-tight">
              {form.promo_tag}
            </span>
          ) : null}
          {form.resort_type ? (
            <span className="absolute bottom-2 left-2 bg-black/55 text-white text-[10px] font-medium px-2 py-0.5 rounded">
              {form.resort_type}
            </span>
          ) : null}
        </div>
        <div className="flex-1 p-3 min-w-0">
          <div className="flex justify-between gap-2 items-start">
            <div className="min-w-0">
              <h4 className={`text-sm font-bold truncate ${text}`}>
                {form.name || "Resort name"}{" "}
                <span className="text-amber-400 text-xs" aria-hidden="true">
                  {"★".repeat(stars)}
                </span>
              </h4>
              <p className={`text-xs mt-0.5 ${muted}`}>
                📍 {[form.city, form.country].filter(Boolean).join(", ") || "City, Country"}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className={`text-[10px] ${muted}`}>{ratingWord(rating)}</span>
              <span className="bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                {rating.toFixed(1)}
              </span>
            </div>
          </div>
          <p className={`text-xs mt-2 line-clamp-2 ${muted}`}>
            {form.description || "Short resort description shown on search results."}
          </p>
          <div className="flex flex-wrap gap-1 mt-2">
            {chips.length ? chips.map((f) => {
              const { icon, name } = facilityLabel(f.name);
              return (
                <span
                  key={f.id ?? f.name}
                  className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border ${border} ${text}`}
                >
                  <span aria-hidden="true">{icon}</span> {name}
                </span>
              );
            }) : (
              <span className={`text-[10px] ${muted}`}>Select facilities below</span>
            )}
          </div>
          <p className={`text-[10px] mt-2 flex flex-wrap gap-x-3 gap-y-1 ${muted}`}>
            <span>🚪 {roomTypes || "—"} room types</span>
            {form.free_cancellation ? <span className="text-green-600">✓ Free cancellation</span> : null}
            {form.breakfast_options ? <span className="text-green-600">☕ Breakfast options</span> : null}
          </p>
          <div className={`mt-3 pt-2 border-t flex items-end justify-between gap-2 ${border}`}>
            <div>
              <span className={`text-[10px] block ${muted}`}>From</span>
              {price > 0 ? (
                <PriceWithDiscount
                  price={priceOriginal}
                  percent={discount}
                  dark={dark}
                  suffix=" / night"
                />
              ) : (
                <span className={`text-sm font-semibold ${muted}`}>—</span>
              )}
              <span className={`text-[10px] ${muted}`}>+ taxes &amp; fees</span>
            </div>
            <div className="flex gap-1 shrink-0">
              <span className={`text-[10px] px-2 py-1 rounded border ${border}`}>View Rooms</span>
              <span className="text-[10px] px-2 py-1 rounded bg-blue-600 text-white">Book Now</span>
            </div>
          </div>
          {reviewCount > 0 ? (
            <p className={`text-[10px] mt-1 ${muted}`}>{reviewCount} approved reviews</p>
          ) : null}
        </div>
      </article>
    </div>
  );
}
