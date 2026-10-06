import React, { useState, useEffect } from 'react';
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
  ChevronDown
} from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { Button } from '../ui/Button.jsx';
import { BrandLogo } from '../brand/BrandLogo.jsx';
import { SignOutConfirmDialog } from '../auth/SignOutConfirmDialog.jsx';

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    theme,
    toggleTheme,
    currency,
    setCurrency,
    toggleCurrency,
    language,
    setLanguage,
    t,
    user,
    logout,
    unreadCount,
  } = useApp();

  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { reduced, scaleIn, fade, transition, duration } = useMotionPresets();

  const requestSignOut = () => {
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

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
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

  const navLinks = [
    { label: t('nav.branches', 'Our Locations'), path: '/branches' },
    { label: t('nav.rooms', 'Rooms'), path: '/rooms' },
    { label: t('nav.activities', 'Activities'), path: '/activities' },
    { label: t('nav.services', 'Services'), path: '/services' },
    { label: t('nav.dining', 'Dining'), path: '/dining' },
    { label: t('nav.gallery', 'Gallery'), path: '/gallery' },
    { label: t('nav.about', 'About'), path: '/about' },
    { label: t('nav.contact', 'Contact'), path: '/contact' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/branches') {
      return (
        location.pathname.startsWith('/branches') ||
        location.pathname.startsWith('/branch') ||
        location.pathname.startsWith('/locations') ||
        location.pathname.startsWith('/resorts') ||
        location.pathname.startsWith('/resort')
      );
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${isScrolled
          ? 'bg-bg/90 backdrop-blur-md border-b border-border shadow-md py-3.5'
          : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent py-5'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <BrandLogo
            to="/"
            showWordmark
            name={t('brand.name', 'SOLARA')}
            tagline={t('brand.tagline', 'Resort & Spa')}
            imgClassName="h-10 w-auto max-w-[52px] object-contain object-left"
          />

          <nav
            className="hidden xl:flex items-center gap-6 2xl:gap-8"
            aria-label="Primary Navigation"
          >
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-xs font-medium tracking-wider uppercase transition-colors relative py-1 hover:text-gold ${active ? 'text-gold' : 'text-slate-200'
                    }`}
                  aria-current={active ? 'page' : undefined}
                >
                  {link.label}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Dual Currency Switcher [ USD ($) | KHR (៛) ] */}
            <div className="inline-flex items-center rounded-lg bg-black/40 p-0.5 border border-white/10 text-xs backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-2 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  currency === 'USD'
                    ? 'bg-gold text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="US Dollar"
              >
                USD ($)
              </button>
              <button
                type="button"
                onClick={() => setCurrency('KHR')}
                className={`px-2 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  currency === 'KHR'
                    ? 'bg-gold text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Khmer Riel"
              >
                KHR (៛)
              </button>
            </div>

            {/* Language Switcher [ 🇰🇭 ខ្មែរ | 🇬🇧 EN ] */}
            <div className="inline-flex items-center rounded-lg bg-black/40 p-0.5 border border-white/10 text-xs backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setLanguage('km')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  language === 'km'
                    ? 'bg-gold text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="ភាសាខ្មែរ"
              >
                <span>🇰🇭</span>
                <span>ខ្មែរ</span>
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-gold text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="English"
              >
                <span>🇬🇧</span>
                <span>EN</span>
              </button>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-[var(--radius-button)] text-slate-200 hover:text-gold hover:bg-surface/50 transition-colors cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-gold" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-[var(--radius-button)] hover:bg-surface/60 transition-colors cursor-pointer border border-transparent hover:border-border"
                  aria-expanded={userMenuOpen}
                  aria-label="User account menu"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover border border-gold/40"
                  />
                  <span className="hidden md:inline text-xs font-medium text-slate-200 max-w-[110px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted" />
                </button>

                <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-[var(--radius-modal)] shadow-2xl p-2 z-50 text-text"
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

                    <Link
                      to="/account"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-button)] text-xs text-text hover:bg-surface-hover hover:text-gold transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-gold" />
                      <span>{t('nav.account', 'Account Dashboard')}</span>
                    </Link>

                    <Link
                      to="/account/bookings"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-button)] text-xs text-text hover:bg-surface-hover hover:text-gold transition-colors"
                    >
                      <Calendar className="w-3.5 h-3.5 text-gold" />
                      <span>{t('nav.bookings', 'My Bookings')}</span>
                    </Link>

                    <Link
                      to="/account/notifications"
                      className="flex items-center justify-between px-3 py-2 rounded-[var(--radius-button)] text-xs text-text hover:bg-surface-hover hover:text-gold transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Bell className="w-3.5 h-3.5 text-gold" />
                        <span>{t('nav.notifications', 'Notifications')}</span>
                      </div>
                      {unreadCount > 0 && (
                        <span className="w-4 h-4 rounded-full bg-gold text-slate-950 font-bold text-[10px] flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </Link>

                    <button
                      type="button"
                      onClick={requestSignOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-button)] text-xs text-rose-400 hover:bg-surface-hover transition-colors text-left border-t border-border/60 mt-1 pt-2 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t('nav.signOut', 'Sign Out')}</span>
                    </button>
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/login')}
                  className="hidden sm:inline-flex text-xs py-1.5 px-3"
                >
                  {t('nav.signIn', 'Sign In')}
                </Button>
                <Button
                  variant="gold"
                  size="sm"
                  onClick={() => navigate('/booking')}
                  className="text-xs py-1.5 px-3"
                >
                  {t('nav.bookStay', 'Book Stay')}
                </Button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-[var(--radius-button)] text-slate-200 hover:text-gold hover:bg-surface/50 transition-colors cursor-pointer"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
      {mobileMenuOpen && (
        <>
        <motion.div
          className="xl:hidden fixed inset-0 top-[65px] bg-slate-950/40 z-40"
          {...fade()}
          transition={transition(duration.button)}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden
        />
        <motion.div
          className="xl:hidden fixed inset-x-0 top-[65px] bg-bg/95 backdrop-blur-xl border-b border-border shadow-2xl p-6 z-50 max-h-[85vh] overflow-y-auto"
          initial={{ opacity: 0, y: reduced ? 0 : -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduced ? 0 : -8 }}
          transition={transition(duration.button)}
        >
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium tracking-wider uppercase py-2 px-3 rounded-[var(--radius-button)] transition-colors ${active
                      ? 'bg-gold/15 text-gold border border-gold/30'
                      : 'text-text hover:bg-surface-hover hover:text-gold'
                    }`}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="pt-4 mt-2 border-t border-border flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-muted px-2">
                <span>{t('common.currency', 'Currency')}:</span>
                <div className="inline-flex rounded-lg bg-surface p-0.5 border border-border">
                  <button
                    onClick={() => setCurrency('USD')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                      currency === 'USD' ? 'bg-gold text-slate-950' : 'text-slate-300'
                    }`}
                  >
                    USD ($)
                  </button>
                  <button
                    onClick={() => setCurrency('KHR')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                      currency === 'KHR' ? 'bg-gold text-slate-950' : 'text-slate-300'
                    }`}
                  >
                    KHR (៛)
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted px-2">
                <span>{t('common.language', 'Language')}:</span>
                <div className="inline-flex rounded-lg bg-surface p-0.5 border border-border">
                  <button
                    onClick={() => setLanguage('km')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                      language === 'km' ? 'bg-gold text-slate-950' : 'text-slate-300'
                    }`}
                  >
                    🇰🇭 ខ្មែរ
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                      language === 'en' ? 'bg-gold text-slate-950' : 'text-slate-300'
                    }`}
                  >
                    🇬🇧 English
                  </button>
                </div>
              </div>

              {!user ? (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => navigate('/login')}
                  >
                    {t('nav.signIn', 'Sign In')}
                  </Button>
                  <Button
                    variant="gold"
                    size="md"
                    onClick={() => navigate('/booking')}
                  >
                    {t('nav.bookStay', 'Book Stay')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 mt-2">
                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full justify-start"
                    onClick={() => navigate('/account')}
                    leftIcon={<User className="w-4 h-4 text-gold" />}
                  >
                    {t('nav.account', 'Guest Dashboard')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-rose-400"
                    onClick={requestSignOut}
                  >
                    {t('nav.signOut', 'Sign Out')}
                  </Button>
                </div>
              )}
            </div>
          </nav>
        </motion.div>
        </>
      )}
      </AnimatePresence>

      <SignOutConfirmDialog
        isOpen={signOutConfirmOpen}
        onClose={() => !signingOut && setSignOutConfirmOpen(false)}
        onConfirm={handleSignOutConfirm}
        confirming={signingOut}
      />
    </header>
  );
};
