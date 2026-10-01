import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  User,
  Calendar,
  Bell,
  Settings,
  Sparkles,
  CheckCircle2,
  Clock,
  LogOut,
  Heart,
  MapPin,
} from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { SignOutConfirmDialog } from '../components/auth/SignOutConfirmDialog.jsx';
import { FavoriteButton } from '../components/catalog/FavoriteButton.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useFavoriteCatalog } from '../hooks/useFavoriteCatalog.js';
import { MARKETING_IMAGES } from '../constants/marketingImages.js';
import { formatCurrency } from '../util/currency.js';
import { resolveStorageUrl } from '../util/media.js';

const BOOKING_ROOM_IMAGE_FALLBACK = MARKETING_IMAGES.villa;

function bookingRoomImageSrc(roomImage) {
  return roomImage || BOOKING_ROOM_IMAGE_FALLBACK;
}

function userAvatarSrc(avatar) {
  if (!avatar) return null;
  return resolveStorageUrl(avatar) || avatar;
}

export const AccountPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user,
    logout,
    bookings,
    cancelBooking,
    notifications,
    markNotificationRead,
    unreadCount,
    currency,
    toggleCurrency,
    theme,
    toggleTheme,
    language,
    setLanguage,
    updateUser,
    saveCustomerProfile,
    changeCustomerPassword,
    t,
    addToast,
    refreshMyBookings,
    favorites,
    localize,
  } = useApp();

  const path = location.pathname;
  let currentTab = 'dashboard';
  if (path.includes('/bookings')) currentTab = 'bookings';
  else if (path.includes('/notifications')) currentTab = 'notifications';
  else if (path.includes('/settings')) currentTab = 'settings';
  else if (path.includes('/favorites')) currentTab = 'favorites';

  const favoriteResortIds = favorites?.resorts ?? [];
  const favoriteRoomIds = favorites?.rooms ?? [];
  const favoritesTotal = favoriteResortIds.length + favoriteRoomIds.length;

  const {
    resorts: favoriteResorts,
    rooms: favoriteRooms,
    loading: favoritesLoading,
  } = useFavoriteCatalog(favoriteResortIds, favoriteRoomIds);

  const memberSinceYear = user?.raw?.created_at
    ? new Date(user.raw.created_at).getFullYear()
    : (user?.created_at ? new Date(user.created_at).getFullYear() : 2025);

  const uniqueDestinations = new Set(
    (bookings || [])
      .map((b) => b.branchName || b.branchId || b.resortName || b.resortId)
      .filter(Boolean)
  ).size;

  const [bookingFilter, setBookingFilter] = useState('all');
  const [selectedBookingForDetail, setSelectedBookingForDetail] = useState(null);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileFieldErrors, setProfileFieldErrors] = useState({});
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordFieldErrors, setPasswordFieldErrors] = useState({});

  useEffect(() => {
    refreshMyBookings();
  }, [refreshMyBookings]);

  useEffect(() => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
  }, [user?.name, user?.phone]);

  if (!user) {
    return (
      <div className="min-h-screen pt-32 pb-16 flex flex-col items-center justify-center px-4 bg-bg text-center">
        <h2 className="text-2xl font-serif font-bold text-text mb-2">
          {language === 'km' ? 'តម្រូវឱ្យចូលគណនីភ្ញៀវកិត្តិយស' : 'Resident Portal Sign In Required'}
        </h2>
        <p className="text-xs text-muted mb-6">
          {language === 'km'
            ? 'សូមចូលគណនីដើម្បីគ្រប់គ្រងការកក់បន្ទប់ និងទទួលបានអត្ថប្រយោជន៍សមាជិក។'
            : 'Please sign in to access your sanctuary reservations and member tier privileges.'}
        </p>
        <Button variant="gold" size="md" onClick={() => navigate('/login?next=/account')}>
          {t('nav.signIn', 'Sign In to Portal')}
        </Button>
      </div>
    );
  }

  const filteredBookings = bookingFilter === 'all'
    ? bookings
    : bookings.filter((b) => b.status === bookingFilter);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileFieldErrors({});
    const result = await saveCustomerProfile({ name, phone });
    setProfileSaving(false);
    if (!result.ok) {
      setProfileFieldErrors(result.fieldErrors || {});
      if (result.error) addToast(result.error, 'error');
      return;
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordError('');
    setPasswordFieldErrors({});
    const result = await changeCustomerPassword({
      current_password: currentPassword,
      password: newPassword,
      password_confirmation: newPasswordConfirm,
    });
    setPasswordSaving(false);
    if (!result.ok) {
      setPasswordFieldErrors(result.fieldErrors || {});
      setPasswordError(result.error || 'Unable to change password.');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setNewPasswordConfirm('');
  };

  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOutConfirm = async () => {
    setSigningOut(true);
    await logout();
    setSigningOut(false);
    setSignOutConfirmOpen(false);
    navigate('/', { replace: true });
  };

  return (
    <div className="w-full min-h-screen pt-28 pb-24 bg-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* User Card */}
        <div className="bg-surface border border-border p-6 sm:p-8 rounded-[var(--radius-card)] shadow-lg mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={userAvatarSrc(user.avatar)}
              alt={user.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-gold shadow-md"
              onError={(e) => {
                e.currentTarget.onerror = null;
                const label = encodeURIComponent(user.name || 'Guest');
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${label}&background=d4af37&color=1a1a1a&size=128`;
              }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-serif font-bold text-text">{user.name}</h1>
                {user.memberTier && (
                  <span className="text-[10px] font-bold text-gold bg-gold/15 px-2.5 py-0.5 rounded border border-gold/40 uppercase tracking-widest">
                    {user.memberTier}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted mt-0.5">{user.email} · {user.phone}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary">
                {typeof user.points === 'number' && (
                  <>
                    <span className="flex items-center gap-1 text-gold font-semibold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>
                        {user.points.toLocaleString()} {t('account.solaraPoints', 'Solara Points')}
                      </span>
                    </span>
                    <span>·</span>
                  </>
                )}
                <span>
                  {language === 'km'
                    ? `សមាជិកតាំងពីឆ្នាំ ${memberSinceYear}`
                    : `Member since ${memberSinceYear}`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/booking')}
            >
              {t('account.reserveNewStay', 'Reserve New Stay')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-rose-400"
              onClick={() => setSignOutConfirmOpen(true)}
              leftIcon={<LogOut className="w-3.5 h-3.5" />}
            >
              {t('nav.signOut', 'Sign Out')}
            </Button>
          </div>
        </div>

        <SignOutConfirmDialog
          isOpen={signOutConfirmOpen}
          onClose={() => !signingOut && setSignOutConfirmOpen(false)}
          onConfirm={handleSignOutConfirm}
          confirming={signingOut}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation Sidebar */}
          <aside className="lg:col-span-1 space-y-2">
            <nav className="bg-surface border border-border p-2 rounded-[var(--radius-card)] space-y-1">
              <Link
                to="/account"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[var(--radius-button)] text-xs font-medium transition-colors ${
                  currentTab === 'dashboard'
                    ? 'bg-gold/15 text-gold border border-gold/30 font-semibold'
                    : 'text-text hover:bg-surface-hover hover:text-gold'
                }`}
              >
                <User className="w-4 h-4 text-gold shrink-0" />
                <span>{t('account.dashboard', 'Dashboard')}</span>
              </Link>

              <Link
                to="/account/bookings"
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-[var(--radius-button)] text-xs font-medium transition-colors ${
                  currentTab === 'bookings'
                    ? 'bg-gold/15 text-gold border border-gold/30 font-semibold'
                    : 'text-text hover:bg-surface-hover hover:text-gold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gold shrink-0" />
                  <span>{t('account.myReservations', 'My Reservations')}</span>
                </div>
                <span className="text-[10px] text-muted bg-surface-elevated px-1.5 py-0.5 rounded">
                  {bookings.length}
                </span>
              </Link>

              <Link
                to="/account/notifications"
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-[var(--radius-button)] text-xs font-medium transition-colors ${
                  currentTab === 'notifications'
                    ? 'bg-gold/15 text-gold border border-gold/30 font-semibold'
                    : 'text-text hover:bg-surface-hover hover:text-gold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-gold shrink-0" />
                  <span>{t('account.alerts', 'Notifications')}</span>
                </div>
                {unreadCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-gold text-slate-950 font-bold text-[10px] flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>

              <Link
                to="/account/favorites"
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-[var(--radius-button)] text-xs font-medium transition-colors ${
                  currentTab === 'favorites'
                    ? 'bg-gold/15 text-gold border border-gold/30 font-semibold'
                    : 'text-text hover:bg-surface-hover hover:text-gold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Heart className="w-4 h-4 text-gold shrink-0" />
                  <span>{t('account.myFavorites', 'Saved Favorites')}</span>
                </div>
                <span className="text-[10px] text-muted bg-surface-elevated px-1.5 py-0.5 rounded">
                  {favoritesTotal}
                </span>
              </Link>

              <Link
                to="/account/settings"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[var(--radius-button)] text-xs font-medium transition-colors ${
                  currentTab === 'settings'
                    ? 'bg-gold/15 text-gold border border-gold/30 font-semibold'
                    : 'text-text hover:bg-surface-hover hover:text-gold'
                }`}
              >
                <Settings className="w-4 h-4 text-gold shrink-0" />
                <span>{t('account.settings', 'Preferences & Profile')}</span>
              </Link>
            </nav>

            <div className="bg-surface border border-border p-5 rounded-[var(--radius-card)] space-y-3">
              <span className="text-[10px] uppercase tracking-wider text-muted font-bold block">
                {t('account.loyaltyTier', 'Loyalty Tier Status')}
              </span>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-text">{t('account.goldConcierge', 'Gold Concierge')}</span>
                <span className="text-gold font-bold">14,200 / 20,000 pts</span>
              </div>
              <div className="w-full bg-bg rounded-full h-1.5 overflow-hidden">
                <div className="bg-gold h-full rounded-full" style={{ width: '71%' }} />
              </div>
              <p className="text-[11px] text-muted leading-relaxed font-light">
                {language === 'km'
                  ? 'សន្សំបាន ៥,៨០០ ពិន្ទុបន្ថែមទៀតដើម្បីឡើងដល់ឋានៈឯកអគ្គរដ្ឋទូតរាជវង្ស ជាមួយសេវាទូកកាណូតផ្ទាល់ខ្លួនដោយឥតគិតថ្លៃ។'
                  : 'Earn 5,800 more points to reach Royal Ambassador status with private yacht complimentary transfers.'}
              </p>
            </div>
          </aside>

          {/* Main Tab Area */}
          <main className="lg:col-span-3 space-y-8">
            {currentTab === 'dashboard' && (
              <div className="space-y-8">
                {bookings.length > 0 && (
                  <div className="bg-surface border border-border p-6 rounded-[var(--radius-card)] shadow-md space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-border">
                      <span className="text-xs uppercase tracking-wider text-gold font-semibold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{language === 'km' ? 'ការស្នាក់នៅរមណីយដ្ឋានបន្ទាប់របស់អ្នក' : 'Upcoming Sanctuary Residency'}</span>
                      </span>
                      <span className="text-xs font-mono font-semibold text-text">
                        #{bookings[0].id}
                      </span>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      <img
                        src={bookingRoomImageSrc(bookings[0].roomImage)}
                        alt={bookings[0].roomName}
                        className="w-full md:w-44 aspect-[16/10] rounded-[var(--radius-button)] object-cover border border-border shrink-0"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = BOOKING_ROOM_IMAGE_FALLBACK;
                        }}
                      />
                      <div className="space-y-2 flex-1 text-left">
                        <h3 className="text-xl font-serif font-bold text-text">
                          {bookings[0].roomName}
                        </h3>
                        <p className="text-xs text-gold-light">{bookings[0].resortName}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-muted pt-1">
                          <div>
                            <span className="text-[10px] block uppercase">{t('search.checkIn', 'Check-In')}</span>
                            <span className="font-medium text-text">{bookings[0].checkIn}</span>
                          </div>
                          <div>
                            <span className="text-[10px] block uppercase">{t('search.checkOut', 'Check-Out')}</span>
                            <span className="font-medium text-text">{bookings[0].checkOut}</span>
                          </div>
                          <div>
                            <span className="text-[10px] block uppercase">{t('common.totalDue', 'Total Paid')}</span>
                            <span className="font-medium text-gold font-serif">
                              {formatCurrency(bookings[0].pricing.totalUSD, currency)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t('confirm.verified', 'Confirmed & Guaranteed')}</span>
                      </span>
                      <Button
                        variant="gold"
                        size="sm"
                        onClick={() => setSelectedBookingForDetail(bookings[0])}
                      >
                        {language === 'km' ? 'មើលវិញ្ញាបនបត្រកក់' : 'View Full Voucher'}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-surface border border-border p-5 rounded-[var(--radius-card)]">
                    <span className="text-[10px] uppercase text-muted tracking-wider block">
                      {language === 'km' ? 'ការស្នាក់នៅសរុប' : 'Total Stays'}
                    </span>
                    <span className="text-2xl font-bold font-serif text-text mt-1 block">
                      {bookings.length}
                    </span>
                    <span className="text-[11px] text-muted">
                      {language === 'km'
                        ? uniqueDestinations > 0
                          ? `នៅទូទាំង ${uniqueDestinations} គោលដៅ`
                          : 'មិនទាន់មានការស្នាក់នៅ'
                        : uniqueDestinations > 0
                          ? `Across ${uniqueDestinations} destination${uniqueDestinations > 1 ? 's' : ''}`
                          : 'No destinations yet'}
                    </span>
                  </div>

                  {typeof user.points === 'number' && (
                    <div className="bg-surface border border-border p-5 rounded-[var(--radius-card)]">
                      <span className="text-[10px] uppercase text-muted tracking-wider block">
                        {language === 'km' ? 'ពិន្ទុភាពស្មោះត្រង់' : 'Loyalty Points'}
                      </span>
                      <span className="text-2xl font-bold font-serif text-gold mt-1 block">
                        {user.points.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-muted">
                        {language === 'km' ? 'រួចរាល់សម្រាប់ដំឡើងបន្ទប់' : 'Ready for room upgrade'}
                      </span>
                    </div>
                  )}

                  <div className="bg-surface border border-border p-5 rounded-[var(--radius-card)]">
                    <span className="text-[10px] uppercase text-muted tracking-wider block">
                      {t('account.savedCount', 'Saved items')}
                    </span>
                    <span className="text-2xl font-bold font-serif text-text mt-1 block">
                      {favoritesTotal}
                    </span>
                    <Link to="/account/favorites" className="text-[11px] text-gold hover:underline">
                      {t('account.myFavorites', 'Saved Favorites')}
                    </Link>
                  </div>
                </div>

                {favoritesTotal > 0 && (
                  <div className="bg-surface border border-border p-6 rounded-[var(--radius-card)] space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-border">
                      <span className="text-xs font-semibold uppercase tracking-wider text-text font-serif flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-gold" />
                        {t('account.myFavorites', 'Saved Favorites')}
                      </span>
                      <Link to="/account/favorites" className="text-xs text-gold hover:underline">
                        {language === 'km' ? 'មើលទាំងអស់' : 'View All'}
                      </Link>
                    </div>
                    {favoritesLoading ? (
                      <p className="text-xs text-muted">{language === 'km' ? 'កំពុងផ្ទុក…' : 'Loading saved items…'}</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[...favoriteResorts.slice(0, 2), ...favoriteRooms.slice(0, 2)].slice(0, 4).map((item) => {
                          const isRoom = Boolean(item.resortId ?? item.resortName);
                          const localized = localize ? localize(item) : item;
                          const href = isRoom ? `/room/${item.id}` : `/resort/${item.id}`;
                          const image = localized.featuredImage;
                          return (
                            <Link
                              key={`${isRoom ? 'room' : 'resort'}-${item.id}`}
                              to={href}
                              className="flex gap-3 p-3 rounded-[var(--radius-button)] border border-border hover:border-gold/40 transition-colors"
                            >
                              <div className="w-20 aspect-[4/3] rounded overflow-hidden bg-slate-900 shrink-0 border border-border">
                                {image ? (
                                  <img src={image} alt={localized.name} className="w-full h-full object-cover" />
                                ) : null}
                              </div>
                              <div className="min-w-0 flex-1 text-left">
                                <p className="text-xs font-serif font-semibold text-text truncate">{localized.name}</p>
                                <p className="text-[10px] text-muted truncate">
                                  {isRoom ? localized.resortName : localized.location}
                                </p>
                              </div>
                              <FavoriteButton kind={isRoom ? 'room' : 'resort'} id={item.id} size="sm" />
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-surface border border-border p-6 rounded-[var(--radius-card)] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <span className="text-xs font-semibold uppercase tracking-wider text-text font-serif">
                      {language === 'km' ? 'សកម្មភាព និងការជូនដំណឹងថ្មីៗ' : 'Recent Activity & Alerts'}
                    </span>
                    <Link to="/account/notifications" className="text-xs text-gold hover:underline">
                      {language === 'km' ? 'មើលទាំងអស់' : 'View All'}
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {notifications.slice(0, 3).map((n) => (
                      <div
                        key={n.id}
                        className={`p-3.5 rounded-[var(--radius-button)] border text-xs flex items-start justify-between gap-3 ${
                          n.read ? 'bg-surface border-border/50 text-muted' : 'bg-surface-elevated border-gold/30 text-text'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <p className="font-semibold text-text">{n.title}</p>
                          <p className="text-muted leading-relaxed font-light">{n.message}</p>
                        </div>
                        <span className="text-[10px] text-muted shrink-0">{n.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentTab === 'bookings' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4 pb-4 border-b border-border">
                  <div>
                    <h2 className="text-xl font-serif font-bold text-text">
                      {t('account.myReservations', 'Sanctuary Reservations')}
                    </h2>
                    <p className="text-xs text-muted">
                      {language === 'km'
                        ? 'គ្រប់គ្រងការស្នាក់នៅនាពេលខាងមុខ និងប្រវត្តិស្នាក់នៅរមណីយដ្ឋាន សូឡារ៉ា របស់អ្នក'
                        : 'Manage your upcoming and past Solara residencies'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 p-1 bg-surface border border-border rounded-[var(--radius-button)]">
                    {[
                      { key: 'all', label: language === 'km' ? 'ទាំងអស់' : 'All' },
                      { key: 'confirmed', label: language === 'km' ? 'បានបញ្ជាក់' : 'Confirmed' },
                      { key: 'completed', label: language === 'km' ? 'បានបញ្ចប់' : 'Completed' },
                      { key: 'cancelled', label: language === 'km' ? 'បានបោះបង់' : 'Cancelled' },
                    ].map((filter) => (
                      <button
                        key={filter.key}
                        onClick={() => setBookingFilter(filter.key)}
                        className={`px-3 py-1 text-xs font-medium rounded capitalize cursor-pointer transition-colors ${
                          bookingFilter === filter.key
                            ? 'bg-gold text-slate-950 font-semibold'
                            : 'text-muted hover:text-text'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredBookings.length === 0 ? (
                    <div className="text-center py-12 bg-surface/50 border border-border rounded-[var(--radius-card)]">
                      <p className="text-xs text-muted">
                        {language === 'km'
                          ? 'មិនមានការកក់បន្ទប់នៅក្នុងផ្នែកនេះទេ។'
                          : 'No reservations found in this category.'}
                      </p>
                    </div>
                  ) : (
                    filteredBookings.map((b) => (
                      <div
                        key={b.id}
                        className="bg-surface border border-border p-6 rounded-[var(--radius-card)] shadow-sm flex flex-col md:flex-row items-start justify-between gap-6"
                      >
                        <div className="flex flex-col sm:flex-row gap-5 items-start">
                          <img
                            src={bookingRoomImageSrc(b.roomImage)}
                            alt={b.roomName}
                            className="w-full sm:w-36 aspect-[16/10] rounded-[var(--radius-button)] object-cover border border-border shrink-0"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = BOOKING_ROOM_IMAGE_FALLBACK;
                            }}
                          />
                          <div className="space-y-1.5 text-left">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-semibold text-gold">#{b.id}</span>
                              <span
                                className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                                  b.status === 'confirmed'
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    : b.status === 'completed'
                                    ? 'bg-surface-elevated text-text border border-border'
                                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                }`}
                              >
                                {b.status === 'confirmed' ? (language === 'km' ? 'បានបញ្ជាក់' : 'confirmed') : b.status}
                              </span>
                            </div>
                            <h3 className="text-lg font-serif font-bold text-text">{b.roomName}</h3>
                            <p className="text-xs text-muted">{b.resortName}</p>
                            <p className="text-xs text-text-secondary pt-1">
                              {b.checkIn} — {b.checkOut} ({b.nights} {b.nights === 1 ? t('common.night', 'night') : t('common.nights', 'nights')})
                            </p>
                          </div>
                        </div>

                        <div className="w-full md:w-auto flex md:flex-col items-center md:items-end justify-between gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-border">
                          <div className="text-left md:text-right">
                            <span className="text-[10px] uppercase text-muted block">{t('common.totalDue', 'Total Paid')}</span>
                            <span className="text-lg font-bold font-serif text-gold">
                              {formatCurrency(b.pricing.totalUSD, currency)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {b.status === 'confirmed' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-rose-400 border-rose-500/30 hover:bg-rose-500/10 text-xs"
                                onClick={() => cancelBooking(b.id)}
                              >
                                {language === 'km' ? 'បោះបង់' : 'Cancel'}
                              </Button>
                            )}
                            <Button
                              variant="gold"
                              size="sm"
                              className="text-xs"
                              onClick={() => setSelectedBookingForDetail(b)}
                            >
                              {language === 'km' ? 'វិញ្ញាបនបត្រ' : 'Voucher'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {currentTab === 'notifications' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div>
                    <h2 className="text-xl font-serif font-bold text-text">
                      {t('account.alerts', 'Sanctuary Alerts')}
                    </h2>
                    <p className="text-xs text-muted">
                      {language === 'km'
                        ? 'ព័ត៌មានបច្ចុប្បន្នភាពនៃការស្នាក់នៅ ការទូទាត់ និងការអញ្ជើញពិសេសពីក្រុមការងារ'
                        : 'Stay updates, payment confirmations, and concierge invitations'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-5 rounded-[var(--radius-card)] border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                        n.read
                          ? 'bg-surface border-border text-muted'
                          : 'bg-surface-elevated border-gold/40 shadow-sm text-text'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-text text-sm font-serif">{n.title}</p>
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-gold shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted leading-relaxed font-light">{n.message}</p>
                      </div>
                      <span className="text-[11px] text-muted shrink-0">{n.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentTab === 'favorites' && (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-border">
                  <div>
                    <h2 className="text-xl font-serif font-bold text-text">
                      {t('account.favoritesTitle', 'Saved Resorts & Rooms')}
                    </h2>
                    <p className="text-xs text-muted mt-1">
                      {t(
                        'account.favoritesSubtitle',
                        'Sanctuaries and accommodations you have marked with the heart icon'
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate('/resorts')}>
                      {t('account.browseResorts', 'Browse resorts')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate('/rooms')}>
                      {t('account.browseRooms', 'Browse rooms')}
                    </Button>
                  </div>
                </div>

                {favoritesTotal === 0 ? (
                  <div className="text-center py-16 bg-surface/50 border border-border rounded-[var(--radius-card)] px-6">
                    <Heart className="w-10 h-10 text-gold/50 mx-auto mb-3" />
                    <p className="text-xs text-muted max-w-md mx-auto leading-relaxed">
                      {t(
                        'account.favoritesEmpty',
                        'You have not saved any resorts or rooms yet. Explore the catalog and tap the heart to save them here.'
                      )}
                    </p>
                  </div>
                ) : favoritesLoading ? (
                  <p className="text-xs text-muted">{language === 'km' ? 'កំពុងផ្ទុក…' : 'Loading saved items…'}</p>
                ) : (
                  <>
                    {favoriteResorts.length > 0 && (
                      <section className="space-y-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-gold">
                          {t('account.favoriteResorts', 'Favorite resorts')} ({favoriteResorts.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {favoriteResorts.map((resort) => {
                            const item = localize ? localize(resort) : resort;
                            return (
                              <div
                                key={resort.id}
                                className="bg-surface border border-border rounded-[var(--radius-card)] overflow-hidden flex flex-col sm:flex-row shadow-sm"
                              >
                                <Link
                                  to={`/resort/${resort.id}`}
                                  className="relative sm:w-40 aspect-[16/10] sm:aspect-auto bg-slate-900 shrink-0"
                                >
                                  {item.featuredImage ? (
                                    <img
                                      src={item.featuredImage}
                                      alt={item.name}
                                      className="w-full h-full object-cover min-h-[120px]"
                                    />
                                  ) : (
                                    <div className="w-full h-full min-h-[120px] flex items-center justify-center text-[10px] text-muted">
                                      {t('catalog.noImage', 'Image not provided')}
                                    </div>
                                  )}
                                </Link>
                                <div className="p-4 flex flex-col justify-between flex-1 gap-3">
                                  <div>
                                    <Link
                                      to={`/resort/${resort.id}`}
                                      className="text-base font-serif font-bold text-text hover:text-gold transition-colors line-clamp-1"
                                    >
                                      {item.name}
                                    </Link>
                                    {item.location && (
                                      <p className="text-[11px] text-muted flex items-center gap-1 mt-1">
                                        <MapPin className="w-3 h-3 text-gold shrink-0" />
                                        <span className="truncate">{item.location}</span>
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => navigate(`/resort/${resort.id}`)}
                                    >
                                      {t('common.explore', 'Explore')}
                                    </Button>
                                    <FavoriteButton kind="resort" id={resort.id} size="sm" />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    )}

                    {favoriteRooms.length > 0 && (
                      <section className="space-y-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-gold">
                          {t('account.favoriteRooms', 'Favorite rooms')} ({favoriteRooms.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {favoriteRooms.map((room) => {
                            const item = localize ? localize(room) : room;
                            return (
                              <div
                                key={room.id}
                                className="bg-surface border border-border rounded-[var(--radius-card)] overflow-hidden flex flex-col sm:flex-row shadow-sm"
                              >
                                <Link
                                  to={`/room/${room.id}`}
                                  className="relative sm:w-40 aspect-[16/10] sm:aspect-auto bg-slate-900 shrink-0"
                                >
                                  {item.featuredImage ? (
                                    <img
                                      src={item.featuredImage}
                                      alt={item.name}
                                      className="w-full h-full object-cover min-h-[120px]"
                                    />
                                  ) : (
                                    <div className="w-full h-full min-h-[120px] flex items-center justify-center text-[10px] text-muted">
                                      {t('catalog.noImage', 'Image not provided')}
                                    </div>
                                  )}
                                </Link>
                                <div className="p-4 flex flex-col justify-between flex-1 gap-3">
                                  <div>
                                    <Link
                                      to={`/room/${room.id}`}
                                      className="text-base font-serif font-bold text-text hover:text-gold transition-colors line-clamp-1"
                                    >
                                      {item.name}
                                    </Link>
                                    <p className="text-[11px] text-muted mt-1 truncate">{item.resortName}</p>
                                    {item.type && (
                                      <span className="inline-block mt-1 text-[10px] uppercase tracking-wider text-gold border border-gold/30 px-2 py-0.5 rounded">
                                        {item.type}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <Button
                                      variant="gold"
                                      size="sm"
                                      onClick={() => navigate(`/room/${room.id}`)}
                                    >
                                      {t('common.details', 'Details')}
                                    </Button>
                                    <FavoriteButton kind="room" id={room.id} size="sm" />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    )}
                  </>
                )}
              </div>
            )}

            {currentTab === 'settings' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-serif font-bold text-text">
                    {t('account.settings', 'Preferences & Profile')}
                  </h2>
                  <p className="text-xs text-muted">
                    {language === 'km'
                      ? 'គ្រប់គ្រងព័ត៌មានផ្ទាល់ខ្លួន និងការកំណត់ការបង្ហាញកម្មវិធី'
                      : 'Manage your personal information and application preferences'}
                  </p>
                </div>

                <form onSubmit={handleSaveSettings} className="bg-surface border border-border p-6 rounded-[var(--radius-card)] space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-text font-serif pb-2 border-b border-border">
                    {language === 'km' ? 'ព័ត៌មានភ្ញៀវស្នាក់នៅ' : 'Resident Information'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label={language === 'km' ? 'ឈ្មោះពេញស្របច្បាប់' : 'Full Legal Name'}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      error={profileFieldErrors.name}
                    />
                    <Input
                      label={t('contact.phone', 'Contact Telephone')}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      error={profileFieldErrors.phone}
                    />
                  </div>
                  <Input
                    label={t('contact.email', 'Email Address')}
                    value={user.email}
                    disabled
                    helperText={
                      language === 'km'
                        ? `អ៊ីមែលនេះភ្ជាប់ជាមួយគណនី${user?.memberTier ? ' ' + user.memberTier : ''} របស់អ្នក។`
                        : `Email is bound to your ${user?.memberTier || 'resident'} account.`
                    }
                  />
                  <div className="pt-2">
                    <Button type="submit" variant="gold" size="sm" disabled={profileSaving}>
                      {profileSaving
                        ? language === 'km'
                          ? 'កំពុងរក្សាទុក…'
                          : 'Saving…'
                        : language === 'km'
                          ? 'រក្សាទុកការផ្លាស់ប្តូរ'
                          : 'Save Profile Changes'}
                    </Button>
                  </div>
                </form>

                <form
                  onSubmit={handleChangePassword}
                  className="bg-surface border border-border p-6 rounded-[var(--radius-card)] space-y-4"
                >
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-text font-serif pb-2 border-b border-border">
                    {language === 'km' ? 'សុវត្ថិភាពគណនី' : 'Account Security'}
                  </h3>
                  <p className="text-[11px] text-muted">
                    <Link
                      to="/forgot-password?next=/account/settings"
                      className="text-gold font-medium hover:underline"
                    >
                      {t('auth.forgotPassword', 'Forgot password?')}
                    </Link>
                    {' · '}
                    {language === 'km'
                      ? 'ផ្ញើលេខកូដ OTP តាមអ៊ីមែលដើម្បីកំណត់ពាក្យសម្ងាត់ឡើងវិញ'
                      : 'Send a verification code to your email to reset your password'}
                  </p>
                  {passwordError && (
                    <div className="p-3 rounded-[var(--radius-button)] bg-error/10 border border-error/30 text-xs text-error">
                      {passwordError}
                    </div>
                  )}
                  <Input
                    label={language === 'km' ? 'ពាក្យសម្ងាត់បច្ចុប្បន្ន' : 'Current password'}
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    error={passwordFieldErrors.current_password}
                    autoComplete="current-password"
                    required
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label={language === 'km' ? 'ពាក្យសម្ងាត់ថ្មី' : 'New password'}
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      error={passwordFieldErrors.password}
                      autoComplete="new-password"
                      required
                    />
                    <Input
                      label={t('auth.confirmPassword', 'Confirm password')}
                      type="password"
                      value={newPasswordConfirm}
                      onChange={(e) => setNewPasswordConfirm(e.target.value)}
                      error={passwordFieldErrors.password_confirmation}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                  <Button type="submit" variant="outline" size="sm" disabled={passwordSaving}>
                    {passwordSaving
                      ? language === 'km'
                        ? 'កំពុងធ្វើបច្ចុប្បន្នភាព…'
                        : 'Updating…'
                      : language === 'km'
                        ? 'ផ្លាស់ប្តូរពាក្យសម្ងាត់'
                        : 'Change Password'}
                  </Button>
                </form>

                <div className="bg-surface border border-border p-6 rounded-[var(--radius-card)] space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-text font-serif pb-2 border-b border-border">
                    {language === 'km' ? 'ការកំណត់ការបង្ហាញកម្មវិធី' : 'Application Display Settings'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-[var(--radius-button)] bg-bg border border-border flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-semibold text-text block">
                          {language === 'km' ? 'ផ្ទៃពណ៌កម្មវិធី' : 'Display Theme'}
                        </span>
                        <span className="text-[11px] text-muted capitalize">{theme} Mode</span>
                      </div>
                      <Button variant="outline" size="sm" onClick={toggleTheme}>
                        {language === 'km' ? 'ប្តូរ' : 'Toggle'}
                      </Button>
                    </div>

                    <div className="p-4 rounded-[var(--radius-button)] bg-bg border border-border flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-semibold text-text block">
                          {language === 'km' ? 'រូបិយប័ណ្ណ' : 'Currency'}
                        </span>
                        <span className="text-[11px] text-muted">{currency}</span>
                      </div>
                      <Button variant="outline" size="sm" onClick={toggleCurrency}>
                        {language === 'km' ? 'ប្តូរ' : 'Switch'}
                      </Button>
                    </div>

                    <div className="p-4 rounded-[var(--radius-button)] bg-bg border border-border flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-semibold text-text block">
                          {language === 'km' ? 'ភាសា' : 'Language'}
                        </span>
                        <span className="text-[11px] text-muted uppercase">
                          {language === 'km' ? 'ភាសាខ្មែរ (KM)' : 'English (EN)'}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLanguage(language === 'en' ? 'km' : 'en')}
                      >
                        {language === 'km' ? 'English' : 'ភាសាខ្មែរ'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {selectedBookingForDetail && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedBookingForDetail(null)}
          title={`${language === 'km' ? 'វិញ្ញាបនបត្រកក់បន្ទប់' : 'Reservation Voucher'} #${selectedBookingForDetail.id}`}
          subtitle={language === 'km' ? 'បង្កាន់ដៃផ្លូវការរបស់សូឡារ៉ា' : 'Official Solara Guest Receipt'}
          maxWidth="2xl"
        >
          <div className="space-y-6 text-xs text-left">
            <div className="p-4 rounded-[var(--radius-button)] bg-bg border border-border flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <h4 className="text-base font-serif font-bold text-text">
                  {selectedBookingForDetail.roomName}
                </h4>
                <p className="text-xs text-gold">{selectedBookingForDetail.resortName}</p>
                <p className="text-muted mt-1">
                  {t('common.date', 'Dates')}: {selectedBookingForDetail.checkIn} to {selectedBookingForDetail.checkOut} ({selectedBookingForDetail.nights} {t('common.nights', 'nights')})
                </p>
                <p className="text-muted">
                  {t('search.guestsRooms', 'Guests')}: {selectedBookingForDetail.guests.adults} {t('search.guests', 'Adults')}, {selectedBookingForDetail.guests.children} {t('search.guests', 'Children')}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-muted block uppercase">{t('common.status', 'Status')}</span>
                <span className="font-bold text-emerald-400 uppercase tracking-wider">
                  {selectedBookingForDetail.paymentStatus === 'paid' ? (language === 'km' ? 'បានបង់រួច' : 'paid') : selectedBookingForDetail.paymentStatus}
                </span>
              </div>
            </div>

            <div className="space-y-2 py-3 border-y border-border">
              <div className="flex justify-between text-muted">
                <span>{t('booking.roomCharges', 'Room Base Charges')}</span>
                <span>{formatCurrency(selectedBookingForDetail.pricing.nightsTotal, currency)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>{t('booking.serviceFee', 'Resort Service Fee (10%)')}</span>
                <span>{formatCurrency(selectedBookingForDetail.pricing.serviceFee, currency)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>{t('booking.tax', 'Taxes & Levies (11%)')}</span>
                <span>{formatCurrency(selectedBookingForDetail.pricing.tax, currency)}</span>
              </div>
              <div className="flex justify-between text-text font-bold text-sm pt-2 border-t border-border/60">
                <span>{t('common.totalDue', 'Total Settled')}</span>
                <span className="text-gold font-serif text-base">
                  {formatCurrency(selectedBookingForDetail.pricing.totalUSD, currency)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.print();
                }}
              >
                {language === 'km' ? 'បោះពុម្ពវិញ្ញាបនបត្រ' : 'Print Voucher'}
              </Button>
              <Button
                variant="gold"
                size="sm"
                onClick={() => setSelectedBookingForDetail(null)}
              >
                {t('common.close', 'Close')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
