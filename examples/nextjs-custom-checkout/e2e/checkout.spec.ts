import { test, expect } from "@playwright/test";

test("demo checkout catalog → OTP → transfer", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Checkout a tu marca" }),
  ).toBeVisible();
  await expect(page.getByText(/Demo/i).first()).toBeVisible({ timeout: 15000 });

  const plusButtons = page.getByRole("button", { name: "+" });
  await plusButtons.first().click();
  await plusButtons.first().click();

  await page.getByRole("button", { name: "Aplicar" }).click();
  await page.getByRole("button", { name: "Enviar OTP" }).click();
  await page.getByRole("button", { name: "Verificar OTP" }).click();
  await page.getByRole("button", { name: "Confirmar compra" }).click();

  await expect(page.getByText(/Transferencia creada/i)).toBeVisible({
    timeout: 15000,
  });
});

test("renders the Elements checkout mode", async ({ page }) => {
  await page.goto("/?mode=elements");

  await expect(page.getByText(/Modo:\s*elements/i)).toBeVisible();
  await expect(page.locator("tickean-checkout")).toBeVisible();
  await expect(page.locator("tickean-checkout").locator("button").first()).toBeVisible({
    timeout: 15000,
  });
});
