"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { readPreference, resolveTheme, setPreference, subscribeTheme, type ThemePreference } from "@/lib/theme";
import { cn } from "@/lib/utils";

/** null on the server and during hydration: the stored preference is only known in the browser. */
function useThemePreference(): ThemePreference | null {
  return useSyncExternalStore(subscribeTheme, readPreference, () => null);
}

/**
 * Compact header button: switches between light and dark. The icon shows the theme you get by
 * clicking. Until the visitor picks one, the device setting is followed.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const pref = useThemePreference();
  const current = pref ? resolveTheme(pref) : null;
  const next = current === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => setPreference(next)}
      aria-label={current ? `Switch to ${next} theme` : "Switch theme"}
      title={current ? `Switch to ${next} theme` : "Switch theme"}
      className={cn("grid size-10 place-items-center rounded-lg text-ink-600 transition hover:bg-ink-100 hover:text-ink-900", className)}
    >
      {/* Both icons are rendered; CSS picks one, so the server markup never mismatches. */}
      <Moon className="size-[18px] dark:hidden" aria-hidden />
      <Sun className="hidden size-[18px] dark:block" aria-hidden />
    </button>
  );
}

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
];

/** Three-way picker (light / dark / follow device) for the mobile menu. */
export function ThemeSwitcher({ className }: { className?: string }) {
  const pref = useThemePreference();
  return (
    <div role="radiogroup" aria-label="Theme" className={cn("grid grid-cols-3 gap-1 rounded-xl bg-ink-100 p-1", className)}>
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = pref === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setPreference(value)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-semibold transition",
              active ? "bg-surface text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-800",
            )}
          >
            <Icon className="size-4" aria-hidden /> {label}
          </button>
        );
      })}
    </div>
  );
}
