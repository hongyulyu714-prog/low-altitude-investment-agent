import { test, expect, type Page } from "@playwright/test";
import { useLegacyReportFixture } from "./fixtures";
test.beforeEach(async ({ page }) => useLegacyReportFixture(page));
const EVT = "EVT_BATTERY_PRICE_DOWN_001";
const fixture = {
  event: {
    event_id: EVT,
    event_name: "TEST · 受控报告边界",
    direction: "下降",
  },
  data_version: "prototype-v1",
  paths: [],
  companies: [],
  evidence: [],
  conclusions: [],
  verification_status: "mock",
};
async function analyze(page: Page) {
  await page.goto("/");
  await page.getByLabel("已有事件").selectOption(EVT);
  await page.getByRole("button", { name: "查看分析", exact: true }).click();
  await expect(page.locator(".sg-card")).toBeVisible();
}
test("HTTP422, unreadable and network errors never fall back", async ({
  page,
}) => {
  for (const kind of ["422", "json", "network"]) {
    await page.route("**/api/v1/analyze", (r) =>
      kind === "422"
        ? r.fulfill({ status: 422, json: { detail: "TEST · 缺路径" } })
        : kind === "json"
          ? r.fulfill({
              status: 200,
              contentType: "text/plain",
              body: "unreadable",
            })
          : r.abort("failed"),
    );
    await page.goto("/");
    await page.getByLabel("已有事件").selectOption(EVT);
    await page.getByRole("button", { name: "查看分析", exact: true }).click();
    await expect(page.getByRole("button", { name: "重试分析" })).toBeVisible();
    await expect(page.locator(".metrics")).toHaveCount(0);
    await expect(page.locator(".sg-card")).toHaveCount(0);
    await page.unroute("**/api/v1/analyze");
  }
});
test("explicit empty differs missing, scores0, pending status, invalidrefs and unsafeURL", async ({
  page,
}) => {
  await page.route("**/api/v1/analyze", (r) => r.fulfill({ json: fixture }));
  await analyze(page);
  await expect(
    page.getByText("报告明确为空，没有路径、公司或证据；不表示零影响。"),
  ).toBeVisible();
  await expect(page.getByText("暂无返回公司")).toBeVisible();
  await page.unroute("**/api/v1/analyze");
  await page.route("**/api/v1/analyze", (r) =>
    r.fulfill({
      json: {
        ...fixture,
        companies: [
          {
            stock_code: "000001.SZ",
            company_name: "TEST · 零评分",
            impact_score: 0,
            verification_status: "pending_verification",
            evidence_ids: ["EVD_TEST_MISSING"],
          },
        ],
        paths: undefined,
        evidence: [
          {
            evidence_id: "EVD_TEST_BOUNDARY",
            event_id: EVT,
            source_title: "TEST · 来源边界",
            published_date: null,
            quote: null,
            source_url: "javascript:alert(1)",
            credibility_level: "A",
            verification_status: "pending_verification",
          },
        ],
      },
    }),
  );
  await analyze(page);
  await expect(page.locator(".score")).toHaveText("0.00");
  await expect(
    page
      .getByRole("region", { name: "业务 ID 图谱", exact: true })
      .getByText("路径集合 · 数据不足"),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "TEST · 零评分", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("风险数据不足");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "证据引用不可用" })
    .click();
  await expect(page.getByRole("dialog")).toContainText("EVD_TEST_MISSING");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /TEST · 来源边界/ }).click();
  await expect(page.getByRole("dialog")).toContainText("待核验");
  await expect(page.getByRole("dialog")).toContainText("来源链接不可用");
  await expect(page.getByRole("dialog").getByRole("link")).toHaveCount(0);
});
test("event switch discards delayed response and clears current selections", async ({
  page,
}) => {
  let release: () => void = () => {};
  const blocked = new Promise<void>((r) => (release = r));
  await page.route("**/api/v1/analyze", async (r) => {
    await blocked;
    await r.fulfill({ json: fixture }).catch(() => {});
  });
  await page.goto("/");
  await page.getByLabel("已有事件").selectOption(EVT);
  await page.getByRole("button", { name: "查看分析", exact: true }).click();
  await expect(page.getByRole("button", { name: "分析中…" })).toBeDisabled();
  await page.getByLabel("已有事件").selectOption("");
  release();
  await page.waitForTimeout(100);
  await expect(page.locator(".metrics")).toHaveCount(0);
  await expect(page.locator(".sg-card")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "查看分析", exact: true }),
  ).toBeDisabled();
});
test("event list empty and read failure remain distinct", async ({ page }) => {
  const url = (u: URL) => u.pathname === "/api/v1/events";
  await page.route(url, (r) => r.fulfill({ json: [] }));
  await page.goto("/");
  await expect(page.getByText("暂无可分析事件")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "查看分析", exact: true }),
  ).toBeDisabled();
  await page.unroute(url);
  await page.route(url, (r) =>
    r.fulfill({ status: 503, json: { detail: "TEST · 列表服务不可用" } }),
  );
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText("TEST · 列表服务不可用");
  await expect(page.getByRole("button", { name: "重新读取" })).toBeVisible();
});

test("nested drawer restores genuinely scrolled reading and traps focus", async ({
  page,
}) => {
  await page.route("**/api/v1/analyze", (r) =>
    r.fulfill({
      json: {
        ...fixture,
        companies: [
          {
            stock_code: "000001.SZ",
            company_name: "TEST · 长风险",
            impact_score: 25,
            risk_flags: Array(40).fill("TEST-boundary-long-risk-field"),
            evidence_ids: ["EVD_TEST_LONG"],
            verification_status: "mock",
          },
        ],
        evidence: [
          {
            evidence_id: "EVD_TEST_LONG",
            event_id: EVT,
            source_title: "TEST · 长摘录",
            quote: "明确标记的 TEST 阅读夹具。".repeat(150),
            credibility_level: "A",
            verification_status: "pending_verification",
          },
        ],
      },
    }),
  );
  await analyze(page);
  await page
    .getByRole("button", { name: "TEST · 长风险", exact: true })
    .click();
  await page.locator(".drawer-body").evaluate((e) => (e.scrollTop = 150));
  const scroll = await page
    .locator(".drawer-body")
    .evaluate((e) => e.scrollTop);
  expect(scroll).toBeGreaterThan(80);
  await page.locator(".drawer-body").evaluate((e) =>
    e.addEventListener(
      "click",
      () => {
        (e as HTMLElement).dataset.departureScroll = String(e.scrollTop);
      },
      { once: true, capture: true },
    ),
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "TEST · 长摘录" })
    .click();
  await page.locator(".drawer-body").evaluate((e) => (e.scrollTop = 300));
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "返回", exact: true })
    .click();
  const departure = Number(
    await page.locator(".drawer-body").getAttribute("data-departure-scroll"),
  );
  expect(departure).toBeGreaterThan(80);
  expect(await page.locator(".drawer-body").evaluate((e) => e.scrollTop)).toBe(
    departure,
  );
  const first = page
    .getByRole("dialog")
    .getByRole("button", { name: "关闭抽屉" });
  await first.focus();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("dialog").getByRole("button", { name: "返回图谱现场" }),
  ).toBeFocused();
});
