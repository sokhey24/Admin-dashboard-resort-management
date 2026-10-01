import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { loadMyBookingsMapped } from '../hooks/useBooking.js';
import { getTranslation } from '../i18n/index.js';
import {
  loginRequest,
  registerRequest,
  logoutRequest,
  meRequest,
  twoFactorChallengeRequest,
} from '../services/api/authApi.js';
import { getApiErrorMessage, getValidationFieldErrors } from '../services/api/errors.js';
import { updateProfile, changePasswordAuth, updatePreferences } from '../services/api/accountApi.js';
import { setAccessToken, clearAccessToken, getAccessToken } from '../store/authStore.js';
import { mapCustomerUser, isCustomerRole } from '../util/mapCustomerUser.js';
import { setUnauthorizedHandler } from '../services/api/axiosClient.js';
import { localize } from '../util/localize.js';
import { loadPreferences, savePreferences } from '../store/preferenceStore.js';
import { loadBookingDraft, saveBookingDraft } from '../store/bookingStore.js';
import {
  loadFavorites,
  saveFavorites,
  mergeFavorites,
  normalizeFavorites,
  toggleFavoriteId,
} from '../store/favoritesStore.js';

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

  // Booking Draft
  const [bookingDraft, setBookingDraft] = useState(() => loadBookingDraft());

  const [bookings, setBookings] = useState([]);

  const [favorites, setFavoritesState] = useState(() => loadFavorites());
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

  // Apply language to document
  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
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


  const setFavorites = useCallback((next) => {
    const normalized = saveFavorites(next);
    setFavoritesState(normalized);
    return normalized;
  }, []);

  const persistFavoritesToServer = useCallback(async (snapshot) => {
    if (!getAccessToken()) return;
    try {
      await updatePreferences({ favorites: snapshot });
    } catch {
      // keep local copy; user can retry on next toggle
    }
  }, []);

  const syncFavoritesAfterLogin = useCallback(
    async (apiUser) => {
      const server = normalizeFavorites(apiUser?.preferences?.favorites);
      const local = loadFavorites();
      const merged = mergeFavorites(server, local);
      setFavorites(merged);

      const serverKey = JSON.stringify(server);
      const mergedKey = JSON.stringify(merged);
      if (serverKey !== mergedKey) {
        await persistFavoritesToServer(merged);
      }
    },
    [persistFavoritesToServer, setFavorites]
  );

  const isFavoriteResort = useCallback(
    (resortId) => favorites.resorts.includes(String(resortId)),
    [favorites.resorts]
  );

  const isFavoriteRoom = useCallback(
    (roomId) => favorites.rooms.includes(String(roomId)),
    [favorites.rooms]
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

  const setLanguage = (lang) => {
    setLanguageState(lang);
    savePrefs({ lang });
    addToast(lang === 'km' ? 'ភាសាខ្មែរត្រូវបានជ្រើសរើស' : 'Language set to English', 'info');
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

  const clearSession = useCallback(() => {
    clearAccessToken();
    setUser(null);
    setAuthStatus('unauthenticated');
    setFavorites(loadFavorites());
    try {
      localStorage.removeItem('solara_user');
    } catch {
      // ignore
    }
  }, [setFavorites]);

  const refreshMyBookings = useCallback(async () => {
    if (!getAccessToken()) {
      setBookings([]);
      return;
    }
    try {
      const mapped = await loadMyBookingsMapped();
      setBookings(mapped);
    } catch {
      setBookings([]);
    }
  }, []);

  const hydrateSession = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setAuthStatus('unauthenticated');
      setUser(null);
      return { ok: true, user: null };
    }

    setAuthStatus('loading');
    try {
      const data = await meRequest();
      const roles = data.roles ?? data.user?.roles ?? [];
      if (!isCustomerRole(roles)) {
        clearSession();
        return { ok: false, error: STAFF_ONLY_MESSAGE };
      }
      const mapped = await applySessionWithFavorites(data.user, roles);
      await refreshMyBookings();
      return { ok: true, user: mapped };
    } catch (error) {
      clearSession();
      return { ok: false, error: getApiErrorMessage(error) };
    }
  }, [applySessionWithFavorites, clearSession, refreshMyBookings]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
      setBookings([]);
      setNotifications([]);
    });
    return () => setUnauthorizedHandler(() => {});
  }, [clearSession]);

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

      try {
        const me = await meRequest();
        const roles = me.roles ?? me.user?.roles ?? [];
        if (!isCustomerRole(roles)) {
          clearSession();
          return { ok: false, error: STAFF_ONLY_MESSAGE };
        }
        const mapped = await applySessionWithFavorites(me.user, roles);
        await refreshMyBookings();
        addToast(`Welcome back, ${mapped.name}`, 'success');
        return { ok: true, user: mapped };
      } catch (error) {
        clearSession();
        return { ok: false, error: getApiErrorMessage(error) };
      }
    },
    [applySessionWithFavorites, clearSession, refreshMyBookings]
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
      const data = await registerRequest({
        name,
        email,
        phone: phone || undefined,
        password,
        password_confirmation,
      });
      if (!data.access_token) {
        return { ok: true, registered: true, message: data.message };
      }
      return await completeAuthResponse(data);
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
    setBookings([]);
    setNotifications([]);
    addToast('You have been signed out', 'info');
  };

  const saveCustomerProfile = async ({ name, phone }) => {
    if (!user) {
      return { ok: false, error: 'You must be signed in to update your profile.' };
    }
    try {
      const updated = await updateProfile({ name, phone });
      const mapped = mapCustomerUser(updated, user.roles);
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
      const next = { ...prev, ...updates };
      saveBookingDraft(next);
      return next;
    });
  };

  const setRoomForBooking = (resort, room) => {
    const nextDraft = {
      ...bookingDraft,
      resortId: resort.id ?? room.resortId,
      branchId: resort.catalogKind === 'branch' ? resort.id : (room.branchId ?? bookingDraft.branchId),
      resortName: resort.name,
      roomId: room.id,
      roomName: room.name,
      roomImage: room.featuredImage,
    };
    setBookingDraft(nextDraft);
    saveBookingDraft(nextDraft);
  };

  const registerBooking = (booking) => {
    if (!booking) return;
    setBookings((prev) => {
      const exists = prev.some((b) => b.apiId === booking.apiId || b.id === booking.id);
      if (exists) {
        return prev.map((b) =>
          b.apiId === booking.apiId || b.id === booking.id ? { ...b, ...booking } : b
        );
      }
      return [booking, ...prev];
    });

    const newNotif = {
      id: `notif-${Date.now()}`,
      title: `Reservation created (#${booking.id})`,
      message: `Your reservation at ${booking.resortName} for ${booking.roomName} has been saved.`,
      date: 'Just now',
      read: false,
      type: 'booking',
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const cancelBooking = (id) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b)));
    addToast(`Reservation #${id} has been cancelled`, 'info');
  };

  const markNotificationRead = (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addToast = (message, type = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleFavoriteResort = useCallback(
    (resortId) => {
      const key = String(resortId);
      setFavoritesState((prev) => {
        const next = normalizeFavorites({
          ...prev,
          resorts: toggleFavoriteId(prev.resorts, key),
        });
        saveFavorites(next);
        const added = next.resorts.includes(key);
        addToast(
          added
            ? t('favorites.addedResort', 'Resort saved to favorites')
            : t('favorites.removedResort', 'Resort removed from favorites'),
          'info'
        );
        if (favoritesSyncRef.current) clearTimeout(favoritesSyncRef.current);
        favoritesSyncRef.current = setTimeout(() => {
          persistFavoritesToServer(next);
        }, 400);
        return next;
      });
    },
    [persistFavoritesToServer, t]
  );

  const toggleFavoriteRoom = useCallback(
    (roomId) => {
      const key = String(roomId);
      setFavoritesState((prev) => {
        const next = normalizeFavorites({
          ...prev,
          rooms: toggleFavoriteId(prev.rooms, key),
        });
        saveFavorites(next);
        const added = next.rooms.includes(key);
        addToast(
          added
            ? t('favorites.addedRoom', 'Room saved to favorites')
            : t('favorites.removedRoom', 'Room removed from favorites'),
          'info'
        );
        if (favoritesSyncRef.current) clearTimeout(favoritesSyncRef.current);
        favoritesSyncRef.current = setTimeout(() => {
          persistFavoritesToServer(next);
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
        changeCustomerPassword,
        updateUser,
        bookingDraft,
        updateBookingDraft,
        setRoomForBooking,
        bookings,
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
        toggleFavoriteResort,
        toggleFavoriteRoom,
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
