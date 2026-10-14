import { test, expect, type Page } from "@playwright/test";
const EVT = "EVT_BATTERY_PRICE_DOWN_001";
const fixture = {
  event: {
    event_id: EVT,
    event_name: "TEST · 受控报告边界",
    direction: "下降",
  },
  data_version: "TEST-fixture",
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
  await page
    .getByRole("button", { name: "打开独立 TEST 图谱", exact: true })
    .click();
}
const camera = (page: Page) =>
  page
    .locator(".sg-card")
    .getAttribute("data-camera")
    .then((s) => JSON.parse(s!));
async function pan(page: Page, dx = 60) {
  const b = (await page.locator(".sg-canvas").boundingBox())!;
  await page.mouse.move(b.x + b.width * 0.68, b.y + b.height * 0.52);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width * 0.68 + dx, b.y + b.height * 0.52 + 20, {
    steps: 5,
  });
  await page.mouse.up();
  await expect(page.locator(".sg-card")).toHaveAttribute(
    "data-view-mode",
    "held",
  );
}
test("real API report, geometry, original source and factors boundary", async ({
  page,
  request,
}) => {
  expect((await request.get("http://127.0.0.1:8000/health")).ok()).toBeTruthy();
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "查看分析", exact: true }),
  ).toBeDisabled();
  await expect(page.locator(".metrics")).toHaveCount(0);
  const response = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/v1/analyze") && r.request().method() === "POST",
  );
  await page.getByLabel("已有事件").selectOption(EVT);
  await page.getByRole("button", { name: "查看分析", exact: true }).click();
  expect((await response).status()).toBe(200);
  await expect(page.locator(".score").first()).toHaveText("40.80");
  await expect(page.locator("td.part")).toHaveText(Array(9).fill("数据不足"));
  const bounds = await page.evaluate(() => ({
    graph: document.querySelector(".sg-card")!.getBoundingClientRect().height,
    canvas: document.querySelector(".sg-canvas")!.getBoundingClientRect()
      .height,
    company: document.querySelector("#companies")!.getBoundingClientRect().top,
  }));
  expect(bounds).toEqual({ graph: 540, canvas: 388, company: 860 });
  await page
    .getByRole("button", { name: "示例 eVTOL 整机公司", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("需求弹性未知");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "模拟证据：电池价格输入" })
    .click();
  await expect(page.getByRole("dialog")).toContainText("来源可信度");
  await expect(
    page.getByRole("link", { name: "查看原始来源（新窗口）" }),
  ).toHaveAttribute("href", "https://example.com/mock/evidence/battery-price");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "示例 eVTOL 整机公司", exact: true }),
  ).toBeFocused();
});
test("file Mock preserves three factors and no forged server metadata", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "文件 Mock", exact: true }).click();
  await page.getByLabel("已有事件").selectOption(EVT);
  await page.getByRole("button", { name: "查看分析", exact: true }).click();
  await expect(page.locator("td.part").first()).toHaveText("69");
  await expect(page.locator("td.part").nth(1)).toHaveText("81");
  await page.getByRole("button", { name: "数据来源", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "文件模式不伪造服务运行 ID 或生成时间",
  );
});
test("manual hold, path choice, focus zoom, reversible history and animation interrupt", async ({
  page,
}) => {
  await analyze(page);
  await pan(page);
  const c = await camera(page);
  await page.locator('[data-node="B"]').press("Enter");
  await expect(page.locator(".sg-card")).toHaveAttribute("data-selected", "B");
  await page.getByRole("button", { name: "正向传导 A → B → D → G" }).click();
  await page.waitForTimeout(100);
  expect(await camera(page)).toEqual(c);
  await page.getByRole("button", { name: "聚焦节点", exact: true }).click();
  await page.waitForTimeout(1100);
  expect((await camera(page)).z).toBeCloseTo(c.z, 5);
  await pan(page, -25);
  const interrupted = await camera(page);
  await page.waitForTimeout(600);
  expect(await camera(page)).toEqual(interrupted);
  await page.getByRole("button", { name: "全局概览", exact: true }).click();
  await page.waitForTimeout(1100);
  await page.getByRole("button", { name: "返回上一视角", exact: true }).click();
  await page.waitForTimeout(1100);
  expect((await camera(page)).x).toBeCloseTo(interrupted.x, 1);
  await expect(
    page.getByRole("button", { name: "前进", exact: true }),
  ).toBeEnabled();
});
test("TEST mapping gated, nested reading scroll, graph return and expanded restoration", async ({
  page,
}) => {
  await analyze(page);
  await pan(page);
  await page.locator('[data-node="B"]').press("Enter");
  const captured = await camera(page);
  await expect(
    page.getByRole("button", { name: "业务节点公司映射 · 数据不足" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "公司比较", exact: true }).click();
  await page.getByRole("button", { name: "TEST 联动", exact: true }).click();
  await page.getByRole("button", { name: "筛选关联 TEST 公司" }).click();
  await expect(page.locator(".test-table tbody tr")).toHaveCount(2);
  await page
    .getByRole("button", { name: "TEST 公司 Alpha", exact: true })
    .click();
  await page.locator(".drawer-body").evaluate((el) => (el.scrollTop = 100));
  const reading = await page
    .locator(".drawer-body")
    .evaluate((el) => el.scrollTop);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "TEST · Alpha 映射测试记录" })
    .click();
  await expect(page.getByRole("dialog")).toContainText("来源链接不可用");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "返回", exact: true })
    .click();
  expect(
    await page.locator(".drawer-body").evaluate((el) => el.scrollTop),
  ).toBe(reading);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "返回图谱现场" })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".sg-card")).toHaveAttribute("data-selected", "B");
  expect(await camera(page)).toEqual(captured);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await page.getByRole("button", { name: "展开图谱" }).click();
  await expect(page.locator("#companies")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "公司比较", exact: true }),
  ).toBeDisabled();
  await pan(page, 20);
  await page.getByRole("button", { name: "收起图谱" }).click();
  await expect(page.locator("#companies")).toBeVisible();
  expect(await camera(page)).toEqual(captured);
});
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
  await expect(page.getByText("路径集合 · 数据不足")).toBeVisible();
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
test("Reduced Motion, pause, narrow desktop and graph anchor", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await analyze(page);
  await expect(page.getByLabel("减少动态效果")).toBeChecked();
  await page.locator('[data-node="B"]').press("Enter");
  const t = await page.locator('[data-node="B"]').getAttribute("transform");
  await page.waitForTimeout(200);
  expect(await page.locator('[data-node="B"]').getAttribute("transform")).toBe(
    t,
  );
  for (const width of [1280, 800]) {
    await page.setViewportSize({ width, height: 1024 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await expect(page.getByLabel("已有事件")).toBeVisible();
  }
  await page.setViewportSize({ width: 1440, height: 1024 });
  await page.getByRole("link", { name: "公司与证据" }).click();
  await page.getByRole("link", { name: "产业路径" }).click();
  expect(
    await page.evaluate(
      () => document.querySelector("#graph")!.getBoundingClientRect().top,
    ),
  ).toBeGreaterThanOrEqual(90);
});

test("event list empty and read failure remain distinct", async ({ page }) => {
  const url = (u: URL) => u.pathname.endsWith("/events.json") && !u.search;
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

test("live idle stays within2 CSS pixels, selected stable, and pause freezes motion", async ({
  page,
}) => {
  await analyze(page);
  await page.getByRole("button", { name: "保持视角", exact: true }).click();
  await page.locator('[data-node="B"]').press("Enter");
  const sample = await page.evaluate(async () => {
    const a = document.querySelector<SVGGElement>('[data-node="A"]')!,
      b = document.querySelector<SVGGElement>('[data-node="B"]')!;
    const startB = b.getAttribute("transform");
    let max = 0,
      changes = 0,
      previous = "";
    for (let i = 0; i < 40; i++) {
      const m = a.transform.baseVal.consolidate()!.matrix;
      const z = JSON.parse(
        document.querySelector<HTMLElement>(".sg-card")!.dataset.camera!,
      ).z;
      max = Math.max(max, Math.hypot(m.e - 80, m.f - 201) * z);
      const next = a.getAttribute("transform")!;
      if (previous && previous !== next) changes++;
      previous = next;
      await new Promise((r) => setTimeout(r, 225));
    }
    return {
      max,
      changes,
      selectedStable: startB === b.getAttribute("transform"),
    };
  });
  expect(sample.max).toBeLessThanOrEqual(2.001);
  expect(sample.changes).toBeGreaterThan(5);
  expect(sample.selectedStable).toBeTruthy();
  await page.getByLabel("暂停非必要运动").check();
  const before = await page
    .locator('[data-node="A"]')
    .getAttribute("transform");
  await page.waitForTimeout(400);
  expect(await page.locator('[data-node="A"]').getAttribute("transform")).toBe(
    before,
  );
});

test("hover preview bridges popup without camera takeover or company selection", async ({
  page,
}) => {
  await analyze(page);
  await page.getByRole("button", { name: "保持视角", exact: true }).click();
  await page.locator('[data-node="B"]').press("Enter");
  const c = await camera(page);
  const nodeBox = (await page.locator('[data-node="D"]').boundingBox())!;
  await page.mouse.move(nodeBox.x + nodeBox.width / 2, nodeBox.y + 27);
  await expect(page.locator(".sg-card")).toHaveAttribute("data-preview", "D");
  await expect(page.locator(".sg-card")).toHaveAttribute("data-selected", "B");
  expect(await camera(page)).toEqual(c);
  await page.locator(".sg-popover").hover();
  await page.waitForTimeout(300);
  await expect(page.locator(".sg-card")).toHaveAttribute("data-preview", "D");
  await page.locator(".sg-popover button").click();
  await expect(page.getByRole("dialog")).toContainText("TEST_NODE_D");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "返回图谱现场" })
    .click();
  await expect(page.locator(".sg-card")).toHaveAttribute("data-selected", "D");
  expect(await camera(page)).toEqual(c);
});

test("fresh node research replaces prior graph departure scroll", async ({
  page,
}) => {
  await analyze(page);
  await page.getByRole("button", { name: "保持视角", exact: true }).click();
  await page.locator('[data-node="B"]').press("Enter");
  await page.evaluate(() => scrollTo(0, 400));
  await page.getByRole("button", { name: "公司比较", exact: true }).click();
  await page
    .locator(".company-tabs")
    .getByRole("button", { name: "返回图谱现场" })
    .click();
  expect(await page.evaluate(() => scrollY)).toBe(400);
  await page.evaluate(() => scrollTo(0, 550));
  await page.getByRole("button", { name: "研究当前节点", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "返回图谱现场" })
    .click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(550);
});
