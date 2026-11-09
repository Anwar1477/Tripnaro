import { expect, type Page } from "@playwright/test";

export const ADMIN = { email: "admin@tripnaro.com", password: "Admin@12345" };
export const DEMO_USER = { email: "user@tripnaro.com", password: "User@12345" };

export function dateInput(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Creates a fresh customer through the API and leaves the session cookie in the browser context. */
export async function registerUser(page: Page, prefix = "e2e") {
  const email = `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1e4)}@example.com`;
  const res = await page.request.post("/api/v1/auth/register", { data: { name: "Test Traveller", email, password: "Passw0rd!x", phone: "+8801711000000" } });
  expect(res.ok(), await res.text()).toBeTruthy();
  return { email, password: "Passw0rd!x" };
}

export async function apiLogin(page: Page, creds: { email: string; password: string }) {
  const res = await page.request.post("/api/v1/auth/login", { data: creds });
  expect(res.ok(), await res.text()).toBeTruthy();
}

/** Collects uncaught page errors and console errors (ignoring expected 401s for guests). */
export function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const t = m.text();
    if (/401|Unauthorized|status of 40[49]/i.test(t)) return;
    errors.push(`console: ${t}`);
  });
  return errors;
}

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, "page scrolls horizontally").toBeLessThanOrEqual(1);
}

/** Fills the shared BookingForm traveller rows and accepts terms. */
export async function fillTravellers(page: Page, count: number, opts: { dob?: boolean } = {}) {
  for (let i = 0; i < count; i++) {
    await page.getByLabel("First name").nth(i).fill(`Rahim${i}`);
    await page.getByLabel("Last name").nth(i).fill("Uddin");
    if (opts.dob) await page.getByLabel("Date of birth").nth(i).fill(i === 0 ? "1990-05-10" : "1992-03-03");
  }
  await page.getByLabel("I agree to the").check();
}

/** From /checkout: pick the demo gateway, pay, choose an outcome, land on /payment/result. */
export async function payWithDemo(page: Page, outcome: "success" | "failed" = "success") {
  await expect(page).toHaveURL(/\/checkout\//);
  await page.getByRole("radio", { name: /Demo payment/ }).click();
  await page.getByRole("button", { name: /^Pay / }).click();
  await expect(page).toHaveURL(/\/payment\/demo-gateway/);
  await expect(page.getByText("DEMO PAYMENT GATEWAY")).toBeVisible();
  await page.getByRole("button", { name: outcome === "success" ? "Simulate success" : "Simulate failure" }).click();
  await expect(page).toHaveURL(/\/payment\/result\?tx=/);
}
