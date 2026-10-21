import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Phone,
  Mail,
  CheckCircle2,
  BedDouble,
  Users,
  Maximize2,
  Eye,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { CatalogNightlyPrice } from '../../components/catalog/CatalogNightlyPrice.jsx';
import { Pagination } from '../../components/common/Pagination.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { paginateItems } from '../../util/paginateList.js';
import { MAIN_SOLARA_BRANCH, MAIN_SOLARA_ROOMS } from '../../data/mainSolaraBranch.js';

const ROOMS_PAGE_SIZE = 3;

function MainSolaraRoomTile({ room, currency, branchLocation, onExplore }) {
  const { t } = useApp();
  const guests = (room.capacity?.adults ?? 0) + (room.capacity?.children ?? 0);
  const locationLabel = room.branchLocation ?? branchLocation;

  return (
    <article
      className="group bg-surface border border-border hover:border-gold/40 rounded-[var(--radius-card)] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-900 shrink-0">
        <img
          src={room.featuredImage}
          alt={room.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          loading="lazy"
        />
        <span className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wider bg-slate-950/80 text-gold border border-gold/30 px-2 py-0.5 rounded">
          {room.type}
        </span>
      </div>
      <div className="p-5 flex flex-col flex-1 gap-3">
        <h3 className="text-lg font-serif font-bold text-text">{room.name}</h3>
        {locationLabel && (
          <p className="text-xs text-muted flex items-center gap-1.5 -mt-1">
            <MapPin className="w-3.5 h-3.5 text-gold shrink-0" aria-hidden />
            <span>
              {t('catalog.location', 'Location')}:{' '}
              <span className="text-text-secondary font-medium">{locationLabel}</span>
            </span>
          </p>
        )}
        <CatalogNightlyPrice
          salePrice={room.pricePerNight}
          listPrice={room.listPricePerNight}
          discountPercent={room.discountPercent}
          currency={currency}
          size="sm"
        />
        <div className="grid grid-cols-2 gap-2 text-[11px] text-muted">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-gold shrink-0" />
            {guests} {t('search.guests', 'Guests')}
          </span>
          <span className="flex items-center gap-1">
            <BedDouble className="w-3.5 h-3.5 text-gold shrink-0" />
            {room.bedType}
          </span>
          <span className="flex items-center gap-1">
            <Maximize2 className="w-3.5 h-3.5 text-gold shrink-0" />
            {room.sizeSqm} m²
          </span>
          <span className="flex items-center gap-1 truncate">
            <Eye className="w-3.5 h-3.5 text-gold shrink-0" />
            {room.view}
          </span>
        </div>
        <ul className="text-[11px] text-muted space-y-1 flex-1">
          {(room.amenities || []).slice(0, 3).map((a) => (
            <li key={a} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-gold shrink-0" />
              {a}
            </li>
          ))}
        </ul>
        <Button variant="outline" size="sm" className="w-full mt-auto" onClick={onExplore}>
          {t('mainSolara.exploreRooms', 'Explore live availability')}
        </Button>
      </div>
    </article>
  );
}

export function MainsolaraResort() {
  const navigate = useNavigate();
  const { currency, t, language } = useApp();
  const branch = MAIN_SOLARA_BRANCH;
  const [roomPage, setRoomPage] = useState(1);
  const [heroImage, setHeroImage] = useState(branch.gallery[0]);

  const roomPagination = useMemo(
    () => paginateItems(MAIN_SOLARA_ROOMS, roomPage, ROOMS_PAGE_SIZE),
    [roomPage]
  );

  useEffect(() => {
    setRoomPage(1);
  }, []);

  useEffect(() => {
    if (roomPage > roomPagination.totalPages) {
      setRoomPage(roomPagination.totalPages);
    }
  }, [roomPage, roomPagination.totalPages]);

  return (
    <section
      id="main-solara-sanctuary"
      className="py-20 bg-bg border-y border-border"
      aria-labelledby="main-solara-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block mb-2">
              {t('mainSolara.badge', 'Flagship Estate')}
            </span>
            <h2 id="main-solara-heading" className="text-3xl sm:text-4xl font-serif font-bold text-text tracking-tight">
              {branch.name}
            </h2>
            <p className="text-sm text-gold font-medium mt-1">{branch.tagline}</p>
          </div>
          <p className="text-sm text-muted max-w-lg leading-relaxed">{branch.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
          <div className="lg:col-span-3 rounded-[var(--radius-card)] overflow-hidden border border-border shadow-lg aspect-[16/10] lg:aspect-auto lg:min-h-[320px] relative bg-slate-900">
            <img src={heroImage} alt={branch.name} className="w-full h-full object-cover absolute inset-0" />
          </div>
          <div className="lg:col-span-2 flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {branch.gallery.map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => setHeroImage(src)}
                className={`shrink-0 w-28 lg:w-full aspect-[4/3] rounded-[var(--radius-button)] overflow-hidden border-2 transition-all cursor-pointer ${heroImage === src ? 'border-gold opacity-100' : 'border-border opacity-70 hover:opacity-100'
                  }`}
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <div className="p-4 rounded-[var(--radius-card)] bg-surface border border-border text-xs text-muted space-y-2">
            <MapPin className="w-4 h-4 text-gold" />
            <p className="font-medium text-text">{branch.location}</p>
            <p>{branch.address}</p>
          </div>
          <div className="p-4 rounded-[var(--radius-card)] bg-surface border border-border text-xs text-muted space-y-2">
            <Clock className="w-4 h-4 text-gold" />
            <p>
              Check-in {branch.checkinTime} · Check-out {branch.checkoutTime}
            </p>
          </div>
          <div className="p-4 rounded-[var(--radius-card)] bg-surface border border-border text-xs text-muted space-y-2">
            <Phone className="w-4 h-4 text-gold" />
            <p>{branch.contactPhone}</p>
          </div>
          <div className="p-4 rounded-[var(--radius-card)] bg-surface border border-border text-xs text-muted space-y-2">
            <Mail className="w-4 h-4 text-gold" />
            <p className="truncate">{branch.contactEmail}</p>
          </div>
        </div>

        <div className="mb-12">
          <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block mb-3">
            {t('branches.amenities', 'Branch Features & Inclusions')}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {branch.amenities.map((amenity) => (
              <div
                key={amenity}
                className="flex items-center gap-3 p-3 rounded-[var(--radius-button)] bg-surface border border-border/60 text-xs text-text"
              >
                <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                {amenity}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block mb-1">
                {t('rooms.allQuarters', 'Private Accommodations')}
              </span>
              <h3 className="text-2xl font-serif font-bold text-text flex items-center gap-2">
                <BedDouble className="w-6 h-6 text-gold" />
                {t('mainSolara.roomsTitle', 'Rooms at Solara Main')}
              </h3>
              <p className="text-xs text-muted mt-1 max-w-xl">
                {language === 'km'
                  ? 'បន្ទប់គំរូសម្រាប់បង្ហាញប៉ុណ្ណោះ — សូមមើលបញ្ជីបន្ទប់ផ្ទាល់សម្រាប់ការកក់ពិតប្រាកដ។'
                  : 'Showcase accommodations for Solara Main only. Live inventory and booking use the catalog below.'}
              </p>
            </div>
            <CatalogNightlyPrice
              salePrice={branch.startingPrice}
              currency={currency}
              size="md"
              align="end"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch auto-rows-fr">
            {roomPagination.items.map((room) => (
              <MainSolaraRoomTile
                key={room.id}
                room={room}
                currency={currency}
                branchLocation={branch.branchCardLabel}
                onExplore={() => navigate('/rooms')}
              />
            ))}
          </div>

          {roomPagination.showPagination && (
            <Pagination
              className="pt-8"
              page={roomPagination.page}
              totalPages={roomPagination.totalPages}
              onPageChange={setRoomPage}
            />
          )}

          <div className="mt-10 flex flex-wrap gap-3 justify-center">
            <Button variant="gold" size="md" onClick={() => navigate('/rooms')}>
              {t('home.exploreAllRooms', 'Explore All Rooms')}
            </Button>
            <Button variant="outline" size="md" onClick={() => navigate('/branches')}>
              {t('home.viewAllResorts', 'View All Solara Sanctuaries')}
            </Button>
            <Button variant="outline" size="md" onClick={() => navigate('/contact')}>
              {t('nav.contact', 'Contact')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MainsolaraResort;
