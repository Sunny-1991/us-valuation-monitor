import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { ALL_INDICES, INDEX_MAP } from "../../core/src/constants.ts";
import type { RawValuationPoint, ValuationDataset } from "../../core/src/types.ts";

const execFileAsync = promisify(execFile);

const INDEX_START_DATE: Record<string, string> = {
  sp500: "1995-01-03",
  nasdaq100: "1999-03-10",
  dow30: "1998-01-02",
  russell2000: "2001-01-03",
  sp400: "2000-01-03",
  us_total_market: "2001-06-15",
  sector_communication: "2018-06-18",
  sector_consumer_discretionary: "1999-01-04",
  sector_consumer_staples: "1999-01-04",
  sector_energy: "1999-01-04",
  sector_financials: "1999-01-04",
  sector_healthcare: "1999-01-04",
  sector_industrials: "1999-01-04",
  sector_materials: "1999-01-04",
  sector_real_estate: "2015-10-08",
  sector_technology: "1999-01-04",
  sector_utilities: "1999-01-04",
};

const BASELINE_BY_INDEX: Record<string, { pe: number; pb: number }> = {
  sp500: { pe: 20.5, pb: 3.9 },
  nasdaq100: { pe: 27.8, pb: 6.8 },
  dow30: { pe: 19.1, pb: 4.2 },
  russell2000: { pe: 22.6, pb: 2.4 },
  sp400: { pe: 19.8, pb: 2.5 },
  us_total_market: { pe: 21.3, pb: 3.7 },
  sector_communication: { pe: 21.7, pb: 4.1 },
  sector_consumer_discretionary: { pe: 23.3, pb: 6.1 },
  sector_consumer_staples: { pe: 20.3, pb: 4.9 },
  sector_energy: { pe: 14.6, pb: 2.0 },
  sector_financials: { pe: 15.1, pb: 1.8 },
  sector_healthcare: { pe: 22.0, pb: 4.5 },
  sector_industrials: { pe: 19.4, pb: 3.6 },
  sector_materials: { pe: 17.1, pb: 2.8 },
  sector_real_estate: { pe: 24.2, pb: 2.3 },
  sector_technology: { pe: 26.5, pb: 7.4 },
  sector_utilities: { pe: 18.2, pb: 2.2 },
};

const MONTH_TO_INDEX: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

const TRENDONIFY_ROUTES: Record<
  string,
  {
    trailing: string[];
    forward: string[];
  }
> = {
  sp500: {
    trailing: [
      "https://trendonify.com/united-states/stock-market/pe-ratio",
      "https://trendonify.com/united-states/stock-market/s-and-p-500/pe-ratio",
    ],
    forward: [
      "https://trendonify.com/united-states/stock-market/forward-pe-ratio",
      "https://trendonify.com/united-states/stock-market/s-and-p-500/forward-pe-ratio",
    ],
  },
  nasdaq100: {
    trailing: ["https://trendonify.com/united-states/stock-market/nasdaq-100/pe-ratio"],
    forward: ["https://trendonify.com/united-states/stock-market/nasdaq-100/forward-pe-ratio"],
  },
  dow30: {
    trailing: ["https://trendonify.com/united-states/stock-market/dow-jones/pe-ratio"],
    forward: ["https://trendonify.com/united-states/stock-market/dow-jones/forward-pe-ratio"],
  },
  russell2000: {
    trailing: ["https://trendonify.com/united-states/stock-market/russell-2000/pe-ratio"],
    forward: ["https://trendonify.com/united-states/stock-market/russell-2000/forward-pe-ratio"],
  },
  sp400: {
    trailing: [
      "https://trendonify.com/united-states/stock-market/s-and-p-midcap-400/pe-ratio",
      "https://trendonify.com/united-states/stock-market/sp-midcap-400/pe-ratio",
      "https://trendonify.com/united-states/stock-market/midcap-400/pe-ratio",
    ],
    forward: [
      "https://trendonify.com/united-states/stock-market/s-and-p-midcap-400/forward-pe-ratio",
      "https://trendonify.com/united-states/stock-market/sp-midcap-400/forward-pe-ratio",
      "https://trendonify.com/united-states/stock-market/midcap-400/forward-pe-ratio",
    ],
  },
  us_total_market: {
    trailing: [
      "https://trendonify.com/united-states/stock-market/wilshire-5000/pe-ratio",
      "https://trendonify.com/united-states/stock-market/us-total-stock-market/pe-ratio",
      "https://trendonify.com/united-states/stock-market/total-stock-market/pe-ratio",
    ],
    forward: [
      "https://trendonify.com/united-states/stock-market/wilshire-5000/forward-pe-ratio",
      "https://trendonify.com/united-states/stock-market/us-total-stock-market/forward-pe-ratio",
      "https://trendonify.com/united-states/stock-market/total-stock-market/forward-pe-ratio",
    ],
  },
  sector_communication: {
    trailing: ["https://trendonify.com/united-states/stock-market/sp-500-communication-services/pe-ratio"],
    forward: ["https://trendonify.com/united-states/stock-market/sp-500-communication-services/forward-pe-ratio"],
  },
  sector_consumer_discretionary: {
    trailing: ["https://trendonify.com/united-states/stock-market/sp-500-consumer-discretionary/pe-ratio"],
    forward: ["https://trendonify.com/united-states/stock-market/sp-500-consumer-discretionary/forward-pe-ratio"],
  },
  sector_consumer_staples: {
    trailing: ["https://trendonify.com/united-states/stock-market/sp-500-consumer-staples/pe-ratio"],
    forward: ["https://trendonify.com/united-states/stock-market/sp-500-consumer-staples/forward-pe-ratio"],
  },
  sector_energy: {
    trailing: ["https://trendonify.com/united-states/stock-market/sp-500-energy/pe-ratio"],
    forward: ["https://trendonify.com/united-states/stock-market/sp-500-energy/forward-pe-ratio"],
  },
  sector_financials: {
    trailing: ["https://trendonify.com/united-states/stock-market/sp-500-financials/pe-ratio"],
    forward: ["https://trendonify.com/united-states/stock-market/sp-500-financials/forward-pe-ratio"],
  },
  sector_healthcare: {
    trailing: [
      "https://trendonify.com/united-states/stock-market/sp-500-health-care/pe-ratio",
      "https://trendonify.com/united-states/stock-market/sp-500-healthcare/pe-ratio",
    ],
    forward: [
      "https://trendonify.com/united-states/stock-market/sp-500-health-care/forward-pe-ratio",
      "https://trendonify.com/united-states/stock-market/sp-500-healthcare/forward-pe-ratio",
    ],
  },
  sector_industrials: {
    trailing: ["https://trendonify.com/united-states/stock-market/sp-500-industrials/pe-ratio"],
    forward: ["https://trendonify.com/united-states/stock-market/sp-500-industrials/forward-pe-ratio"],
  },
  sector_materials: {
    trailing: ["https://trendonify.com/united-states/stock-market/sp-500-materials/pe-ratio"],
    forward: ["https://trendonify.com/united-states/stock-market/sp-500-materials/forward-pe-ratio"],
  },
  sector_real_estate: {
    trailing: ["https://trendonify.com/united-states/stock-market/sp-500-real-estate/pe-ratio"],
    forward: ["https://trendonify.com/united-states/stock-market/sp-500-real-estate/forward-pe-ratio"],
  },
  sector_technology: {
    trailing: ["https://trendonify.com/united-states/stock-market/sp-500-information-technology/pe-ratio"],
    forward: ["https://trendonify.com/united-states/stock-market/sp-500-information-technology/forward-pe-ratio"],
  },
  sector_utilities: {
    trailing: ["https://trendonify.com/united-states/stock-market/sp-500-utilities/pe-ratio"],
    forward: ["https://trendonify.com/united-states/stock-market/sp-500-utilities/forward-pe-ratio"],
  },
};

const MACROMICRO_CHART_IDS: Partial<
  Record<
    string,
    {
      trailing?: number;
      forward?: number;
    }
  >
> = {
  nasdaq100: { forward: 15115 },
};

const NASDAQ100_FORWARD_MM_BOOTSTRAP: Array<{ date: string; value: number }> = [
  { date: "2000-01-31", value: 95.92 },
  { date: "2000-02-29", value: 98.98 },
  { date: "2000-03-31", value: 98.47 },
  { date: "2000-04-30", value: 93.35 },
  { date: "2000-05-31", value: 81.95 },
  { date: "2000-06-30", value: 71.31 },
  { date: "2000-07-31", value: 67.78 },
  { date: "2000-08-31", value: 72.42 },
  { date: "2000-09-30", value: 58.67 },
  { date: "2000-10-31", value: 52.44 },
  { date: "2000-11-30", value: 57.78 },
  { date: "2000-12-31", value: 65.72 },
  { date: "2001-01-31", value: 67.95 },
  { date: "2001-02-28", value: 56.53 },
  { date: "2001-03-31", value: 42.89 },
  { date: "2001-04-30", value: 32.5 },
  { date: "2001-05-31", value: 34.05 },
  { date: "2001-06-30", value: 37.95 },
  { date: "2001-07-31", value: 36.95 },
  { date: "2001-08-31", value: 38.64 },
  { date: "2001-09-30", value: 29.61 },
  { date: "2001-10-31", value: 29.66 },
  { date: "2001-11-30", value: 33.88 },
  { date: "2001-12-31", value: 37.58 },
  { date: "2002-01-31", value: 35.87 },
  { date: "2002-02-28", value: 34.3 },
  { date: "2002-03-31", value: 29.53 },
  { date: "2002-04-30", value: 31.54 },
  { date: "2002-05-31", value: 29.16 },
  { date: "2002-06-30", value: 32.44 },
  { date: "2002-07-31", value: 27.66 },
  { date: "2002-08-31", value: 24.8 },
  { date: "2002-09-30", value: 17.97 },
  { date: "2002-10-31", value: 18.95 },
  { date: "2002-11-30", value: 26.28 },
  { date: "2002-12-31", value: 34.12 },
];

interface ClosePoint {
  date: string;
  close: number;
}

interface YieldPoint {
  date: string;
  value: number;
}

interface MonthlyMetricPoint {
  date: string;
  value: number;
  ts: number;
}

interface BuildSeriesOptions {
  anchorPe: number;
  anchorForwardPe: number;
  anchorPb: number;
  yields: YieldPoint[];
}

interface GenerateDatasetOptions {
  previousDataset?: ValuationDataset | null;
}

class ReliableSourceError extends Error {}

function parseDate(dateText: string): Date {
  return new Date(`${dateText}T00:00:00Z`);
}

function formatDate(input: Date): string {
  return input.toISOString().slice(0, 10);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundTo(value: number, digits = 4): number {
  const ratio = 10 ** digits;
  return Math.round(value * ratio) / ratio;
}

function deriveStaticPe(peTtm: number, currentStatic?: number): number {
  if (Number.isFinite(currentStatic) && Number(currentStatic) > 0) return Number(currentStatic);
  if (!Number.isFinite(peTtm) || peTtm <= 0) return 0;
  return clamp(peTtm, 0.1, 170);
}

function normalizePointWithStatic(point: RawValuationPoint): RawValuationPoint {
  return {
    ...point,
    pe_static: roundTo(deriveStaticPe(point.pe_ttm, point.pe_static), 4),
  };
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error || "unknown error");
}

function parseCsv(csvText: string): string[][] {
  return csvText
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(","));
}

async function curlGet(url: string, timeoutMs = 25000, extraHeaders: Record<string, string> = {}): Promise<string> {
  const timeoutSec = Math.max(8, Math.ceil(timeoutMs / 1000));
  const args = ["-sS", "-L", "--max-time", String(timeoutSec), "--connect-timeout", "8"];

  for (const [key, value] of Object.entries(extraHeaders)) {
    args.push("-H", `${key}: ${value}`);
  }

  args.push(url);

  const clearProxyEnv: NodeJS.ProcessEnv = { ...process.env };
  delete clearProxyEnv.HTTP_PROXY;
  delete clearProxyEnv.HTTPS_PROXY;
  delete clearProxyEnv.ALL_PROXY;
  delete clearProxyEnv.http_proxy;
  delete clearProxyEnv.https_proxy;
  delete clearProxyEnv.all_proxy;
  clearProxyEnv.NO_PROXY = "*";
  clearProxyEnv.no_proxy = "*";

  try {
    const { stdout } = await execFileAsync("curl", args, {
      maxBuffer: 32 * 1024 * 1024,
    });
    return stdout;
  } catch (error) {
    try {
      const { stdout } = await execFileAsync("curl", args, {
        maxBuffer: 32 * 1024 * 1024,
        env: clearProxyEnv,
      });
      return stdout;
    } catch (retryError) {
      const fallbackMessage = retryError instanceof Error ? retryError.message : "curl failed";
      const stderr =
        typeof retryError === "object" && retryError && "stderr" in retryError
          ? String((retryError as { stderr?: string }).stderr || "")
          : "";
      throw new Error(`${fallbackMessage}${stderr ? ` | ${stderr.trim()}` : ""}`);
    }
  }
}

function monthYearToIsoDate(monthRaw: string, yearRaw: string): string | undefined {
  const year = Number(yearRaw);
  if (!Number.isFinite(year) || year < 1800 || year > 2200) return undefined;

  const monthKey = String(monthRaw || "").slice(0, 3).toLowerCase();
  const monthIndex = MONTH_TO_INDEX[monthKey];
  if (monthIndex === undefined) return undefined;

  const monthEnd = new Date(Date.UTC(year, monthIndex + 1, 0));
  return monthEnd.toISOString().slice(0, 10);
}

function monthDayYearToIsoDate(monthRaw: string, dayRaw: string, yearRaw: string): string | undefined {
  const year = Number(yearRaw);
  const day = Number(dayRaw);
  if (!Number.isFinite(year) || year < 1800 || year > 2200) return undefined;
  if (!Number.isFinite(day) || day < 1 || day > 31) return undefined;

  const monthKey = String(monthRaw || "").slice(0, 3).toLowerCase();
  const monthIndex = MONTH_TO_INDEX[monthKey];
  if (monthIndex === undefined) return undefined;

  const date = new Date(Date.UTC(year, monthIndex, day));
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
}

function parseTrendonifyMonthlySeries(html: string): MonthlyMetricPoint[] {
  const byDate = new Map<string, number>();
  const tableRegex =
    /<td[^>]*>\s*([A-Za-z]{3,9})\s+([12][0-9]{3})\s*<\/td>\s*<td[^>]*>\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?)\s*<\/td>/gi;

  let tableMatch: RegExpExecArray | null;
  while ((tableMatch = tableRegex.exec(html)) !== null) {
    const isoDate = monthYearToIsoDate(tableMatch[1], tableMatch[2]);
    if (!isoDate) continue;
    const value = Number(tableMatch[3].replace(/,/g, ""));
    if (!Number.isFinite(value) || value <= 0 || value > 250) continue;
    if (!byDate.has(isoDate)) byDate.set(isoDate, value);
  }

  if (!byDate.size) {
    const plain = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<\/(p|div|li|tr|h[1-6]|table|section)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\r/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\n+/g, "\n");

    const lineRegex =
      /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+([12][0-9]{3})\s*\|?\s*([0-9]+(?:\.[0-9]+)?)/gi;

    let lineMatch: RegExpExecArray | null;
    while ((lineMatch = lineRegex.exec(plain)) !== null) {
      const isoDate = monthYearToIsoDate(lineMatch[1], lineMatch[2]);
      if (!isoDate) continue;
      const value = Number(lineMatch[3]);
      if (!Number.isFinite(value) || value <= 0 || value > 250) continue;
      if (!byDate.has(isoDate)) byDate.set(isoDate, value);
    }
  }

  return [...byDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, value]) => ({ date, value, ts: parseDate(date).getTime() }));
}

async function fetchTrendonifySeries(urls: string[]): Promise<MonthlyMetricPoint[] | undefined> {
  const expandedUrls: string[] = [];
  for (const rawUrl of urls) {
    const url = rawUrl.trim();
    if (!url) continue;
    expandedUrls.push(url);
    if (/^https?:\/\//i.test(url)) {
      expandedUrls.push(`https://r.jina.ai/http://${url.replace(/^https?:\/\//i, "")}`);
    }
  }

  const visited = new Set<string>();
  for (const rawUrl of expandedUrls) {
    const url = rawUrl.trim();
    if (!url || visited.has(url)) continue;
    visited.add(url);
    try {
      const html = await curlGet(url, 28000, {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        Accept: "text/html,application/xhtml+xml",
      });
      const series = parseTrendonifyMonthlySeries(html);
      if (series.length >= 12) {
        return series;
      }
    } catch {
      // try next url
    }
  }
  return undefined;
}

async function fetchMultplSp500PeSeries(): Promise<MonthlyMetricPoint[] | undefined> {
  const html = await curlGet("https://www.multpl.com/s-p-500-pe-ratio/table/by-month", 25000, {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    Accept: "text/html,application/xhtml+xml",
  });

  const byDate = new Map<string, number>();
  const rowRegex =
    /<tr[^>]*>\s*<td>\s*([A-Za-z]{3,9})\s+([0-9]{1,2}),\s*([12][0-9]{3})\s*<\/td>\s*<td>[\s\S]*?([0-9]+(?:\.[0-9]+)?)\s*<\/td>\s*<\/tr>/gi;
  let match: RegExpExecArray | null;
  while ((match = rowRegex.exec(html)) !== null) {
    const isoDate = monthDayYearToIsoDate(match[1], match[2], match[3]);
    if (!isoDate) continue;
    const value = Number(match[4]);
    if (!Number.isFinite(value) || value <= 0 || value > 250) continue;
    if (!byDate.has(isoDate)) byDate.set(isoDate, value);
  }

  if (!byDate.size) return undefined;
  return [...byDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, value]) => ({ date, value, ts: parseDate(date).getTime() }));
}

function normalizeMacroMicroMonthlyDate(dateText: string): string | undefined {
  const raw = String(dateText || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return undefined;
  const parsed = parseDate(raw);
  if (Number.isNaN(parsed.getTime())) return undefined;
  const monthEnd = new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth() + 1, 0));
  return formatDate(monthEnd);
}

function parseMacroMicroChartSeries(body: string): MonthlyMetricPoint[] {
  const text = String(body || "").trim();
  if (!text) return [];

  const parsePayload = (raw: string): MonthlyMetricPoint[] => {
    const rows = JSON.parse(raw) as Array<{ Date?: string; Value?: string | number }>;
    const byDate = new Map<string, number>();

    for (const row of rows || []) {
      const date = normalizeMacroMicroMonthlyDate(String(row?.Date || ""));
      const value = Number(row?.Value);
      if (!date) continue;
      if (!Number.isFinite(value) || value <= 0 || value > 250) continue;
      byDate.set(date, value);
    }

    return [...byDate.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, value]) => ({ date, value, ts: parseDate(date).getTime() }));
  };

  try {
    return parsePayload(text);
  } catch {
    const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!jsonMatch) return [];
    try {
      return parsePayload(jsonMatch[0]);
    } catch {
      return [];
    }
  }
}

async function fetchMacroMicroChartSeries(chartId: number): Promise<MonthlyMetricPoint[] | undefined> {
  const sources = [
    `https://en.macromicro.me/api/v1/chart-data?id=${chartId}`,
    `https://r.jina.ai/http://en.macromicro.me/api/v1/chart-data?id=${chartId}`,
  ];

  for (const url of sources) {
    try {
      const body = await curlGet(url, 25000, {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        Accept: "application/json,text/plain,*/*",
      });
      const series = parseMacroMicroChartSeries(body);
      if (series.length >= 12) return series;
    } catch {
      // try next source
    }
  }

  return undefined;
}

function buildBootstrapSeries(points: Array<{ date: string; value: number }>): MonthlyMetricPoint[] {
  return points
    .filter(
      (point) =>
        /^\d{4}-\d{2}-\d{2}$/.test(point.date || "") &&
        Number.isFinite(point.value) &&
        point.value > 0 &&
        point.value < 250
    )
    .map((point) => ({ date: point.date, value: point.value, ts: parseDate(point.date).getTime() }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function mergeMonthlySeries(primary: MonthlyMetricPoint[], secondary: MonthlyMetricPoint[]): MonthlyMetricPoint[] {
  const byDate = new Map<string, number>();
  for (const point of secondary) {
    byDate.set(point.date, point.value);
  }
  for (const point of primary) {
    byDate.set(point.date, point.value);
  }
  return [...byDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, value]) => ({ date, value, ts: parseDate(date).getTime() }));
}

function interpolateMonthlyMetric(date: string, series: MonthlyMetricPoint[]): number | undefined {
  if (!series.length) return undefined;
  const targetTs = parseDate(date).getTime();

  if (targetTs < series[0].ts) return undefined;
  if (targetTs >= series[series.length - 1].ts) return series[series.length - 1].value;

  let lo = 0;
  let hi = series.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const ts = series[mid].ts;
    if (ts === targetTs) return series[mid].value;
    if (ts < targetTs) lo = mid + 1;
    else hi = mid - 1;
  }

  const left = series[Math.max(0, hi)];
  const right = series[Math.min(series.length - 1, lo)];
  if (!left || !right) return undefined;
  const span = right.ts - left.ts;
  if (span <= 0) return left.value;

  const ratio = (targetTs - left.ts) / span;
  return left.value + (right.value - left.value) * ratio;
}

async function fetchStooqCloseSeries(symbol: string, startDate: string, endDate: string): Promise<ClosePoint[]> {
  const url = `https://stooq.com/q/d/l/?s=${symbol.toLowerCase()}.us&i=d`;
  const csvText = await curlGet(url, 35000);
  const rows = parseCsv(csvText);

  if (!rows.length || rows[0][0]?.toLowerCase() !== "date") {
    throw new Error(`Unexpected Stooq CSV format for ${symbol}`);
  }

  const result: ClosePoint[] = [];
  for (const row of rows.slice(1)) {
    const date = row[0];
    const close = Number(row[4]);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) continue;
    if (date < startDate || date > endDate) continue;
    if (!Number.isFinite(close) || close <= 0) continue;
    result.push({ date, close });
  }

  if (!result.length) {
    throw new Error(`No Stooq data for ${symbol}`);
  }

  return result;
}

async function fetchUs10ySeries(endDate: string): Promise<YieldPoint[]> {
  const csvText = await curlGet("https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS10", 25000);
  const rows = parseCsv(csvText);

  if (!rows.length || !rows[0][0]?.toLowerCase().includes("observation")) {
    throw new Error("Unexpected FRED CSV format for DGS10");
  }

  const result: YieldPoint[] = [];
  for (const row of rows.slice(1)) {
    const date = row[0];
    const rawValue = row[1];

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) continue;
    if (date > endDate) continue;
    if (!rawValue || rawValue === ".") continue;

    const value = Number(rawValue) / 100;
    if (!Number.isFinite(value) || value <= 0) continue;

    result.push({ date, value });
  }

  if (!result.length) {
    throw new Error("No usable DGS10 values from FRED");
  }

  return result;
}

async function fetchStockAnalysisPe(symbol: string): Promise<number | undefined> {
  const url = `https://stockanalysis.com/etf/${symbol.toLowerCase()}/`;
  const html = await curlGet(url, 25000, {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    Accept: "text/html,application/xhtml+xml",
  });

  const plain = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  const match =
    html.match(/"peRatio":"([0-9.]+)"/i) ||
    html.match(/"peRatio":([0-9.]+)/i) ||
    plain.match(/PE Ratio\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (!match) return undefined;

  const value = Number(match[1]);
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return value;
}

async function fetchStockAnalysisForwardPe(symbol: string): Promise<number | undefined> {
  const url = `https://stockanalysis.com/etf/${symbol.toLowerCase()}/`;
  const html = await curlGet(url, 25000, {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    Accept: "text/html,application/xhtml+xml",
  });

  const plain = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  const match =
    html.match(/"forwardPE":"([0-9.]+)"/i) ||
    html.match(/"forwardPE":([0-9.]+)/i) ||
    plain.match(/Forward\s*(?:P\/E|PE)\s*([0-9]+(?:\.[0-9]+)?)/i) ||
    plain.match(/P\/E\s*\(Forward\)\s*([0-9]+(?:\.[0-9]+)?)/i);

  if (!match) return undefined;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return value;
}

async function fetchFinvizForwardPe(symbol: string): Promise<number | undefined> {
  const url = `https://finviz.com/quote.ashx?t=${symbol.toUpperCase()}&p=d`;
  const html = await curlGet(url, 25000, {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    Accept: "text/html,application/xhtml+xml",
  });

  const plain = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  const match =
    html.match(/Forward P\/E<\/td>\s*<td[^>]*>\s*([0-9]+(?:\.[0-9]+)?)/i) ||
    plain.match(/Forward P\/E\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (!match) return undefined;

  const value = Number(match[1]);
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return value;
}

async function fetchYahooForwardPe(symbol: string): Promise<number | undefined> {
  const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol.toUpperCase()}?modules=defaultKeyStatistics,financialData`;
  const body = await curlGet(url, 25000, {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    Accept: "application/json,text/plain,*/*",
  });

  if (!body || /^Edge:\s*Too\s*Many\s*Requests/i.test(body.trim())) return undefined;

  const payload = JSON.parse(body) as {
    quoteSummary?: {
      result?: Array<{
        defaultKeyStatistics?: {
          forwardPE?: {
            raw?: number;
          };
        };
        financialData?: {
          forwardPE?: {
            raw?: number;
          };
        };
      }>;
    };
  };
  const result = payload?.quoteSummary?.result?.[0];
  const value =
    result?.defaultKeyStatistics?.forwardPE?.raw ??
    result?.financialData?.forwardPE?.raw;

  if (!Number.isFinite(value) || Number(value) <= 0) return undefined;
  return Number(value);
}

async function fetchGuruFocusEtfPe(symbol: string): Promise<number | undefined> {
  const url = `https://www.gurufocus.com/etf/${symbol.toUpperCase()}/summary`;
  const html = await curlGet(url, 25000, {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    Accept: "text/html,application/xhtml+xml",
  });

  const plain = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  const match = plain.match(/PE Ratio\s*:?\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (!match) return undefined;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return value;
}

async function fetchMacroMicroSp500Pe(): Promise<number | undefined> {
  const url = "https://en.macromicro.me/series/1633/us-sp500-pe-ratio";
  const html = await curlGet(url, 25000, {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    Accept: "text/html,application/xhtml+xml",
  });

  const plain = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  const match = plain.match(/US\s*-\s*S&P\s*500\s*PE\s*Ratio\s*(20\d{2}-\d{2}(?:-\d{2})?)\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (!match) return undefined;
  const value = Number(match[2]);
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return value;
}

function buildProxySeriesFromClose(closes: ClosePoint[], options: BuildSeriesOptions): RawValuationPoint[] {
  const yields = [...options.yields].sort((a, b) => a.date.localeCompare(b.date));
  let yieldIndex = 0;
  let currentYield = yields[0]?.value ?? 0.035;

  const alpha63 = 2 / (63 + 1);
  const alpha252 = 2 / (252 + 1);
  const alpha756 = 2 / (756 + 1);
  const alphaPe = 0.06;
  const alphaForwardPe = 0.08;
  const alphaPb = 0.05;

  let ema63 = closes[0]?.close || 1;
  let ema252 = ema63;
  let ema756 = ema63;

  let rollingYieldFast = currentYield;
  let rollingYieldSlow = currentYield;
  let rollingAbsReturnFast = 0;
  let rollingAbsReturnSlow = 0;

  let peTtmSmooth = options.anchorPe;
  let peForwardSmooth = options.anchorForwardPe;
  let pbSmooth = options.anchorPb;

  const peRaw: number[] = [];
  const peForwardRaw: number[] = [];
  const pbRaw: number[] = [];
  const yieldSeries: number[] = [];

  for (let i = 0; i < closes.length; i += 1) {
    const closePoint = closes[i];

    while (yieldIndex < yields.length && yields[yieldIndex].date <= closePoint.date) {
      currentYield = yields[yieldIndex].value;
      yieldIndex += 1;
    }

    const close = Math.max(closePoint.close, 0.01);
    const prevClose = Math.max(closes[Math.max(i - 1, 0)].close, 0.01);
    const dailyReturn = close / prevClose - 1;

    ema63 += alpha63 * (close - ema63);
    ema252 += alpha252 * (close - ema252);
    ema756 += alpha756 * (close - ema756);

    rollingYieldFast += alpha63 * (currentYield - rollingYieldFast);
    rollingYieldSlow += alpha756 * (currentYield - rollingYieldSlow);

    const absRet = Math.abs(dailyReturn);
    rollingAbsReturnFast += alpha63 * (absRet - rollingAbsReturnFast);
    rollingAbsReturnSlow += alpha252 * (absRet - rollingAbsReturnSlow);

    const premiumShort = Math.log(close / Math.max(ema252, 0.01));
    const premiumLong = Math.log(Math.max(ema252, 0.01) / Math.max(ema756, 0.01));
    const premiumUltraShort = Math.log(close / Math.max(ema63, 0.01));
    const yieldGap = currentYield - rollingYieldSlow;
    const yieldMomentum = currentYield - rollingYieldFast;
    const volGap = rollingAbsReturnFast - rollingAbsReturnSlow;

    const ttmSignal = clamp(
      premiumUltraShort * 1.25 +
        premiumShort * 0.72 +
        premiumLong * 0.46 -
        yieldGap * 4.8 -
        yieldMomentum * 1.4 -
        volGap * 6.2,
      -0.92,
      0.92
    );
    const pbSignal = clamp(ttmSignal * 0.62 + premiumLong * 0.28 - yieldGap * 1.8 - volGap * 2.2, -0.9, 0.9);
    const forwardSpread = clamp(
      0.085 + premiumLong * 0.22 + premiumShort * 0.12 - yieldGap * 0.42 - yieldMomentum * 0.2,
      -0.08,
      0.24
    );

    const targetPeTtm = options.anchorPe * Math.exp(ttmSignal);
    const targetPeForward = targetPeTtm * (1 - forwardSpread);
    const targetPb = options.anchorPb * Math.exp(pbSignal);

    peTtmSmooth += alphaPe * (targetPeTtm - peTtmSmooth);
    peForwardSmooth += alphaForwardPe * (targetPeForward - peForwardSmooth);
    pbSmooth += alphaPb * (targetPb - pbSmooth);

    peRaw.push(peTtmSmooth);
    peForwardRaw.push(peForwardSmooth);
    pbRaw.push(pbSmooth);
    yieldSeries.push(clamp(currentYield, 0.001, 0.12));
  }

  const scalePe = options.anchorPe / Math.max(peRaw[peRaw.length - 1] || options.anchorPe, 0.0001);
  const scaleForward =
    options.anchorForwardPe / Math.max(peForwardRaw[peForwardRaw.length - 1] || options.anchorForwardPe, 0.0001);
  const scalePb = options.anchorPb / Math.max(pbRaw[pbRaw.length - 1] || options.anchorPb, 0.0001);

  return closes.map((closePoint, index) => {
    const peTtm = roundTo(clamp(peRaw[index] * scalePe, 2.4, 140), 4);
    const peForward = roundTo(clamp(peForwardRaw[index] * scaleForward, 2, 120), 4);
    return {
      date: closePoint.date,
      pe_ttm: peTtm,
      pe_static: roundTo(deriveStaticPe(peTtm), 4),
      pe_forward: peForward,
      pb: roundTo(clamp(pbRaw[index] * scalePb, 0.2, 28), 4),
      us10y_yield: roundTo(yieldSeries[index], 5),
    };
  });
}

function applyMonthlyPeOverrides(
  points: RawValuationPoint[],
  trailingSeries?: MonthlyMetricPoint[],
  forwardSeries?: MonthlyMetricPoint[]
): RawValuationPoint[] {
  if ((!trailingSeries || !trailingSeries.length) && (!forwardSeries || !forwardSeries.length)) {
    return points;
  }

  return points.map((point) => {
    const trailing = trailingSeries?.length ? interpolateMonthlyMetric(point.date, trailingSeries) : undefined;
    const forward = forwardSeries?.length ? interpolateMonthlyMetric(point.date, forwardSeries) : undefined;

    const peTtm = Number.isFinite(trailing) ? clamp(Number(trailing), 2.4, 140) : point.pe_ttm;
    const peForward = Number.isFinite(forward) ? clamp(Number(forward), 2, 120) : point.pe_forward;

    return {
      ...point,
      pe_ttm: roundTo(peTtm, 4),
      pe_forward: roundTo(peForward, 4),
      pe_static: roundTo(deriveStaticPe(peTtm, point.pe_static), 4),
    };
  });
}

function isReasonablePe(value: number | undefined): value is number {
  return Number.isFinite(value) && value > 4 && value < 80;
}

function isReasonableForwardPe(value: number | undefined): value is number {
  return Number.isFinite(value) && value > 2 && value < 120;
}

function isUsableHistoryDataset(dataset: ValuationDataset | null | undefined): dataset is ValuationDataset {
  if (!dataset || !Array.isArray(dataset.indices) || !dataset.indices.length) return false;
  if (!dataset.source || /synthetic/i.test(dataset.source)) return false;

  for (const item of dataset.indices) {
    if (!item?.id || !Array.isArray(item.points) || !item.points.length) {
      return false;
    }
  }
  return true;
}

function isHistorySeriesReliable(indexId: string, points: RawValuationPoint[]): boolean {
  if (!points.length) return false;
  if (indexId === "nasdaq100") {
    const bubbleRange = points.filter((point) => point.date >= "1999-01-01" && point.date <= "2003-12-31");
    if (!bubbleRange.length) return false;
    const bubblePeak = Math.max(...bubbleRange.map((point) => Number(point.pe_ttm) || 0));
    if (!Number.isFinite(bubblePeak) || bubblePeak < 70) {
      return false;
    }
  }
  return true;
}

function buildHistoryFallbackMap(
  dataset: ValuationDataset | null | undefined,
  effectiveEnd: string
): Map<string, RawValuationPoint[]> {
  const result = new Map<string, RawValuationPoint[]>();
  if (!isUsableHistoryDataset(dataset)) return result;

  for (const item of dataset.indices) {
    const points = item.points
      .filter((point) => point.date <= effectiveEnd)
      .map((point) => normalizePointWithStatic(point));
    if (isHistorySeriesReliable(item.id, points)) {
      result.set(item.id, points);
    }
  }
  return result;
}

function buildLatestForwardMap(
  dataset: ValuationDataset | null | undefined,
  effectiveEnd: string
): Map<string, number> {
  const result = new Map<string, number>();
  if (!isUsableHistoryDataset(dataset)) return result;
  if (/ttm-fpe-fallback-/i.test(dataset.source || "")) {
    return result;
  }

  for (const item of dataset.indices) {
    const latest = [...item.points].reverse().find((point) => point.date <= effectiveEnd);
    if (!latest) continue;
    if (isReasonableForwardPe(latest.pe_forward)) {
      result.set(item.id, Number(latest.pe_forward));
    }
  }

  return result;
}

function buildForwardStartMap(
  dataset: ValuationDataset | null | undefined,
  effectiveEnd: string
): Map<string, string> {
  const result = new Map<string, string>();
  if (!isUsableHistoryDataset(dataset)) return result;

  for (const item of dataset.indices) {
    const rawStart = String(item.forwardStartDate || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rawStart)) continue;
    if (rawStart > effectiveEnd) continue;
    result.set(item.id, rawStart);
  }

  return result;
}

export async function generateDataset(endDate?: string, options: GenerateDatasetOptions = {}): Promise<ValuationDataset> {
  const effectiveEnd = endDate || new Date().toISOString().slice(0, 10);
  const historyFallbackMap = buildHistoryFallbackMap(options.previousDataset, effectiveEnd);
  const latestForwardMap = buildLatestForwardMap(options.previousDataset, effectiveEnd);
  const historyForwardStartMap = buildForwardStartMap(options.previousDataset, effectiveEnd);

  let us10ySeries: YieldPoint[] = [];
  let yieldSource = "fred10y";
  try {
    us10ySeries = await fetchUs10ySeries(effectiveEnd);
  } catch {
    yieldSource = "fallback10y";
    us10ySeries = [];
  }

  const indices: ValuationDataset["indices"] = [];
  let liveSeriesCount = 0;
  let historyFallbackCount = 0;
  let stockAnalysisAnchorCount = 0;
  let guruFocusAnchorCount = 0;
  let macroMicroAnchorCount = 0;
  let trendonifyTrailingCount = 0;
  let trendonifyForwardCount = 0;
  let macroMicroForwardCount = 0;
  let ndxForwardBootstrapCount = 0;
  let multplTrailingCount = 0;
  let stockAnalysisForwardCount = 0;
  let finvizForwardCount = 0;
  let yahooForwardCount = 0;
  let historyForwardFallbackCount = 0;
  let cachedMultplSp500Series: MonthlyMetricPoint[] | undefined;
  const fetchErrors: string[] = [];

  for (const meta of ALL_INDICES) {
    const startDate = INDEX_START_DATE[meta.id] || "2010-01-04";
    const baseline = BASELINE_BY_INDEX[meta.id];

    try {
      const closes = await fetchStooqCloseSeries(meta.symbol, startDate, effectiveEnd);
      if (closes.length < 120) {
        throw new Error(`insufficient close data: ${meta.id}`);
      }

      let anchorPe = baseline.pe;
      let resolvedFrom = "";
      const trendRoutes = TRENDONIFY_ROUTES[meta.id];

      let trailingSeries: MonthlyMetricPoint[] | undefined;
      let forwardSeries: MonthlyMetricPoint[] | undefined;
      const macroMicroIds = MACROMICRO_CHART_IDS[meta.id];

      if (meta.id === "sp500") {
        try {
          if (!cachedMultplSp500Series) {
            cachedMultplSp500Series = await fetchMultplSp500PeSeries();
          }
        } catch {
          // ignore
        }

        if (cachedMultplSp500Series?.length) {
          trailingSeries = cachedMultplSp500Series;
          multplTrailingCount += 1;
          const latestTrailing = trailingSeries[trailingSeries.length - 1]?.value;
          if (isReasonablePe(latestTrailing)) {
            anchorPe = Number(latestTrailing);
            resolvedFrom = "multpl";
          }
        }
      }

      if (!trailingSeries && trendRoutes) {
        trailingSeries = await fetchTrendonifySeries(trendRoutes.trailing);
        if (trailingSeries?.length) {
          trendonifyTrailingCount += 1;
          const latestTrailing = trailingSeries[trailingSeries.length - 1]?.value;
          if (isReasonablePe(latestTrailing)) {
            anchorPe = Number(latestTrailing);
            resolvedFrom = "trendonify";
          }
        }

      }

      if (!forwardSeries && macroMicroIds?.forward) {
        try {
          forwardSeries = await fetchMacroMicroChartSeries(macroMicroIds.forward);
          if (forwardSeries?.length) {
            macroMicroForwardCount += 1;
          }
        } catch {
          // ignore
        }
      }

      if (!forwardSeries && meta.id === "nasdaq100") {
        const bootstrapForward = buildBootstrapSeries(NASDAQ100_FORWARD_MM_BOOTSTRAP);
        if (bootstrapForward.length) {
          forwardSeries = bootstrapForward;
          ndxForwardBootstrapCount += 1;
        }
      }

      if (trendRoutes) {
        const shouldFetchTrendForward =
          !forwardSeries?.length || forwardSeries[forwardSeries.length - 1].date < effectiveEnd;
        if (shouldFetchTrendForward) {
          const trendForward = await fetchTrendonifySeries(trendRoutes.forward);
          if (trendForward?.length) {
            forwardSeries = forwardSeries?.length ? mergeMonthlySeries(forwardSeries, trendForward) : trendForward;
            trendonifyForwardCount += 1;
          }
        }
      }

      if (meta.id === "nasdaq100" && !trailingSeries?.length) {
        throw new ReliableSourceError(`missing reliable trailing PE history for ${meta.id}`);
      }
      if (meta.id === "nasdaq100") {
        if (!forwardSeries?.length) {
          throw new ReliableSourceError(`missing reliable forward PE history for ${meta.id}`);
        }
        const forwardStart = forwardSeries[0].date;
        if (forwardStart > "2001-12-31") {
          throw new ReliableSourceError(`insufficient forward PE history for ${meta.id}: starts at ${forwardStart}`);
        }
      }

      if (!resolvedFrom) {
        const anchorCandidates: Array<{ from: string; value?: number }> = [];

        if (meta.id === "sp500") {
          try {
            anchorCandidates.push({ from: "macromicro", value: await fetchMacroMicroSp500Pe() });
          } catch {
            // ignore
          }
        }

        try {
          anchorCandidates.push({ from: "gurufocus", value: await fetchGuruFocusEtfPe(meta.symbol) });
        } catch {
          // ignore
        }

        try {
          anchorCandidates.push({ from: "stockanalysis", value: await fetchStockAnalysisPe(meta.symbol) });
        } catch {
          // ignore
        }

        for (const candidate of anchorCandidates) {
          if (isReasonablePe(candidate.value)) {
            anchorPe = Number(candidate.value);
            resolvedFrom = candidate.from;
            break;
          }
        }
      }

      if (resolvedFrom === "macromicro") macroMicroAnchorCount += 1;
      else if (resolvedFrom === "gurufocus") guruFocusAnchorCount += 1;
      else if (resolvedFrom === "stockanalysis") stockAnalysisAnchorCount += 1;

      const latestForward = forwardSeries?.length ? forwardSeries[forwardSeries.length - 1]?.value : undefined;
      let anchorForwardPe = isReasonableForwardPe(latestForward) ? Number(latestForward) : undefined;

      if (!anchorForwardPe) {
        try {
          const stockAnalysisForward = await fetchStockAnalysisForwardPe(meta.symbol);
          if (isReasonableForwardPe(stockAnalysisForward)) {
            anchorForwardPe = Number(stockAnalysisForward);
            stockAnalysisForwardCount += 1;
          }
        } catch {
          // ignore
        }
      }

      if (!anchorForwardPe) {
        try {
          const finvizForward = await fetchFinvizForwardPe(meta.symbol);
          if (isReasonableForwardPe(finvizForward)) {
            anchorForwardPe = Number(finvizForward);
            finvizForwardCount += 1;
          }
        } catch {
          // ignore
        }
      }

      if (!anchorForwardPe) {
        try {
          const yahooForward = await fetchYahooForwardPe(meta.symbol);
          if (isReasonableForwardPe(yahooForward)) {
            anchorForwardPe = Number(yahooForward);
            yahooForwardCount += 1;
          }
        } catch {
          // ignore
        }
      }

      if (!anchorForwardPe) {
        const latestHistoryForward = latestForwardMap.get(meta.id);
        if (isReasonableForwardPe(latestHistoryForward)) {
          anchorForwardPe = Number(latestHistoryForward);
          historyForwardFallbackCount += 1;
        }
      }

      if (!anchorForwardPe) {
        throw new ReliableSourceError(`missing reliable forward PE source for ${meta.id}`);
      }

      let forwardStartDate = forwardSeries?.[0]?.date;
      if (!forwardStartDate) {
        forwardStartDate = historyForwardStartMap.get(meta.id);
      }
      if (!forwardStartDate) {
        forwardStartDate = closes[closes.length - 1]?.date;
      }

      const anchorPb = clamp(baseline.pb * Math.pow(anchorPe / baseline.pe, 0.72), 0.5, 16);
      const proxyPoints = buildProxySeriesFromClose(closes, {
        anchorPe,
        anchorForwardPe,
        anchorPb,
        yields: us10ySeries,
      });
      const points = applyMonthlyPeOverrides(proxyPoints, trailingSeries, forwardSeries);

      liveSeriesCount += 1;

      indices.push({
        id: meta.id,
        symbol: meta.symbol,
        group: meta.group,
        displayName: meta.displayName,
        description: meta.description,
        forwardStartDate,
        points,
      });
    } catch (error) {
      if (error instanceof ReliableSourceError) {
        fetchErrors.push(`${meta.id}/${meta.symbol}: ${errorMessage(error)}`);
        continue;
      }
      const historyPoints = historyFallbackMap.get(meta.id);
      if (historyPoints?.length) {
        historyFallbackCount += 1;
        indices.push({
          id: meta.id,
          symbol: meta.symbol,
          group: meta.group,
          displayName: meta.displayName,
          description: meta.description,
          forwardStartDate: historyForwardStartMap.get(meta.id) || historyPoints[historyPoints.length - 1]?.date,
          points: historyPoints,
        });
        continue;
      }
      fetchErrors.push(`${meta.id}/${meta.symbol}: ${errorMessage(error)}`);
    }
  }

  if (fetchErrors.length > 0) {
    throw new Error(
      `Real data fetch failed for ${fetchErrors.length} index(es) without historical fallback: ${fetchErrors.join(
        " | "
      )}`
    );
  }

  let source = "free-live-proxy-v6";
  if (historyFallbackCount > 0) {
    source += `+history-fallback-${historyFallbackCount}`;
  }
  if (liveSeriesCount === 0) {
    source += "+no-live-refresh";
  }
  if (stockAnalysisAnchorCount > 0) {
    source += `+stockanalysis-pe-${stockAnalysisAnchorCount}`;
  }
  if (guruFocusAnchorCount > 0) {
    source += `+gurufocus-pe-${guruFocusAnchorCount}`;
  }
  if (macroMicroAnchorCount > 0) {
    source += `+macromicro-pe-${macroMicroAnchorCount}`;
  }
  if (multplTrailingCount > 0) {
    source += `+multpl-pe-${multplTrailingCount}`;
  }
  if (trendonifyTrailingCount > 0) {
    source += `+trendonify-pe-${trendonifyTrailingCount}`;
  }
  if (trendonifyForwardCount > 0) {
    source += `+trendonify-fpe-${trendonifyForwardCount}`;
  }
  if (macroMicroForwardCount > 0) {
    source += `+macromicro-fpe-${macroMicroForwardCount}`;
  }
  if (ndxForwardBootstrapCount > 0) {
    source += `+ndx-fpe-bootstrap-${ndxForwardBootstrapCount}`;
  }
  if (stockAnalysisForwardCount > 0) {
    source += `+stockanalysis-fpe-${stockAnalysisForwardCount}`;
  }
  if (finvizForwardCount > 0) {
    source += `+finviz-fpe-${finvizForwardCount}`;
  }
  if (yahooForwardCount > 0) {
    source += `+yahoo-fpe-${yahooForwardCount}`;
  }
  if (historyForwardFallbackCount > 0) {
    source += `+history-fpe-${historyForwardFallbackCount}`;
  }
  source += `+${yieldSource}`;

  return {
    generatedAt: new Date().toISOString(),
    source,
    indices,
  };
}

export function validateDataset(dataset: ValuationDataset): void {
  if (!dataset.indices.length) {
    throw new Error("Dataset contains no indices");
  }

  for (const indexData of dataset.indices) {
    if (!INDEX_MAP[indexData.id]) {
      throw new Error(`Unknown index in dataset: ${indexData.id}`);
    }
    if (!indexData.points.length) {
      throw new Error(`Empty time series: ${indexData.id}`);
    }
    if (
      indexData.forwardStartDate !== undefined &&
      !/^\d{4}-\d{2}-\d{2}$/.test(String(indexData.forwardStartDate || ""))
    ) {
      throw new Error(`Invalid forwardStartDate: ${indexData.id}`);
    }

    let prevDate = "";
    for (const point of indexData.points) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(point.date || "")) {
        throw new Error(`Invalid date format: ${indexData.id}`);
      }
      if (prevDate && point.date < prevDate) {
        throw new Error(`Date order is not ascending: ${indexData.id}`);
      }
      prevDate = point.date;

      const numberFields = [point.pe_ttm, point.pe_forward, point.pb, point.us10y_yield];
      if (numberFields.some((value) => !Number.isFinite(value))) {
        throw new Error(`Invalid numeric value: ${indexData.id}`);
      }
      if (point.pe_static !== undefined && !Number.isFinite(point.pe_static)) {
        throw new Error(`Invalid numeric value: ${indexData.id}`);
      }
    }
  }
}
