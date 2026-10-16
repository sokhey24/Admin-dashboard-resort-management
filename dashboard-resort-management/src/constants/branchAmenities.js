/** Quick-pick labels for branch amenities (guest catalog / BranchCard). */
export const BRANCH_AMENITY_PRESETS = [
  'Free WiFi',
  'Breakfast',
  'Swimming Pool',
  'Spa & Wellness',
  'Free Parking',
  'Restaurant',
  'Room Service',
  'Fitness Center',
  'Airport Shuttle',
  'Beach Access',
  'Pet Friendly',
  'Kids Club',
];

export function normalizeAmenityList(list) {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.map((s) => String(s).trim()).filter(Boolean))];
}
