import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { BrandLogo } from '../brand/BrandLogo.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { useWebsiteContent } from '../../hooks/useWebsiteContent.js';
import { resolveContactDetails } from '../../util/marketingContent.js';
import { SITE_CONTACT } from '../../constants/siteContact.js';

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t, language } = useApp();
  const { grouped } = useWebsiteContent();

  const contact = useMemo(
    () => resolveContactDetails(grouped, { t, language, siteContact: SITE_CONTACT }),
    [grouped, t, language]
  );

  const copyrightLine =
    contact.copyright ||
    `© ${currentYear} ${t('brand.name', 'Solara')} Resort & Spa Group. ${t('footer.rights', 'All rights reserved.')}`;

  return (
    <footer className="w-full bg-bg-secondary border-t border-border text-text-secondary pt-16 pb-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-12">
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo
              to="/"
              showWordmark
              name={t('brand.name', 'SOLARA')}
              tagline={t('brand.tagline', 'Resort & Spa')}
              titleClassName="text-xl font-bold font-serif tracking-[0.2em] text-text"
              taglineClassName="text-[9px] uppercase tracking-[0.25em] text-gold -mt-1 font-sans"
              imgClassName="h-10 w-auto max-w-[52px] object-contain object-left"
              imageSrc={contact.logoUrl}
            />
            <p className="text-xs text-muted leading-relaxed max-w-sm">
              {t(
                'home.heroSubtitle',
                'An architectural celebration of barefoot luxury, mindful heritage, and pristine Southeast Asian sanctuaries across Koh Rong, Siem Reap, Bokor Highlands, and Kep Bay.'
              )}
            </p>
            {(contact.checkIn || contact.checkOut) && (
              <p className="text-[11px] text-muted">
                {t('footer.checkIn', 'Check-in')}: {contact.checkIn} · {t('footer.checkOut', 'Check-out')}:{' '}
                {contact.checkOut}
              </p>
            )}
            <div className="flex items-center gap-2 text-xs text-gold font-medium pt-2">
              <Sparkles className="w-4 h-4" />
              <span>{t('brand.winner', 'World Luxury Hotel Awards 2026 Winner')}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text font-serif">
              {t('nav.branches', 'Our Locations')} & {t('nav.rooms', 'Rooms')}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/branches" className="hover:text-gold transition-colors">
                  {t('branches.pageTitle', 'All Branch Sanctuaries')}
                </Link>
              </li>
              <li>
                <Link to="/rooms" className="hover:text-gold transition-colors">
                  {t('rooms.pageTitle', 'Villas & Quarters')}
                </Link>
              </li>
              <li>
                <Link to="/branches?destination=Koh+Rong" className="hover:text-gold transition-colors">
                  Koh Rong Island Branch
                </Link>
              </li>
              <li>
                <Link to="/branches?destination=Siem+Reap" className="hover:text-gold transition-colors">
                  Siem Reap Heritage Branch
                </Link>
              </li>
              <li>
                <Link to="/branches?destination=Kampot" className="hover:text-gold transition-colors">
                  Kampot Riverside Branch
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text font-serif">
              {t('nav.activities', 'Experience')}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/dining" className="hover:text-gold transition-colors">
                  {t('nav.dining', 'Fine Dining & Cellars')}
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-gold transition-colors">
                  {t('nav.services', 'Lotus Flower Spa')}
                </Link>
              </li>
              <li>
                <Link to="/activities" className="hover:text-gold transition-colors">
                  {t('nav.activities', 'Catamaran & Diving')}
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="hover:text-gold transition-colors">
                  {t('nav.gallery', 'Photography Gallery')}
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-gold transition-colors">
                  {t('nav.about', 'Our Heritage & Vision')}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text font-serif">
              {t('nav.contact', 'Concierge')}
            </h4>
            <div className="space-y-2.5 text-xs text-muted">
              <p className="text-xs text-muted leading-relaxed">
                {t(
                  'footer.conciergeBlurb',
                  'Reach our guest concierge team for reservations, transfers, and bespoke experiences.'
                )}
              </p>
              <p>
                <a href={contact.phoneHref} className="hover:text-gold transition-colors block">
                  {contact.phonePrimary}
                </a>
                {contact.phoneSecondary && (
                  <span className="block text-[11px] mt-0.5">{contact.phoneSecondary}</span>
                )}
              </p>
              <p>
                <a href={contact.emailHref} className="hover:text-gold transition-colors">
                  {contact.emailPrimary}
                </a>
                {contact.emailSecondary && (
                  <span className="block text-[11px] mt-0.5">{contact.emailSecondary}</span>
                )}
              </p>
              {contact.address && <p className="text-[11px]">{contact.address}</p>}
              <div className="flex flex-wrap gap-3 pt-1">
                {contact.facebookUrl && (
                  <a
                    href={contact.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold hover:underline"
                  >
                    Facebook
                  </a>
                )}
                {contact.telegramUrl && (
                  <a
                    href={contact.telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold hover:underline"
                  >
                    Telegram
                  </a>
                )}
                {contact.instagramUrl && (
                  <a
                    href={contact.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold hover:underline"
                  >
                    Instagram
                  </a>
                )}
              </div>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 text-gold hover:underline text-xs font-medium pt-1"
              >
                <Mail className="w-3.5 h-3.5" />
                {t('nav.contact', 'Contact Concierge')}
              </Link>
            </div>
          </div>
        </div>

        <div className="py-6 border-t border-border flex flex-wrap items-center justify-between gap-4 text-xs text-muted">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium text-text-secondary">
              {t('footer.acceptedPayments', 'Accepted Payments:')}
            </span>
            <div className="flex items-center gap-2 font-medium">
              <span className="bg-surface px-2 py-0.5 rounded border border-border text-[10px] text-gold font-bold">
                KHQR (Bakong)
              </span>
              <span className="bg-surface px-2 py-0.5 rounded border border-border text-[10px]">
                Visa / Mastercard
              </span>
              <span className="bg-surface px-2 py-0.5 rounded border border-border text-[10px]">
                Wing / ABA Pay
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>{t('footer.ssl', 'Verified 256-bit SSL Secure Booking')}</span>
            </span>
          </div>
        </div>

        <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-muted">
          <p>{copyrightLine}</p>
          <div className="flex items-center gap-4">
            <Link to="/about" className="hover:text-gold transition-colors">
              {t('footer.privacy', 'Privacy Policy')}
            </Link>
            <Link to="/about" className="hover:text-gold transition-colors">
              {t('footer.terms', 'Terms of Hospitality')}
            </Link>
            <Link to="/contact" className="hover:text-gold transition-colors">
              {t('footer.support', 'Guest Support')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
