import { businessDaysBetween } from "./stats.ts";
import type { AlertRule } from "./types.ts";

export type AlertDirection = "high" | "low" | "neutral";

export function resolveDirection(percentile: number, rule: AlertRule): AlertDirection {
  const highLine = rule.upper / 100;
  const lowLine = rule.lower / 100;
  if (percentile >= highLine) return "high";
  if (percentile <= lowLine) return "low";
  return "neutral";
}

export function detectCrossing(
  previousPercentile: number,
  currentPercentile: number,
  rule: AlertRule
): AlertDirection | null {
  const prev = resolveDirection(previousPercentile, rule);
  const current = resolveDirection(currentPercentile, rule);
  if (current === "neutral") return null;
  if (prev === current) return null;
  return current;
}

export function severityFromPercentile(percentile: number): "P1" | "P2" {
  if (percentile >= 0.95 || percentile <= 0.05) return "P1";
  return "P2";
}

export function allowByCooldown(
  orderedDates: string[],
  lastTriggeredDate: string | undefined,
  currentDate: string,
  cooldownTradingDays: number
): boolean {
  if (!lastTriggeredDate) return true;
  const gap = businessDaysBetween(orderedDates, lastTriggeredDate, currentDate);
  return gap >= cooldownTradingDays;
}
