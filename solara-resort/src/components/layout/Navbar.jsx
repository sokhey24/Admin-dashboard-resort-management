import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMotionPresets } from '../../motion/useMotionPresets.js';
import {
  Sun,
  Moon,
  Globe,
  User,
  Menu,
  X,
  Calendar,
  LogOut,
  Bell,
  ChevronDown,
  Phone,
  Mail,
  Clock,
  MessageCircle,
} from 'lucide-react';
import { SITE_CONTACT } from '../../constants/siteContact.js';
import { useApp } from '../../context/AppContext.jsx';
import { Button } from '../ui/Button.jsx';
import { BrandLogo } from '../brand/BrandLogo.jsx';
import { SignOutConfirmDialog } from '../auth/SignOutConfirmDialog.jsx';

const MOBILE_NAV_PANEL_ID = 'solara-mobile-nav-panel';
const SCROLL_THRESHOLD = 20;
/** Fallback until header height is measured (avoids menu covering the bar). */
const FALLBACK_HEADER_HEIGHT_PX = 108;

function openConciergeChat() {
  window.dispatchEvent(new CustomEvent('solara:open-concierge'));
}

function matchPathPrefix(pathname, base) {
  return pathname === base || pathname.startsWith(`${base}/`);
}

/** Precise active-route matching (avoids /resorts matching /resort-only prefix bugs). */
function isNavLinkActive(path, pathname) {
  if (path === '/branches') {
    return (
      matchPathPrefix(pathname, '/branches') ||
      pathname === '/branch' ||
      pathname.startsWith('/branch/') ||
      matchPathPrefix(pathname, '/locations') ||
      matchPathPrefix(pathname, '/resorts') ||
      pathname === '/resort' ||
      pathname.startsWith('/resort/')
    );
  }
  if (path === '/rooms') {
    return matchPathPrefix(pathname, '/rooms') || pathname === '/room' || pathname.startsWith('/room/');
  }
  return matchPathPrefix(pathname, path);
}

function navSegmentTrackClass(isScrolled) {
  return isScrolled
    ? 'inline-flex items-center rounded-[var(--radius-button)] bg-surface/95 p-0.5 border border-border shadow-sm backdrop-blur-sm'
    : 'inline-flex items-center rounded-[var(--radius-button)] bg-black/40 p-0.5 border border-white/15 backdrop-blur-sm';
}

function navSegmentButtonClass(active, isScrolled, variant = 'lang') {
  const sizeClass =
    variant === 'langWide' ? 'h-8 min-h-8 w-[5.75rem] max-w-[5.75rem]' : 'h-8 min-h-8 w-[4.75rem] max-w-[4.75rem]';

  const base = `inline-flex items-center justify-center shrink-0 ${sizeClass} rounded-md text-xs font-medium box-border border border-solid transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 shadow-none`;

  if (active) {
    return `${base} bg-gold text-slate-950 border-gold/40`;
  }

  return isScrolled
    ? `${base} border-transparent text-text-secondary hover:text-text hover:bg-surface-hover/80`
    : `${base} border-transparent text-slate-300 hover:text-white hover:bg-white/10`;
}

/** Hero overlay = light text; scrolled solid bar = theme semantic tokens. */
function navBarForegroundMuted(isScrolled) {
  return isScrolled ? 'text-text-secondary hover:text-gold' : 'text-slate-200 hover:text-gold';
}

function navBarForeground(isScrolled) {
  return isScrolled ? 'text-text' : 'text-slate-200';
}

function useMeasuredHeaderHeight(headerRef) {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return undefined;

    const update = () => {
      setHeight(Math.round(el.getBoundingClientRect().height));
    };

    update();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }

    const observer = new ResizeObserver(() => update());
    observer.observe(el);
    return () => observer.disconnect();
  }, [headerRef]);

  return height;
}

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    theme,
    toggleTheme,
    language,
    setLanguage,
    t,
    user,
    logout,
    unreadCount,
  } = useApp();

  const headerRef = useRef(null);
  const userMenuRef = useRef(null);
  const mobileMenuTriggerRef = useRef(null);
  const mobileNavFirstLinkRef = useRef(null);
  const mobileNavScrollRef = useRef(null);

  const headerHeight = useMeasuredHeaderHeight(headerRef);

  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { reduced, scaleIn, fade, transition, duration } = useMotionPresets();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isWideNav, setIsWideNav] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1280px)').matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1280px)');
    const update = () => setIsWideNav(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const requestSignOut = () => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    setSignOutConfirmOpen(true);
  };

  const handleSignOutConfirm = async () => {
    setSigningOut(true);
    await logout();
    setSigningOut(false);
    setSignOutConfirmOpen(false);
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    navigate('/', { replace: true });
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > SCROLL_THRESHOLD);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setUserMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!userMenuOpen) return undefined;

    const handlePointerDown = (e) => {
      if (signOutConfirmOpen) return;
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [userMenuOpen, signOutConfirmOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    mobileNavScrollRef.current?.scrollTo(0, 0);
    const id = requestAnimationFrame(() => {
      mobileNavFirstLinkRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [mobileMenuOpen]);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
    requestAnimationFrame(() => {
      mobileMenuTriggerRef.current?.focus();
    });
  }, []);

  const chooseLanguage = useCallback(
    (lang) => {
      if (lang === language) return;
      setLanguage(lang);
    },
    [language, setLanguage]
  );

  const navLinks = useMemo(
    () => [
      { label: t('nav.branches', 'Our Resorts'), path: '/branches' },
      { label: t('nav.rooms', 'Rooms'), path: '/rooms' },
      { label: t('nav.activities', 'Activities'), path: '/activities' },
      { label: t('nav.services', 'Services'), path: '/services' },
      { label: t('nav.dining', 'Dining'), path: '/dining' },
      { label: t('nav.gallery', 'Gallery'), path: '/gallery' },
      { label: t('nav.about', 'About'), path: '/about' },
      { label: t('nav.contact', 'Contact'), path: '/contact' },
    ],
    [t]
  );

  const isActive = useCallback((path) => isNavLinkActive(path, location.pathname), [location.pathname]);

  const themeToggleLabel =
    theme === 'dark'
      ? t('nav.switchToLightMode', 'Switch to light mode')
      : t('nav.switchToDarkMode', 'Switch to dark mode');

  const menuTopPx = headerHeight > 0 ? headerHeight : FALLBACK_HEADER_HEIGHT_PX;
  const headerBarSolid = isScrolled || mobileMenuOpen;

  const logoTitleClass = headerBarSolid
    ? 'text-xl font-bold font-serif tracking-[0.2em] text-text'
    : 'text-xl font-bold font-serif tracking-[0.2em] text-white';

  const logoTaglineClass = headerBarSolid
    ? 'text-[9px] uppercase tracking-[0.25em] text-gold -mt-1 font-sans'
    : 'text-[9px] uppercase tracking-[0.25em] text-gold-light -mt-1 font-sans';

  const iconBtnClass = `p-2 rounded-[var(--radius-button)] transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 ${navBarForegroundMuted(headerBarSolid)}`;

  const mobileMenuMaxHeight = `calc(100dvh - ${menuTopPx}px)`;

  const resortDisplayName = `${t('brand.name', 'SOLARA')} ${t('brand.tagline', 'Resort & Spa')}`;
  const topBarMuted = headerBarSolid ? 'text-text-secondary' : 'text-slate-300';
  const topBarLink = headerBarSolid
    ? 'text-text-secondary hover:text-gold'
    : 'text-slate-200 hover:text-gold-light';
  const topBarBorder = headerBarSolid ? 'border-border/60' : 'border-white/10';
  const topBarBg = headerBarSolid ? 'bg-bg-secondary/80' : 'bg-black/35';

  return (
    <header
      ref={headerRef}
      className={`fixed top-0 left-0 right-0 z-50 overflow-visible transition-[background-color,box-shadow,padding,border-color] duration-300 ${
        headerBarSolid
          ? 'bg-bg/95 backdrop-blur-xl border-b border-border shadow-sm'
          : 'bg-gradient-to-b from-black/30 via-black/15 to-transparent backdrop-blur-sm'
      }`}
    >
      <div
        className={`${topBarBg} border-b ${topBarBorder} backdrop-blur-md transition-colors duration-300`}
        aria-label={t('nav.utilityBar', 'Resort contact and concierge')}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 py-1.5 min-h-[34px] text-[10px] sm:text-[11px]">
            <p
              className={`hidden lg:block font-medium tracking-wide truncate shrink min-w-0 ${headerBarSolid ? 'text-text' : 'text-white'}`}
              title={resortDisplayName}
            >
              {resortDisplayName}
            </p>
            <div className="flex flex-1 lg:flex-none items-center justify-start lg:justify-center gap-x-3 sm:gap-x-4 overflow-x-auto no-scrollbar min-w-0">
              <span className={`lg:hidden font-medium shrink-0 ${headerBarSolid ? 'text-text' : 'text-white'}`}>
                {t('brand.name', 'SOLARA')}
              </span>
              <a
                href={SITE_CONTACT.phoneHref}
                className={`inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap transition-colors ${topBarLink}`}
              >
                <Phone className="w-3 h-3 text-gold shrink-0" aria-hidden />
                <span>{SITE_CONTACT.phone}</span>
              </a>
              <a
                href={SITE_CONTACT.emailHref}
                className={`hidden sm:inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap transition-colors max-w-[11rem] sm:max-w-none truncate ${topBarLink}`}
              >
                <Mail className="w-3 h-3 text-gold shrink-0" aria-hidden />
                <span className="truncate">{SITE_CONTACT.email}</span>
              </a>
              <span className={`hidden md:inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap ${topBarMuted}`}>
                <Clock className="w-3 h-3 text-gold shrink-0" aria-hidden />
                {t('nav.conciergeHours', '24/7 Concierge')}
              </span>
            </div>
            <button
              type="button"
              onClick={openConciergeChat}
              className={`inline-flex items-center gap-1.5 shrink-0 font-semibold uppercase tracking-wider transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 rounded-sm px-1 ${
                headerBarSolid ? 'text-gold hover:text-gold-light' : 'text-gold-light hover:text-white'
              }`}
              aria-label={t('nav.openConciergeChat', 'Open AI concierge chat')}
            >
              <MessageCircle className="w-3.5 h-3.5 shrink-0" aria-hidden />
              <span className="hidden sm:inline">{t('nav.liveChat', 'Live Chat')}</span>
            </button>
          </div>
        </div>
      </div>

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${headerBarSolid ? 'py-2.5 sm:py-3.5' : 'py-3 sm:py-4'}`}>
        <div className="flex flex-nowrap items-center justify-between gap-2 sm:gap-3 lg:gap-4 min-w-0">
          <BrandLogo
            to="/"
            showWordmark
            name={t('brand.name', 'SOLARA')}
            tagline={t('brand.tagline', 'Resort & Spa')}
            imgClassName="h-9 w-auto max-w-[44px] sm:h-10 sm:max-w-[52px] object-contain object-left shrink-0"
            className="shrink min-w-0 max-w-[min(100%,11rem)] sm:max-w-none"
            titleClassName={`${logoTitleClass} hidden sm:block text-lg sm:text-xl`}
            taglineClassName={`${logoTaglineClass} hidden md:block`}
          />

          <nav
            className="hidden xl:flex items-center gap-4 2xl:gap-6 min-w-0"
            aria-label={t('nav.primaryNavigation', 'Primary navigation')}
          >
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-xs font-medium tracking-wider uppercase transition-colors duration-200 relative py-1.5 px-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 rounded-sm ${
                    active ? 'text-gold' : navBarForegroundMuted(headerBarSolid)
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  {link.label}
                  <span
                    className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gold rounded-full origin-center transition-all duration-200 ${
                      active ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-75'
                    }`}
                    aria-hidden
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex flex-nowrap items-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-2.5 shrink-0">
            <div
              role="group"
              aria-label={t('nav.translate', 'Language')}
              className={`notranslate ${navSegmentTrackClass(headerBarSolid)} hidden xl:inline-flex gap-1 pl-1.5 pr-0.5`}
            >
              <Globe className="w-3.5 h-3.5 text-gold shrink-0 self-center ml-0.5" aria-hidden />
              <button
                type="button"
                onClick={() => chooseLanguage('km')}
                className={`${navSegmentButtonClass(language === 'km', headerBarSolid, 'lang')} gap-1`}
                aria-pressed={language === 'km'}
                title={t('nav.languageKhTitle', 'Khmer language')}
              >
                <span>ខ្មែរ</span>
              </button>
              <button
                type="button"
                onClick={() => chooseLanguage('en')}
                className={`${navSegmentButtonClass(language === 'en', headerBarSolid, 'lang')} gap-1`}
                aria-pressed={language === 'en'}
                title={t('nav.languageEnTitle', 'English language')}
              >
                <span>{t('nav.languageEnShort', 'EN')}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className={`hidden xl:inline-flex hover:bg-surface/50 ${iconBtnClass}`}
              title={themeToggleLabel}
              aria-label={themeToggleLabel}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-gold shrink-0" aria-hidden />
              ) : (
                <Moon className={`w-4 h-4 shrink-0 ${headerBarSolid ? 'text-text' : 'text-slate-200'}`} aria-hidden />
              )}
            </button>

            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setUserMenuOpen((open) => !open);
                    window.dispatchEvent(new CustomEvent('solara:dining-cart-blur'));
                  }}
                  className="flex items-center gap-2 p-1.5 rounded-[var(--radius-button)] hover:bg-surface/60 transition-colors duration-200 cursor-pointer border border-transparent hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                  aria-label={t('nav.userAccountMenu', 'User account menu')}
                >
                  <img
                    src={user.avatar}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover border border-gold/40"
                  />
                  <span
                    className={`hidden md:inline text-xs font-medium max-w-[100px] lg:max-w-[110px] truncate ${navBarForeground(headerBarSolid)}`}
                  >
                    {user.name}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-muted transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      className={`w-56 max-w-[min(20rem,calc(100vw-2rem))] bg-surface/95 backdrop-blur-md border border-border rounded-[var(--radius-modal)] shadow-2xl p-2 z-[110] text-text ${
                        isWideNav ? 'absolute right-0 mt-2' : 'fixed left-4 right-4'
                      }`}
                      style={isWideNav ? undefined : { top: menuTopPx + 8 }}
                      {...scaleIn()}
                      transition={transition(duration.button)}
                    >
                      <div className="px-3 py-2 border-b border-border/80 mb-1">
                        <p className="text-xs font-semibold text-text truncate">{user.name}</p>
                        <p className="text-[11px] text-muted truncate">{user.email}</p>
                        {user.memberTier && (
                          <div className="mt-1.5 inline-block text-[10px] font-semibold text-gold bg-gold/15 px-2 py-0.5 rounded border border-gold/30">
                            {user.memberTier}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <Link
                          to="/account"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] rounded-[var(--radius-button)] text-xs text-text hover:bg-surface-hover hover:text-gold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
                        >
                          <User className="w-3.5 h-3.5 text-gold shrink-0" aria-hidden />
                          <span>{t('nav.account', 'Account Dashboard')}</span>
                        </Link>

                        <Link
                          to="/account/bookings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] rounded-[var(--radius-button)] text-xs text-text hover:bg-surface-hover hover:text-gold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
                        >
                          <Calendar className="w-3.5 h-3.5 text-gold shrink-0" aria-hidden />
                          <span>{t('nav.bookings', 'My Bookings')}</span>
                        </Link>

                        <Link
                          to="/account/notifications"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center justify-between px-3 py-2.5 min-h-[44px] rounded-[var(--radius-button)] text-xs text-text hover:bg-surface-hover hover:text-gold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
                        >
                          <div className="flex items-center gap-2.5">
                            <Bell className="w-3.5 h-3.5 text-gold shrink-0" aria-hidden />
                            <span>{t('nav.notifications', 'Notifications')}</span>
                          </div>
                          {unreadCount > 0 && (
                            <span
                              className="min-w-[1rem] h-4 px-1 rounded-full bg-gold text-slate-950 font-bold text-[10px] flex items-center justify-center"
                              aria-label={`${unreadCount} unread`}
                            >
                              {unreadCount}
                            </span>
                          )}
                        </Link>
                      </div>

                      <button
                        type="button"
                        onClick={requestSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] rounded-[var(--radius-button)] text-xs text-rose-400 hover:bg-surface-hover transition-colors text-left border-t border-border/60 mt-1 pt-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
                      >
                        <LogOut className="w-3.5 h-3.5 shrink-0" aria-hidden />
                        <span>{t('nav.signOut', 'Sign Out')}</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/login')}
                  className="hidden sm:inline-flex text-xs py-1.5 px-2.5 lg:px-3 shrink-0"
                >
                  {t('nav.signIn', 'Sign In')}
                </Button>
                <Button
                  variant="gold"
                  size="sm"
                  onClick={() => navigate('/booking')}
                  className="text-xs py-1.5 px-2 sm:px-3 shrink-0 min-h-[40px] sm:min-h-[34px]"
                >
                  <span className="sm:hidden">{t('nav.bookShort', 'Book')}</span>
                  <span className="hidden sm:inline">{t('nav.bookStay', 'Book Stay')}</span>
                </Button>
              </div>
            )}

            <button
              ref={mobileMenuTriggerRef}
              type="button"
              onClick={() => {
                setUserMenuOpen(false);
                setMobileMenuOpen((open) => !open);
              }}
              className={`xl:hidden inline-flex items-center justify-center min-h-[44px] min-w-[44px] hover:bg-surface/50 ${iconBtnClass}`}
              aria-expanded={mobileMenuOpen}
              aria-controls={MOBILE_NAV_PANEL_ID}
              aria-label={
                mobileMenuOpen
                  ? t('nav.closeMenu', 'Close navigation menu')
                  : t('nav.openMenu', 'Open navigation menu')
              }
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {mobileMenuOpen && (
              <>
                <motion.div
                  className="xl:hidden fixed inset-x-0 bg-black/45 backdrop-blur-[2px] z-[100]"
                  style={{ top: menuTopPx, bottom: 0 }}
                  {...fade()}
                  transition={transition(duration.button)}
                  onClick={closeMobileMenu}
                  aria-hidden
                />
                <motion.div
                  id={MOBILE_NAV_PANEL_ID}
                  role="dialog"
                  aria-modal="true"
                  aria-label={t('nav.menu', 'Menu ')}
                  className="xl:hidden fixed inset-x-0 z-[105] flex flex-col bg-bg border-b border-border shadow-2xl overflow-hidden"
                  style={{ top: menuTopPx, maxHeight: mobileMenuMaxHeight }}
                  initial={{ opacity: 0, y: reduced ? 0 : -16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reduced ? 0 : -12 }}
                  transition={transition(duration.button)}
                >
                  <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-bg px-4 py-3">
                    <p className="text-sm font-semibold tracking-wide text-text">
                      {t('nav.menu', 'Menu')}
                    </p>
                    <button
                      type="button"
                      onClick={closeMobileMenu}
                      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-button)] text-text-secondary hover:bg-surface-hover hover:text-text cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
                      aria-label={t('nav.closeMenu', 'Close  menu')}
                    >
                      <X className="w-5 h-5" aria-hidden />
                    </button>
                  </div>

                  <div
                    ref={mobileNavScrollRef}
                    className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y"
                  >
                    <nav
                      className="px-4 sm:px-6 pt-4 pb-2 flex flex-col gap-2"
                      aria-label={t('nav.primaryNavigation', 'Primary navigation')}
                    >
                      {navLinks.map((link, index) => {
                        const active = isActive(link.path);
                        return (
                          <Link
                            key={link.path}
                            ref={index === 0 ? mobileNavFirstLinkRef : undefined}
                            to={link.path}
                            onClick={closeMobileMenu}
                            className={`text-sm font-medium tracking-wider uppercase min-h-[44px] flex items-center px-3 rounded-[var(--radius-button)] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 ${
                              active
                                ? 'bg-gold/15 text-gold border border-gold/30'
                                : 'text-text border border-transparent hover:bg-surface-hover hover:text-gold'
                            }`}
                            aria-current={active ? 'page' : undefined}
                          >
                            {link.label}
                          </Link>
                        );
                      })}
                    </nav>

                    <div className="border-t border-border px-4 sm:px-6 py-5 flex flex-col gap-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted font-medium mb-2 px-1">
                          {t('nav.preferencesSection', 'Preferences')}
                        </p>
                        <div className="flex flex-col gap-3 px-1">
                          <div className="flex flex-col gap-2">
                            <span className="text-[11px] text-muted inline-flex items-center gap-1.5">
                              <Globe className="w-3.5 h-3.5 text-gold" aria-hidden />
                              {t('nav.translate', 'Language')}
                            </span>
                            <div
                              role="group"
                              aria-label={t('nav.translate', 'Language')}
                              className="notranslate inline-flex self-start rounded-[var(--radius-button)] bg-surface p-0.5 border border-border gap-0.5"
                            >
                              <button
                                type="button"
                                onClick={() => chooseLanguage('km')}
                                className={`${navSegmentButtonClass(language === 'km', true, 'lang')} gap-1`}
                                aria-pressed={language === 'km'}
                              >
                                ខ្មែរ
                              </button>
                              <button
                                type="button"
                                onClick={() => chooseLanguage('en')}
                                className={`${navSegmentButtonClass(language === 'en', true, 'langWide')} gap-1`}
                                aria-pressed={language === 'en'}
                              >
                                {t('nav.languageEnLong', 'English')}
                              </button>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={toggleTheme}
                            className="inline-flex items-center gap-2 min-h-[44px] px-3 rounded-[var(--radius-button)] text-xs text-text border border-border bg-surface hover:bg-surface-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
                            aria-label={themeToggleLabel}
                          >
                            {theme === 'dark' ? (
                              <Sun className="w-4 h-4 text-gold" aria-hidden />
                            ) : (
                              <Moon className="w-4 h-4 text-gold" aria-hidden />
                            )}
                            <span>{themeToggleLabel}</span>
                          </button>
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted font-medium mb-2 px-1">
                          {t('nav.authenticationSection', 'Account')}
                        </p>
                        {!user ? (
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              size="md"
                              className="min-h-[44px]"
                              onClick={() => {
                                closeMobileMenu();
                                navigate('/login');
                              }}
                            >
                              {t('nav.signIn', 'Sign In')}
                            </Button>
                            <Button
                              variant="gold"
                              size="md"
                              className="min-h-[44px]"
                              onClick={() => {
                                closeMobileMenu();
                                navigate('/booking');
                              }}
                            >
                              {t('nav.bookStay', 'Book Stay')}
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Button
                              variant="secondary"
                              size="md"
                              className="w-full justify-start min-h-[44px]"
                              onClick={() => {
                                closeMobileMenu();
                                navigate('/account');
                              }}
                              leftIcon={<User className="w-4 h-4 text-gold" />}
                            >
                              {t('nav.account', 'Account Dashboard')}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full text-rose-400 min-h-[44px]"
                              onClick={requestSignOut}
                            >
                              {t('nav.signOut', 'Sign Out')}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}

      <SignOutConfirmDialog
        isOpen={signOutConfirmOpen}
        onClose={() => !signingOut && setSignOutConfirmOpen(false)}
        onConfirm={handleSignOutConfirm}
        confirming={signingOut}
      />
    </header>
  );
};
