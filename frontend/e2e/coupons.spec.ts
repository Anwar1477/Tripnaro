import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { ADMIN, dateInput, expectNoHorizontalOverflow, fillTravellers, registerUser, trackErrors } from "./helpers";

/**
 * Admin-controlled coupon system: admin CRUD + validation, discount maths, every coupon rule,
 * usage limits (including a concurrency race), checkout re-validation, the global switch, and the
 * conditional discount-badge UI. Coupons are created per run with unique codes; the global switch
 * is always restored to "on".
 */

const RUN = Date.now().toString(36).toUpperCase().slice(-5);
const code = (name: string) => `E2E${name}${RUN}`;
const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * 86_400_000).toISOString();

type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

let admin: APIRequestContext;
let hotel: { id: string; slug: string; roomId: string };
let dateSlot = 0;
/** A fresh 2-night stay per booking so test bookings never exhaust room inventory. */
function stay() {
  const start = 70 + dateSlot++ * 3;
  return { checkIn: dateInput(start), checkOut: dateInput(start + 2) };
}
const hotelBody = (extra: Json = {}) => ({ type: "hotel", hotelId: hotel.id, roomId: hotel.roomId, rooms: 1, adults: 2, children: 0, ...stay(), ...extra });
const guest = { travelers: [{ type: "adult", firstName: "Rahim", lastName: "Uddin" }], contact: { name: "Rahim Uddin", email: "rahim@example.com", phone: "+8801711000000" } };

async function createCoupon(data: Json) {
  const res = await admin.post("/api/v1/admin/coupons", {
    data: { title: "E2E coupon", discountType: "percent", value: 20, minAmount: 0, appliesTo: ["hotel", "tour", "flight", "bus"], usageLimit: 0, perUserLimit: 0, showOnHome: false, active: true, validFrom: iso(-1), validTo: iso(30), ...data },
  });
  expect(res.status(), await res.text()).toBe(201);
  return (await res.json()).data as Json;
}
const updateCoupon = async (id: string, data: Json) => {
  const res = await admin.put(`/api/v1/admin/coupons/${id}`, { data });
  expect(res.ok(), await res.text()).toBeTruthy();
  return (await res.json()).data as Json;
};
const setCouponsEnabled = async (on: boolean) => expect((await admin.put("/api/v1/admin/settings", { data: { "features.coupons": on } })).ok()).toBeTruthy();
const quote = async (req: APIRequestContext, body: Json) => (await (await req.post("/api/v1/bookings/quote", { data: body })).json()).data as Json;
async function book(page: Page, body: Json) {
  const res = await page.request.post("/api/v1/bookings", { data: { ...body, ...guest } });
  return { status: res.status(), body: (await res.json()) as Json };
}
const couponDoc = async (id: string) => (await (await admin.get(`/api/v1/admin/coupons/${id}`)).json()).data as Json;

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ playwright }) => {
  admin = await playwright.request.newContext({ baseURL: test.info().project.use.baseURL });
  expect((await admin.post("/api/v1/auth/login", { data: ADMIN })).ok()).toBeTruthy();
  await setCouponsEnabled(true);
  const list = (await (await admin.get("/api/v1/hotels?limit=1")).json()).data as Json[];
  const detail = (await (await admin.get(`/api/v1/hotels/${list[0].slug}`)).json()).data as Json;
  hotel = { id: list[0]._id, slug: list[0].slug, roomId: (detail.rooms ?? detail.hotel?.rooms)[0]._id };
});

test.afterAll(async () => {
  await setCouponsEnabled(true);
  // Remove this run's coupons so they do not pile up on the home page or in the admin list.
  const mine = (await (await admin.get(`/api/v1/admin/coupons?q=${RUN}&limit=100`)).json()).data as Json[];
  for (const c of mine) if (String(c.code).startsWith("E2E") && String(c.code).endsWith(RUN)) await admin.delete(`/api/v1/admin/coupons/${c._id}`);
  await admin.dispose();
});

test.describe("admin coupon management", () => {
  test("creates, normalises, validates and rejects duplicates", async () => {
    const c = await createCoupon({ code: code("ADM").toLowerCase() });
    expect(c.code).toBe(code("ADM")); // stored upper-case
    const dup = await admin.post("/api/v1/admin/coupons", { data: { code: code("adm"), title: "dup", discountType: "percent", value: 5, appliesTo: ["hotel"], validTo: iso(5) } });
    expect(dup.status()).toBe(409);
    const tooBig = await admin.post("/api/v1/admin/coupons", { data: { code: code("BIG"), title: "x", discountType: "percent", value: 150, appliesTo: ["hotel"], validTo: iso(5) } });
    expect(tooBig.status()).toBe(422);
    const backwards = await admin.post("/api/v1/admin/coupons", { data: { code: code("BACK"), title: "x", discountType: "percent", value: 5, appliesTo: ["hotel"], validFrom: iso(5), validTo: iso(1) } });
    expect(backwards.status()).toBe(422);
    const badCode = await admin.post("/api/v1/admin/coupons", { data: { code: "no spaces!", title: "x", discountType: "percent", value: 5, appliesTo: ["hotel"], validTo: iso(5) } });
    expect(badCode.status()).toBe(422);
    // Admin cannot tamper with usage counters through the CRUD API.
    const edited = await updateCoupon(c._id, { usedCount: 999, title: "Edited" });
    expect(edited.usedCount).toBe(0);
    expect(edited.title).toBe("Edited");
    // Delete → the code stops working.
    expect((await admin.delete(`/api/v1/admin/coupons/${c._id}`)).ok()).toBeTruthy();
    const q = await quote(admin, hotelBody({ couponCode: code("ADM") }));
    expect(q.couponError.code).toBe("COUPON_INVALID");
  });

  test("customers cannot manage coupons", async ({ page }) => {
    await registerUser(page, "cpn-guard");
    const res = await page.request.post("/api/v1/admin/coupons", { data: { code: code("HACK"), title: "x", discountType: "percent", value: 90, appliesTo: ["hotel"], validTo: iso(5) } });
    expect(res.status()).toBe(403);
  });
});

test.describe("discount calculation", () => {
  test("percentage maths, rounding and the max-discount cap", async ({ page }) => {
    await createCoupon({ code: code("P20"), value: 20 });
    await createCoupon({ code: code("P15"), value: 15 });
    await createCoupon({ code: code("CAP"), value: 20, maxDiscount: 1500 });
    const check = async (c: string, amount: number) => (await (await page.request.post("/api/v1/coupons/validate", { data: { code: c, type: "hotel", amount } })).json()).data as Json;
    expect((await check(code("P20"), 10_000)).discount).toBe(2000);
    expect((await check(code("P15"), 5_000)).discount).toBe(750);
    expect((await check(code("P15"), 333)).discount).toBe(50); // 49.95 rounds to whole BDT
    const capped = await check(code("CAP"), 10_000);
    expect(capped).toMatchObject({ discount: 1500, capped: true });
  });

  test("quote discounts fare + taxes, never the service fee, and reflects admin changes", async ({ page }) => {
    const c = await createCoupon({ code: code("LIVE"), value: 20 });
    const body = hotelBody();
    const plain = await quote(page.request, body);
    const subtotal = plain.pricing.base + plain.pricing.taxes;
    const withCoupon = await quote(page.request, { ...body, couponCode: code("live") });
    expect(withCoupon.coupon).toMatchObject({ code: code("LIVE"), discountType: "percent", value: 20 });
    expect(withCoupon.pricing.discount).toBe(Math.round(subtotal * 0.2));
    expect(withCoupon.pricing.serviceFee).toBe(plain.pricing.serviceFee);
    expect(withCoupon.pricing.total).toBe(plain.pricing.total - withCoupon.pricing.discount);

    await updateCoupon(c._id, { value: 15 });
    const after = await quote(page.request, { ...body, couponCode: code("LIVE") });
    expect(after.coupon.value).toBe(15);
    expect(after.pricing.discount).toBe(Math.round(subtotal * 0.15));
  });
});

test.describe("coupon rules", () => {
  test("inactive, expired, not-yet-started, wrong product and minimum amount are rejected", async ({ page }) => {
    await createCoupon({ code: code("OFF"), active: false });
    await createCoupon({ code: code("OLD"), validFrom: iso(-10), validTo: iso(-1) });
    await createCoupon({ code: code("SOON"), validFrom: iso(3), validTo: iso(10) });
    await createCoupon({ code: code("BUS"), appliesTo: ["bus"] });
    await createCoupon({ code: code("MIN"), minAmount: 99_000_000 });
    const expectations: [string, string][] = [
      ["OFF", "COUPON_INACTIVE"],
      ["OLD", "COUPON_EXPIRED"],
      ["SOON", "COUPON_NOT_STARTED"],
      ["BUS", "COUPON_NOT_APPLICABLE"],
      ["MIN", "COUPON_MIN_AMOUNT"],
      ["NOPE", "COUPON_INVALID"],
    ];
    for (const [name, err] of expectations) {
      const q = await quote(page.request, hotelBody({ couponCode: code(name) }));
      expect(q.couponError?.code, name).toBe(err);
      expect(q.coupon, name).toBeNull();
      expect(q.pricing.discount, name).toBe(0);
    }
    // Creating a booking with a rejected coupon fails outright (no silent full-price booking).
    await registerUser(page, "cpn-rules");
    expect((await book(page, hotelBody({ couponCode: code("OLD") }))).status).toBe(400);
  });

  test("client-supplied prices and discounts are ignored", async ({ page }) => {
    await registerUser(page, "cpn-tamper");
    await createCoupon({ code: code("TAMP"), value: 10 });
    const body = hotelBody({ couponCode: code("TAMP") });
    const q = await quote(page.request, body);
    const { status, body: res } = await book(page, { ...body, pricing: { total: 1, discount: 999_999 }, discount: 999_999, total: 1 });
    expect(status).toBe(201);
    expect(res.data.pricing.total).toBe(q.pricing.total);
    expect(res.data.pricing.discount).toBe(q.pricing.discount);
    expect(res.data.coupon).toMatchObject({ code: code("TAMP"), value: 10, discountType: "percent" });
  });
});

test.describe("usage limits", () => {
  test("total limit: a cancelled booking returns its slot", async ({ page, browser }) => {
    const c = await createCoupon({ code: code("ONE"), usageLimit: 1 });
    await registerUser(page, "cpn-a");
    const first = await book(page, hotelBody({ couponCode: code("ONE") }));
    expect(first.status).toBe(201);
    expect((await couponDoc(c._id)).usedCount).toBe(1);

    const other = await browser.newPage();
    await registerUser(other, "cpn-b");
    expect((await quote(other.request, hotelBody({ couponCode: code("ONE") }))).couponError.code).toBe("COUPON_USAGE_LIMIT");

    const cancel = await page.request.post(`/api/v1/bookings/${first.body.data._id}/cancel`, { data: { reason: "Changed my plans" } });
    expect(cancel.ok(), await cancel.text()).toBeTruthy();
    expect((await couponDoc(c._id)).usedCount).toBe(0);
    expect((await quote(other.request, hotelBody({ couponCode: code("ONE") }))).coupon.code).toBe(code("ONE"));
    await other.close();
  });

  test("total limit holds under concurrent bookings", async ({ browser }) => {
    const c = await createCoupon({ code: code("RACE"), usageLimit: 1 });
    const pages = await Promise.all([browser.newPage(), browser.newPage(), browser.newPage()]);
    for (const [i, p] of pages.entries()) await registerUser(p, `cpn-race${i}`);
    const results = await Promise.all(pages.map((p) => book(p, hotelBody({ couponCode: code("RACE") }))));
    expect(results.filter((r) => r.status === 201)).toHaveLength(1);
    expect((await couponDoc(c._id)).usedCount).toBe(1);
    await Promise.all(pages.map((p) => p.close()));
  });

  test("per-customer limit", async ({ page }) => {
    await createCoupon({ code: code("PU"), perUserLimit: 1 });
    await registerUser(page, "cpn-pu");
    expect((await book(page, hotelBody({ couponCode: code("PU") }))).status).toBe(201);
    const q = await quote(page.request, hotelBody({ couponCode: code("PU") }));
    expect(q.couponError).toMatchObject({ code: "COUPON_USER_LIMIT", message: "You have already used this coupon" });
    expect((await book(page, hotelBody({ couponCode: code("PU") }))).status).toBe(400);
  });
});

test.describe("checkout and payment", () => {
  async function payDemo(page: Page, bookingId: string) {
    const init = await page.request.post("/api/v1/payments/initiate", { data: { bookingId, provider: "demo" } });
    if (!init.ok()) return { status: init.status(), body: (await init.json()) as Json };
    const { transactionId } = (await init.json()).data;
    const decide = await page.request.post(`/api/v1/payments/demo-gateway/${transactionId}/decide`, { data: { outcome: "success" } });
    const { callbackUrl } = (await decide.json()).data;
    await page.request.get(callbackUrl, { maxRedirects: 0 });
    return { status: 200, body: {} };
  }

  test("a paid booking keeps its usage and the paid amount matches the server price", async ({ page }) => {
    const c = await createCoupon({ code: code("PAY"), value: 10, usageLimit: 5 });
    await registerUser(page, "cpn-pay");
    const { body } = await book(page, hotelBody({ couponCode: code("PAY") }));
    await payDemo(page, body.data._id);
    const paid = (await (await page.request.get(`/api/v1/bookings/${body.data._id}`)).json()).data as Json;
    expect(paid.paymentStatus).toBe("paid");
    expect(paid.pricing.total).toBe(body.data.pricing.total);
    expect((await couponDoc(c._id)).usedCount).toBe(1);
    const stats = (await (await admin.get("/api/v1/admin/coupon-stats")).json()).data as Json;
    expect(stats.byCode.find((r: Json) => r.code === code("PAY"))).toMatchObject({ redeemed: 1, discountGiven: body.data.pricing.discount });
  });

  test("a coupon deactivated after booking is removed before payment and its slot freed", async ({ page }) => {
    const c = await createCoupon({ code: code("GONE"), value: 10 });
    await registerUser(page, "cpn-gone");
    const { body } = await book(page, hotelBody({ couponCode: code("GONE") }));
    const fullPrice = body.data.pricing.total + body.data.pricing.discount;
    await updateCoupon(c._id, { active: false });
    const attempt = await payDemo(page, body.data._id);
    expect(attempt.status).toBe(409);
    expect(attempt.body.error.code).toBe("COUPON_REMOVED");
    const after = (await (await page.request.get(`/api/v1/bookings/${body.data._id}`)).json()).data as Json;
    expect(after.pricing).toMatchObject({ discount: 0, total: fullPrice });
    expect(after.coupon?.code).toBeFalsy();
    expect((await couponDoc(c._id)).usedCount).toBe(0);
    expect((await payDemo(page, body.data._id)).status).toBe(200); // pays the full, server-calculated price
  });

  test("a changed percentage is recalculated before payment", async ({ page }) => {
    const c = await createCoupon({ code: code("CHG"), value: 20 });
    await registerUser(page, "cpn-chg");
    const { body } = await book(page, hotelBody({ couponCode: code("CHG") }));
    const subtotal = body.data.pricing.base + body.data.pricing.taxes;
    await updateCoupon(c._id, { value: 15 });
    const attempt = await payDemo(page, body.data._id);
    expect(attempt.body.error.code).toBe("COUPON_UPDATED");
    const after = (await (await page.request.get(`/api/v1/bookings/${body.data._id}`)).json()).data as Json;
    expect(after.coupon).toMatchObject({ value: 15, discount: Math.round(subtotal * 0.15) });
  });

  test("the customer can remove a coupon at checkout", async ({ page }) => {
    const c = await createCoupon({ code: code("RM"), value: 10 });
    await registerUser(page, "cpn-rm");
    const { body } = await book(page, hotelBody({ couponCode: code("RM") }));
    const res = await page.request.delete(`/api/v1/bookings/${body.data._id}/coupon`);
    expect(res.ok()).toBeTruthy();
    const data = (await res.json()).data as Json;
    expect(data.pricing.total).toBe(body.data.pricing.total + body.data.pricing.discount);
    expect((await couponDoc(c._id)).usedCount).toBe(0);
  });
});

test.describe("global coupon switch", () => {
  test("off: quotes, bookings, payments and home offers all reject coupons", async ({ page }) => {
    await createCoupon({ code: code("SW"), value: 10, showOnHome: true });
    await registerUser(page, "cpn-sw");
    const { body } = await book(page, hotelBody({ couponCode: code("SW") }));
    await setCouponsEnabled(false);
    try {
      const q = await quote(page.request, hotelBody({ couponCode: code("SW") }));
      expect(q.couponsEnabled).toBe(false);
      expect(q.couponError.code).toBe("COUPON_DISABLED");
      expect(q.pricing.discount).toBe(0);
      expect((await book(page, hotelBody({ couponCode: code("SW") }))).status).toBe(403);
      const home = (await (await page.request.get("/api/v1/content/home")).json()).data as Json;
      expect(home.coupons).toEqual([]);
      const init = await page.request.post("/api/v1/payments/initiate", { data: { bookingId: body.data._id, provider: "demo" } });
      expect(init.status()).toBe(409);
      expect((await init.json()).error.code).toBe("COUPON_REMOVED");
    } finally {
      await setCouponsEnabled(true);
    }
    expect((await quote(page.request, hotelBody({ couponCode: code("SW") }))).coupon.code).toBe(code("SW"));
  });
});

test.describe("booking summary UI", () => {
  const bookUrl = () => {
    const s = stay();
    return `/hotels/${hotel.slug}/book?room=${hotel.roomId}&checkIn=${s.checkIn}&checkOut=${s.checkOut}&rooms=1&adults=2`;
  };
  const badge = (page: Page) => page.getByText(/% OFF$/);
  const total = async (page: Page) => (await page.getByText("Total payable").locator("..").innerText()).trim();

  test("discount badge appears only after the server applies a coupon", async ({ page }) => {
    const errors = trackErrors(page);
    await createCoupon({ code: code("UI"), value: 20 });
    await registerUser(page, "cpn-ui");
    await page.goto(bookUrl());
    await expect(page.getByText("Total payable")).toBeVisible();
    const original = await total(page);

    // State 1: nothing applied: no badge, no discount row.
    await expect(page.getByLabel("Coupon code")).toBeVisible();
    await expect(badge(page)).toHaveCount(0);
    await expect(page.getByTestId("coupon-discount-row")).toHaveCount(0);

    // Typing alone does nothing.
    await page.getByLabel("Coupon code").fill(code("UI"));
    await expect(badge(page)).toHaveCount(0);

    // State 4: invalid code → error, no badge, price unchanged.
    await page.getByLabel("Coupon code").fill("DEFINITELYNOT1");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "not valid" })).toBeVisible();
    await expect(badge(page)).toHaveCount(0);
    expect(await total(page)).toBe(original);

    // State 2: valid code → applied indicator, 20% OFF badge, discount row, lower total.
    await page.getByLabel("Coupon code").fill(code("ui"));
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText(`${code("UI")} applied`)).toBeVisible();
    await expect(badge(page).first()).toHaveText("20% OFF");
    await expect(page.getByTestId("coupon-discount-row")).toBeVisible();
    expect(await total(page)).not.toBe(original);

    // State 3: remove → everything discount-related disappears and the price is restored.
    await page.getByRole("button", { name: `Remove coupon ${code("UI")}` }).click();
    await expect(page.getByTestId("coupon-discount-row")).toHaveCount(0);
    await expect(badge(page)).toHaveCount(0);
    await expect.poll(() => total(page)).toBe(original);

    // A refresh never resurrects a discount.
    await page.reload();
    await expect(page.getByText("Total payable")).toBeVisible();
    await expect(badge(page)).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("coupon box is hidden when the system is off, and fits on mobile", async ({ page }) => {
    await registerUser(page, "cpn-ui2");
    await setCouponsEnabled(false);
    try {
      await page.goto(bookUrl());
      await expect(page.getByText("Total payable")).toBeVisible();
      await expect(page.getByLabel("Coupon code")).toHaveCount(0);
    } finally {
      await setCouponsEnabled(true);
    }
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(bookUrl());
    await expect(page.getByLabel("Coupon code")).toBeVisible();
    await page.getByLabel("Coupon code").fill(code("UI"));
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText(`${code("UI")} applied`)).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("checkout shows the stored coupon and lets the customer remove it", async ({ page }) => {
    await createCoupon({ code: code("CO"), value: 10 });
    await registerUser(page, "cpn-co");
    await page.goto(bookUrl());
    await page.getByLabel("Coupon code").fill(code("CO"));
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText(`${code("CO")} applied`)).toBeVisible();
    await fillTravellers(page, 1);
    await page.getByRole("button", { name: "Continue to payment" }).click();
    await expect(page).toHaveURL(/\/checkout\//);
    await expect(page.getByText("10% OFF")).toBeVisible();
    await page.getByRole("button", { name: `Remove coupon ${code("CO")}` }).click();
    await expect(page.getByText("10% OFF")).toHaveCount(0);
    await expect(page.getByTestId("coupon-discount-row")).toHaveCount(0);
  });
});
