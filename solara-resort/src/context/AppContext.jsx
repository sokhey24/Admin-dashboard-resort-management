import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { loadMyBookingsMapped } from '../hooks/useBooking.js';
import { updateBookingRequest } from '../services/api/bookingApi.js';
import { syncBookingNotifications } from '../util/bookingNotifications.js';
import {
  fetchCustomerNotifications,
  markCustomerNotificationRead,
} from '../services/api/notificationsApi.js';
import { mapServerNotification } from '../util/mapServerNotification.js';
import { getTranslation } from '../i18n/index.js';
import {
  loginRequest,
  registerRequest,
  logoutRequest,
  meRequest,
  twoFactorChallengeRequest,
} from '../services/api/authApi.js';
import { getApiErrorMessage, getValidationFieldErrors } from '../services/api/errors.js';
import {
  updateProfile,
  changePasswordAuth,
  updatePreferences,
  uploadProfileAvatar,
  deleteProfileAvatar,
} from '../services/api/accountApi.js';
import { setAccessToken, clearAccessToken, getAccessToken } from '../store/authStore.js';
import { mapCustomerUser, isCustomerRole } from '../util/mapCustomerUser.js';
import { setUnauthorizedHandler } from '../services/api/axiosClient.js';
import { localize } from '../util/localize.js';
import { loadPreferences, savePreferences } from '../store/preferenceStore.js';
import { loadBookingDraft, saveBookingDraft } from '../store/bookingStore.js';
import {
  normalizeRoomIds,
  reconcileRoomSelections,
  syncDraftRoomFields,
} from '../util/roomIds.js';
import { normalizeFavorites, toggleFavoriteId } from '../store/favoritesStore.js';

const AppContext = createContext(undefined);

const STAFF_ONLY_MESSAGE =
  'This portal is for guest accounts. Please use the resort staff dashboard to sign in.';

export const AppProvider = ({ children }) => {
  const initialPrefs = loadPreferences();

  const [theme, setThemeState] = useState(() =>
    initialPrefs.theme === 'light' || initialPrefs.theme === 'dark' ? initialPrefs.theme : 'dark'
  );

  const [currency, setCurrencyState] = useState(() =>
    initialPrefs.currency === 'KHR' || initialPrefs.currency === 'USD' ? initialPrefs.currency : 'USD'
  );

  const [language, setLanguageState] = useState(() =>
    initialPrefs.lang === 'km' || initialPrefs.lang === 'en' ? initialPrefs.lang : 'en'
  );

  const [user, setUser] = useState(null);
  const [authStatus, setAuthStatus] = useState(() =>
    getAccessToken() ? 'loading' : 'unauthenticated'
  );
  const bootstrapRan = useRef(false);
  /** Bumped on logout and on each new login so stale API responses cannot apply to another guest. */
  const sessionGenRef = useRef(0);

  // Booking Draft
  const [bookingDraft, setBookingDraft] = useState(() => loadBookingDraft());

  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState(null);

  const [favorites, setFavoritesState] = useState(() => normalizeFavorites({}));
  const favoritesUserIdRef = useRef(null);
  const favoritesSyncRef = useRef(null);

  // Notifications
  const [notifications, setNotifications] = useState([]);

  // Toasts
  const [toasts, setToasts] = useState([]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    savePrefs({ theme });
  }, [theme]);

  // Apply language to document (translate=no avoids browser auto-translate spinner on lang toggle)
  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
    document.documentElement.setAttribute('translate', 'no');
    savePrefs({ lang: language });
  }, [language]);

  const t = useCallback(
    (path, fallback = '') => {
      return getTranslation(language, path, fallback);
    },
    [language]
  );

  const localizeItem = useCallback(
    (item) => {
      return localize(item, language);
    },
    [language]
  );

  const savePrefs = (updates) => {
    savePreferences(updates);
  };


  const applyFavoritesFromApi = useCallback((apiFavorites) => {
    const normalized = normalizeFavorites(apiFavorites);
    setFavoritesState(normalized);
    return normalized;
  }, []);

  const persistFavoritesToServer = useCallback(async (snapshot, gen = sessionGenRef.current) => {
    if (!getAccessToken() || gen !== sessionGenRef.current) return;
    try {
      await updatePreferences({ favorites: snapshot });
    } catch {
      // Optimistic UI already updated; user can retry by toggling again.
    }
  }, []);

  /** Load favorites from `/auth/me` only — never merge or upload browser storage on login. */
  const syncFavoritesAfterLogin = useCallback(
    async (apiUser) => {
      const gen = sessionGenRef.current;
      const userId = apiUser?.id;
      if (userId == null) return;

      favoritesUserIdRef.current = userId;
      const server = normalizeFavorites(apiUser?.preferences?.favorites);
      if (gen !== sessionGenRef.current) return;
      applyFavoritesFromApi(server);
    },
    [applyFavoritesFromApi]
  );

  const isFavoriteResort = useCallback(
    (resortId) => favorites.resorts.includes(String(resortId)),
    [favorites.resorts]
  );

  const isFavoriteRoom = useCallback(
    (roomId) => favorites.rooms.includes(String(roomId)),
    [favorites.rooms]
  );

  const isFavoriteDish = useCallback(
    (dishId) => favorites.dishes.includes(String(dishId)),
    [favorites.dishes]
  );

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setCurrency = (newCurrency) => {
    setCurrencyState(newCurrency);
    savePrefs({ currency: newCurrency });
    addToast(`Currency switched to ${newCurrency}`, 'info');
  };

  const toggleCurrency = () => {
    setCurrency(currency === 'USD' ? 'KHR' : 'USD');
  };

  const LANG_SWITCH_TOAST_ID = 'toast-language-switch';

  const setLanguage = (lang) => {
    if (lang !== 'en' && lang !== 'km') return;
    if (lang === language) return;
    setLanguageState(lang);
    const message = getTranslation(
      lang,
      'toast.langSwitched',
      lang === 'km' ? 'ភាសាខ្មែរត្រូវបានជ្រើសរើស' : 'Language set to English'
    );
    setToasts((prev) => {
      const withoutLang = prev.filter((toast) => toast.id !== LANG_SWITCH_TOAST_ID);
      return [...withoutLang, { id: LANG_SWITCH_TOAST_ID, message, type: 'info' }];
    });
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== LANG_SWITCH_TOAST_ID));
    }, 3000);
  };

  const applySession = useCallback((apiUser, roles) => {
    const mapped = mapCustomerUser(apiUser, roles);
    setUser(mapped);
    setAuthStatus('authenticated');
    return mapped;
  }, []);

  const applySessionWithFavorites = useCallback(
    async (apiUser, roles) => {
      const mapped = applySession(apiUser, roles);
      await syncFavoritesAfterLogin(apiUser);
      return mapped;
    },
    [applySession, syncFavoritesAfterLogin]
  );

  const resetCustomerState = useCallback(() => {
    sessionGenRef.current += 1;
    favoritesUserIdRef.current = null;
    if (favoritesSyncRef.current) {
      clearTimeout(favoritesSyncRef.current);
      favoritesSyncRef.current = null;
    }
    setUser(null);
    setFavoritesState(normalizeFavorites({}));
    setBookings([]);
    setBookingsLoading(false);
    setBookingsError(null);
    setNotifications([]);
  }, []);

  const clearSession = useCallback(() => {
    clearAccessToken();
    setAuthStatus('unauthenticated');
    resetCustomerState();
    try {
      localStorage.removeItem('solara_user');
    } catch {
      // ignore
    }
  }, [resetCustomerState]);

  const refreshMyBookings = useCallback(async () => {
    const gen = sessionGenRef.current;
    if (!getAccessToken()) {
      setBookings([]);
      setBookingsLoading(false);
      setBookingsError(null);
      return;
    }
    setBookingsLoading(true);
    setBookingsError(null);
    try {
      const mapped = await loadMyBookingsMapped();
      if (gen !== sessionGenRef.current || !getAccessToken()) return;
      setBookings(mapped);
    } catch (error) {
      if (gen === sessionGenRef.current) {
        setBookings([]);
        setBookingsError(getApiErrorMessage(error, 'Unable to load your reservations.'));
      }
    } finally {
      if (gen === sessionGenRef.current) setBookingsLoading(false);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    const gen = sessionGenRef.current;
    if (!getAccessToken()) return;
    try {
      const payload = await fetchCustomerNotifications({ per_page: 50 });
      if (gen !== sessionGenRef.current) return;
      const server = (payload.data ?? []).map(mapServerNotification);
      setNotifications((prev) => {
        const merged = syncBookingNotifications(prev, bookings, language);
        const paymentOnly = merged.filter((n) =>
          String(n.id).startsWith('booking-alert-payment-')
        );
        const ephemeral = prev.filter(
          (n) => !n.server && !String(n.id).startsWith('booking-alert-payment-')
        );
        return [...paymentOnly, ...server, ...ephemeral];
      });
    } catch {
      setNotifications((prev) => syncBookingNotifications(prev, bookings, language));
    }
  }, [bookings, language]);

  useEffect(() => {
    if (!getAccessToken()) return;
    setNotifications((prev) => syncBookingNotifications(prev, bookings, language));
  }, [language, bookings]);

  useEffect(() => {
    if (!getAccessToken()) return;
    refreshNotifications();
    const timer = window.setInterval(refreshNotifications, 90_000);
    return () => window.clearInterval(timer);
  }, [refreshNotifications]);

  const hydrateSession = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setAuthStatus('unauthenticated');
      setUser(null);
      return { ok: true, user: null };
    }

    const gen = sessionGenRef.current;
    setAuthStatus('loading');
    try {
      const data = await meRequest();
      if (gen !== sessionGenRef.current || !getAccessToken()) {
        return { ok: false, error: 'Session changed.' };
      }
      const roles = data.roles ?? data.user?.roles ?? [];
      if (!isCustomerRole(roles)) {
        clearSession();
        return { ok: false, error: STAFF_ONLY_MESSAGE };
      }
      const mapped = await applySessionWithFavorites(data.user, roles);
      if (gen !== sessionGenRef.current) {
        return { ok: false, error: 'Session changed.' };
      }
      await refreshMyBookings();
      await refreshNotifications();
      return { ok: true, user: mapped };
    } catch (error) {
      if (gen === sessionGenRef.current) clearSession();
      return { ok: false, error: getApiErrorMessage(error) };
    }
  }, [applySessionWithFavorites, clearSession, refreshMyBookings, refreshNotifications]);

  useEffect(() => {
    if (bootstrapRan.current) return;
    bootstrapRan.current = true;
    hydrateSession();
  }, [hydrateSession]);

  const completeAuthResponse = useCallback(
    async (data) => {
      if (!data.access_token) {
        return { ok: false, error: 'Sign-in did not return an access token.' };
      }
      setAccessToken(data.access_token);
      resetCustomerState();
      const gen = sessionGenRef.current;

      try {
        const me = await meRequest();
        if (gen !== sessionGenRef.current || !getAccessToken()) {
          return { ok: false, error: 'Session changed.' };
        }
        const roles = me.roles ?? me.user?.roles ?? [];
        if (!isCustomerRole(roles)) {
          clearSession();
          return { ok: false, error: STAFF_ONLY_MESSAGE };
        }
        const mapped = await applySessionWithFavorites(me.user, roles);
        if (gen !== sessionGenRef.current) {
          return { ok: false, error: 'Session changed.' };
        }
        await refreshMyBookings();
        addToast(`Welcome back, ${mapped.name}`, 'success');
        return { ok: true, user: mapped };
      } catch (error) {
        if (gen === sessionGenRef.current) clearSession();
        return { ok: false, error: getApiErrorMessage(error) };
      }
    },
    [applySessionWithFavorites, clearSession, refreshMyBookings, resetCustomerState]
  );

  const loginWithPassword = async ({ email, password }) => {
    try {
      const data = await loginRequest({ email, password });
      if (data.two_factor_required && data.challenge_token) {
        return {
          ok: false,
          twoFactorRequired: true,
          challengeToken: data.challenge_token,
          message: data.message,
        };
      }
      return await completeAuthResponse(data);
    } catch (error) {
      return { ok: false, error: getApiErrorMessage(error) };
    }
  };

  const verifyTwoFactor = async ({ challengeToken, code }) => {
    try {
      const data = await twoFactorChallengeRequest({
        challenge_token: challengeToken,
        code,
      });
      return await completeAuthResponse(data);
    } catch (error) {
      return {
        ok: false,
        error: getApiErrorMessage(error),
        fieldErrors: getValidationFieldErrors(error),
      };
    }
  };

  const registerAccount = async ({ name, email, phone, password, password_confirmation }) => {
    try {
      await registerRequest({
        name,
        email,
        phone: phone || undefined,
        password,
        password_confirmation,
      });
      return { ok: true, registered: true, email };
    } catch (error) {
      return {
        ok: false,
        error: getApiErrorMessage(error),
        fieldErrors: getValidationFieldErrors(error),
      };
    }
  };

  const logout = async () => {
    try {
      if (getAccessToken()) {
        await logoutRequest();
      }
    } catch {
      // still clear local session
    }
    clearSession();
    addToast('You have been signed out', 'info');
  };

  const saveCustomerProfile = async ({ name, phone }) => {
    if (!user) {
      return { ok: false, error: 'You must be signed in to update your profile.' };
    }
    try {
      const gen = sessionGenRef.current;
      const roles = user.roles;
      const updated = await updateProfile({ name, phone });
      if (gen !== sessionGenRef.current) {
        return { ok: false, error: 'Session changed. Please try again.' };
      }
      const mapped = mapCustomerUser(updated, roles);
      setUser(mapped);
      addToast('Profile updated successfully', 'success');
      return { ok: true, user: mapped };
    } catch (error) {
      return {
        ok: false,
        error: getApiErrorMessage(error),
        fieldErrors: getValidationFieldErrors(error),
      };
    }
  };

  const uploadCustomerAvatar = async (file) => {
    if (!user) {
      return { ok: false, error: 'You must be signed in to update your profile photo.' };
    }
    if (!file) {
      return { ok: false, error: 'Please choose an image file.' };
    }
    try {
      const gen = sessionGenRef.current;
      const roles = user.roles;
      await uploadProfileAvatar(file);
      if (gen !== sessionGenRef.current) {
        return { ok: false, error: 'Session changed. Please try again.' };
      }
      const me = await meRequest();
      if (gen !== sessionGenRef.current) {
        return { ok: false, error: 'Session changed. Please try again.' };
      }
      const mapped = mapCustomerUser(me.user, me.roles ?? roles);
      setUser(mapped);
      addToast(
        getTranslation(language, 'account.profilePhotoUpdated', 'Profile photo updated'),
        'success'
      );
      return { ok: true, user: mapped };
    } catch (error) {
      return {
        ok: false,
        error: getApiErrorMessage(error),
        fieldErrors: getValidationFieldErrors(error),
      };
    }
  };

  const removeCustomerAvatar = async () => {
    if (!user) {
      return { ok: false, error: 'You must be signed in to update your profile photo.' };
    }
    try {
      const gen = sessionGenRef.current;
      const roles = user.roles;
      await deleteProfileAvatar();
      if (gen !== sessionGenRef.current) {
        return { ok: false, error: 'Session changed. Please try again.' };
      }
      const me = await meRequest();
      if (gen !== sessionGenRef.current) {
        return { ok: false, error: 'Session changed. Please try again.' };
      }
      const mapped = mapCustomerUser(me.user, me.roles ?? roles);
      setUser(mapped);
      addToast(
        getTranslation(language, 'account.profilePhotoRemoved', 'Profile photo removed'),
        'success'
      );
      return { ok: true, user: mapped };
    } catch (error) {
      return {
        ok: false,
        error: getApiErrorMessage(error),
        fieldErrors: getValidationFieldErrors(error),
      };
    }
  };

  const changeCustomerPassword = async ({
    current_password,
    password,
    password_confirmation,
  }) => {
    if (!user) {
      return { ok: false, error: 'You must be signed in to change your password.' };
    }
    try {
      await changePasswordAuth({
        current_password,
        password,
        password_confirmation,
      });
      addToast('Password changed successfully', 'success');
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: getApiErrorMessage(error),
        fieldErrors: getValidationFieldErrors(error),
      };
    }
  };

  const updateUser = (updated) => {
    if (!user) return;
    const nextUser = { ...user, ...updated };
    setUser(nextUser);
  };

  const updateBookingDraft = (updates) => {
    setBookingDraft((prev) => {
      let next = syncDraftRoomFields({ ...prev, ...updates });
      const roomIds = normalizeRoomIds(next);
      const selections = Array.isArray(next.roomSelections) ? next.roomSelections : [];
      const selectionIds = new Set(
        selections.map((row) => Number(row?.id)).filter((rid) => rid > 0)
      );
      const idsMismatch =
        roomIds.length !== selections.length ||
        roomIds.some((rid) => !selectionIds.has(rid));
      if (idsMismatch) {
        next = reconcileRoomSelections(next);
      }
      saveBookingDraft(next);
      return next;
    });
  };

  const setRoomForBooking = (resort, room, { append = false, draftUpdates } = {}) => {
    setBookingDraft((prev) => {
      const base = draftUpdates ? { ...prev, ...draftUpdates } : prev;
      const roomIdNum = Number(room.id);
      let roomIds = normalizeRoomIds(base);
      let roomSelections = Array.isArray(base.roomSelections) ? [...base.roomSelections] : [];

      const selectionEntry = {
        id: room.id,
        name: room.name,
        image: room.featuredImage,
        resortName: room.resortName,
      };

      if (append && roomIdNum > 0 && !roomIds.includes(roomIdNum)) {
        roomIds = [...roomIds, roomIdNum];
        roomSelections.push(selectionEntry);
      } else if (!append) {
        roomIds = roomIdNum > 0 ? [roomIdNum] : [];
        roomSelections = roomIdNum > 0 ? [selectionEntry] : [];
      }

      const displayName =
        roomSelections.length > 1
          ? `${roomSelections.length} ${roomSelections.length === 1 ? 'room' : 'rooms'}`
          : roomSelections[0]?.name || room.name;

      const branchIdFromResort =
        resort.catalogKind === 'branch' ? resort.id : (room.branchId ?? base.branchId);
      const branchNameFromResort =
        resort.catalogKind === 'branch' ? resort.name : base.branchName || '';
      const roomTypeId =
        room.roomTypeId != null && Number(room.roomTypeId) > 0
          ? Number(room.roomTypeId)
          : base.roomTypeId ?? null;

      const nextDraft = syncDraftRoomFields({
        ...base,
        resortId: resort.resortId ?? resort.id ?? room.resortId,
        branchId: branchIdFromResort != null ? Number(branchIdFromResort) : base.branchId,
        branchName: base.branchName || branchNameFromResort || '',
        roomTypeId,
        resortName: resort.catalogKind === 'branch' ? resort.name : resort.name,
        roomIds,
        roomSelections,
        roomName: displayName,
        roomImage: roomSelections[0]?.image || room.featuredImage,
      });
      saveBookingDraft(nextDraft);
      return nextDraft;
    });
  };

  const addRoomToStay = (resort, room, options) =>
    setRoomForBooking(resort, room, { append: true, ...options });

  const removeRoomFromStay = (targetRoomId) => {
    const id = Number(targetRoomId);
    setBookingDraft((prev) => {
      const roomIds = normalizeRoomIds(prev).filter((rid) => rid !== id);
      const roomSelections = (prev.roomSelections || []).filter((r) => Number(r.id) !== id);
      const nextDraft = syncDraftRoomFields({
        ...prev,
        roomIds,
        roomSelections,
        roomName:
          roomSelections.length > 1
            ? `${roomSelections.length} rooms`
            : roomSelections[0]?.name || '',
        roomImage: roomSelections[0]?.image || '',
      });
      saveBookingDraft(nextDraft);
      return nextDraft;
    });
  };

  const registerBooking = (booking) => {
    if (!booking) return;

    setBookings((prev) => {
      const exists = prev.some((b) => b.apiId === booking.apiId || b.id === booking.id);
      return exists
        ? prev.map((b) =>
            b.apiId === booking.apiId || b.id === booking.id ? { ...b, ...booking } : b
          )
        : [booking, ...prev];
    });

    refreshNotifications();
  };

  const cancelBooking = async (id) => {
    if (!getAccessToken() || !user) {
      addToast('You must be signed in to cancel a reservation.', 'error');
      return { ok: false };
    }
    const gen = sessionGenRef.current;
    const match = bookings.find((b) => b.id === id || b.apiId === id);
    const apiId = match?.apiId ?? id;
    try {
      await updateBookingRequest(apiId, { status: 'cancelled' });
      if (gen !== sessionGenRef.current) return { ok: false };
      addToast(`Reservation #${match?.id ?? id} has been cancelled`, 'info');
      await refreshMyBookings();
      return { ok: true };
    } catch (error) {
      addToast(getApiErrorMessage(error, 'Unable to cancel this reservation.'), 'error');
      return { ok: false, error: getApiErrorMessage(error) };
    }
  };

  const markNotificationRead = (id) => {
    setNotifications((prev) => {
      const row = prev.find((n) => n.id === id);
      if (row?.server) {
        markCustomerNotificationRead(id).catch(() => {});
      }
      return prev.map((n) => (n.id === id ? { ...n, read: true } : n));
    });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addToast = (message, type = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  useEffect(() => {
    setUnauthorizedHandler((meta) => {
      clearSession();
      if (meta?.from === 'request') {
        addToast(
          t('auth.sessionExpired', 'Your session has expired. Please sign in again.'),
          'info'
        );
      }
    });
    return () => setUnauthorizedHandler(() => {});
  }, [clearSession, t]);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleFavoriteResort = useCallback(
    (resortId) => {
      if (!getAccessToken() || favoritesUserIdRef.current == null) {
        addToast(t('account.signInRequired', 'Sign in to save favorites'), 'info');
        return;
      }
      const gen = sessionGenRef.current;
      const key = String(resortId);
      setFavoritesState((prev) => {
        const next = normalizeFavorites({
          ...prev,
          resorts: toggleFavoriteId(prev.resorts, key),
        });
        const added = next.resorts.includes(key);
        addToast(
          added
            ? t('favorites.addedResort', 'Resort saved to favorites')
            : t('favorites.removedResort', 'Resort removed from favorites'),
          'info'
        );
        if (favoritesSyncRef.current) clearTimeout(favoritesSyncRef.current);
        favoritesSyncRef.current = setTimeout(() => {
          persistFavoritesToServer(next, gen);
        }, 400);
        return next;
      });
    },
    [persistFavoritesToServer, t]
  );

  const toggleFavoriteRoom = useCallback(
    (roomId) => {
      if (!getAccessToken() || favoritesUserIdRef.current == null) {
        addToast(t('account.signInRequired', 'Sign in to save favorites'), 'info');
        return;
      }
      const gen = sessionGenRef.current;
      const key = String(roomId);
      setFavoritesState((prev) => {
        const next = normalizeFavorites({
          ...prev,
          rooms: toggleFavoriteId(prev.rooms, key),
        });
        const added = next.rooms.includes(key);
        addToast(
          added
            ? t('favorites.addedRoom', 'Room saved to favorites')
            : t('favorites.removedRoom', 'Room removed from favorites'),
          'info'
        );
        if (favoritesSyncRef.current) clearTimeout(favoritesSyncRef.current);
        favoritesSyncRef.current = setTimeout(() => {
          persistFavoritesToServer(next, gen);
        }, 400);
        return next;
      });
    },
    [persistFavoritesToServer, t]
  );

  const toggleFavoriteDish = useCallback(
    (dishId) => {
      if (!getAccessToken() || favoritesUserIdRef.current == null) {
        addToast(t('account.signInRequired', 'Sign in to save favorites'), 'info');
        return;
      }
      const gen = sessionGenRef.current;
      const key = String(dishId);
      setFavoritesState((prev) => {
        const next = normalizeFavorites({
          ...prev,
          dishes: toggleFavoriteId(prev.dishes, key),
        });
        const added = next.dishes.includes(key);
        addToast(
          added
            ? t('favorites.addedDish', 'Dish saved to favorites')
            : t('favorites.removedDish', 'Dish removed from favorites'),
          'info'
        );
        if (favoritesSyncRef.current) clearTimeout(favoritesSyncRef.current);
        favoritesSyncRef.current = setTimeout(() => {
          persistFavoritesToServer(next, gen);
        }, 400);
        return next;
      });
    },
    [persistFavoritesToServer, t]
  );

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        currency,
        setCurrency,
        toggleCurrency,
        language,
        setLanguage,
        t,
        localize: localizeItem,
        user,
        authStatus,
        hydrateSession,
        loginWithPassword,
        verifyTwoFactor,
        registerAccount,
        logout,
        saveCustomerProfile,
        uploadCustomerAvatar,
        removeCustomerAvatar,
        changeCustomerPassword,
        updateUser,
        bookingDraft,
        updateBookingDraft,
        setRoomForBooking,
        addRoomToStay,
        removeRoomFromStay,
        bookings,
        bookingsLoading,
        bookingsError,
        refreshMyBookings,
        registerBooking,
        cancelBooking,
        notifications,
        markNotificationRead,
        unreadCount,
        toasts,
        addToast,
        removeToast,
        favorites,
        isFavoriteResort,
        isFavoriteRoom,
        isFavoriteDish,
        toggleFavoriteResort,
        toggleFavoriteRoom,
        toggleFavoriteDish,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
