import { expect, test, type Page } from "@playwright/test";

const userId = "e2e-client-0001";
const bookingId = "deposit-booking-0001";
const siteOrigin = "https://gpwlzhegvjsbgbaepfjz.supabase.co";
const now = new Date().toISOString();

const partialBooking = {
  id: bookingId,
  user_id: userId,
  service_id: "tour-service-0001",
  start_date: "2027-05-10",
  end_date: "2027-05-12",
  total_price: 100000,
  currency: "XOF",
  status: "confirmed",
  payment_status: "partially_paid",
  payment_plan: "deposit",
  deposit_percent: 30,
  amount_due_now: 30000,
  amount_paid: 30000,
  balance_due: 70000,
  balance_paid_on_site: false,
  booking_details: {},
  created_at: now,
  customer_name: "Client Test",
  customer_email: "client@example.test",
  customer_phone: "+2250700000000",
  guests: 2,
  notes: null,
  services: { name: "Circuit Abidjan", type: "tour", location: "Abidjan" },
};
const pendingDepositBooking = {
  ...partialBooking,
  payment_status: "pending",
  amount_paid: 0,
};

async function mockSupabase(page: Page, options: {
  onPayment?: (body: Record<string, unknown>) => void;
  onBalanceSettlement?: (body: Record<string, unknown>) => void;
  admin?: boolean;
} = {}) {
  let bookingState = partialBooking;
  await page.addInitScript(({ authKey, user }) => {
    localStorage.setItem(authKey, JSON.stringify({
      access_token: "e2e-access-token",
      refresh_token: "e2e-refresh-token",
      token_type: "bearer",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user,
    }));
  }, {
    authKey: "sb-gpwlzhegvjsbgbaepfjz-auth-token",
    user: { id: userId, aud: "authenticated", role: "authenticated", email: "client@example.test", app_metadata: { provider: "email", providers: ["email"] }, user_metadata: {}, created_at: now },
  });

  await page.route(`${siteOrigin}/rest/v1/**`, (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/rest/v1/bookings") {
      const fixture = url.searchParams.has("id") && !options.admin ? pendingDepositBooking : bookingState;
      return route.fulfill({ json: url.searchParams.has("id") ? fixture : [bookingState] });
    }
    if (url.pathname === "/rest/v1/site_config") {
      return route.fulfill({ json: [{ config_value: { depositEnabled: true, depositPercent: 30, enabledServiceTypes: ["tour"], reviewPromptEnabled: true } }] });
    }
    if (url.pathname === "/rest/v1/user_roles") {
      return route.fulfill({ json: options.admin ? [{ role: "admin" }] : [{ role: "user" }] });
    }
    if (url.pathname === "/rest/v1/reviews" && route.request().method() === "POST") {
      return route.fulfill({ status: 201, body: "" });
    }
    if (url.pathname === "/rest/v1/rpc/admin_mark_booking_balance_paid") {
      options.onBalanceSettlement?.(route.request().postDataJSON() as Record<string, unknown>);
      bookingState = { ...bookingState, payment_status: "paid", amount_paid: bookingState.total_price, balance_due: 0, balance_paid_on_site: true };
      return route.fulfill({ status: 204, body: "" });
    }
    return route.fulfill({ json: [] });
  });

  await page.route(`${siteOrigin}/auth/v1/user**`, (route) => route.fulfill({ json: {
    id: userId,
    aud: "authenticated",
    role: "authenticated",
    email: "client@example.test",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: {},
    created_at: now,
  } }));

  await page.route(`${siteOrigin}/functions/v1/process-payment**`, async (route) => {
    options.onPayment?.(route.request().postDataJSON() as Record<string, unknown>);
    return route.fulfill({ json: { success: true, payment_url: "https://checkout.example.test/pay", transaction_id: "e2e-tx" } });
  });
}

async function dismissCookieBanner(page: Page) {
  const acceptButton = page.getByRole("button", { name: "Accepter tout" });
  if (await acceptButton.isVisible().catch(() => false)) await acceptButton.click();
}

test("deposit page displays and requests only the configured 30%", async ({ page }, testInfo) => {
  let paymentBody: Record<string, unknown> | undefined;
  await mockSupabase(page, { onPayment: (body) => { paymentBody = body; } });
  await page.goto(`/payment?bookingId=${bookingId}`, { waitUntil: "domcontentloaded" });
  await dismissCookieBanner(page);
  await expect(page.getByRole("button", { name: "Ouvrir le chat" })).toHaveCount(0);

  await expect(page.getByText("À payer maintenant (30 %):")).toBeVisible();
  if (page.viewportSize()!.width <= 480) {
    await page.screenshot({ path: `test-results/${testInfo.project.name}-payment.png`, fullPage: true });
  }
  await expect(page.getByRole("button", { name: /Payer/ })).toContainText("30 000");
  await page.getByRole("button", { name: /Payer/ }).click();
  await expect.poll(() => paymentBody?.amount).toBe(30000);
  await expect(paymentBody?.bookingId).toBe(bookingId);
});

test("booking portal shows the balance and permits one verified review", async ({ page }, testInfo) => {
  let insertedReview: Record<string, unknown> | undefined;
  await mockSupabase(page);
  await page.route(`${siteOrigin}/rest/v1/reviews**`, async (route) => {
    if (route.request().method() === "POST") {
      insertedReview = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({ status: 201, body: "" });
    }
    return route.fulfill({ json: [] });
  });

  await page.goto("/booking-history", { waitUntil: "domcontentloaded" });
  await dismissCookieBanner(page);
  await expect(page.getByText(/70\s?000.*sur place/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Ouvrir le chat" })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  if (page.viewportSize()!.width <= 480) {
    await page.screenshot({ path: `test-results/${testInfo.project.name}-portal.png`, fullPage: true });
  }
  await page.getByRole("button", { name: "Laisser un avis" }).click();
  await page.getByRole("button", { name: "4 étoiles" }).click();
  await page.getByPlaceholder("Partagez votre expérience (facultatif)").fill("Très bonne expérience.");
  await page.getByRole("button", { name: "Envoyer mon avis" }).click();

  await expect.poll(() => insertedReview?.booking_id).toBe(bookingId);
  await expect(insertedReview?.service_id).toBe("tour-service-0001");
  await expect(page.getByRole("button", { name: "Avis envoyé" })).toBeVisible();
});

test("admin can record the on-site balance settlement", async ({ page }, testInfo) => {
  let settlementBody: Record<string, unknown> | undefined;
  await mockSupabase(page, { admin: true, onBalanceSettlement: (body) => { settlementBody = body; } });
  await page.goto("/admin/bookings", { waitUntil: "domcontentloaded" });
  await dismissCookieBanner(page);
  await expect(page.getByRole("button", { name: "Ouvrir le chat" })).toHaveCount(0);
  await page.getByText("Client Test", { exact: true }).first().click();
  await page.getByRole("button", { name: "Confirmer le règlement sur place" }).click();
  if (page.viewportSize()!.width <= 480) {
    await page.screenshot({ path: `test-results/${testInfo.project.name}-admin-balance.png`, fullPage: true });
  }
  await expect.poll(() => settlementBody?.p_booking_id).toBe(bookingId);
});

test("mobile menu exposes Circuits without horizontal page overflow", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSupabase(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await dismissCookieBanner(page);
  await page.getByRole("button", { name: "Menu" }).click();
  await expect(page.getByRole("link", { name: "Circuits" })).toBeVisible();
  await page.screenshot({ path: `test-results/${testInfo.project.name}-menu.png`, fullPage: true });
  await page.getByRole("link", { name: "Circuits" }).click();
  await expect(page).toHaveURL(/\/tours$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
