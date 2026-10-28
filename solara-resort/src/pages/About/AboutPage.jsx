import React, { useMemo } from 'react';
import { HeroSection } from '../../components/ui/HeroSection.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useNavigate } from 'react-router-dom';
import { MARKETING_IMAGES } from '../../constants/marketingImages.js';
import { useApp } from '../../context/AppContext.jsx';
import { useWebsiteContent } from '../../hooks/useWebsiteContent.js';
import {
  cmsText,
  getCmsMediaUrl,
  resolveAboutCoreValues,
} from '../../util/marketingContent.js';

export const AboutPage = () => {
  const navigate = useNavigate();
  const { t, language } = useApp();
  const { grouped } = useWebsiteContent();

  const heroBadge = cmsText(
    grouped,
    'about',
    'hero_badge',
    'hero_badge_km',
    language,
    t('about.heritageBadge', 'The Solara Heritage')
  );
  const heroTitle = cmsText(
    grouped,
    'about',
    'hero_title',
    'hero_title_km',
    language,
    t('about.pageTitle', 'Mindful Luxury Rooted in Cambodian Serenity')
  );
  const heroSubtitle = cmsText(
    grouped,
    'about',
    'hero_subtitle',
    'hero_subtitle_km',
    language,
    t(
      'about.pageSubtitle',
      'Born from an architectural passion to preserve native craftsmanship while crafting sanctuaries of peerless contemporary comfort.'
    )
  );
  const heroImage = getCmsMediaUrl(grouped, 'about', 'hero_image') || MARKETING_IMAGES.hero;

  const genesisTag = cmsText(
    grouped,
    'about',
    'genesis_tag',
    'genesis_tag_km',
    language,
    t('about.genesisTag', 'Our Genesis')
  );
  const genesisTitle = cmsText(
    grouped,
    'about',
    'genesis_title',
    'genesis_title_km',
    language,
    t('about.genesisTitle', 'An Uncompromising Vision of Barefoot Refinement')
  );
  const p1 = cmsText(
    grouped,
    'about',
    'p1',
    'p1_km',
    language,
    t(
      'about.p1',
      'Founded in 2018 along the secluded turquoise bays of Koh Rong, Solara began with a singular premise: luxury hospitality should breathe in harmony with its ancestral environment, rather than dominate it.'
    )
  );
  const p2 = cmsText(
    grouped,
    'about',
    'p2',
    'p2_km',
    language,
    t(
      'about.p2',
      'Over the past decade, our collection has grown into five distinct sanctuaries across Cambodia—from the mist-shrouded peaks of Bokor Highlands to the sacred banyan forests of Siem Reap and the quiet seaside glamour of Kep.'
    )
  );
  const p3 = cmsText(
    grouped,
    'about',
    'p3',
    'p3_km',
    language,
    t(
      'about.p3',
      'Every pavilion, villa, and courtyard is hand-built in partnership with master Cambodian stone carvers, weavers, and bamboo artisans, blending timeless Khmer architectural balance with modern technological comfort.'
    )
  );

  const coreValues = useMemo(
    () => resolveAboutCoreValues(grouped, { t, language }),
    [grouped, t, language]
  );

  const quoteText = cmsText(
    grouped,
    'about',
    'quote_text',
    'quote_text_km',
    language,
    language === 'km'
      ? '«យើងខ្ញុំមិនត្រឹមតែផ្តល់ជូននូវកន្លែងស្នាក់នៅប៉ុណ្ណោះទេ ប៉ុន្តែយើងបង្កើតពេលវេលានៃសេចក្តីស្ងប់ក្នុងចិត្តដ៏ជ្រាលជ្រៅ និងស្ថិតស្ថេរជានិច្ច។»'
      : '"We do not merely offer rooms. We craft moments of deep and lasting stillness."'
  );
  const quoteAuthor = cmsText(
    grouped,
    'about',
    'quote_author',
    'quote_author_km',
    language,
    language === 'km'
      ? 'សូមអញ្ជើញមកទទួលយកបទពិសោធន៍បដិសណ្ឋារកិច្ចដ៏កក់ក្តៅនេះ នៅរមណីយដ្ឋានទាំង ៥ របស់យើង។'
      : 'Experience our mindful hospitality firsthand at any of our five locations.'
  );

  return (
    <div className="w-full pb-24">
      <HeroSection
        image={heroImage}
        badge={heroBadge}
        title={heroTitle}
        subtitle={heroSubtitle}
        heightClass="min-h-[460px]"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 space-y-16">
        <section className="space-y-6 text-left">
          <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block">
            {genesisTag}
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-text tracking-tight">
            {genesisTitle}
          </h2>
          <div className="space-y-4 text-sm sm:text-base text-muted leading-relaxed font-light">
            <p>{p1}</p>
            <p>{p2}</p>
            <p>{p3}</p>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-border">
          {coreValues.map((value) => {
            const Icon = value.icon;
            return (
              <div
                key={value.title}
                className="bg-surface border border-border p-6 rounded-[var(--radius-card)] space-y-3"
              >
                <div className="w-10 h-10 rounded-lg bg-gold/15 text-gold flex items-center justify-center">
                  <Icon className="w-5 h-5" aria-hidden />
                </div>
                <h3 className="text-lg font-serif font-semibold text-text">{value.title}</h3>
                <p className="text-xs text-muted leading-relaxed">{value.description}</p>
              </div>
            );
          })}
        </section>

        <section className="bg-gradient-to-r from-slate-950 via-surface to-slate-950 p-8 sm:p-12 rounded-[var(--radius-modal)] border border-border text-white text-center space-y-4">
          <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block">
            {language === 'km' ? 'ការប្តេជ្ញាចិត្តរបស់យើង' : 'Our Promise'}
          </span>
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white max-w-xl mx-auto">
            {quoteText}
          </h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto">{quoteAuthor}</p>
          <div className="pt-4">
            <Button variant="gold" size="md" onClick={() => navigate('/resorts')}>
              {t('about.exploreSanctuaries', 'Explore Our Sanctuaries')}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};
