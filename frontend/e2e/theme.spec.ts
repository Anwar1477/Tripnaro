import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow, trackErrors } from "./helpers";

const theme = (page: import("@playwright/test").Page) => page.evaluate(() => document.documentElement.dataset.theme);
const bodyBg = (page: import("@playwright/test").Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);

test.describe("light / dark theme", () => {
  test("follows the device setting until the visitor chooses", async ({ browser }) => {
    for (const scheme of ["light", "dark"] as const) {
      const ctx = await browser.newContext({ colorScheme: scheme });
      const page = await ctx.newPage();
      await page.goto("/");
      expect(await theme(page)).toBe(scheme);
      await ctx.close();
    }
  });

  test("theme is applied before first paint (no flash)", async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme: "dark" });
    const page = await ctx.newPage();
    // Check the attribute as soon as the HTML is parsed, before any app JavaScript runs.
    await page.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () => {
        (window as unknown as { __themeAtParse?: string }).__themeAtParse = document.documentElement.dataset.theme;
      });
    });
    await page.goto("/login");
    expect(await page.evaluate(() => (window as unknown as { __themeAtParse?: string }).__themeAtParse)).toBe("dark");
    await ctx.close();
  });

  test("header toggle switches, persists across reloads and reports no errors", async ({ page }) => {
    const errors = trackErrors(page);
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    expect(await theme(page)).toBe("light");
    const light = await bodyBg(page);

    await page.getByRole("button", { name: "Switch to dark theme" }).click();
    expect(await theme(page)).toBe("dark");
    expect(await bodyBg(page)).not.toBe(light);
    await expect(page.getByRole("button", { name: "Switch to light theme" })).toBeVisible();

    await page.reload();
    expect(await theme(page)).toBe("dark");
    await page.goto("/hotels");
    expect(await theme(page)).toBe("dark");

    await page.getByRole("button", { name: "Switch to light theme" }).click();
    expect(await theme(page)).toBe("light");
    expect(errors).toEqual([]);
  });

  test("mobile menu offers light, dark and system", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    const group = page.getByRole("radiogroup", { name: "Theme" });
    await expect(group.getByRole("radio", { name: "System" })).toHaveAttribute("aria-checked", "true");
    await group.getByRole("radio", { name: "Light" }).click();
    expect(await theme(page)).toBe("light");
    await expect(group.getByRole("radio", { name: "Light" })).toHaveAttribute("aria-checked", "true");
    await group.getByRole("radio", { name: "System" }).click();
    expect(await theme(page)).toBe("dark"); // back to the device setting
    expect(await page.evaluate(() => localStorage.getItem("tripnaro-theme"))).toBeNull();
    await expectNoHorizontalOverflow(page);
  });
});
