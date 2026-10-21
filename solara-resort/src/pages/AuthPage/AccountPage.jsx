import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useMotionPresets } from '../../motion/useMotionPresets.js';
import { StaggerItem } from '../../components/motion/StaggerItem.jsx';
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
  Camera,
  Loader2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { SignOutConfirmDialog } from '../../components/auth/SignOutConfirmDialog.jsx';
import { FavoriteButton } from '../../components/catalog/FavoriteButton.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { useFavoriteCatalog } from '../../hooks/useFavoriteCatalog.js';
import { getFavoriteDishesByIds } from '../../data/diningData.js';
import { useDiningMenu } from '../../hooks/useDiningMenu.js';
import { ROUTES } from '../../config/routes.js';
import { MARKETING_IMAGES } from '../../constants/marketingImages.js';
import { formatCurrency } from '../../util/currency.js';
import { resolveStorageUrl } from '../../util/media.js';
import { bookingNeedsPayment } from '../../util/mapBooking.js';
import { pickUpcomingBooking } from '../../util/bookingNotifications.js';
import { paginateItems } from '../../util/paginateList.js';
import { ListPagination } from '../../components/ui/ListPagination.jsx';
import { ReviewFormModal } from '../../components/reviews/ReviewFormModal.jsx';
import { StarRatingDisplay } from '../../components/reviews/StarRating.jsx';
import { useMyGuestReviews } from '../../hooks/useMyGuestReviews.js';
import { deleteGuestReview } from '../../services/api/reviewsApi.js';
import { getApiErrorMessage } from '../../services/api/errors.js';
import GuestLiveBill from '../../components/account/GuestLiveBill.jsx';
import { RescheduleBookingModal } from '../../components/booking/RescheduleBookingModal.jsx';

const BOOKING_ROOM_IMAGE_FALLBACK = MARKETING_IMAGES.villa;

function bookingRoomImageSrc(roomImage) {
  return roomImage || BOOKING_ROOM_IMAGE_FALLBACK;
}

function userAvatarSrc(avatar) {
  if (!avatar) return null;
  return resolveStorageUrl(avatar) || avatar;
}

function guestHasStoredProfilePhoto(user) {
  return Boolean(user?.raw?.profile_image);
}

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_ACCEPT = 'image/jpeg,image/jpg,image/png';

function validateAvatarFile(file, t) {
  if (!file) return null;
  const type = (file.type || '').toLowerCase();
  if (!['image/jpeg', 'image/jpg', 'image/png'].includes(type)) {
    return t('account.profilePhotoInvalidType', 'Please choose a JPG or PNG image.');
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return t('account.profilePhotoTooLarge', 'Image must be 2 MB or smaller.');
  }
  return null;
}

function bookingStatusBadgeClass(status) {
  switch (status) {
    case 'confirmed':
    case 'checked_in':
      return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
    case 'completed':
      return 'bg-surface-elevated text-text border border-border';
    case 'cancelled':
      return 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
    case 'pending':
      return 'bg-amber-500/15 text-amber-300 border border-amber-500/30';
    default:
      return 'bg-surface-elevated text-muted border border-border';
  }
}

function canGuestRescheduleOnline(booking) {
  return booking && ['pending', 'confirmed'].includes(booking.status);
}

function bookingStatusLabel(status, language) {
  const labels = {
    pending: language === 'km' ? 'កំពុងរង់ចាំ' : 'pending',
    confirmed: language === 'km' ? 'បានបញ្ជាក់' : 'confirmed',
    checked_in: language === 'km' ? 'កំពុងស្នាក់នៅ' : 'checked in',
    completed: language === 'km' ? 'បានបញ្ចប់' : 'completed',
    cancelled: language === 'km' ? 'បានបោះបង់' : 'cancelled',
  };
  return labels[status] || status;
}

export const AccountPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user,
    logout,
    bookings,
    bookingsLoading,
    bookingsError,
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
    uploadCustomerAvatar,
    removeCustomerAvatar,
    changeCustomerPassword,
    t,
    addToast,
    refreshMyBookings,
    favorites,
    localize,
  } = useApp();

  const { reduced, fadeUp, transition, duration } = useMotionPresets();
  const tabPanelMotion = {
    ...fadeUp(8),
    transition: transition(duration.page),
  };

  const path = location.pathname;
  let currentTab = 'dashboard';
  if (path.includes('/bookings')) currentTab = 'bookings';
  else if (path.includes('/notifications')) currentTab = 'notifications';
  else if (path.includes('/settings')) currentTab = 'settings';
  else if (path.includes('/favorites')) currentTab = 'favorites';

  const favoriteResortIds = favorites?.resorts ?? [];
  const favoriteRoomIds = favorites?.rooms ?? [];
  const favoriteDishIds = favorites?.dishes ?? [];
  const favoritesTotal =
    favoriteResortIds.length + favoriteRoomIds.length + favoriteDishIds.length;

  const { menuItems: liveMenuItems } = useDiningMenu();
  const favoriteDishes = useMemo(
    () => getFavoriteDishesByIds(favoriteDishIds, liveMenuItems),
    [favoriteDishIds, liveMenuItems]
  );

  const {
    resorts: favoriteResorts,
    rooms: favoriteRooms,
    loading: favoritesLoading,
  } = useFavoriteCatalog(favoriteResortIds, favoriteRoomIds);

  const favoritePreviewEntries = useMemo(() => {
    const entries = [];
    favoriteResorts.slice(0, 2).forEach((item) => entries.push({ type: 'resort', item }));
    favoriteRooms.slice(0, 2).forEach((item) => entries.push({ type: 'room', item }));
    favoriteDishes.slice(0, 2).forEach((item) => entries.push({ type: 'dish', item }));
    return entries.slice(0, 4);
  }, [favoriteResorts, favoriteRooms, favoriteDishes]);

  const memberSinceYear = user?.raw?.created_at
    ? new Date(user.raw.created_at).getFullYear()
    : (user?.created_at ? new Date(user.created_at).getFullYear() : null);

  const loyaltyTierLabel = user?.memberTier ?? null;
  const loyaltyPoints = typeof user?.points === 'number' ? user.points : null;
  const loyaltyTarget =
    typeof user?.pointsTarget === 'number' && user.pointsTarget > 0 ? user.pointsTarget : null;
  const loyaltyProgressPercent =
    loyaltyPoints !== null && loyaltyTarget !== null
      ? Math.min(100, Math.round((loyaltyPoints / loyaltyTarget) * 100))
      : null;
  const loyaltyPointsRemaining =
    loyaltyPoints !== null && loyaltyTarget !== null && loyaltyTarget > loyaltyPoints
      ? loyaltyTarget - loyaltyPoints
      : null;
  const hasLoyaltyData =
    loyaltyTierLabel || loyaltyPoints !== null || loyaltyTarget !== null;

  const uniqueDestinations = new Set(
    (bookings || [])
      .map((b) => b.branchName || b.branchId || b.resortName || b.resortId)
      .filter(Boolean)
  ).size;

  const [bookingFilter, setBookingFilter] = useState('all');
  const [bookingsPage, setBookingsPage] = useState(1);
  const [notificationsPage, setNotificationsPage] = useState(1);
  const [selectedBookingForDetail, setSelectedBookingForDetail] = useState(null);
  const [bookingForReview, setBookingForReview] = useState(null);
  const [editingReview, setEditingReview] = useState(null);
  const {
    reviews: myGuestReviews,
    loading: myReviewsLoading,
    reload: reloadMyGuestReviews,
  } = useMyGuestReviews({ per_page: 20 }, { enabled: Boolean(user) });

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileFieldErrors, setProfileFieldErrors] = useState({});
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const avatarInputRef = useRef(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordFieldErrors, setPasswordFieldErrors] = useState({});
  const [paymentNavigatingId, setPaymentNavigatingId] = useState(null);
  const [rescheduleBooking, setRescheduleBooking] = useState(null);

  useEffect(() => {
    refreshMyBookings();
  }, [refreshMyBookings, location.pathname]);

  useEffect(() => {
    setPaymentNavigatingId(null);
  }, [location.pathname]);

  const filteredBookings = useMemo(
    () =>
      bookingFilter === 'all'
        ? bookings
        : bookingFilter === 'unpaid'
          ? bookings.filter((b) => bookingNeedsPayment(b))
          : bookings.filter((b) => b.status === bookingFilter),
    [bookings, bookingFilter]
  );

  const paginatedBookings = useMemo(
    () => paginateItems(filteredBookings, bookingsPage),
    [filteredBookings, bookingsPage]
  );

  const paginatedNotifications = useMemo(
    () => paginateItems(notifications, notificationsPage),
    [notifications, notificationsPage]
  );

  useEffect(() => {
    setBookingsPage(1);
  }, [bookingFilter]);

  useEffect(() => {
    if (bookingsPage > paginatedBookings.totalPages) {
      setBookingsPage(paginatedBookings.totalPages);
    }
  }, [bookingsPage, paginatedBookings.totalPages]);

  useEffect(() => {
    if (notificationsPage > paginatedNotifications.totalPages) {
      setNotificationsPage(paginatedNotifications.totalPages);
    }
  }, [notificationsPage, paginatedNotifications.totalPages]);

  useEffect(() => {
    setNotificationsPage(1);
  }, [currentTab]);

  const goToCompletePayment = (booking) => {
    const apiId = booking?.apiId;
    if (!apiId || paymentNavigatingId != null || !bookingNeedsPayment(booking)) return;
    setPaymentNavigatingId(apiId);
    navigate(`/payment?bookingId=${apiId}`);
  };

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  useEffect(() => {
    if (!user?.id) return;
    setName(user.name || '');
    setPhone(user.phone || '');
    setSelectedBookingForDetail(null);
    setBookingFilter('all');
    setProfileFieldErrors({});
    setPasswordFieldErrors({});
    setPasswordError('');
    setCurrentPassword('');
    setNewPassword('');
    setNewPasswordConfirm('');
  }, [user?.id, user?.name, user?.phone]);

  const displayAvatarUrl = avatarPreview || userAvatarSrc(user?.avatar);

  const handleAvatarImgError = (e) => {
    e.currentTarget.onerror = null;
    const label = encodeURIComponent(user?.name || 'Guest');
    e.currentTarget.src = `https://ui-avatars.com/api/?name=${label}&background=d4af37&color=1a1a1a&size=128`;
  };

  const openAvatarPicker = () => {
    if (!avatarUploading) avatarInputRef.current?.click();
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const validationError = validateAvatarFile(file, t);
    if (validationError) {
      addToast(validationError, 'error');
      return;
    }

    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setAvatarUploading(true);

    const result = await uploadCustomerAvatar(file);
    setAvatarUploading(false);

    if (!result.ok) {
      URL.revokeObjectURL(previewUrl);
      setAvatarPreview(null);
      if (result.error) addToast(result.error, 'error');
      return;
    }

    URL.revokeObjectURL(previewUrl);
    setAvatarPreview(null);
  };

  const handleRemoveProfilePhoto = async () => {
    if (!guestHasStoredProfilePhoto(user) || avatarUploading) return;
    setAvatarUploading(true);
    const result = await removeCustomerAvatar();
    setAvatarUploading(false);
    if (!result.ok) {
      if (result.error) addToast(result.error, 'error');
      return;
    }
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
    }
  };

  const hasStoredProfilePhoto = guestHasStoredProfilePhoto(user);

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

  const unpaidBookingsCount = bookings.filter((b) => bookingNeedsPayment(b)).length;
  const upcomingBooking = pickUpcomingBooking(bookings);

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
            <button
              type="button"
              onClick={() => navigate('/account/settings')}
              className="relative shrink-0 rounded-full group cursor-pointer"
              aria-label={t('account.changePhoto', 'Change photo')}
            >
              <img
                src={displayAvatarUrl}
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-gold shadow-md"
                onError={handleAvatarImgError}
              />
              {avatarUploading && (
                <span className="absolute inset-0 rounded-full bg-slate-950/55 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-gold animate-spin" aria-hidden />
                </span>
              )}
            </button>
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
                {memberSinceYear && (
                  <span>
                    {language === 'km'
                      ? `សមាជិកតាំងពីឆ្នាំ ${memberSinceYear}`
                      : `Member since ${memberSinceYear}`}
                  </span>
                )}
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
              {hasLoyaltyData ? (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text">
                      {loyaltyTierLabel ||
                        (language === 'km' ? 'កម្រិតសមាជិក' : 'Member tier')}
                    </span>
                    {loyaltyPoints !== null && loyaltyTarget !== null && (
                      <span className="text-gold font-bold">
                        {loyaltyPoints.toLocaleString()} / {loyaltyTarget.toLocaleString()} pts
                      </span>
                    )}
                    {loyaltyPoints !== null && loyaltyTarget === null && (
                      <span className="text-gold font-bold">
                        {loyaltyPoints.toLocaleString()} pts
                      </span>
                    )}
                  </div>
                  {loyaltyProgressPercent !== null && (
                    <div className="w-full bg-bg rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gold h-full rounded-full"
                        style={{ width: `${loyaltyProgressPercent}%` }}
                      />
                    </div>
                  )}
                  {loyaltyPointsRemaining !== null && loyaltyPointsRemaining > 0 && (
                    <p className="text-[11px] text-muted leading-relaxed font-light">
                      {language === 'km'
                        ? `សន្សំបាន ${loyaltyPointsRemaining.toLocaleString()} ពិន្ទុបន្ថែមទៀតដើម្បីឈានដល់កម្រិតបន្ទាប់។`
                        : `Earn ${loyaltyPointsRemaining.toLocaleString()} more points to reach the next tier.`}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-[11px] text-muted leading-relaxed font-light">
                  {language === 'km'
                    ? 'ព័ត៌មានកម្មវិធីភាពស្មោះត្រង់មិនទាន់មានសម្រាប់គណនីនេះទេ។'
                    : 'Loyalty program details are not available for this account yet.'}
                </p>
              )}
            </div>
          </aside>

          {/* Main Tab Area */}
          <main className="lg:col-span-3 space-y-8">
            <AnimatePresence mode="wait">
            {currentTab === 'dashboard' && (
              <motion.div key="account-dashboard" {...tabPanelMotion} className="space-y-8">
                {upcomingBooking && (
                  <div className="bg-surface border border-border p-6 rounded-[var(--radius-card)] shadow-md space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-border">
                      <span className="text-xs uppercase tracking-wider text-gold font-semibold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{language === 'km' ? 'ការស្នាក់នៅរមណីយដ្ឋានបន្ទាប់របស់អ្នក' : 'Upcoming Sanctuary Residency'}</span>
                      </span>
                      <span className="text-xs font-mono font-semibold text-text">
                        #{upcomingBooking.id}
                      </span>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      <img
                        src={bookingRoomImageSrc(upcomingBooking.roomImage)}
                        alt={upcomingBooking.roomName}
                        className="w-full md:w-44 aspect-[16/10] rounded-[var(--radius-button)] object-cover border border-border shrink-0"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = BOOKING_ROOM_IMAGE_FALLBACK;
                        }}
                      />
                      <div className="space-y-2 flex-1 text-left">
                        <h3 className="text-xl font-serif font-bold text-text">
                          {upcomingBooking.roomName}
                        </h3>
                        <p className="text-xs text-gold-light">{upcomingBooking.resortName}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-muted pt-1">
                          <div>
                            <span className="text-[10px] block uppercase">{t('search.checkIn', 'Check-In')}</span>
                            <span className="font-medium text-text">{upcomingBooking.checkIn}</span>
                          </div>
                          <div>
                            <span className="text-[10px] block uppercase">{t('search.checkOut', 'Check-Out')}</span>
                            <span className="font-medium text-text">{upcomingBooking.checkOut}</span>
                          </div>
                          <div>
                            <span className="text-[10px] block uppercase">{t('common.totalDue', 'Total Paid')}</span>
                            <span className="font-medium text-gold font-serif">
                              {formatCurrency(upcomingBooking.pricing.totalUSD, currency)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs">
                      {bookingNeedsPayment(upcomingBooking) ? (
                        <span className="text-amber-400 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {language === 'km' ? 'ការបង់ប្រាក់មិនទាន់បញ្ចប់' : 'Payment outstanding'}
                          </span>
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{t('confirm.verified', 'Confirmed & Guaranteed')}</span>
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        {bookingNeedsPayment(upcomingBooking) && (
                          <Button
                            variant="gold"
                            size="sm"
                            disabled={paymentNavigatingId === upcomingBooking.apiId}
                            onClick={() => goToCompletePayment(upcomingBooking)}
                          >
                            {t('account.completePayment', 'Complete Payment')}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedBookingForDetail(upcomingBooking)}
                        >
                          {language === 'km' ? 'មើលវិញ្ញាបនបត្រកក់' : 'View Full Voucher'}
                        </Button>
                      </div>
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
                    {favoritesLoading && favoritePreviewEntries.length === 0 ? (
                      <p className="text-xs text-muted">{language === 'km' ? 'កំពុងផ្ទុក…' : 'Loading saved items…'}</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {favoritePreviewEntries.map(({ type, item }) => {
                          if (type === 'dish') {
                            return (
                              <Link
                                key={`dish-${item.id}`}
                                to={ROUTES.menuDetail(item.id)}
                                className="flex gap-3 p-3 rounded-[var(--radius-button)] border border-border hover:border-gold/40 transition-colors"
                              >
                                <div className="w-20 aspect-[4/3] rounded overflow-hidden bg-slate-900 shrink-0 border border-border">
                                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="min-w-0 flex-1 text-left">
                                  <p className="text-xs font-serif font-semibold text-text truncate">{item.name}</p>
                                  <p className="text-[10px] text-muted truncate">
                                    {formatCurrency(item.price, currency)}
                                  </p>
                                </div>
                                <FavoriteButton kind="dish" id={item.id} size="sm" />
                              </Link>
                            );
                          }
                          const isRoom = type === 'room';
                          const localized = localize ? localize(item) : item;
                          const href = isRoom ? `/room/${item.id}` : `/resort/${item.id}`;
                          const image = localized.featuredImage;
                          return (
                            <Link
                              key={`${type}-${item.id}`}
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
                    {notifications.length === 0 ? (
                      <p className="text-xs text-muted py-2">
                        {t(
                          'account.noAlertsYet',
                          'No alerts yet. Reservation and payment updates will appear here.'
                        )}
                      </p>
                    ) : (
                      notifications.slice(0, 3).map((n) => (
                        <div
                          key={n.id}
                          role={n.bookingApiId ? 'button' : undefined}
                          tabIndex={n.bookingApiId ? 0 : undefined}
                          onClick={() => n.bookingApiId && navigate('/account/bookings')}
                          onKeyDown={(e) => {
                            if (n.bookingApiId && (e.key === 'Enter' || e.key === ' ')) {
                              e.preventDefault();
                              navigate('/account/bookings');
                            }
                          }}
                          className={`p-3.5 rounded-[var(--radius-button)] border text-xs flex items-start justify-between gap-3 ${
                            n.read
                              ? 'bg-surface border-border/50 text-muted'
                              : 'bg-surface-elevated border-gold/30 text-text'
                          } ${n.bookingApiId ? 'cursor-pointer hover:border-gold/50' : ''}`}
                        >
                          <div className="space-y-0.5">
                            <p className="font-semibold text-text">{n.title}</p>
                            <p className="text-muted leading-relaxed font-light whitespace-pre-line">{n.message}</p>
                          </div>
                          <span className="text-[10px] text-muted shrink-0">{n.date}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {currentTab === 'bookings' && (
              <motion.div key="account-bookings" {...tabPanelMotion} className="space-y-6">
                {bookingsError && (
                  <div className="rounded-[var(--radius-card)] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-text">
                    <p className="font-medium text-rose-200/90">{bookingsError}</p>
                    <button
                      type="button"
                      className="text-gold hover:underline mt-2 cursor-pointer"
                      onClick={() => refreshMyBookings()}
                    >
                      {t('common.tryAgain', 'Try again')}
                    </button>
                  </div>
                )}

                {bookingsLoading && bookings.length === 0 && !bookingsError && (
                  <p className="text-xs text-muted text-center py-8">
                    {t('account.loadingReservations', 'Loading your reservations…')}
                  </p>
                )}

                {unpaidBookingsCount > 0 && (
                  <div className="rounded-[var(--radius-card)] border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-text">
                    <p className="font-medium text-amber-200/90">
                      {language === 'km'
                        ? `ការកក់ ${unpaidBookingsCount} ដែលរង់ចាំការបង់ប្រាក់`
                        : `${unpaidBookingsCount} reservation${unpaidBookingsCount > 1 ? 's' : ''} awaiting payment`}
                    </p>
                    <p className="text-muted mt-1">
                      {t(
                        'account.unpaidBookingsHint',
                        'You have reservations waiting for payment. Use Complete Payment to continue with KHQR.'
                      )}
                    </p>
                  </div>
                )}

                {(myReviewsLoading || myGuestReviews.length > 0) && (
                  <div className="space-y-3 pb-6 border-b border-border">
                    <h3 className="text-sm font-serif font-bold text-text">
                      {t('account.myReviews', 'Your Reviews')}
                    </h3>
                    <p className="text-[11px] text-muted">
                      {t(
                        'account.reviewsHomeHint',
                        'Published reviews appear on the Home page after staff approval.'
                      )}
                    </p>
                    {myReviewsLoading && myGuestReviews.length === 0 && (
                      <p className="text-xs text-muted">{t('account.loadingReviews', 'Loading your reviews…')}</p>
                    )}
                    <div className="space-y-3">
                      {myGuestReviews.map((rev) => (
                        <div
                          key={rev.id}
                          className="rounded-[var(--radius-card)] border border-border bg-surface/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <StarRatingDisplay value={rev.rating} />
                              <span className="text-[10px] uppercase font-semibold text-muted">
                                {rev.status === 'pending'
                                  ? t('account.reviewStatusPending', 'Awaiting approval')
                                  : rev.status === 'approved'
                                    ? t('account.reviewStatusApproved', 'Published')
                                    : t('account.reviewStatusRejected', 'Not published')}
                              </span>
                            </div>
                            {rev.title && (
                              <p className="text-sm font-semibold text-text truncate">{rev.title}</p>
                            )}
                            <p className="text-xs text-muted line-clamp-2">{rev.comment}</p>
                            <p className="text-[10px] text-muted">
                              {[rev.roomLabel, rev.locationLabel].filter(Boolean).join(' · ')}
                            </p>
                          </div>
                          {rev.status === 'pending' && (
                            <div className="flex flex-wrap gap-2 shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => setEditingReview(rev)}
                              >
                                {t('account.editReview', 'Edit')}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs text-rose-400 border-rose-500/30"
                                onClick={async () => {
                                  try {
                                    await deleteGuestReview(re.id);
                                    addToast(t('account.reviewDeleted', 'Review removed.'), 'info');
                                    await reloadMyGuestReviews();
                                    await refreshMyBookings();
                                  } catch (err) {
                                    addToast(
                                      getApiErrorMessage(err, t('account.reviewDeleteFailed', 'Unable to delete review.')),
                                      'error'
                                    );
                                  }
                                }}
                              >
                                {t('account.deleteReview', 'Delete')}
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                      ...(unpaidBookingsCount > 0
                        ? [
                            {
                              key: 'unpaid',
                              label: language === 'km' ? 'រង់ចាំបង់' : 'Awaiting payment',
                            },
                          ]
                        : []),
                      { key: 'pending', label: language === 'km' ? 'កំពុងរង់ចាំ' : 'Pending' },
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
                    paginatedBookings.items.map((b, index) => (
                      <StaggerItem key={b.id} index={index}>
                      <div
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
                                className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${bookingStatusBadgeClass(
                                  b.status
                                )}`}
                              >
                                {bookingStatusLabel(b.status, language)}
                              </span>
                            </div>
                            <h3 className="text-lg font-serif font-bold text-text">{b.roomName}</h3>
                            {b.rooms?.length > 1 && (
                              <p className="text-[11px] text-muted">
                                {b.rooms.map((r) => r.label).join(' · ')}
                              </p>
                            )}
                            <p className="text-xs text-muted">{b.resortName}</p>
                            <p className="text-xs text-text-secondary pt-1">
                              {b.checkIn} — {b.checkOut} ({b.nights} {b.nights === 1 ? t('common.night', 'night') : t('common.nights', 'nights')})
                            </p>
                            <GuestLiveBill
                              bookingApiId={b.apiId}
                              bookingStatus={b.status}
                              currency={currency}
                              t={t}
                            />
                            {bookingNeedsPayment(b) && (
                              <p className="text-[10px] font-semibold uppercase text-amber-400/90 pt-0.5">
                                {t('account.paymentUnpaid', 'Payment required')}
                                {b.paymentStatus && b.paymentStatus !== 'unpaid'
                                  ? ` · ${b.paymentStatus}`
                                  : ''}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="w-full md:w-auto flex md:flex-col items-center md:items-end justify-between gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-border">
                          <div className="text-left md:text-right">
                            <span className="text-[10px] uppercase text-muted block">
                              {bookingNeedsPayment(b)
                                ? t('account.balanceDue', 'Balance due')
                                : t('common.totalDue', 'Total Paid')}
                            </span>
                            <span className="text-lg font-bold font-serif text-gold">
                              {formatCurrency(
                                bookingNeedsPayment(b) ? b.balanceDue : b.pricing.totalUSD,
                                currency
                              )}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {bookingNeedsPayment(b) && (
                              <Button
                                variant="gold"
                                size="sm"
                                className="text-xs"
                                disabled={paymentNavigatingId === b.apiId}
                                onClick={() => goToCompletePayment(b)}
                              >
                                {t('account.completePayment', 'Complete Payment')}
                              </Button>
                            )}
                            {canGuestRescheduleOnline(b) && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => setRescheduleBooking(b)}
                              >
                                {t('reschedule.changeDates', 'Change dates')}
                              </Button>
                            )}
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
                            {b.reviewEligibility?.can_review && (
                              <Button
                                variant="gold"
                                size="sm"
                                className="text-xs"
                                onClick={() => setBookingForReview(b)}
                              >
                                {t('home.writeReview', 'Write a Review')}
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => setSelectedBookingForDetail(b)}
                            >
                              {language === 'km' ? 'វិញ្ញាបនបត្រ' : 'Voucher'}
                            </Button>
                          </div>
                        </div>
                      </div>
                      </StaggerItem>
                    ))
                  )}
                </div>

                {paginatedBookings.showPagination && (
                  <ListPagination
                    page={paginatedBookings.page}
                    totalPages={paginatedBookings.totalPages}
                    total={paginatedBookings.total}
                    startIndex={paginatedBookings.startIndex}
                    endIndex={paginatedBookings.endIndex}
                    onPageChange={setBookingsPage}
                    language={language}
                  />
                )}
              </motion.div>
            )}

            {currentTab === 'notifications' && (
              <motion.div key="account-notifications" {...tabPanelMotion} className="space-y-6">
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
                  {notifications.length === 0 ? (
                    <div className="text-center py-12 bg-surface/50 border border-border rounded-[var(--radius-card)]">
                      <p className="text-xs text-muted max-w-sm mx-auto">
                        {t(
                          'account.noAlertsYet',
                          'No alerts yet. Reservation and payment updates will appear here.'
                        )}
                      </p>
                    </div>
                  ) : (
                  paginatedNotifications.items.map((n, index) => (
                    <motion.div
                      key={n.id}
                      layout
                      initial={{ opacity: 0, x: reduced ? 0 : 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ ...transition(duration.card), delay: reduced ? 0 : Math.min(index, 4) * 0.05 }}
                      onClick={() => {
                        markNotificationRead(n.id);
                        if (n.bookingApiId) navigate('/account/bookings');
                      }}
                      className={`p-5 rounded-[var(--radius-card)] border transition-colors cursor-pointer flex items-start justify-between gap-4 ${
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
                        <p className="text-xs text-muted leading-relaxed font-light whitespace-pre-line">{n.message}</p>
                      </div>
                      <span className="text-[11px] text-muted shrink-0">{n.date}</span>
                    </motion.div>
                  ))
                  )}
                </div>

                {paginatedNotifications.showPagination && (
                  <ListPagination
                    page={paginatedNotifications.page}
                    totalPages={paginatedNotifications.totalPages}
                    total={paginatedNotifications.total}
                    startIndex={paginatedNotifications.startIndex}
                    endIndex={paginatedNotifications.endIndex}
                    onPageChange={setNotificationsPage}
                    language={language}
                  />
                )}
              </motion.div>
            )}

            {currentTab === 'favorites' && (
              <motion.div key="account-favorites" {...tabPanelMotion} className="space-y-8">
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
                    <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.dining)}>
                      {t('account.browseDining', 'Browse dining')}
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

                    {favoriteDishes.length > 0 && (
                      <section className="space-y-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-gold">
                          {t('account.favoriteDishes', 'Favorite dishes')} ({favoriteDishes.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {favoriteDishes.map((dish) => (
                            <div
                              key={dish.id}
                              className="bg-surface border border-border rounded-[var(--radius-card)] overflow-hidden flex flex-col sm:flex-row shadow-sm"
                            >
                              <Link
                                to={ROUTES.menuDetail(dish.id)}
                                className="relative sm:w-40 aspect-[4/3] sm:aspect-auto bg-slate-900 shrink-0"
                              >
                                <img
                                  src={dish.image}
                                  alt={dish.name}
                                  className="w-full h-full object-cover min-h-[120px]"
                                />
                              </Link>
                              <div className="p-4 flex flex-col justify-between flex-1 gap-3">
                                <div>
                                  <Link
                                    to={ROUTES.menuDetail(dish.id)}
                                    className="text-base font-serif font-bold text-text hover:text-gold transition-colors line-clamp-1"
                                  >
                                    {dish.name}
                                  </Link>
                                  <p className="text-[11px] text-gold mt-1">
                                    {formatCurrency(dish.price, currency)}
                                  </p>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(ROUTES.menuDetail(dish.id))}
                                  >
                                    {t('dining.viewDish', 'View')}
                                  </Button>
                                  <FavoriteButton kind="dish" id={dish.id} size="sm" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {currentTab === 'settings' && (
              <motion.div key="account-settings" {...tabPanelMotion} className="space-y-8">
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

                <input
                  ref={avatarInputRef}
                  type="file"
                  accept={AVATAR_ACCEPT}
                  className="hidden"
                  onChange={handleAvatarFileChange}
                  aria-hidden
                  tabIndex={-1}
                />

                <div className="bg-surface border border-border p-6 rounded-[var(--radius-card)] space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-text font-serif pb-2 border-b border-border">
                    {t('account.profilePhoto', 'Profile photo')}
                  </h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                    <div className="relative shrink-0 mx-auto sm:mx-0">
                      <img
                        src={displayAvatarUrl}
                        alt={user.name}
                        className="w-24 h-24 rounded-full object-cover border-2 border-gold/60 shadow-md"
                        onError={handleAvatarImgError}
                      />
                      {avatarUploading && (
                        <span className="absolute inset-0 rounded-full bg-slate-950/55 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 text-gold animate-spin" aria-hidden />
                        </span>
                      )}
                    </div>
                    <div className="flex-1 space-y-3 text-center sm:text-left">
                      <p className="text-xs text-muted leading-relaxed">
                        {t(
                          'account.profilePhotoHint',
                          'JPG or PNG, up to 2 MB. Minimum 100×100 pixels.'
                        )}
                      </p>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <Button
                          type="button"
                          variant="gold"
                          size="sm"
                          disabled={avatarUploading}
                          onClick={openAvatarPicker}
                          leftIcon={<Camera className="w-4 h-4" />}
                        >
                          {avatarUploading
                            ? t('account.profilePhotoUploading', 'Uploading photo…')
                            : hasStoredProfilePhoto
                              ? t('account.changePhoto', 'Change photo')
                              : t('account.uploadPhoto', 'Upload photo')}
                        </Button>
                        {hasStoredProfilePhoto && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={avatarUploading}
                            onClick={handleRemoveProfilePhoto}
                          >
                            {t('account.removePhoto', 'Remove photo')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
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
              </motion.div>
            )}
            </AnimatePresence>
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

            <div className="flex flex-wrap justify-end gap-3 pt-2">
              {bookingNeedsPayment(selectedBookingForDetail) && (
                <Button
                  variant="gold"
                  size="sm"
                  disabled={paymentNavigatingId === selectedBookingForDetail.apiId}
                  onClick={() => goToCompletePayment(selectedBookingForDetail)}
                >
                  {t('account.completePayment', 'Complete Payment')}
                </Button>
              )}
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
                variant="outline"
                size="sm"
                onClick={() => setSelectedBookingForDetail(null)}
              >
                {t('common.close', 'Close')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <RescheduleBookingModal
        open={Boolean(rescheduleBooking)}
        booking={rescheduleBooking}
        currency={currency}
        t={t}
        language={language}
        onClose={() => setRescheduleBooking(null)}
        onSuccess={async () => {
          addToast(t('reschedule.success', 'Your stay dates have been updated.'), 'success');
          await refreshMyBookings();
        }}
        onPaymentRequired={(mapped, hint) => {
          addToast(
            t('reschedule.payBalance', 'Please complete the updated balance to confirm your new dates.'),
            'info'
          );
          const apiId = mapped?.apiId ?? rescheduleBooking?.apiId;
          const path =
            typeof hint === 'string' && hint.startsWith('/')
              ? hint
              : apiId
                ? `/payment?bookingId=${apiId}`
                : null;
          if (path) navigate(path);
        }}
      />

      <ReviewFormModal
        isOpen={Boolean(bookingForReview)}
        booking={bookingForReview}
        onClose={() => setBookingForReview(null)}
        t={t}
        language={language}
        onSubmitted={async () => {
          addToast(t('home.reviewSubmitted', 'Thank you for your review. It has been submitted and is awaiting approval.'), 'success');
          await refreshMyBookings();
          await reloadMyGuestReviews();
        }}
      />

      <ReviewFormModal
        isOpen={Boolean(editingReview)}
        editingReview={editingReview}
        onClose={() => setEditingReview(null)}
        t={t}
        language={language}
        onSubmitted={async () => {
          addToast(t('account.reviewUpdated', 'Review updated.'), 'success');
          await reloadMyGuestReviews();
        }}
      />
    </div>
  );
};
