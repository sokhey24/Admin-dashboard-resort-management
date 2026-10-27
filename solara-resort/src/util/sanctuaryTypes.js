/** Sanctuary experience categories for branch listing filters. */
export const SANCTUARY_TYPE_PILLS = [
  {
    id: '',
    labelKey: 'branches.sanctuaryTypeAll',
    defaultLabel: 'All Sanctuaries',
  },
  {
    id: 'riverside-heritage',
    labelKey: 'branches.sanctuaryTypeRiverside',
    defaultLabel: 'Riverside & Heritage',
  },
  {
    id: 'island-beach',
    labelKey: 'branches.sanctuaryTypeIsland',
    defaultLabel: 'Island & Beach',
  },
  {
    id: 'eco-wellness',
    labelKey: 'branches.sanctuaryTypeEco',
    defaultLabel: 'Eco-Wellness',
  },
];

function branchHaystack(branch) {
  return [
    branch?.destination,
    branch?.city,
    branch?.province,
    branch?.name,
    branch?.address,
    branch?.description,
    branch?.tagline,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function getBranchSanctuaryType(branch) {
  const text = branchHaystack(branch);
  if (/rong|sihanouk|island|beach|coast|shore|\bkep\b/.test(text)) {
    return 'island-beach';
  }
  if (/bokor|mountain|wellness|eco|forest|jungle|mindful|sky|sanctuary/.test(text)) {
    return 'eco-wellness';
  }
  if (/kampot|siem|angkor|heritage|riverside|mekong|phnom penh|temple/.test(text)) {
    return 'riverside-heritage';
  }
  return '';
}

export function sanctuaryTypeFromDestination(destination) {
  if (!destination) return '';
  return getBranchSanctuaryType({ city: destination, destination });
}

export function branchMatchesSanctuaryType(branch, typeId) {
  if (!typeId) return true;
  return getBranchSanctuaryType(branch) === typeId;
}

export function resolveActiveSanctuaryType(criteria) {
  if (criteria?.region) return criteria.region;
  if (criteria?.destination) {
    return sanctuaryTypeFromDestination(criteria.destination);
  }
  return '';
}

export function isSanctuaryTypePillActive(pillId, criteria) {
  if (criteria?.branchId) {
    return pillId === '';
  }
  if (pillId === '') {
    return !criteria?.region && !criteria?.destination;
  }
  if (criteria?.region) {
    return criteria.region === pillId;
  }
  if (criteria?.destination) {
    return sanctuaryTypeFromDestination(criteria.destination) === pillId;
  }
  return false;
}
