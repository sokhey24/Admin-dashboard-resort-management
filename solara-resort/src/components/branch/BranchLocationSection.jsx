import React, { useMemo } from 'react';
import {
  MapPin,
  Compass,
  Navigation,
  Plane,
  Car,
  Ship,
  CloudSun,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { getBranchLocationGuide } from './branchLocationGuide.js';

function GoldMapPin() {
  return (
    <div
      className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-full z-10 pointer-events-none"
      aria-hidden
    >
      <span className="relative flex h-10 w-10 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/25" />
        <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-gold bg-[#0a0e17] shadow-lg shadow-gold/20">
          <MapPin className="h-5 w-5 text-gold fill-gold/30" strokeWidth={2} />
        </span>
      </span>
      <span className="block h-2 w-2 rounded-full bg-gold/80 mx-auto -mt-1 shadow-[0_0_12px_rgba(212,175,55,0.6)]" />
    </div>
  );
}

function GuideCard({ icon: Icon, title, children }) {
  return (
    <article className="rounded-[var(--radius-card)] border border-border bg-surface p-4 flex gap-3">
      <div
        className="w-10 h-10 rounded-[var(--radius-button)] bg-gold/10 border border-gold/25 flex items-center justify-center shrink-0"
        aria-hidden
      >
        <Icon className="w-5 h-5 text-gold" strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <h4 className="text-sm font-semibold text-text font-serif leading-snug">{title}</h4>
        <div className="text-xs text-text-secondary leading-relaxed mt-1">{children}</div>
      </div>
    </article>
  );
}

export function BranchLocationSection({ branch, branchName }) {
  const { t, language } = useApp();

  const guide = useMemo(() => getBranchLocationGuide(branch), [branch]);

  const lat = Number(branch?.latitude);
  const lng = Number(branch?.longitude);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  const mapEmbedSrc = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.06}%2C${lat - 0.04}%2C${lng + 0.06}%2C${lat + 0.04}&layer=mapnik&marker=${lat}%2C${lng}`
    : null;

  const mapsLink = hasCoords
    ? `https://www.google.com/maps?q=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        branch?.address || branch?.location || branchName || ''
      )}`;

  const displayName =
    language === 'km' && branch?.raw?.city_km
      ? branch.raw.city_km
      : branch?.city || branch?.destination || branchName;

  const weatherLabel = t(guide.weatherKey, guide.weatherFallback);

  return (
    <section
      id="branch-location"
      className="scroll-mt-36 space-y-6"
      aria-labelledby="branch-location-heading"
    >
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block">
            {t('resorts.locationEyebrow', 'Arrival & Orientation')}
          </span>
          <h3 id="branch-location-heading" className="text-2xl font-serif font-bold text-text mt-1">
            {t('branches.location.mapAndGuideTitle', 'Interactive Map & Arrival Guide')}
          </h3>
          <p className="text-xs text-muted mt-2 max-w-xl">
            {t(
              'branches.location.mapAndGuideSubtitle',
              'Navigate your sanctuary with curated transfers, climate context, and landmark distances.'
            )}
          </p>
        </div>
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-gold/30 text-sm text-text shadow-sm"
          role="status"
        >
          <CloudSun className="w-4 h-4 text-gold shrink-0" aria-hidden />
          <span className="font-medium">{weatherLabel}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
        <div className="relative min-h-[280px] sm:min-h-[360px] rounded-[var(--radius-card)] border border-border overflow-hidden bg-[#0a0e17] shadow-xl group">
          {mapEmbedSrc ? (
            <>
              <iframe
                title={t('branches.location.mapFrameTitle', 'Sanctuary location map')}
                src={mapEmbedSrc}
                className="absolute inset-0 w-full h-full border-0 grayscale-[35%] contrast-[1.05] brightness-[0.85] group-hover:brightness-95 transition-[filter] duration-500"
                loading="lazy"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-[#0a0e17]/90 via-[#0a0e17]/20 to-transparent pointer-events-none"
                aria-hidden
              />
              <GoldMapPin />
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center bg-bg-secondary">
              <MapPin className="w-10 h-10 text-gold/70" aria-hidden />
              <p className="text-sm text-text font-medium">{branch?.address || branch?.location}</p>
              <p className="text-xs text-muted">
                {t('branches.location.mapCoordsPending', 'Precise coordinates will appear once charted by our team.')}
              </p>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-wrap items-center justify-between gap-3 z-20">
            <div className="flex items-center gap-2 text-xs text-slate-200">
              <Compass className="w-4 h-4 text-gold shrink-0" aria-hidden />
              <span className="font-medium truncate max-w-[200px] sm:max-w-none">{displayName}</span>
            </div>
            <a
              href={mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/80 border border-gold/35 text-gold text-xs font-semibold hover:bg-gold/10 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" aria-hidden />
              {t('branches.location.openInteractiveMap', 'Open interactive map')}
              <ExternalLink className="w-3 h-3 opacity-70" aria-hidden />
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <header className="pb-1 border-b border-border/80">
            <h4 className="text-lg font-serif font-bold text-text flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gold shrink-0" aria-hidden />
              {t('branches.location.arrivalGuideTitle', 'Arrival & Sanctuary Access Guide')}
            </h4>
            {hasCoords && (
              <p className="text-[11px] text-muted font-mono mt-2">
                {t('resorts.gpsCoordinates', 'GPS coordinates')}: {lat.toFixed(5)}, {lng.toFixed(5)}
              </p>
            )}
          </header>

          <GuideCard
            icon={Car}
            title={t('branches.location.vipChauffeurTitle', 'Private VIP Chauffeur')}
          >
            <ul className="space-y-2 list-none">
              <li className="flex gap-2">
                <Plane className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" aria-hidden />
                <span>{t(guide.chauffeurPhnomPenhKey, guide.chauffeurPhnomPenhFallback)}</span>
              </li>
              <li className="flex gap-2">
                <Car className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" aria-hidden />
                <span>{t(guide.chauffeurSihanoukvilleKey, guide.chauffeurSihanoukvilleFallback)}</span>
              </li>
            </ul>
          </GuideCard>

          {guide.coastal && guide.speedboatKey && (
            <GuideCard
              icon={Ship}
              title={t('branches.location.speedboatTitle', 'Speedboat & Yacht Transfer')}
            >
              {t(guide.speedboatKey, guide.speedboatFallback)}
            </GuideCard>
          )}

          {guide.helicopter && (
            <GuideCard
              icon={Plane}
              title={t('branches.location.helicopterTitle', 'Helicopter Pad')}
            >
              {t(
                'branches.location.helicopterDesc',
                'Private helicopter landing coordination available with 24-hour advance notice.'
              )}
            </GuideCard>
          )}

          <div className="rounded-[var(--radius-card)] border border-border bg-bg-secondary/60 p-4">
            <h4 className="text-xs uppercase tracking-[0.18em] text-gold font-semibold mb-3 flex items-center gap-2">
              <Compass className="w-4 h-4" aria-hidden />
              {t('branches.location.landmarksTitle', 'Key Landmark Distances')}
            </h4>
            <ul className="space-y-2">
              {guide.landmarks.map((item) => (
                <li
                  key={item.key}
                  className="flex items-start gap-2 text-xs text-text font-medium leading-relaxed"
                >
                  <MapPin className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" aria-hidden />
                  <span>{t(item.key, item.fallback)}</span>
                </li>
              ))}
            </ul>
          </div>

          <a
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto inline-flex items-center justify-center gap-2 text-sm font-semibold text-gold hover:text-gold-light transition-colors py-2"
          >
            <Navigation className="w-4 h-4" aria-hidden />
            {t('common.openInMaps', 'Open in Maps')}
          </a>
        </div>
      </div>
    </section>
  );
}

export default BranchLocationSection;
