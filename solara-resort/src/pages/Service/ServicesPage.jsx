import React, { useState, useCallback, useMemo } from 'react';
import { HeroSection } from '../../components/ui/HeroSection.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useNavigate } from 'react-router-dom';
import { MARKETING_IMAGES } from '../../constants/marketingImages.js';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { SERVICES_FIXTURE, SANCTUARY_FIXTURE } from '../../data/servicesData.js';
import { ServiceList } from '../../components/services/ServiceList.jsx';
import { ServiceInquiryModal } from '../../components/services/ServiceInquiryModal.jsx';
import ROUTES from '../../config/routes.js';

export const ServicesPage = () => {
  const navigate = useNavigate();
  const { t, localize, user, currency } = useApp();

  const [selectedService, setSelectedService] = useState(null);

  const services = SERVICES_FIXTURE;
  const showEmpty = services.length === 0;

  const localizedSanctuaries = useMemo(
    () => SANCTUARY_FIXTURE.map((s) => (localize ? localize(s) : s)),
    [localize]
  );

  const selectedDisplay = selectedService
    ? (localize ? localize(selectedService) : selectedService)
    : null;

  const openInquiryModal = useCallback((rawService) => {
    setSelectedService(rawService);
  }, []);

  const closeInquiryModal = useCallback(() => {
    setSelectedService(null);
  }, []);

  const scrollToServices = () => {
    document.getElementById('services-catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const listLabels = useMemo(
    () => ({
      signatureLabel: t('services.signatureService', 'Solara Signature Service'),
      inquireLabel: t('services.inquireConcierge', 'Inquire with Concierge'),
      bookLabel: t('services.bookPerks', 'Reserve Room with Privileges'),
      durationLabel: t('activities.duration', 'Duration'),
      fromLabel: t('common.from', 'From'),
      complimentaryLabel: t('services.complimentaryConsultation', 'Complimentary consultation'),
    }),
    [t]
  );

  return (
    <div className="w-full pb-24 overflow-x-hidden">
      <HeroSection
        image={MARKETING_IMAGES.spa}
        badge={t('services.heroEyebrow', 'The Solara Standard')}
        title={t('services.heroTitle', 'Restorative Sanctuary Services')}
        subtitle={t(
          'services.heroSubtitle',
          'Mindful wellness, Khmer-inspired rituals, and unhurried care—every treatment is composed to restore balance and quiet the senses.'
        )}
        heightClass="min-h-[440px] sm:min-h-[480px] lg:min-h-[520px]"
      >
        <Button variant="gold" size="md" type="button" onClick={scrollToServices} className="shadow-lg">
          {t('services.exploreCta', 'Explore Services')}
        </Button>
      </HeroSection>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16 space-y-16">
        <section className="text-center max-w-2xl mx-auto space-y-4">
          <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block">
            {t('services.solaraStandard', 'The Solara Standard')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-text tracking-tight">
            {t('services.introHeadline', 'Every detail is designed around your wellbeing.')}
          </h2>
          <p className="text-xs sm:text-sm text-muted leading-relaxed font-light">
            {t(
              'services.introDesc',
              'From restorative spa therapies to personalized wellness planning, Solara blends premium hospitality with Khmer heritage—so each moment feels calm, considered, and entirely yours.'
            )}
          </p>
        </section>

        {showEmpty ? (
          <EmptyState
            title={t('services.emptyTitle', 'No Services Available')}
            description={t(
              'services.emptyDesc',
              'Sanctuary services will appear here once our team publishes the catalog.'
            )}
            actionText={t('services.exploreResort', 'Explore Resort')}
            onAction={() => navigate(ROUTES.resorts)}
          />
        ) : (
          <div id="services-catalog">
            <ServiceList
              services={services}
              localize={localize}
              currency={currency}
              labels={listLabels}
              onInquire={openInquiryModal}
              onBookRoom={() => navigate(ROUTES.booking)}
            />
          </div>
        )}

        {!showEmpty && (
          <>
            <section
              className="rounded-[var(--radius-card)] border border-gold/25 bg-gradient-to-br from-surface via-surface to-gold/5 p-8 sm:p-12 text-center space-y-4"
              aria-labelledby="services-concierge-cta"
            >
              <h2 id="services-concierge-cta" className="text-xl sm:text-2xl font-serif font-bold text-text">
                {t('services.conciergeCtaTitle', 'Personalized care, one message away')}
              </h2>
              <p className="text-sm text-muted max-w-xl mx-auto leading-relaxed font-light">
                {t(
                  'services.conciergeCtaDesc',
                  'Our concierge team can tailor treatments, schedule private sessions, and coordinate wellness for your entire party.'
                )}
              </p>
              <Button
                variant="gold"
                size="sm"
                type="button"
                className="shadow-sm"
                onClick={() => openInquiryModal(services[0])}
              >
                {t('services.inquireConcierge', 'Inquire with Concierge')}
              </Button>
            </section>

            <section
              className="rounded-[var(--radius-card)] border border-border bg-surface p-8 sm:p-12 flex flex-col lg:flex-row items-center justify-between gap-6 text-center lg:text-left"
              aria-labelledby="services-reservation-cta"
            >
              <div className="space-y-2 max-w-xl">
                <h2 id="services-reservation-cta" className="text-xl sm:text-2xl font-serif font-bold text-text">
                  {t('services.reservationCtaTitle', 'Reserve your sanctuary stay')}
                </h2>
                <p className="text-sm text-muted leading-relaxed font-light">
                  {t(
                    'services.reservationCtaDesc',
                    'Book a room with resident privileges—spa credits, late checkout, and priority wellness scheduling.'
                  )}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="w-full lg:w-auto shrink-0"
                onClick={() => navigate(ROUTES.booking)}
              >
                {t('services.bookPerks', 'Reserve Room with Privileges')}
              </Button>
            </section>
          </>
        )}
      </div>

      <ServiceInquiryModal
        isOpen={Boolean(selectedService)}
        service={selectedService}
        display={selectedDisplay}
        sanctuaries={localizedSanctuaries}
        t={t}
        user={user}
        onClose={closeInquiryModal}
      />
    </div>
  );
};
