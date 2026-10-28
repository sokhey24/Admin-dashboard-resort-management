/**
 * Guest-site paths that exist in `src/app/router.jsx`.
 * Used for Reaksa shortcuts and catalog hints (internal links only).
 */
export const CONCIERGE_SITE_ROUTES = [
  { path: '/', labelEn: 'Home', labelKm: 'ទំព័រដើម' },
  { path: '/branches', labelEn: 'All branches', labelKm: 'គ្រប់សាខា' },
  { path: '/rooms', labelEn: 'Rooms', labelKm: 'បន្ទប់' },
  { path: '/booking', labelEn: 'Book a stay', labelKm: 'កក់ស្នាក់នៅ' },
  { path: '/dining', labelEn: 'Dining', labelKm: 'ភោជនីយដ្ឋាន' },
  { path: '/dining/menu', labelEn: 'Menu', labelKm: 'ម៉ឺនុយ' },
  { path: '/activities', labelEn: 'Activities', labelKm: 'សកម្មភាព' },
  { path: '/services', labelEn: 'Services', labelKm: 'សេវាកម្ម' },
  { path: '/gallery', labelEn: 'Gallery', labelKm: 'វិចិត្រសាល' },
  { path: '/about', labelEn: 'About', labelKm: 'អំពីយើង' },
  { path: '/contact', labelEn: 'Contact', labelKm: 'ទាក់ទង' },
  { path: '/login', labelEn: 'Sign in', labelKm: 'ចូលគណនី' },
  { path: '/account', labelEn: 'My account', labelKm: 'គណនីរបស់ខ្ញុំ' },
];

/**
 * Branch pills: always use API `detailPath` / slug (never hardcoded city slugs).
 */
export function buildBranchShortcuts(branches, language = 'en') {
  const all = {
    to: '/branches',
    label: language === 'km' ? 'គ្រប់សាខា' : 'All Branches',
  };

  const items = (branches || [])
    .map((branch) => {
      const to =
        branch.detailPath ||
        (branch.slug ? `/branches/${branch.slug}` : branch.id ? `/branches/${branch.id}` : null);
      if (!to || to === '/branches') return null;
      const label =
        language === 'km' && branch.name_km ? branch.name_km : branch.name || branch.city;
      return { to, label };
    })
    .filter(Boolean);

  return [all, ...items];
}

export function formatSiteRoutesForCatalog(language = 'en') {
  const isKm = language === 'km';
  const header = isKm ? 'តំណផ្ទៃតាមគេហទំព័រ (markdown):' : 'SITE PAGES (valid markdown paths):';
  const lines = CONCIERGE_SITE_ROUTES.map((route) => {
    const label = isKm ? route.labelKm : route.labelEn;
    return `- [${label}](${route.path})`;
  });
  return `${header}\n${lines.join('\n')}`;
}
