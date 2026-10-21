import { ProfileStore } from "../store/ProfileStore";

const PROFILE_STORE_KEY = "ResortProfileStore";

/** Authoritative token: Zustand persist (`ResortProfileStore.state.access_token`). */
export function getTokenFromProfileStore() {
  try {
    const raw = localStorage.getItem(PROFILE_STORE_KEY);
    const store = raw ? JSON.parse(raw) : null;
    return store?.state?.access_token || null;
  } catch {
    return null;
  }
}

export const getToken = () => getTokenFromProfileStore();

export const getUser = () => {
  try {
    return ProfileStore.getState().profile;
  } catch {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }
};

export const isAuthenticated = () => {
  try {
    const { profile, access_token } = ProfileStore.getState();
    return Boolean(profile && access_token);
  } catch {
    return Boolean(getTokenFromProfileStore());
  }
};

/** Mirror token/user to legacy keys for older call sites; ProfileStore remains authoritative. */
export const setAuth = (token, user) => {
  if (token) {
    localStorage.setItem("access_token", token);
  } else {
    localStorage.removeItem("access_token");
  }
  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  } else {
    localStorage.removeItem("user");
  }
};

export const clearAuth = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
};

/** Clear only admin session data (not theme, language, or unrelated app prefs). */
export const clearAdminSession = () => {
  try {
    ProfileStore.getState().logout();
  } catch {
    // ignore
  }
  clearAuth();
};

export function isAuthApiPath(url = "") {
  const path = String(url).replace(/^\/+/, "").split("?")[0].toLowerCase();
  return /^(auth\/login|auth\/register|auth\/forgot-password|auth\/verify-otp|auth\/reset-password|auth\/two-factor)/.test(
    path
  );
}
