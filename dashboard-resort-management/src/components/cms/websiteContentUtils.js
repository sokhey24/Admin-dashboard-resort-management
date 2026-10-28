/** Parse JSON array stored in website_contents.value */
export function parseCmsList(grouped, section, key = "items") {
  const raw = grouped?.[section]?.[key]?.value;
  if (!raw || typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getCmsValue(grouped, section, key) {
  const v = grouped?.[section]?.[key]?.value;
  return v == null ? "" : String(v);
}

export function getCmsRow(grouped, section, key) {
  return grouped?.[section]?.[key] ?? null;
}

export function slugifyId(text) {
  return String(text || "item")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function makeUniqueId(base, existingIds, currentId) {
  if (currentId && !existingIds.has(currentId)) return currentId;
  let id = base || "item";
  let n = 2;
  while (existingIds.has(id)) {
    id = `${base}-${n++}`;
  }
  return id;
}

/** Lines ↔ string array for features lists */
export function linesToArray(text) {
  return String(text || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function arrayToLines(arr) {
  return Array.isArray(arr) ? arr.join("\n") : "";
}
