import React from 'react';
import { HeroSection } from '../../components/ui/HeroSection.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useNavigate } from 'react-router-dom';
import { Leaf, HeartHandshake, Award } from 'lucide-react';
import { MARKETING_IMAGES } from '../../constants/marketingImages.js';
import { useApp } from '../../context/AppContext.jsx';

export const AboutPage = () => {
  const navigate = useNavigate();
  const { t, language } = useApp();

  return (
    <div className="w-full pb-24">
      <HeroSection
        image={MARKETING_IMAGES.hero}
        badge={t('about.heritageBadge', 'The Solara Heritage')}
        title={t('about.pageTitle', 'Mindful Luxury Rooted in Cambodian Serenity')}
        subtitle={t('about.pageSubtitle', 'Born from an architectural passion to preserve native craftsmanship while crafting sanctuaries of peerless contemporary comfort.')}
        heightClass="min-h-[460px]"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 space-y-16">
        <section className="space-y-6 text-left">
          <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block">
            {t('about.genesisTag', 'Our Genesis')}
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-text tracking-tight">
            {t('about.genesisTitle', 'An Uncompromising Vision of Barefoot Refinement')}
          </h2>
          <div className="space-y-4 text-sm sm:text-base text-muted leading-relaxed font-light">
            <p>
              {t('about.p1', 'Founded in 2018 along the secluded turquoise bays of Koh Rong, Solara began with a singular premise: luxury hospitality should breathe in harmony with its ancestral environment, rather than dominate it.')}
            </p>
            <p>
              {t('about.p2', 'Over the past decade, our collection has grown into five distinct sanctuaries across Cambodia—from the mist-shrouded peaks of Bokor Highlands to the sacred banyan forests of Siem Reap and the quiet seaside glamour of Kep.')}
            </p>
            <p>
              {t('about.p3', 'Every pavilion, villa, and courtyard is hand-built in partnership with master Cambodian stone carvers, weavers, and bamboo artisans, blending timeless Khmer architectural balance with modern technological comfort.')}
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-border">
          <div className="bg-surface border border-border p-6 rounded-[var(--radius-card)] space-y-3">
            <div className="w-10 h-10 rounded-lg bg-gold/15 text-gold flex items-center justify-center">
              <Leaf className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-serif font-semibold text-text">
              {t('about.zeroWasteTitle', 'Zero-Waste & Conservation')}
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              {t('about.zeroWasteDesc', 'We operate 100% single-use plastic free across all five retreats, with on-site reverse osmosis water purification and solar micro-grids.')}
            </p>
          </div>

          <div className="bg-surface border border-border p-6 rounded-[var(--radius-card)] space-y-3">
            <div className="w-10 h-10 rounded-lg bg-gold/15 text-gold flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-serif font-semibold text-text">
              {t('about.heritageGuildTitle', 'Local Heritage Craft Guild')}
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              {t('about.heritageGuildDesc', 'Over 80% of our architectural artisans and staff are from surrounding communities, preserving indigenous arts and ancient hospitality wisdom.')}
            </p>
          </div>

          <div className="bg-surface border border-border p-6 rounded-[var(--radius-card)] space-y-3">
            <div className="w-10 h-10 rounded-lg bg-gold/15 text-gold flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-serif font-semibold text-text">
              {t('about.awardHonorTitle', 'Global Luxury Recognition')}
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              {t('about.awardHonorDesc', 'Recognized consecutively by Conde Nast Traveler and World Luxury Hotel Awards as Southeast Asia’s most mindful sanctuary retreat.')}
            </p>
          </div>
        </section>

        <section className="bg-gradient-to-r from-slate-950 via-surface to-slate-950 p-8 sm:p-12 rounded-[var(--radius-modal)] border border-border text-white text-center space-y-4">
          <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block">
            {language === 'km' ? 'ការប្តេជ្ញាចិត្តរបស់យើង' : 'Our Promise'}
          </span>
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white max-w-xl mx-auto">
            {language === 'km'
              ? '«យើងខ្ញុំមិនត្រឹមតែផ្តល់ជូននូវកន្លែងស្នាក់នៅប៉ុណ្ណោះទេ ប៉ុន្តែយើងបង្កើតពេលវេលានៃសេចក្តីស្ងប់ក្នុងចិត្តដ៏ជ្រាលជ្រៅ និងស្ថិតស្ថេរជានិច្ច។»'
              : '"We do not merely offer rooms. We craft moments of deep and lasting stillness."'}
          </h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            {language === 'km'
              ? 'សូមអញ្ជើញមកទទួលយកបទពិសោធន៍បដិសណ្ឋារកិច្ចដ៏កក់ក្តៅនេះ នៅរមណីយដ្ឋានទាំង ៥ របស់យើង។'
              : 'Experience our mindful hospitality firsthand at any of our five locations.'}
          </p>
          <div className="pt-4">
            <Button
              variant="gold"
              size="md"
              onClick={() => navigate('/resorts')}
            >
              {t('about.exploreSanctuaries', 'Explore Our Sanctuaries')}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};
