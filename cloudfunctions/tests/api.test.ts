import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  applyDailyUpdate,
  buildMeta,
  buildSeriesPayload,
  loadDataset,
  normalizeWatchlist,
  type RuntimeStores,
} from "../src/app.ts";

const CURRENT_FILE = fileURLToPath(import.meta.url);
const ROOT_DIR = path.resolve(path.dirname(CURRENT_FILE), "../..");

test("meta payload exposes complete index catalog", async () => {
  const dataset = await loadDataset(ROOT_DIR);
  const meta = buildMeta(dataset);

  assert.equal(meta.indices.length, 17);
  assert.ok(meta.indices.every((item) => item.pointCount > 100));
});

test("series payload defaults to index full history", async () => {
  const dataset = await loadDataset(ROOT_DIR);
  const payload = buildSeriesPayload(dataset, "sp500", "pe_ttm");

  assert.equal(payload.rows.length, payload.availableRange.pointCount);
  assert.equal(payload.rows[0].date, payload.availableRange.startDate);
  assert.equal(payload.rows[payload.rows.length - 1].date, payload.availableRange.endDate);
});

test("watchlist normalization applies defaults and clamps invalid input", () => {
  const watchlist = normalizeWatchlist(
    {
      watchIndexIds: ["sp500", "invalid", "nasdaq100"],
      alertRule: {
        metric: "percentile_full",
        upper: 88,
        lower: 12,
        cooldownTradingDays: 4,
      },
      themePreference: "terminal",
    },
    "test-user"
  );

  assert.deepEqual(watchlist.watchIndexIds, ["sp500", "nasdaq100"]);
  assert.equal(watchlist.alertRule.upper, 88);
  assert.equal(watchlist.themePreference, "terminal");
});

test("daily update returns refreshed dataset and alert count field", async () => {
  const dataset = await loadDataset(ROOT_DIR);
  const stores: RuntimeStores = {
    watchlists: {
      users: {
        "test-user": normalizeWatchlist(
          {
            watchIndexIds: ["sp500", "sector_technology"],
            alertRule: {
              metric: "percentile_full",
              upper: 85,
              lower: 15,
              cooldownTradingDays: 5,
            },
            themePreference: "fresh",
          },
          "test-user"
        ),
      },
    },
    alerts: { users: { "test-user": [] } },
    alertState: { users: { "test-user": {} } },
  };

  const result = await applyDailyUpdate(dataset, stores, {
    generateDatasetFn: async () => dataset,
  });
  assert.ok(result.dataset.generatedAt);
  assert.equal(result.dataset.indices.length, 17);
  assert.ok(Number.isInteger(result.createdAlerts));
});
