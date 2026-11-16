/**
 * Light / dark theme.
 *
 * The visitor's choice ("light" | "dark" | "system") is kept in localStorage. "system" (the default)
 * follows the device's prefers-color-scheme. The resolved theme is written to <html data-theme>,
 * which the CSS keys off. `THEME_SCRIPT` runs inline in <head> before first paint, so there is no
 * flash of the wrong theme on load.
 */
export type ThemePreference = "light" | "dark" | "system";
export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "tripnaro-theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

export const THEME_SCRIPT = `(function(){try{var p=localStorage.getItem("${THEME_STORAGE_KEY}");var d=p==="dark"||(p!=="light"&&window.matchMedia("${DARK_QUERY}").matches);document.documentElement.dataset.theme=d?"dark":"light";}catch(e){document.documentElement.dataset.theme="light";}})();`;

export function readPreference(): ThemePreference {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

export function resolveTheme(pref: ThemePreference): Theme {
  if (pref !== "system") return pref;
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

/** Applies a theme without animating every colour transition on the page. */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (root.dataset.theme === theme) return;
  root.setAttribute("data-theme-switching", "");
  root.dataset.theme = theme;
  requestAnimationFrame(() => requestAnimationFrame(() => root.removeAttribute("data-theme-switching")));
}

export function setPreference(pref: ThemePreference) {
  try {
    if (pref === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    // Storage blocked (private mode): the choice still applies for this page view.
  }
  applyTheme(resolveTheme(pref));
  window.dispatchEvent(new Event("tripnaro-theme"));
}

/** Notifies on preference changes (this tab, other tabs) and on device theme changes. */
export function subscribeTheme(onChange: () => void) {
  const media = window.matchMedia(DARK_QUERY);
  const onSystem = () => {
    if (readPreference() === "system") applyTheme(resolveTheme("system"));
    onChange();
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key !== THEME_STORAGE_KEY) return;
    applyTheme(resolveTheme(readPreference()));
    onChange();
  };
  media.addEventListener("change", onSystem);
  window.addEventListener("storage", onStorage);
  window.addEventListener("tripnaro-theme", onChange);
  return () => {
    media.removeEventListener("change", onSystem);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("tripnaro-theme", onChange);
  };
}
