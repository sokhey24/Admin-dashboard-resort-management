import config from "../../util/config";

export const ROOM_STATUSES = ["available", "occupied", "reserved", "maintenance"];

export const STATUS_STYLE = {
  available:   { dot: "bg-green-500",  light: "bg-green-50 text-green-700 ring-green-200",    dark: "bg-green-900/40 text-green-400 ring-green-700"   },
  occupied:    { dot: "bg-red-500",    light: "bg-red-50 text-red-700 ring-red-200",            dark: "bg-red-900/40 text-red-400 ring-red-700"         },
  reserved:    { dot: "bg-blue-500",   light: "bg-blue-50 text-blue-700 ring-blue-200",          dark: "bg-blue-900/40 text-blue-400 ring-blue-700"       },
  maintenance: { dot: "bg-yellow-500", light: "bg-yellow-50 text-yellow-700 ring-yellow-200",  dark: "bg-yellow-900/40 text-yellow-400 ring-yellow-700" },
};

export const TYPE_STATUSES = ["active", "inactive"];
export const TYPE_STATUS_STYLE = {
  active:   { dot: "bg-green-500", light: "bg-green-50 text-green-700 ring-green-200", dark: "bg-green-900/40 text-green-400 ring-green-700" },
  inactive: { dot: "bg-gray-400",  light: "bg-gray-100 text-gray-600 ring-gray-200",   dark: "bg-gray-700 text-gray-300 ring-gray-600" },
};

export const ROOM_IMAGE_MAX_KB = 2048;
export const ROOM_IMAGE_ACCEPT = "image/jpeg,image/png,image/gif,image/webp,image/bmp";

export function imageUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${config.image_path}${String(path).replace(/^\/+/, "")}`;
}

export function roomImageSrc(image) {
  if (!image) return null;
  return imageUrl(image.url || image.image_path || image.path);
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
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
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
  const fromType = [room?.room_type?.bed_type, room?.view].filter(Boolean);
  const fromResort = Array.isArray(room?.resort?.facilities)
    ? room.resort.facilities.map((f) => f.name).filter(Boolean)
    : [];
  return [...new Set([...fromType, ...fromResort])];
}

export function roomTypeAmenities(type, facilities = []) {
  const names = [];
  if (type?.bed_type) names.push(type.bed_type);
  const resortId = type?.resort_id ?? type?.resort?.id;
  facilities
    .filter((f) => !resortId || String(f.resort_id) === String(resortId))
    .forEach((f) => { if (f.name) names.push(f.name); });
  return [...new Set(names)];
}

export function roomActionClass(dark) {
  return `inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors !border-0 !shadow-none h-auto px-4 py-2 ${
    dark ? "!bg-blue-900/40 !text-blue-400 hover:!bg-blue-900/70" : "!bg-[#FFF3E8] !text-[#FF6B00] hover:!bg-orange-100"
  }`;
}

export function roomPrimaryBtnClass() {
  return "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[8px] !bg-[#FF6B00] !border-[#FF6B00] !text-white hover:!bg-[#e05e00] hover:!border-[#e05e00] h-auto";
}

export function roomModalOkClass() {
  return "!bg-[#FF6B00] !border-[#FF6B00] hover:!bg-[#e05e00] hover:!border-[#e05e00] rounded-[8px] font-medium";
}

export function roomModalCancelClass(dark) {
  return dark
    ? "rounded-lg !border-gray-600 !text-gray-300 hover:!bg-gray-700"
    : "rounded-lg !border-[#D9E2EC] !text-[#486581] hover:!bg-[#F5F8FC]";
}

export function roomSearchClass(dark) {
  return dark
    ? "pl-9 pr-3 py-1.5 w-full min-w-[200px] text-sm border border-gray-600 bg-gray-700 text-gray-100 placeholder-[#829AB1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30"
    : "pl-9 pr-3 py-1.5 w-full min-w-[200px] text-sm border border-[#D9E2EC] bg-white text-[#102A43] placeholder-[#829AB1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30";
}

export function applyFormErrors(form, errors) {
  if (!errors || !form) return;
  const fields = Object.keys(errors)
    .filter((k) => k !== "message" && errors[k]?.help)
    .map((k) => ({ name: k, errors: [errors[k].help] }));
  if (fields.length) form.setFields(fields);
}
