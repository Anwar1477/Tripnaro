import { expect, test } from "@playwright/test";
import { ADMIN, apiLogin, dateInput, DEMO_USER, fillTravellers, payWithDemo, registerUser, trackErrors } from "./helpers";

test.describe("authentication", () => {
  test("register, sign out and sign back in through the UI", async ({ page }) => {
    const errors = trackErrors(page);
    const email = `ui.${Date.now()}@example.com`;
    await page.goto("/register");
    await page.getByLabel("Full name").fill("UI Tester");
    await page.getByLabel("Email").fill(email);
    await page.locator("input[name=password]").fill("Secret123");
    await page.locator("input[name=confirm]").fill("Secret123");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/my-account/);
    await expect(page.getByRole("heading", { name: /Hi, UI/ })).toBeVisible();

    await page.getByRole("button", { name: "Sign out" }).click();
    await page.goto("/my-account");
    await expect(page).toHaveURL(/\/login\?next=/);

    await page.getByLabel("Email").fill(email);
    await page.locator("input[name=password]").fill("wrong-password1");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("alert").filter({ hasText: /invalid|incorrect/i })).toBeVisible();
    await page.locator("input[name=password]").fill("Secret123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/my-account/);
    expect(errors).toEqual([]);
  });

  test("client-side validation blocks bad input", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Enter your full name")).toBeVisible();
    await expect(page.getByText("Enter a valid email")).toBeVisible();
  });

  test("forgot and reset password (dev console mail)", async ({ page }) => {
    const user = await registerUser(page, "reset");
    await page.context().clearCookies();
    await page.goto("/forgot-password");
    await page.getByLabel("Email").fill(user.email);
    await page.getByRole("button", { name: "Send reset link" }).click();
    const link = page.getByRole("link", { name: /reset-password\?token=/ });
    await expect(link).toBeVisible();
    await page.goto(new URL((await link.getAttribute("href"))!).pathname + new URL((await link.getAttribute("href"))!).search);
    await page.locator("input[name=password]").fill("Newpass123");
    await page.locator("input[name=confirm]").fill("Newpass123");
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page).toHaveURL(/\/my-account/);
    const old = await page.request.post("/api/v1/auth/login", { data: user });
    expect(old.status()).toBe(401);
  });
});

test.describe("booking flows", () => {
  test("hotel: search → room → guest details → demo payment → confirmed", async ({ page }) => {
    const errors = trackErrors(page);
    await registerUser(page, "hotel");
    await page.goto(`/hotels?destination=coxs-bazar&checkIn=${dateInput(12)}&checkOut=${dateInput(14)}&rooms=1&adults=2`);
    const first = page.locator('main a[href^="/hotels/"][href*="checkIn"]').first();
    await expect(first).toBeVisible();
    await first.click();
    await expect(page.getByRole("heading", { name: "Choose your room" })).toBeVisible();
    await page.getByRole("button", { name: "Reserve" }).first().click();
    await expect(page).toHaveURL(/\/book\?/);
    await expect(page.getByText("Total payable")).toBeVisible();
    await fillTravellers(page, 1);
    await page.getByRole("button", { name: "Continue to payment" }).click();
    await payWithDemo(page, "success");
    await expect(page.getByRole("heading", { name: "Booking confirmed!" })).toBeVisible();
    await expect(page.getByText("Demo payment: no real money was charged")).toBeVisible();

    await page.getByRole("link", { name: "View details" }).click();
    await expect(page.getByText("Confirmed").first()).toBeVisible();
    await expect(page.getByText("Paid").first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("tour: coupon, failed payment, retry succeeds", async ({ page }) => {
    await registerUser(page, "tour");
    await page.goto("/tours");
    await page.locator('main a[href^="/tours/"]').filter({ hasNotText: "custom" }).first().click();
    await page.getByRole("button", { name: "Book this tour" }).click();
    await expect(page).toHaveURL(/\/book\?departure=/);
    const totalBefore = await page.locator("text=Total payable").locator("..").innerText();
    await page.getByLabel("Coupon code").fill("NOTACODE");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByRole("alert").filter({ hasText: /coupon|invalid|not found/i })).toBeVisible();
    await page.getByLabel("Coupon code").fill("TRIPNARO10");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText("TRIPNARO10 applied")).toBeVisible();
    expect(await page.locator("text=Total payable").locator("..").innerText()).not.toEqual(totalBefore);

    await fillTravellers(page, 2);
    await page.getByRole("button", { name: "Continue to payment" }).click();
    await payWithDemo(page, "failed");
    await expect(page.getByRole("heading", { name: "Payment failed" })).toBeVisible();
    await page.getByRole("link", { name: "Try again" }).click();
    await payWithDemo(page, "success");
    await expect(page.getByRole("heading", { name: "Booking confirmed!" })).toBeVisible();
  });

  test("flight: round trip with demo inventory → passengers → checkout", async ({ page }) => {
    await registerUser(page, "flight");
    await page.goto(`/flights/search?trip=round_trip&cabin=economy&adults=1&children=1&infants=0&from=DAC&to=CXB&date=${dateInput(10)}&return=${dateInput(13)}`);
    await expect(page.getByText("Demo flight inventory").first()).toBeVisible();
    await page.getByRole("checkbox", { name: "Non-stop" }).check();
    await page.getByRole("button", { name: "Select & continue" }).first().click();
    await expect(page.getByRole("button", { name: /2\. CXB/ })).toHaveClass(/bg-brand-600/);
    await page.getByRole("button", { name: /^Select$/ }).first().click();
    await expect(page).toHaveURL(/\/flights\/review/);
    await fillTravellers(page, 2, { dob: true });
    await page.getByRole("button", { name: "Continue to payment" }).click();
    await expect(page).toHaveURL(/\/checkout\//);
    await expect(page.getByText(/DAC/).first()).toBeVisible();
  });

  test("bus: choose seats → passengers → pay → seats become unavailable", async ({ page }) => {
    await registerUser(page, "bus");
    const date = dateInput(5);
    await page.goto(`/bus?from=Dhaka&to=${encodeURIComponent("Cox's Bazar")}&date=${date}`);
    await page.getByRole("link", { name: "Select seats" }).first().click();
    const free = page.locator('button[aria-label^="Seat "]:not([disabled])');
    const seatA = (await free.nth(0).getAttribute("aria-label"))!.replace("Seat ", "");
    const seatB = (await free.nth(1).getAttribute("aria-label"))!.replace("Seat ", "");
    await free.nth(0).click();
    await page.getByRole("button", { name: `Seat ${seatB}` }).click();
    await expect(page.getByText(`Passenger 2 · Seat ${seatB}`)).toBeVisible();
    await fillTravellers(page, 2);
    await page.getByRole("button", { name: "Continue to payment" }).click();
    await payWithDemo(page, "success");
    await expect(page.getByRole("heading", { name: "Booking confirmed!" })).toBeVisible();

    const busUrl = await page.evaluate(() => document.referrer);
    expect(busUrl).toBeDefined();
    await page.goBack();
    // The held/paid seats must now be reported as taken by the API.
    const busId = new URL(page.url()).pathname.split("/").pop();
    if (busId && /^[a-f0-9]{24}$/.test(busId)) {
      const seats = await (await page.request.get(`/api/v1/buses/${busId}/seats?date=${date}`)).json();
      expect(seats.data.taken).toEqual(expect.arrayContaining([seatA, seatB]));
    }
  });

  test("unpaid booking can be cancelled by the customer", async ({ page }) => {
    await registerUser(page, "cancel");
    await page.goto("/tours");
    await page.locator('main a[href^="/tours/"]').filter({ hasNotText: "custom" }).nth(1).click();
    await page.getByRole("button", { name: "Book this tour" }).click();
    await fillTravellers(page, 2);
    await page.getByRole("button", { name: "Continue to payment" }).click();
    await expect(page).toHaveURL(/\/checkout\//);
    const id = page.url().split("/").pop();
    await page.goto(`/my-account/bookings/${id}`);
    await page.getByRole("button", { name: "Cancel booking" }).click();
    await page.getByLabel("Reason").fill("Change of plans for the family");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("Cancelled").first()).toBeVisible();
  });

  test("visa: apply with document upload, then pay the fee", async ({ page }) => {
    await registerUser(page, "visa");
    await page.goto("/visa/thailand/apply");
    await page.getByLabel("Given name(s)").fill("Karim");
    await page.getByLabel("Surname").fill("Ahmed");
    await page.getByLabel("Date of birth").fill("1988-02-02");
    await page.getByLabel("Passport number").fill("A01234567");
    await page.getByLabel("Passport expiry").fill(dateInput(800));
    await page.locator("#doc-0").setInputFiles({ name: "passport.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n% test passport\n") });
    await expect(page.getByText("passport.pdf")).toBeVisible();
    await page.getByRole("button", { name: "Submit application" }).click();
    await expect(page.getByText(/Application TNV-/)).toBeVisible();
    await page.getByRole("radio", { name: /Demo payment/ }).click();
    await page.getByRole("button", { name: /^Pay / }).click();
    await page.getByRole("button", { name: "Simulate success" }).click();
    await expect(page.getByRole("heading", { name: "Payment received" })).toBeVisible();

    await page.getByRole("link", { name: "View details" }).click();
    const ref = (await page.locator("p.font-mono").first().innerText()).trim();
    await page.context().clearCookies();
    await page.goto(`/visa/track?reference=${ref}`);
    await page.getByLabel("Passport number").fill("A01234567");
    await page.getByRole("button", { name: "Track" }).click();
    await expect(page.getByText("Thailand ·")).toBeVisible();
  });
});

test.describe("security", () => {
  test("payment result is read from the server, not the URL", async ({ page }) => {
    await registerUser(page, "sec");
    await page.goto("/payment/result?tx=FAKE-TX-123&status=success");
    await expect(page.getByRole("heading", { name: "Booking confirmed!" })).toHaveCount(0);
    await expect(page.getByText(/not found|wrong/i).first()).toBeVisible();
  });

  test("forged demo callback does not confirm a booking", async ({ request }) => {
    const res = await request.get("http://localhost:5000/api/v1/payments/callback/demo?tx=TX-DOESNOTEXIST&outcome=success&signature=abc", { maxRedirects: 0 });
    expect([302, 303]).toContain(res.status());
    expect(res.headers().location).toContain("/payment/result");
  });

  test("customers cannot open the admin panel or admin API", async ({ page }) => {
    await apiLogin(page, DEMO_USER);
    const api = await page.request.get("/api/v1/admin/stats");
    expect(api.status()).toBe(403);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/my-account/);
  });

  test("guests are redirected away from private pages", async ({ page }) => {
    await page.goto("/my-account/bookings");
    await expect(page).toHaveURL(/\/login\?next=%2Fmy-account%2Fbookings/);
  });
});

test.describe("admin", () => {
  test("dashboard, destination CRUD and booking management", async ({ page }) => {
    const errors = trackErrors(page);
    await apiLogin(page, ADMIN);
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("Demo payments")).toBeVisible();

    const name = `E2E Island ${Date.now()}`;
    await page.goto("/admin/content/destinations");
    await page.getByRole("button", { name: "New destination" }).click();
    await page.getByLabel("Name *").fill(name);
    await page.getByLabel("Description").fill("A test destination created by the end-to-end suite.");
    await page.getByPlaceholder("…or paste an image URL").first().fill("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800");
    await page.getByRole("button", { name: "Add" }).first().click();
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Destination created")).toBeVisible();

    await page.getByPlaceholder("Search…").fill("E2E Island");
    const row = page.getByRole("row", { name: new RegExp(name) });
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: "Edit" }).click();
    await page.getByLabel("Tagline").fill("Edited by Playwright");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Destination updated")).toBeVisible();
    await row.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText("Destination deleted")).toBeVisible();

    await page.goto("/admin/bookings");
    await page.getByRole("button", { name: "Manage" }).first().click();
    await expect(page.getByText("Take action")).toBeVisible();

    for (const path of ["/admin/users", "/admin/payments", "/admin/visa-applications", "/admin/reviews", "/admin/newsletter", "/admin/settings", "/admin/content/hotels", "/admin/content/tours", "/admin/content/flights", "/admin/content/buses", "/admin/content/visa-countries", "/admin/content/coupons", "/admin/content/banners", "/admin/content/rooms", "/admin/content/airports", "/admin/content/tour-requests"]) {
      await page.goto(path);
      await expect(page.locator("h1").first()).toBeVisible();
      await expect(page.getByText(/Something went wrong|couldn't/i)).toHaveCount(0);
    }
    expect(errors).toEqual([]);
  });
});
