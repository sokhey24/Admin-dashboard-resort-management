/**
 * Shareable guest search state in the URL.
 * Resort list API supports: destination / city / search (not dates or guest counts).
 * Room list API supports: check_in, check_out, resort_id, room_type_id, include_booked.
 */

export function parseSearchCriteria(searchParams) {
  const adultsRaw = searchParams.get('adults');
  const childrenRaw = searchParams.get('children');
  const guestsLegacy = searchParams.get('guests');

  let adults = 2;
  if (adultsRaw) {
    adults = Number(adultsRaw) || 2;
  } else if (guestsLegacy) {
    adults = Number(guestsLegacy) || 2;
  }

  const branchRaw = searchParams.get('branchId') || searchParams.get('branch_id');

  return {
    branchId: branchRaw ? Number(branchRaw) || '' : '',
    destination: searchParams.get('destination') || '',
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
    adults,
    children: childrenRaw ? Number(childrenRaw) || 0 : 0,
    rooms: Number(searchParams.get('rooms')) || 1,
  };
}

export function applySearchCriteria(baseParams, criteria) {
  const next = new URLSearchParams(baseParams);

  const setOrDelete = (key, value) => {
    if (value === undefined || value === null || value === '') {
      next.delete(key);
    } else {
      next.set(key, String(value));
    }
  };

  setOrDelete('branchId', criteria.branchId);
  setOrDelete('destination', criteria.destination);
  setOrDelete('checkIn', criteria.checkIn);
  setOrDelete('checkOut', criteria.checkOut);
  setOrDelete('adults', criteria.adults);
  setOrDelete('children', criteria.children > 0 ? criteria.children : '');
  setOrDelete('rooms', criteria.rooms);

  next.delete('guests');

  return next;
}

export function buildBranchesSearchPath(criteria, existingParams = '') {
  const base =
    existingParams instanceof URLSearchParams
      ? existingParams
      : new URLSearchParams(existingParams || '');
  const next = applySearchCriteria(base, criteria);
  const qs = next.toString();
  return qs ? `/branches?${qs}` : '/branches';
}

export function buildResortsSearchPath(criteria, existingParams = '') {
  return buildBranchesSearchPath(criteria, existingParams);
}

/** Room catalogue query (snake_case for Laravel). */
export function roomCatalogParamsFromCriteria(criteria, extra = {}) {
  const out = { ...extra };
  if (criteria.branchId) out.branch_id = Number(criteria.branchId);
  if (criteria.checkIn) out.check_in = criteria.checkIn;
  if (criteria.checkOut) out.check_out = criteria.checkOut;
  if (criteria.checkIn && criteria.checkOut) {
    out.include_booked = 1;
  }
  return out;
}

export function buildRoomsSearchPath(criteria) {
  const next = applySearchCriteria(new URLSearchParams(), criteria);
  const qs = next.toString();
  return qs ? `/rooms?${qs}` : '/rooms';
}

/**
 * City/region label for sanctuary tabs — branch selection wins over stale destination param.
 */
export function sanctuaryRegionFromCriteria(criteria, branchOptions = []) {
  if (criteria?.branchId) {
    const match = branchOptions.find(
      (o) => String(o.branchId ?? o.value) === String(criteria.branchId)
    );
    const city =
      match?.destination ||
      match?.branch?.city ||
      match?.branch?.location?.split?.(',')?.[0]?.trim() ||
      '';
    if (city) return city;
  }
  return criteria?.destination || '';
}

export function sanctuaryRegionMatches(locKey, activeRegion) {
  if (!locKey && !activeRegion) return true;
  if (!locKey || !activeRegion) return false;
  const a = activeRegion.toLowerCase();
  const k = locKey.toLowerCase();
  return a.includes(k) || k.includes(a);
}

/**
 * Region tab / sidebar: filter by destination only — must not keep a specific branch id.
 */
export function applyDestinationRegionParams(baseParams, destination) {
  const next = new URLSearchParams(baseParams);
  if (destination) {
    next.set('destination', destination);
  } else {
    next.delete('destination');
  }
  next.delete('branchId');
  next.delete('branch_id');
  return next;
}
