export const isAuthenticated = () => !!localStorage.getItem("access_token");
export const getToken = () => localStorage.getItem("access_token");
export const getUser = () => {
  try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
};
export const setAuth = (token, user) => {
  localStorage.setItem("access_token", token);
  if (user) localStorage.setItem("user", JSON.stringify(user));
};
export const clearAuth = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
};
