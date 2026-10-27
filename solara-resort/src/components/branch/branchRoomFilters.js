/** Align with dashboard `filterRoomTypesByBranch` (Room.jsx / roomHelpers.js). */
export function roomTypeBranchId(type) {
  if (!type) return null;
  const raw = type.branch_id ?? type.branch?.id;
  if (raw == null || raw === '') return null;
  return raw;
}

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

export function roomCatalogTypeId(room) {
  if (!room) return null;
  const id = room.roomTypeId ?? room.raw?.room_type_id ?? room.raw?.room_type?.id;
  const num = Number(id);
  return num > 0 ? num : null;
}

/**
 * Build quick-book filter options: "all" + room types from catalog that exist on this branch's rooms.
 * @returns {{ value: string, label: string }[]}
 */
export function getBranchRoomTypeFilterOptions(
  rooms = [],
  catalogRoomTypes = [],
  { branchId, resortId } = {}
) {
  const allOption = { value: 'all', label: '' };

  const idsInRooms = new Set();
  rooms.forEach((room) => {
    const id = roomCatalogTypeId(room);
    if (id) idsInRooms.add(String(id));
  });

  const scopedTypes = filterRoomTypesByBranch(catalogRoomTypes, resortId, branchId);

  const options = scopedTypes
    .filter((t) => t?.id != null && idsInRooms.has(String(t.id)))
    .map((t) => ({
      value: String(t.id),
      label: String(t.name || 'Room').trim(),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  if (!options.length && idsInRooms.size) {
    const byId = new Map();
    rooms.forEach((room) => {
      const id = roomCatalogTypeId(room);
      if (!id || byId.has(String(id))) return;
      byId.set(String(id), {
        value: String(id),
        label: String(room.type || 'Room').trim(),
      });
    });
    options.push(...Array.from(byId.values()).sort((a, b) => a.label.localeCompare(b.label)));
  }

  return [allOption, ...options];
}

export function filterBranchRoomsByType(rooms = [], roomTypeFilter = 'all') {
  if (!roomTypeFilter || roomTypeFilter === 'all') return rooms;

  const typeId = Number(roomTypeFilter);
  if (Number.isFinite(typeId) && typeId > 0) {
    return rooms.filter((room) => roomCatalogTypeId(room) === typeId);
  }

  const legacy = String(roomTypeFilter).toLowerCase();
  return rooms.filter((room) => {
    const typeName = String(room.type || '').toLowerCase();
    if (legacy === 'pool_villa') {
      return typeName.includes('pool') && typeName.includes('villa');
    }
    if (legacy === 'villa') {
      return typeName.includes('villa') && !typeName.includes('pool');
    }
    if (legacy === 'suite') {
      return typeName.includes('suite');
    }
    return true;
  });
}

export function filterBranchRoomsByGuests(rooms = [], adults = 2, children = 0) {
  const totalGuests = Number(adults) + Number(children);
  if (!totalGuests) return rooms;
  return rooms.filter((room) => {
    const capacity = room.capacity || {};
    const maxGuests =
      Number(capacity.adults ?? 0) + Number(capacity.children ?? 0) || Number(capacity.adults ?? 2);
    return maxGuests >= totalGuests;
  });
}
