function branchText(branch) {
  return `${branch?.name || ''} ${branch?.city || ''} ${branch?.slug || ''} ${branch?.destination || ''}`.toLowerCase();
}

export function detectBranchLocationProfile(branch) {
  const text = branchText(branch);
  if (text.includes('rong') || text.includes('island') || text.includes('koh')) return 'coastal';
  if (text.includes('kampot') || text.includes('bokor')) return 'kampot';
  if (text.includes('siem') || text.includes('angkor')) return 'siem';
  if (text.includes('kep')) return 'kep';
  return 'default';
}

const PROFILES = {
  kampot: {
    weatherKey: 'branches.location.weatherKampot',
    weatherFallback: 'Kampot Riverside: 28°C · Gentle Breeze',
    coastal: false,
    helicopter: true,
    chauffeurPhnomPenhKey: 'branches.location.chauffeurKampotPp',
    chauffeurPhnomPenhFallback: 'Approx. 3.5 hours from Phnom Penh via private VIP chauffeur',
    chauffeurSihanoukvilleKey: 'branches.location.chauffeurKampotKos',
    chauffeurSihanoukvilleFallback: 'Approx. 2 hours from Sihanoukville along the coastal highway',
    landmarks: [
      {
        key: 'branches.location.landmarkBokor',
        fallback: '15 mins to Bokor National Park',
      },
      {
        key: 'branches.location.landmarkKampotRiver',
        fallback: '5 mins to Kampot riverside promenade',
      },
    ],
  },
  kep: {
    weatherKey: 'branches.location.weatherKep',
    weatherFallback: 'Kep Coast: 29°C · Ocean Breeze',
    coastal: true,
    helicopter: true,
    chauffeurPhnomPenhKey: 'branches.location.chauffeurKepPp',
    chauffeurPhnomPenhFallback: 'Approx. 3 hours from Phnom Penh with concierge meet-and-greet',
    chauffeurSihanoukvilleKey: 'branches.location.chauffeurKepKos',
    chauffeurSihanoukvilleFallback: 'Approx. 2.5 hours from Sihanoukville International Airport',
    speedboatKey: 'branches.location.speedboatKep',
    speedboatFallback: 'Optional yacht transfer from coastal marinas on request',
    landmarks: [
      {
        key: 'branches.location.landmarkKepCrab',
        fallback: '5 mins to Kep Crab Market',
      },
      {
        key: 'branches.location.landmarkRabbitIsland',
        fallback: '20 mins by boat to Rabbit Island',
      },
    ],
  },
  coastal: {
    weatherKey: 'branches.location.weatherIsland',
    weatherFallback: 'Island Sanctuary: 30°C · Trade Winds',
    coastal: true,
    helicopter: true,
    chauffeurPhnomPenhKey: 'branches.location.chauffeurIslandPp',
    chauffeurPhnomPenhFallback: '4 hours to Sihanoukville pier, then private speedboat transfer',
    chauffeurSihanoukvilleKey: 'branches.location.chauffeurIslandKos',
    chauffeurSihanoukvilleFallback: '45 mins from Sihanoukville International Airport to marina',
    speedboatKey: 'branches.location.speedboatIsland',
    speedboatFallback: 'Private speedboat or yacht — approx. 45 mins from mainland pier',
    landmarks: [
      {
        key: 'branches.location.landmarkCoral',
        fallback: '10 mins by boat to coral gardens',
      },
      {
        key: 'branches.location.landmarkSunset',
        fallback: 'On-property sunset sandbar rituals',
      },
    ],
  },
  siem: {
    weatherKey: 'branches.location.weatherSiem',
    weatherFallback: 'Siem Reap: 31°C · Light Humidity',
    coastal: false,
    helicopter: true,
    chauffeurPhnomPenhKey: 'branches.location.chauffeurSiemPp',
    chauffeurPhnomPenhFallback: 'Approx. 4.5 hours from Phnom Penh via luxury SUV',
    chauffeurSihanoukvilleKey: 'branches.location.chauffeurSiemRep',
    chauffeurSihanoukvilleFallback: 'Domestic flights recommended; chauffeur from Siem Reap Airport in 20 mins',
    landmarks: [
      {
        key: 'branches.location.landmarkAngkor',
        fallback: '15 mins to Angkor Wat main gate',
      },
      {
        key: 'branches.location.landmarkPubStreet',
        fallback: '12 mins to heritage Old Market quarter',
      },
    ],
  },
  default: {
    weatherKey: 'branches.location.weatherDefault',
    weatherFallback: 'Cambodia: 30°C · Tropical Calm',
    coastal: false,
    helicopter: false,
    chauffeurPhnomPenhKey: 'branches.location.chauffeurDefaultPp',
    chauffeurPhnomPenhFallback: 'Private VIP chauffeur from Phnom Penh — duration coordinated by concierge',
    chauffeurSihanoukvilleKey: 'branches.location.chauffeurDefaultKos',
    chauffeurSihanoukvilleFallback: 'VIP fleet from Sihanoukville International Airport on request',
    landmarks: [
      {
        key: 'branches.location.landmarkConcierge',
        fallback: 'Concierge-curated temple, market, and nature excursions nearby',
      },
    ],
  },
};

export function getBranchLocationGuide(branch) {
  const profileKey = detectBranchLocationProfile(branch);
  return { profileKey, ...PROFILES[profileKey] };
}
