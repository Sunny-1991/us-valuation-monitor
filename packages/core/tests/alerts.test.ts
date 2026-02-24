import test from "node:test";
import assert from "node:assert/strict";

import {
  allowByCooldown,
  detectCrossing,
  resolveDirection,
  severityFromPercentile,
} from "../src/alerts.ts";

const rule = {
  metric: "percentile_full" as const,
  upper: 85,
  lower: 15,
  cooldownTradingDays: 5,
};

test("resolveDirection identifies high/low/neutral", () => {
  assert.equal(resolveDirection(0.9, rule), "high");
  assert.equal(resolveDirection(0.1, rule), "low");
  assert.equal(resolveDirection(0.5, rule), "neutral");
});

test("detectCrossing triggers only when crossing threshold", () => {
  assert.equal(detectCrossing(0.83, 0.86, rule), "high");
  assert.equal(detectCrossing(0.9, 0.88, rule), null);
  assert.equal(detectCrossing(0.2, 0.1, rule), "low");
});

test("severityFromPercentile returns P1 at extremes", () => {
  assert.equal(severityFromPercentile(0.97), "P1");
  assert.equal(severityFromPercentile(0.04), "P1");
  assert.equal(severityFromPercentile(0.9), "P2");
});

test("allowByCooldown checks trading-day gap", () => {
  const dates = [
    "2026-01-02",
    "2026-01-05",
    "2026-01-06",
    "2026-01-07",
    "2026-01-08",
    "2026-01-09",
    "2026-01-12",
  ];
  assert.equal(allowByCooldown(dates, "2026-01-05", "2026-01-12", 5), true);
  assert.equal(allowByCooldown(dates, "2026-01-06", "2026-01-09", 5), false);
});
