import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow, trackErrors } from "./helpers";

const PUBLIC_PAGES = [
  "/",
  "/flights",
  "/hotels",
  "/hotels/coxs-bazar",
  "/tours",
  "/tours/coxs-bazar",
  "/tours/custom-request",
  "/bus",
  "/visa",
  "/visa/thailand",
  "/visa/track",
  "/destinations",
  "/destinations/bangladesh",
  "/destinations/coxs-bazar",
  "/login",
  "/register",
  "/forgot-password",
  "/info/terms",
];

test.describe("public pages", () => {
  for (const path of PUBLIC_PAGES) {
    test(`renders ${path} with SEO tags and no errors`, async ({ page }) => {
      const errors = trackErrors(page);
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator("h1").first()).toBeVisible();
      expect(await page.title()).toMatch(/Tripnaro/);
      if (!["/login", "/register", "/forgot-password"].includes(path)) {
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${path === "/" ? "" : path}$`));
        await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
      }
      await page.waitForLoadState("networkidle");
      expect(errors).toEqual([]);
    });
  }

  test("detail pages expose structured data", async ({ page }) => {
    await page.goto("/hotels/coxs-bazar");
    const hotelHref = await page.locator('a[href^="/hotels/"]').filter({ hasNot: page.locator("nav") }).nth(2).getAttribute("href");
    await page.goto("/tours/coxs-bazar");
    const tourLink = page.locator('main a[href^="/tours/"]').first();
    const tourHref = await tourLink.getAttribute("href");
    for (const [href, type] of [[hotelHref, "Hotel"], [tourHref, "TouristTrip"]] as const) {
      await page.goto(href!.split("?")[0]);
      const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
      expect(ld.some((j) => j.includes(`"@type":"${type}"`)), `${type} JSON-LD on ${href}`).toBeTruthy();
      expect(ld.some((j) => j.includes("BreadcrumbList"))).toBeTruthy();
    }
  });

  test("sitemap and robots", async ({ request }) => {
    const sm = await request.get("/sitemap.xml");
    expect(sm.ok()).toBeTruthy();
    const xml = await sm.text();
    expect(xml).toContain("/tours/");
    expect(xml).toContain("/hotels/");
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /admin");
    expect(robots).toContain("Sitemap:");
  });

  test("unknown routes return the 404 page", async ({ page }) => {
    const res = await page.goto("/this-page-does-not-exist");
    expect(res?.status()).toBe(404);
    await expect(page.getByText("This page took a detour")).toBeVisible();
  });

  test("homepage images load", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
    });
    await page.waitForLoadState("networkidle");
    const broken = await page.$$eval("img", (imgs) => imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src));
    expect(broken).toEqual([]);
  });
});

test.describe("responsive layout", () => {
  for (const width of [320, 375, 768, 1024, 1440]) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const path of ["/", "/hotels", "/tours", "/flights", "/bus", "/visa", "/destinations/coxs-bazar", "/login"]) {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        await expectNoHorizontalOverflow(page);
      }
    });
  }

  test("mobile navigation opens and navigates", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");
    await page.getByRole("button", { name: /menu/i }).first().click();
    await page.getByRole("link", { name: "Tours" }).last().click();
    await expect(page).toHaveURL(/\/tours/);
  });
});
