import { test, expect } from "@playwright/test";
const eventId = "EVT_BATTERY_PRICE_DOWN_001";
test("business nodes survive return to research, including a different path", async ({
  page,
}) => {
  await page.route("**/api/v1/analyze", async (route) => {
    const response = await route.fetch();
    const report = await response.json();
    report.paths.push({
      ...report.paths[0],
      path_id: "PATH_TEST_SECOND",
      node_ids: ["NODE_TEST_OTHER", "NODE_EVTOL"],
      relation_ids: ["REL_TEST_OTHER"],
      impact_direction: "uncertain",
    });
    await route.fulfill({ json: report });
  });
  await page.goto("/");
  await page.getByLabel("已有事件").selectOption(eventId);
  await page.getByRole("button", { name: "查看分析", exact: true }).click();
  const shelf = page.locator(".business-path").nth(1);
  await shelf.getByRole("button", { name: "NODE_EVTOL", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("NODE_EVTOL");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "返回图谱现场", exact: true })
    .click();
  await expect(shelf).toHaveClass(/active/);
  await expect(
    shelf.getByRole("button", { name: "NODE_EVTOL", exact: true }),
  ).toHaveClass(/active/);
});
test("actual report paths render adjacent endpoints and stay separate from TEST", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("已有事件").selectOption(eventId);
  await page.getByRole("button", { name: "查看分析", exact: true }).click();
  await expect(
    page.locator('[data-business-edge="REL_PROPULSION_EVTOL"]'),
  ).toHaveAttribute("data-source", "NODE_ELECTRIC_PROPULSION");
  await expect(
    page.locator('[data-business-edge="REL_PROPULSION_EVTOL"]'),
  ).toHaveAttribute("data-target", "NODE_EVTOL");
  await expect(page.locator(".business-graph")).toContainText("NODE_EVTOL");
  await expect(
    page.getByRole("button", { name: "TEST 输入 A", exact: true }),
  ).toHaveCount(0);
});
test("business camera and node survive company, evidence, and graph return", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("已有事件").selectOption(eventId);
  await page.getByRole("button", { name: "查看分析", exact: true }).click();
  const graph = page.locator(".business-graph");
  await graph
    .getByRole("button", { name: "业务节点 NODE_EVTOL", exact: true })
    .click();
  const canvas = await graph.locator(".bg-canvas").boundingBox();
  await page.mouse.move(canvas!.x + 400, canvas!.y + 70);
  await page.mouse.down();
  await page.mouse.move(canvas!.x + 450, canvas!.y + 80);
  await page.mouse.up();
  await expect(graph).toHaveAttribute("data-view-mode", "held");
  const held = await graph.getAttribute("data-camera");
  await graph
    .getByRole("button", { name: "业务节点 NODE_BATTERY", exact: true })
    .click();
  await expect(graph).toHaveAttribute("data-camera", held!);
  await page
    .getByRole("button", { name: "示例 eVTOL 整机公司", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "模拟证据：电池价格输入" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "返回图谱现场", exact: true })
    .click();
  await expect(graph).toHaveAttribute("data-selected", "NODE_BATTERY");
  await expect(graph).toHaveAttribute("data-camera", held!);
  await graph
    .getByRole("button", { name: "查看规则与证据", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "RULE_BATTERY_COST_PASS_THROUGH_V1",
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "模拟证据：电池价格输入" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "返回图谱现场", exact: true })
    .click();
  await expect(graph).toHaveAttribute("data-selected", "NODE_BATTERY");
});
test("each business path retains direction and invalid adjacency never fabricates lines", async ({
  page,
}) => {
  await page.route("**/api/v1/analyze", async (route) => {
    const response = await route.fetch();
    const report = await response.json();
    report.paths = ["positive", "negative", "neutral", "uncertain"].map(
      (impact_direction, i) => ({
        ...report.paths[0],
        path_id: `PATH_TEST_${i}`,
        impact_direction,
      }),
    );
    report.paths.push({
      ...report.paths[0],
      path_id: "PATH_TEST_INVALID",
      relation_ids: [],
    });
    await route.fulfill({ json: report });
  });
  await page.goto("/");
  await page.getByLabel("已有事件").selectOption(eventId);
  await page.getByRole("button", { name: "查看分析", exact: true }).click();
  const graph = page.locator(".business-graph");
  for (const [i, color] of [
    "#287B53",
    "#BB354A",
    "#58687E",
    "#9B690C",
  ].entries()) {
    await graph
      .getByRole("button", { name: new RegExp(`PATH_TEST_${i}`) })
      .click();
    await expect(graph.locator("[data-business-edge]").first()).toHaveAttribute(
      "stroke",
      color,
    );
  }
  await graph.getByRole("button", { name: /PATH_TEST_INVALID/ }).click();
  await expect(graph).toContainText("相邻关系数量不匹配");
  await expect(graph.locator("[data-business-edge]")).toHaveCount(0);
});
test("business graph expansion restores camera and chosen node", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("已有事件").selectOption(eventId);
  await page.getByRole("button", { name: "查看分析", exact: true }).click();
  const graph = page.locator(".business-graph");
  await graph
    .getByRole("button", { name: "业务节点 NODE_EVTOL", exact: true })
    .click();
  const camera = await graph.getAttribute("data-camera");
  await graph.getByRole("button", { name: "展开图谱", exact: true }).click();
  await expect(page.locator("#companies")).toHaveCount(0);
  await graph
    .getByRole("button", {
      name: "业务节点 NODE_ELECTRIC_PROPULSION",
      exact: true,
    })
    .click();
  await graph.getByRole("button", { name: "收起图谱", exact: true }).click();
  await expect(page.locator("#companies")).toBeVisible();
  await expect(graph).toHaveAttribute("data-selected", "NODE_EVTOL");
  await expect(graph).toHaveAttribute("data-camera", camera!);
});
test("TEST round trip preserves business camera, hold and undo history", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("已有事件").selectOption(eventId);
  await page.getByRole("button", { name: "查看分析", exact: true }).click();
  const graph = page.locator(".business-graph");
  await graph
    .getByRole("button", { name: "业务节点 NODE_EVTOL", exact: true })
    .click();
  const focused = await graph.getAttribute("data-camera");
  await graph.getByRole("button", { name: "＋", exact: true }).click();
  const held = await graph.getAttribute("data-camera");
  for (let i = 0; i < 2; i++) {
    await page
      .getByRole("button", { name: "打开独立 TEST 图谱", exact: true })
      .click();
    await page
      .getByRole("button", { name: "返回业务 ID 图谱", exact: true })
      .click();
    await expect(graph).toHaveAttribute("data-camera", held!);
    await expect(graph).toHaveAttribute("data-view-mode", "held");
    await expect(graph).toHaveAttribute("data-selected", "NODE_EVTOL");
    await expect(
      graph.getByRole("button", { name: "视角返回", exact: true }),
    ).toBeEnabled();
  }
  await graph.getByRole("button", { name: "视角返回", exact: true }).click();
  await expect(graph).toHaveAttribute("data-camera", focused!);
  await graph.getByRole("button", { name: "视角返回", exact: true }).click();
  await expect(graph).toHaveAttribute(
    "data-camera",
    JSON.stringify({ x: 0, y: 0, z: 1 }),
  );
  await expect(
    graph.getByRole("button", { name: "视角返回", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "查看分析", exact: true }).click();
  await expect(graph).toHaveAttribute("data-view-mode", "auto");
  await expect(graph).toHaveAttribute("data-selected", "");
});
test("source and event changes clear saved business views", async ({
  page,
}) => {
  await page.route(
    (url) => url.pathname.endsWith("/events.json") && !url.search,
    async (route) => {
      const response = await route.fetch();
      const events = await response.json();
      await route.fulfill({
        json: [
          ...events,
          {
            ...events[0],
            event_id: "EVT_TEST_OTHER",
            event_name: "TEST · 换事件",
          },
        ],
      });
    },
  );
  await page.goto("/");
  await page.getByLabel("已有事件").selectOption(eventId);
  await page.getByRole("button", { name: "查看分析", exact: true }).click();
  const graph = page.locator(".business-graph");
  await graph.getByRole("button", { name: "＋", exact: true }).click();
  await page.getByRole("button", { name: "文件 Mock", exact: true }).click();
  await page.getByLabel("已有事件").selectOption(eventId);
  await page.getByRole("button", { name: "查看分析", exact: true }).click();
  await expect(graph).toHaveAttribute(
    "data-camera",
    JSON.stringify({ x: 0, y: 0, z: 1 }),
  );
  await expect(graph).toHaveAttribute("data-view-mode", "auto");
  await graph.getByRole("button", { name: "＋", exact: true }).click();
  await page.getByLabel("已有事件").selectOption("EVT_TEST_OTHER");
  await expect(graph).toHaveCount(0);
  await page.getByLabel("已有事件").selectOption(eventId);
  await page.getByRole("button", { name: "查看分析", exact: true }).click();
  await expect(graph).toHaveAttribute(
    "data-camera",
    JSON.stringify({ x: 0, y: 0, z: 1 }),
  );
  await expect(
    graph.getByRole("button", { name: "视角返回", exact: true }),
  ).toBeDisabled();
});
