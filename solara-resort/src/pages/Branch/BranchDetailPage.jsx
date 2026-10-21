import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Star,
  Phone,
  Mail,
  CheckCircle2,
  Share2,
  Clock,
  ShieldCheck,
  BedDouble,
  Sparkles,
} from 'lucide-react';
import { RoomCardGrid } from '../../components/room/RoomCard.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { PageSkeleton } from '../../components/ui/Skeleton.jsx';
import { CatalogNightlyPrice } from '../../components/catalog/CatalogNightlyPrice.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { useBranchDetail } from '../../hooks/useCatalog.js';
import { FavoriteButton } from '../../components/catalog/FavoriteButton.jsx';
import { BranchRelated } from '../../related/BranchRelated.jsx';

export const BranchDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currency, addToast, t, language } = useApp();

  const { resort: branch, rooms: branchRooms, loading, error, reload } = useBranchDetail(id);

  const [activePhoto, setActivePhoto] = useState('');
  const [photoModalOpen, setPhotoModalOpen] = useState(false);

  useEffect(() => {
    if (branch?.gallery?.[0]) {
      setActivePhoto(branch.gallery[0]);
    } else if (branch?.featuredImage) {
      setActivePhoto(branch.featuredImage);
    }
  }, [branch?.id, branch?.gallery, branch?.featuredImage]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      addToast(t('toast.linkCopied', 'Location link copied to clipboard'), 'success');
    }
  };

  if (loading) {
    return (
      <div className="w-full pb-24 pt-24">
        <PageSkeleton />
      </div>
    );
  }

  if (error || !branch) {
    return (
      <div className="w-full pb-24 pt-28 max-w-3xl mx-auto px-4">
        <ErrorState
          title={t('resorts.detailErrorTitle', 'Location unavailable')}
          message={error || t('resorts.detailNotFound', 'This sanctuary branch could not be found.')}
          onRetry={reload}
        />
        <div className="text-center mt-6">
          <Button variant="outline" size="sm" onClick={() => navigate('/branches')}>
            {t('resorts.backToList', 'Back to all locations')}
          </Button>
        </div>
      </div>
    );
  }

  const gallery = (branch.gallery?.length ? branch.gallery : [branch.featuredImage]).filter(Boolean);

  return (
    <div className="w-full pb-24">
      {/* 1. HERO / BANNER HEADER */}
      <section className="pt-24 pb-8 bg-bg-secondary border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              {/* Breadcrumb with Unified Brand */}
              <div className="flex items-center gap-2 text-xs text-muted mb-2">
                <Link to="/branches" className="hover:text-gold transition-colors font-medium">
                  {t('brand.name', 'Solara Resort & Spa')}
                </Link>
                <span>/</span>
                <Link to="/branches" className="hover:text-gold transition-colors">
                  {t('nav.branches', 'Our Locations')}
                </Link>
                <span>/</span>
                <span className="text-text-secondary">{branch.city || branch.destination}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-text tracking-tight">
                {branch.name}
              </h1>

              <div className="flex items-center gap-3 mt-2 text-xs text-muted flex-wrap">
                {(branch.rating ?? 0) > 0 && (
                  <>
                    <div className="flex items-center gap-1 text-gold font-semibold">
                      <Star className="w-3.5 h-3.5 fill-gold" />
                      <span>{Number(branch.rating).toFixed(2)}</span>
                      <span className="text-muted font-normal">
                        ({branch.reviewsCount ?? 0} {language === 'km' ? 'ការពិនិត្យ' : 'guest reviews'})
                      </span>
                    </div>
                    <span>·</span>
                  </>
                )}

                {branch.location && (
                  <div className="flex items-center gap-1 text-text-secondary">
                    <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
                    <span>{branch.location}</span>
                  </div>
                )}

                <span>·</span>

                {/* Operating schedule indicator */}
                <div className="flex items-center gap-1 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-gold shrink-0" />
                  <span>
                    Check-in {branch.checkinTime || '14:00'} · Check-out {branch.checkoutTime || '12:00'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <FavoriteButton kind="resort" id={branch.id} size="lg" />
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                leftIcon={<Share2 className="w-4 h-4" />}
              >
                {t('resorts.share', 'Share')}
              </Button>
              <Button
                variant="gold"
                size="md"
                onClick={() => {
                  const targetElement = document.getElementById('available-rooms');
                  targetElement?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {t('resorts.selectRoom', 'Explore Rooms')}
              </Button>
            </div>
          </div>

          {/* Photo Gallery Grid */}
          {gallery.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-[var(--radius-card)] overflow-hidden shadow-lg border border-border">
              <div
                className="md:col-span-2 md:row-span-2 aspect-[16/10] md:aspect-auto h-full min-h-[360px] relative overflow-hidden bg-slate-900 cursor-pointer group"
                onClick={() => {
                  setActivePhoto(gallery[0]);
                  setPhotoModalOpen(true);
                }}
              >
                <img
                  src={gallery[0]}
                  alt={branch.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute bottom-3 left-3 bg-slate-950/70 backdrop-blur-md px-3 py-1 rounded text-xs text-white border border-white/10 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-gold" />
                  <span>{branch.name} · Solara Sanctuary</span>
                </div>
              </div>
              {gallery.slice(1, 4).map((img, i) => (
                <div
                  key={i}
                  className="hidden md:block aspect-[4/3] relative overflow-hidden bg-slate-900 cursor-pointer group"
                  onClick={() => {
                    setActivePhoto(img);
                    setPhotoModalOpen(true);
                  }}
                >
                  <img
                    src={img}
                    alt={`${branch.name} gallery ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 2. BODY CONTENT + SIDEBAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-12">
            {/* Overview */}
            <div className="space-y-4">
              <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block">
                {t('resorts.overview', 'Branch Sanctuary Overview')}
              </span>
              <h2 className="text-2xl font-serif font-bold text-text">
                {branch.tagline || `${branch.name} by Solara`}
              </h2>
              <p className="text-sm text-muted leading-relaxed font-light whitespace-pre-line">
                {branch.description ||
                  `Experience bespoke luxury hospitality at ${branch.name}. Every villa and suite has been crafted to harmonize with the surroundings, offering direct access to nature, fine gastronomy, and holistic wellness.`}
              </p>
            </div>

            {/* Inclusions & Amenities */}
            {(branch.amenities || []).length > 0 && (
              <div className="space-y-4 pt-8 border-t border-border">
                <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block">
                  {t('branches.amenities', 'Branch Features & Inclusions')}
                </span>
                <h3 className="text-xl font-serif font-semibold text-text">
                  Curated Conveniences & Privileges
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {(branch.amenities || []).map((amenity) => (
                    <div
                      key={amenity}
                      className="flex items-center gap-3 p-3 rounded-[var(--radius-button)] bg-surface border border-border/60 text-xs text-text"
                    >
                      <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Accommodations at this Branch */}
            <div id="available-rooms" className="space-y-6 pt-8 border-t border-border">
              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block mb-1">
                  {t('rooms.allQuarters', 'Private Accommodations')}
                </span>
                <h3 className="text-2xl font-serif font-bold text-text">
                  Available Rooms at {branch.name}
                </h3>
                <p className="text-xs text-muted mt-1">
                  All reservations include dedicated butler guild care, daily Champagne breakfast, and Solara privileges.
                </p>
              </div>

              {branchRooms.length === 0 ? (
                <div className="p-8 rounded-[var(--radius-card)] bg-surface border border-border text-center space-y-3">
                  <BedDouble className="w-8 h-8 text-gold/60 mx-auto" />
                  <p className="text-sm font-medium text-text">
                    {language === 'km'
                      ? 'បច្ចុប្បន្នមិនទាន់មានបន្ទប់ទំនេរនៅសាខានេះទេ'
                      : 'No accommodations currently available for online booking at this branch.'}
                  </p>
                  <p className="text-xs text-muted max-w-sm mx-auto">
                    Please contact our concierge guild directly for VIP inventory releases and private villa requests.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => navigate('/contact')}>
                    Contact Concierge
                  </Button>
                </div>
              ) : (
                <RoomCardGrid
                  rooms={branchRooms}
                  pageSize={4}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch auto-rows-fr"
                  paginationClassName="pt-8"
                />
              )}
            </div>
          </div>

          {/* Sidebar Booking Card */}
          <aside className="space-y-6">
            <div className="sticky top-28 bg-surface border border-border p-6 rounded-[var(--radius-card)] shadow-xl space-y-6">
              {branch.startingPrice > 0 && (
                <div>
                  <span className="text-xs text-muted block mb-1">
                    Direct Sanctuary Rates From
                  </span>
                  <CatalogNightlyPrice
                    salePrice={branch.startingPrice}
                    listPrice={branch.startingPriceOriginal}
                    discountPercent={branch.startingPriceDiscountPercent}
                    currency={currency}
                    size="lg"
                  />
                </div>
              )}

              {/* Contact info & Operating hours */}
              <div className="space-y-3 pt-4 border-t border-border text-xs text-muted">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                  <span>{branch.address || branch.location}</span>
                </div>
                {branch.contactPhone && (
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-gold shrink-0" />
                    <span>{branch.contactPhone}</span>
                  </div>
                )}
                {branch.contactEmail && (
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-gold shrink-0" />
                    <span className="truncate">{branch.contactEmail}</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5 pt-1 text-slate-300">
                  <Clock className="w-4 h-4 text-gold shrink-0" />
                  <span>
                    Check-in {branch.checkinTime || '14:00'} · Check-out {branch.checkoutTime || '12:00'}
                  </span>
                </div>
              </div>

              {/* Direct Booking Privileges */}
              <div className="p-4 rounded-[var(--radius-button)] bg-bg/60 border border-border/80 text-xs space-y-2">
                <div className="flex items-center gap-2 text-text font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Solara Direct Resident Privileges:</span>
                </div>
                <ul className="text-muted space-y-1 text-[11px] list-disc list-inside">
                  <li>Best rate guarantee direct with Solara Brand</li>
                  <li>Complimentary organic breakfast & welcome elixirs</li>
                  <li>Roundtrip VIP fleet or island speedboat transfer</li>
                  <li>Early check-in & late departure priority</li>
                </ul>
              </div>

              <Button
                variant="gold"
                size="lg"
                className="w-full shadow-md"
                onClick={() => {
                  const targetElement = document.getElementById('available-rooms');
                  targetElement?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Choose Accommodation
              </Button>
            </div>
          </aside>
        </div>
      </div>

      <BranchRelated branch={branch} />

      {/* Photo Modal */}
      <Modal
        isOpen={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        maxWidth="4xl"
      >
        <div className="w-full aspect-[16/10] overflow-hidden rounded-[var(--radius-button)] bg-slate-950">
          <img
            src={activePhoto}
            alt={branch.name}
            className="w-full h-full object-cover"
          />
        </div>
      </Modal>
    </div>
  );
};

export default BranchDetailPage;
