// Run against a local preview; set TORCHVOLT_PLAYWRIGHT_PATH if Playwright is bundled elsewhere.
/* eslint-disable @typescript-eslint/no-require-imports -- Standalone CommonJS test runner. */
const { chromium } = require(
  process.env.TORCHVOLT_PLAYWRIGHT_PATH || "playwright",
);
const assert = require("node:assert/strict");
const fs = require("node:fs");
const base = process.env.TORCHVOLT_PREVIEW_URL || "http://127.0.0.1:3010";
const output = "artifacts/homepage";
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  const consoleErrors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  // A full-page capture alone does not trigger every lazy-loaded image.
  for (const section of await page.locator(".tv-home section").all()) {
    await section.scrollIntoViewIfNeeded();
    await section
      .locator("img")
      .evaluateAll((images) =>
        Promise.all(images.map((image) => image.decode().catch(() => {}))),
      );
  }
  const broken = await page
    .locator(".tv-home img")
    .evaluateAll((images) =>
      images.filter((image) => !image.naturalWidth).map((image) => image.src),
    );
  assert.deepEqual(broken, [], "Every homepage image must load");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${output}/desktop.png`, fullPage: true });
  await page.screenshot({ path: `${output}/desktop-hero.png` });
  // Section references omit the site header; keep sticky chrome out of these captures.
  await page.locator(".tv-header").evaluate((header) => {
    header.style.position = "relative";
  });
  await page.locator(".tv-skip").evaluate(link => { link.hidden = true; });
  for (const [selector, name] of [
    [".tv-appliances", "appliances"],
    [".tv-process", "process"],
    [".tv-services", "services"],
    [".tv-benefits", "benefits"],
    [".tv-cost", "cost"],
    [".tv-coverage", "coverage"],
    [".tv-faq", "faq"],
    [".tv-final", "final"],
    [".tv-footer", "footer"],
  ]) {
    await page.locator(selector).screenshot({ path: `${output}/${name}.png` });
  }
  await page.locator(".tv-header").evaluate((header) => {
    header.style.position = "";
  });
  await page.locator(".tv-skip").evaluate(link => { link.hidden = false; });
  assert.equal(
    await page.locator("header").count(),
    1,
    "No duplicate site header",
  );
  assert.equal(
    await page.locator("footer").count(),
    1,
    "No duplicate site footer",
  );
  await page
    .getByRole("button", { name: "Can solar power run an air conditioner?" })
    .click();
  assert.equal(
    await page
      .getByRole("button", { name: "Can solar power run an air conditioner?" })
      .getAttribute("aria-expanded"),
    "true",
  );
  assert.equal(await page.locator("#faq-answer-1").isVisible(), true);
  await page.getByRole("button", { name: "Lights", exact: true }).click();
  await page.getByRole("button", { name: "Refrigerator", exact: true }).click();
  await page
    .getByRole("button", { name: "Find my system", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  assert.equal(await dialog.isVisible(), true);
  await dialog.getByRole("button", { name: /^A home/ }).click();
  await dialog.getByRole("button", { name: "Continue", exact: true }).click();
  await dialog.getByRole("button", { name: "Continue", exact: true }).click();
  await dialog.getByRole("button", { name: "Continue", exact: true }).click();
  assert.equal(
    await dialog
      .getByRole("button", { name: "Continue", exact: true })
      .isEnabled(),
    true,
    "Homepage selections carry into load sizing",
  );
  await dialog.getByRole("button", { name: "Continue", exact: true }).click();
  await dialog.getByRole("button", { name: /^No generator/ }).click();
  await dialog.getByRole("button", { name: "Continue", exact: true }).click();
  assert.equal(
    await dialog
      .getByText("Here's a package that fits", { exact: true })
      .isVisible(),
    true,
  );
  assert.match(
    await dialog.getByRole("link", { name: /WhatsApp/ }).getAttribute("href"),
    /wa\.me\/2348165452992/,
  );
  await dialog.screenshot({ path: `${output}/quote-result.png` });
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").count(), 0);
  const narrow = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  await narrow.goto(base, { waitUntil: "networkidle" });
  await narrow.evaluate(() => document.fonts.ready);
  for (const section of await narrow.locator(".tv-home section").all()) {
    await section.scrollIntoViewIfNeeded();
    await section
      .locator("img")
      .evaluateAll((images) =>
        Promise.all(images.map((image) => image.decode().catch(() => {}))),
      );
  }
  assert.equal(
    await narrow.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    true,
    "No horizontal overflow at 390px",
  );
  await narrow.evaluate(() => window.scrollTo(0, 0));
  await narrow.screenshot({ path: `${output}/mobile.png`, fullPage: true });
  await narrow.screenshot({ path: `${output}/mobile-hero.png` });
  await narrow.getByRole("button", { name: "Open menu", exact: true }).click();
  await narrow
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "FAQs", exact: true })
    .click();
  assert.equal(
    await narrow.getByRole("navigation", { name: "Mobile navigation" }).count(),
    0,
  );
  await narrow
    .getByRole("button", { name: "Get a free quote", exact: true })
    .click();
  assert.equal(await narrow.getByRole("dialog").isVisible(), true);
  await narrow
    .getByRole("button", { name: "Close quote tool", exact: true })
    .click();
  await narrow.setViewportSize({ width: 320, height: 740 });
  assert.equal(
    await narrow.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    true,
    "No horizontal overflow at 320px",
  );
  await narrow.evaluate(() => window.scrollTo(0, 0));
  await narrow.screenshot({ path: `${output}/mobile-320.png` });
  await narrow.setViewportSize({ width: 834, height: 1194 });
  assert.equal(await narrow.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, "No horizontal overflow at 834px");
  await narrow.evaluate(() => window.scrollTo(0, 0));
  await narrow.screenshot({ path: `${output}/tablet.png` });
  assert.deepEqual(errors, [], "No browser runtime exceptions");
  console.log(
    JSON.stringify(
      {
        desktop: "1440x1000",
        mobile: "390x844 and 320x740",
        images: "loaded",
        quoteFlow: "passed to recommendation",
        faq: "passed",
        mobileMenu: "passed",
        runtimeErrors: errors,
        consoleErrors,
        screenshots: output,
      },
      null,
      2,
    ),
  );
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
