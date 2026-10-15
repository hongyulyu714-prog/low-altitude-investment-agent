import type { Page } from "@playwright/test";

// Replay the legacy API fixtures solely in boundary/camera regression tests.
// The production UI exposes only prototype-v1; golden-chain.spec.ts uses it live.
export async function useLegacyReportFixture(page: Page) {
  await page.route("**/api/v1/events?*", async (route) => {
    const url = new URL(route.request().url());
    url.searchParams.set("data_version", "mock-v1");
    await route.fulfill({
      response: await route.fetch({ url: url.toString() }),
    });
  });
  await page.route("**/api/v1/analyze", async (route) => {
    const response = await route.fetch({
      postData: { ...route.request().postDataJSON(), data_version: "mock-v1" },
    });
    const report = await response.json();
    await route.fulfill({ json: { ...report, data_version: "prototype-v1" } });
  });
}
