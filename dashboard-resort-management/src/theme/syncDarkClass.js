export function resolveRmsDarkMode() {
  const saved = localStorage.getItem("rms-theme");
  if (saved === "dark") return true;
  if (saved === "light") return false;
  if (saved === "auto") {
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
  }
  return false;
}

export function applyHtmlDarkClass(isDark) {
  document.documentElement.classList.toggle("dark", Boolean(isDark));
}
