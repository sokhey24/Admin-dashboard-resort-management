import config from "../../util/config";
import { asList as asListUtil } from "../../util/asList";
import { BRAND, STATUS_COLORS } from "../../theme/brandTokens";

export const ROOM_STATUSES = ["available", "occupied", "reserved", "maintenance"];

export const STATUS_STYLE = {
  available: {
    dot: "bg-status-available",
    light: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dark: "bg-emerald-900/40 text-emerald-400 ring-emerald-700",
  },
  occupied: {
    dot: "bg-status-occupied",
    light: "bg-red-50 text-red-700 ring-red-200",
    dark: "bg-red-900/40 text-red-400 ring-red-700",
  },
  reserved: {
    dot: "bg-status-reserved",
    light: "bg-blue-50 text-blue-700 ring-blue-200",
    dark: "bg-blue-900/40 text-blue-400 ring-blue-700",
  },
  maintenance: {
    dot: "bg-status-maintenance",
    light: "bg-amber-50 text-amber-700 ring-amber-200",
    dark: "bg-amber-900/40 text-amber-400 ring-amber-700",
  },
};

/** For charts / inline styles */
export { STATUS_COLORS, BRAND };

export const TYPE_STATUSES = ["active", "inactive"];
export const TYPE_STATUS_STYLE = {
  active: { dot: "bg-status-available", light: "bg-emerald-50 text-emerald-700 ring-emerald-200", dark: "bg-emerald-900/40 text-emerald-400 ring-emerald-700" },
  inactive: { dot: "bg-gray-400", light: "bg-gray-100 text-gray-600 ring-gray-200", dark: "bg-gray-700 text-gray-300 ring-gray-600" },
};

export const MAX_DISCOUNT_PERCENT = 100;

// ── Page shell (Room module) ─────────────────────────────────────────────

export function roomPageTitleClass(dark) {
  return dark ? "text-gray-100" : "text-brand-navy";
}

export function roomPageSubTextClass(dark) {
  return dark ? "text-gray-400" : "text-slate-500";
}

export function roomCardClass(dark) {
  return dark
    ? "bg-brand-card-dark border-brand-border-dark"
    : "bg-brand-card-light border-brand-border-light";
}

export function roomCardHoverClass(dark) {
  return `${roomCardClass(dark)} ${dark ? "hover:bg-gray-700/40" : "hover:bg-brand-surface-light"}`;
}

export function roomCardHeaderBorderClass(dark) {
  return dark ? "border-brand-border-dark" : "border-brand-border-light";
}

export function roomTableHeaderTextClass(dark) {
  return dark ? "text-gray-400" : "text-slate-500";
}

export function roomCellMutedClass() {
  return "text-slate-500";
}

export function roomMutedSurfaceClass(dark) {
  return dark ? "bg-gray-700 text-gray-400" : "bg-brand-surface-light text-slate-500";
}

export function roomStickyBarClass(dark) {
  return dark
    ? "bg-gray-900/95 border-brand-border-dark backdrop-blur-sm"
    : "bg-brand-surface-light/95 border-brand-border-light backdrop-blur-sm";
}

export function roomDividerClass(dark) {
  return dark ? "border-brand-border-dark" : "border-brand-border-light";
}

export function roomCountBadgeClass(dark) {
  return dark
    ? "bg-blue-900/40 text-blue-400 ring-1 ring-blue-700"
    : "bg-blue-50 text-brand-navy ring-1 ring-blue-200";
}

export function roomPageShellClass(dark) {
  return `min-h-full rounded-xl p-4 transition-colors duration-200 ${dark ? "bg-brand-surface-dark" : "bg-brand-surface-light"}`;
}

export function roomTableHeadClass(dark) {
  return dark ? "bg-gray-700/60" : "bg-brand-surface-light";
}

export function roomTableBodyClass(dark) {
  return dark ? "bg-brand-card-dark divide-brand-border-dark" : "bg-brand-card-light divide-gray-100";
}

export function roomRowHoverClass(dark) {
  return dark ? "hover:bg-gray-700/50" : "hover:bg-brand-surface-light";
}

export function roomCellTextClass(dark) {
  return dark ? "text-gray-300" : "text-slate-600";
}

export function roomStatusSearchClass(dark) {
  const focus = "focus:outline-none focus:ring-2 focus:ring-brand-accent/30";
  return dark
    ? `pl-9 pr-3 py-1.5 text-sm border border-brand-border-dark bg-gray-700 text-gray-100 placeholder:text-slate-500 rounded-brand ${focus} w-48`
    : `pl-9 pr-3 py-1.5 text-sm border border-brand-border-light rounded-brand ${focus} w-48`;
}

export function roomPaginationNavBtnClass(dark) {
  return dark
    ? "px-3 py-1.5 rounded-brand border border-brand-border-dark text-xs font-semibold hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300"
    : "px-3 py-1.5 rounded-brand border border-brand-border-light text-xs font-semibold hover:bg-brand-surface-light disabled:opacity-40 disabled:cursor-not-allowed";
}

export function roomPriceAccentClass() {
  return "text-brand-accent font-semibold";
}

export function roomPrimaryChipClass() {
  return "bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded";
}

export function roomDiscountChipClass() {
  return "px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-brand-accent whitespace-nowrap";
}

export function roomPaginationPageClass(dark, active) {
  if (active) return "bg-blue-600 text-white";
  return dark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-brand-surface-light text-slate-600";
}

export function roomPaginationNavClass(dark) {
  return dark
    ? "px-3 py-1.5 rounded-brand border border-brand-border-dark text-xs font-semibold hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
    : "px-3 py-1.5 rounded-brand border border-brand-border-light text-xs font-semibold hover:bg-brand-surface-light disabled:opacity-40 disabled:cursor-not-allowed";
}

// Preview-only helpers. Laravel recalculates every figure on quote and on save,
// so these exist purely so the form can show the effect while it is being typed.
export function clampPercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(MAX_DISCOUNT_PERCENT, Math.max(0, n));
}

/** A room's own percentage, or its room type's when the room has no override. */
export function effectiveDiscountPercent(room) {
  const own = room?.discount_percent;
  if (own !== null && own !== undefined && own !== "") return clampPercent(own);
  return clampPercent(room?.room_type?.discount_percent ?? 0);
}

export function discountedPrice(price, percent) {
  const base = Number(price) || 0;
  const pct = clampPercent(percent);
  return Math.round((base - (base * pct) / 100) * 100) / 100;
}

export function formatPercent(value) {
  const n = clampPercent(value);
  return String(Number(n.toFixed(2)));
}

export function formatMoney(value) {
  return `$${(Number(value) || 0).toFixed(2)}`;
}

export const ROOM_IMAGE_MAX_KB = 2048;
export const ROOM_IMAGE_ACCEPT = "image/jpeg,image/png,image/gif,image/webp,image/bmp";

export function imageUrl(path) {
  if (!path) return null;
  const str = String(path);
  if (/^https?:\/\//i.test(str)) {
    const storageTail = str.match(/\/storage\/(.+)$/i);
    if (storageTail) {
      const base = config.image_path.replace(/\/+$/, "");
      return `${base}/${storageTail[1]}`;
    }
    return str;
  }
  return `${config.image_path}${str.replace(/^\/+/, "")}`;
}

export function roomImageSrc(image) {
  if (!image) return null;
  return imageUrl(image.image_path || image.path || image.url);
}

export function primaryRoomImage(room) {
  const images = Array.isArray(room?.images) ? room.images : [];
  return images.find((img) => img.is_primary) || images[0] || null;
}

export function validateRoomImageFile(file) {
  if (!file) return "Select an image file.";
  const type = String(file.type || "").toLowerCase();
  if (type && !type.startsWith("image/")) {
    return "File must be an image.";
  }
  if (file.size > ROOM_IMAGE_MAX_KB * 1024) {
    return `Image must be ${ROOM_IMAGE_MAX_KB / 1024} MB or smaller.`;
  }
  return null;
}

export function asList(res) {
  return asListUtil(res);
}

/** Room type branch from API row (top-level or nested relation). */
export function roomTypeBranchId(type) {
  if (!type) return null;
  const raw = type.branch_id ?? type.branch?.id;
  if (raw == null || raw === "") return null;
  return raw;
}

/** Room types available for a resort + branch (exact branch or resort-wide with no branch). */
export function filterRoomTypesByBranch(types, resortId, branchId) {
  const list = Array.isArray(types) ? types : [];
  let scoped = list;
  if (resortId) {
    scoped = scoped.filter((t) => String(t.resort_id) === String(resortId));
  }
  if (!branchId) return scoped;
  const bid = String(branchId);
  return scoped.filter((t) => {
    const tb = roomTypeBranchId(t);
    return tb == null || String(tb) === bid;
  });
}

export function paginationFrom(res) {
  const meta = res?.meta ?? res;
  return {
    current: Number(meta?.current_page) || 1,
    last: Number(meta?.last_page) || 1,
    perPage: Number(meta?.per_page) || 10,
    total: Number(meta?.total) || 0,
    from: Number(meta?.from) || 0,
    to: Number(meta?.to) || 0,
  };
}

export function roomFeatures(room) {
  const type = room?.room_type ?? {};
  const fromType = roomTypeAmenities(type, room?.resort?.facilities ?? []);
  const fromRoom = [room?.view].filter(Boolean);
  return [...new Set([...fromRoom, ...fromType])];
}

export const GUEST_AMENITY_PRESETS = [
  "Garden view",
  "Ocean view",
  "Lagoon view",
  "Wi-Fi",
  "Air conditioning",
  "Mini bar",
  "Balcony",
  "Bathtub",
  "Outdoor shower",
  "Lagoon deck",
  "Terrace",
  "Work desk",
  "Rainfall shower",
];

export function roomTypeAmenities(type, facilities = []) {
  const stored = Array.isArray(type?.amenities) ? type.amenities.filter(Boolean) : [];
  if (stored.length) return [...new Set(stored)];
  const names = [];
  const resortId = type?.resort_id ?? type?.resort?.id;
  facilities
    .filter((f) => !resortId || String(f.resort_id) === String(resortId))
    .forEach((f) => { if (f.name) names.push(f.name); });
  return [...new Set(names)];
}

export function roomActionClass(dark) {
  return `inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors !border-0 !shadow-none h-auto px-4 py-2 ${
    dark ? "!bg-blue-900/40 !text-blue-400 hover:!bg-blue-900/70" : "!bg-blue-50 !text-brand-accent hover:!bg-blue-100"
  }`;
}

export function roomPrimaryBtnClass() {
  return "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-brand !bg-blue-600 !border-blue-600 !text-white hover:!bg-blue-700 hover:!border-blue-700 h-auto";
}

export function roomModalOkClass() {
  return "!bg-blue-600 !border-blue-600 hover:!bg-blue-700 hover:!border-blue-700 rounded-brand font-medium";
}

export function roomModalCancelClass(dark) {
  return dark
    ? "rounded-lg !border-brand-border-dark !text-gray-300 hover:!bg-gray-700"
    : "rounded-lg !border-brand-border-light !text-slate-600 hover:!bg-brand-surface-light";
}

export function roomSearchClass(dark) {
  const focus = "focus:outline-none focus:ring-2 focus:ring-brand-accent/30";
  return dark
    ? `pl-9 pr-3 py-1.5 w-full min-w-[200px] text-sm border border-brand-border-dark bg-gray-700 text-gray-100 placeholder:text-slate-500 rounded-brand ${focus}`
    : `pl-9 pr-3 py-1.5 w-full min-w-[200px] text-sm border border-brand-border-light bg-brand-card-light text-brand-navy placeholder:text-slate-500 rounded-brand ${focus}`;
}

export function applyFormErrors(form, errors) {
  if (!errors || !form) return;
  const fields = Object.keys(errors)
    .filter((k) => k !== "message" && errors[k]?.help)
    .map((k) => ({ name: k, errors: [errors[k].help] }));
  if (fields.length) form.setFields(fields);
}
