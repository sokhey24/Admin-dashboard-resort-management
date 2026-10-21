export function normalizeRoomIds(draft) {
  if (!draft) return [];
  const fromArray = Array.isArray(draft.roomIds)
    ? draft.roomIds.map((id) => Number(id)).filter((id) => id > 0)
    : [];
  if (fromArray.length) return [...new Set(fromArray)];
  if (draft.roomId) {
    const id = Number(draft.roomId);
    return id > 0 ? [id] : [];
  }
  return [];
}

/** Stable primitive for React effect deps (sorted unique ids, e.g. "3,7"). */
export function roomIdsSortKey(draft) {
  const ids = normalizeRoomIds(draft);
  return ids.slice().sort((a, b) => a - b).join(',');
}

export function roomIdsFromSortKey(key) {
  if (!key || typeof key !== 'string') return [];
  return key
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((id) => id > 0);
}

export function syncDraftRoomFields(draft) {
  const roomIds = normalizeRoomIds(draft);
  return {
    ...draft,
    roomIds,
    roomId: roomIds[0] ?? null,
    roomsCount: roomIds.length || 1,
  };
}
