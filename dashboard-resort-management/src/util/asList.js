/** Normalize Laravel paginated or wrapped API responses to an array. */
export function asList(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}
