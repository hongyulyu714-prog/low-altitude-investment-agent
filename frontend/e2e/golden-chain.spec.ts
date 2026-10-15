import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

test("prototype-v1 uses live API, linked evidence, pending paths and synthetic factors", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByLabel("数据版本", { exact: true })
    .selectOption("prototype-v1");
  await page.getByLabel("已有事件").selectOption("EVT_002");
  const responsePromise = page.waitForResponse((r) =>
    r.url().endsWith("/api/v1/analyze"),
  );
  await page.getByRole("button", { name: "查看分析", exact: true }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  expect(response.request().postDataJSON()).toEqual({
    event_id: "EVT_002",
    data_version: "prototype-v1",
  });
  await expect(page.locator(".business-graph")).toContainText("eVTOL");
  await expect(page.locator(".score").first()).toHaveText("17.15");
  await expect(page.locator("#companies")).toContainText("威海广泰");
  await expect(page.locator("#companies")).toContainText("合成财务与情景评分");
  await page
    .getByRole("button", { name: "业务节点 NODE_VERTIPORT", exact: true })
    .click();
  await expect(page.locator(".mapped-company")).toHaveCount(2);
  await mkdir("../docs/issue14/evidence", { recursive: true });
  await page.screenshot({
    path: "../docs/issue14/evidence/prototype-report.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "查看规则与证据", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("待核验");
  await expect(dialog).toContainText("型号审定进展不等于商业运营许可");
  await dialog
    .getByRole("button", {
      name: /亿航智能EH216-S无人驾驶载人航空器系统成功取得中国民航局颁发的型号合格证/,
    })
    .click();
  await expect(
    page.getByRole("link", { name: "查看原始来源（新窗口）" }),
  ).toHaveAttribute("href", "https://www.ehang.com/cn/news/989.html");
  await page.screenshot({
    path: "../docs/issue14/evidence/prototype-evidence.png",
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "顺丰控股股份有限公司", exact: true })
    .click();
  await expect(dialog).toContainText("impact-v1.0.0");
  await expect(dialog).toContainText("非实际");
  await page.keyboard.press("Escape");
  await page.getByLabel("数据版本", { exact: true }).selectOption("mock-v1");
  await expect(page.locator(".business-graph")).toHaveCount(0);
  await expect(page.getByLabel("已有事件")).toHaveValue("");
});

test("changing version discards a late previous report", async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/v1/analyze", async (route) => {
    const response = await route.fetch();
    await gate;
    await route.fulfill({ response }).catch(() => {});
  });
  await page.goto("/");
  await page.getByLabel("已有事件").selectOption("EVT_BATTERY_PRICE_DOWN_001");
  const sent = page.waitForRequest("**/api/v1/analyze");
  await page.getByRole("button", { name: "查看分析", exact: true }).click();
  await sent;
  await page
    .getByLabel("数据版本", { exact: true })
    .selectOption("prototype-v1");
  release();
  await page.getByLabel("已有事件").selectOption("EVT_002");
  await expect(page.locator(".business-graph")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "查看分析", exact: true }),
  ).toBeEnabled();
});
