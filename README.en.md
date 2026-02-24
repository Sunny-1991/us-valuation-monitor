# US Valuation Monitor

A US equity valuation monitoring project designed for a **professional, visual-first, and clean institutional UX** across **Web + WeChat Mini Program**.

At this stage, the **Web client is the production-ready focus**, while the Mini Program scaffold is included for the next iteration.

## 1. Scope

- Coverage: major US market indices + S&P 11 sector mapping (17 tracked assets)
- Core metrics: `pe_ttm`, `pe_forward`, `pb`, `earnings_yield`, `erp_proxy`
- Derived analytics: historical percentiles, Z-score, valuation regime classification
- Update cadence: post-close daily refresh (local/light-cloud workflow)

## 2. Current Delivery Status

- Web: complete interaction and charting workflow in place
- Data: real free-source ingestion pipeline with historical fallback
- API: unified endpoints usable by both Web and Mini Program
- Mini Program: project structure and pages are scaffolded for follow-up work

> Note: the current Web build focuses on valuation analytics/visualization and does not include the alert-center UI.

## 3. Key Product Capabilities

- Index snapshot cards (core indices first, then sectors)
- Detail page with dual visualization modules (valuation + percentile trend)
- Slider/track based time-window controls with smooth synchronized updates
- Multi-index comparison (default: S&P 500, Dow Jones, Nasdaq-100)
- Persistent local preferences (grouping, compare range, watchlist)
- End-of-line labels on chart series for better readability

## 4. Data Sources & Methodology

The pipeline follows a “real free data first, multi-source merge” strategy:

- Price history: Stooq (index/ETF proxy)
- US 10Y yield: FRED `DGS10`
- Valuation supplements: Trendonify / Multpl / StockAnalysis / other public sources

### Nasdaq-100 forward PE (dot-com period fix)

The 2000-2002 forward PE quality issue has been explicitly fixed:

- MacroMicro NDX forward PE series (`id=15115`) is prioritized as a real source
- A trusted fallback block is retained for this critical period under anti-bot instability
- Prevents synthetic behavior where valuation lines mechanically mirror index price

## 5. Repository Structure

```text
us-valuation-monitor/
├─ apps/
│  ├─ web/                # Web app (index.html / app.js / styles.css)
│  └─ miniprogram/        # WeChat Mini Program scaffold
├─ packages/
│  ├─ core/               # shared types, metrics, statistical logic
│  └─ data-pipeline/      # ingestion, normalization, snapshot generation
├─ cloudfunctions/        # lightweight Node API server
├─ data/
│  ├─ standardized/       # valuation history snapshots
│  └─ runtime/            # runtime states (watchlist/alerts...)
├─ package.json
└─ tsconfig.json
```

## 6. Local Run

```bash
cd "/Users/coattail/Documents/New project/us-valuation-monitor"
```

### 6.1 Build/refresh dataset

```bash
npm run build:data
```

Output:

- `data/standardized/valuation-history.json`

### 6.2 Launch Web preview

```bash
npm run start:web
```

Open:

- `http://127.0.0.1:9030/apps/web/`

### 6.3 Launch API (optional)

```bash
npm run start:api
```

API base URL:

- `http://127.0.0.1:9040`

## 7. API Endpoints

- `GET /api/meta`
- `GET /api/snapshot`
- `GET /api/series?indexId=&metric=&from=&to=`
- `GET /api/heatmap?group=core|sector|all`
- `GET /api/watchlist`
- `POST /api/watchlist`
- `GET /api/alerts`
- `POST /api/alerts/ack`
- `POST /api/jobs/daily-update`
- `POST /api/auth/dev-login`
- `POST /api/auth/wechat-login` (placeholder)

## 8. Tests

```bash
npm test
```

Current coverage includes:

- core metric/statistical rules
- API integration essentials

## 9. Next Steps

- finish Mini Program visual/interaction parity with the Web version
- keep improving forward PE source coverage and calibration
- strengthen scheduled updates, alert loop, and operational robustness
