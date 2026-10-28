import { formatSiteRoutesForCatalog } from './conciergeSiteRoutes.js';

/**
 * Builds a compact catalog snapshot for Reaksa (AI concierge) system context.
 */

function formatMoney(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return null;
  return `USD ${n.toFixed(0)}`;
}

function branchSlug(branch) {
  return branch?.slug || branch?.id || 'branches';
}

/**
 * @param {Array} branches - mapped branch rows from useBranches
 * @param {Array} rooms - mapped room rows from useRoomsList
 * @param {string} language
 */
export function buildConciergeCatalogDigest(branches, rooms, language = 'en') {
  const lines = [];
  const isKm = language === 'km';

  lines.push(
    isKm
      ? 'ទិន្នន័យផ្ទាល់ពីគេហទំព័រសូឡារ៉ា (ប្រើសម្រាប់តម្លៃ និងតំណភ្ជាប់):'
      : 'LIVE GUEST-SITE CATALOG (use for rates, room names, and markdown links):',
  );
  lines.push(
    isKm
      ? 'នៅពេលភ្ញៀវសួរអំពីតម្លៃ ឬបន្ទប់ សូមណែនាំតំណ markdown ដូច [មើលបន្ទប់កែប](/branches/kep)។'
      : 'When guests ask about prices, availability, or rooms, answer from this data and include markdown links e.g. [View Kep Rooms](/branches/kep).',
  );
  lines.push(
    isKm
      ? 'សម្រាប់កាលបរិច្ឆេទជាក់លាក់ ប្រាប់ភ្ញៀវថាអាចពិនិត្យភាពទំនេរជាក់ស្តែងតាមតំណ ឬប្រអប់កក់បន្ទប់។'
      : 'For specific stay dates, confirm warmly and invite them to verify live availability via the link or booking bar.',
  );
  lines.push(formatSiteRoutesForCatalog(language));

  const roomsByBranch = new Map();
  for (const room of rooms || []) {
    const bid = room.branchId ?? room.branch_id;
    if (bid == null) continue;
    if (!roomsByBranch.has(bid)) roomsByBranch.set(bid, []);
    roomsByBranch.get(bid).push(room);
  }

  const branchList = Array.isArray(branches) ? branches : [];

  if (branchList.length === 0) {
    lines.push(isKm ? '(មិនទាន់មានសាខាផ្ទុក)' : '(No branches loaded yet.)');
    return lines.join('\n');
  }

  for (const branch of branchList) {
    const id = branch.branchId ?? branch.id;
    const slug = branchSlug(branch);
    const path = branch.detailPath || `/branches/${slug}`;
    const name = branch.name || slug;
    const branchRooms = roomsByBranch.get(id) || [];

    const prices = branchRooms
      .map((r) => Number(r.pricePerNight))
      .filter((p) => Number.isFinite(p) && p > 0);

    const minFromBranch = Number(branch.startingPrice);
    const minPrice =
      prices.length > 0
        ? Math.min(...prices)
        : Number.isFinite(minFromBranch) && minFromBranch > 0
          ? minFromBranch
          : null;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : minPrice;

    const typeNames = [
      ...new Set(branchRooms.map((r) => r.type || r.name).filter(Boolean)),
    ].slice(0, 6);

    const priceRange =
      minPrice != null && maxPrice != null && maxPrice > minPrice
        ? `${formatMoney(minPrice)} – ${formatMoney(maxPrice)}/night`
        : minPrice != null
          ? `from ${formatMoney(minPrice)}/night`
          : isKm
            ? 'តម្លៃ: សួរផ្នែកទទួលភ្ញៀវ'
            : 'rates: contact concierge';

    const typesLine =
      typeNames.length > 0
        ? typeNames.join(', ')
        : isKm
          ? 'បន្ទប់/វីឡាផ្សងព្រេង'
          : 'suites & villas';

    lines.push(
      `- ${name} (${branch.city || branch.destination || 'Cambodia'}): ${typesLine}; ${priceRange}; link: [${isKm ? 'មើលបន្ទប់' : 'View rooms'}](${path})`,
    );
  }

  return lines.join('\n');
}
