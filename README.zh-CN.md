# US Valuation Monitor（美国股市估值监测）

面向美国市场的估值监测项目，目标是提供**专业、可视化强、清新大气**的双端体验（Web + 微信小程序）。

当前阶段以 **Web 端完整可用** 为主，小程序工程已保留并可在后续继续补齐。

## 1. 项目定位

- 覆盖对象：核心美股指数 + S&P 11 行业映射（共 17 个监测对象）
- 核心指标：`pe_ttm`、`pe_forward`、`pb`、`earnings_yield`、`erp_proxy`
- 统计衍生：历史百分位、Z-Score、估值状态分层
- 数据频率：交易日收盘后更新（本地/轻量云函数模式）

## 2. 当前完成度

- Web：已完成主站功能、交互与图表系统（深色机构风）
- 数据：已接入真实免费数据管线，并支持失败时历史快照回退
- API：提供统一接口，Web/小程序可共用
- 小程序：已具备工程结构与页面骨架，后续可继续迭代

> 说明：Web 端当前版本聚焦估值分析与展示，不包含提醒中心 UI。

## 3. 核心能力

- 首页指数卡片（核心指数优先 + 行业指数）
- 指数详情双图联动（估值主图 + 百分位副图）
- 滑块/轨道缩放，支持丝滑时间范围同步
- 多指数对比分析（默认：标普500、道指、纳指100）
- 本地化偏好设置（分组、对比区间、自选等）
- 图表线尾数值标注（同色、可读性优化）

## 4. 数据来源与方法

当前数据源采用“真实免费源优先、多源融合”：

- 价格序列：Stooq（ETF/指数代理）
- 美债10Y：FRED `DGS10`
- 估值补充：Trendonify / Multpl / StockAnalysis / 其他可用公开源

### 关于纳斯达克100 `forward PE`（互联网泡沫期）

已专门修正 2000-2002 区间的真实性问题：

- 引入 MacroMicro NDX forward PE 对应序列（`id=15115`）作为优先真源
- 在外部站点反爬/波动场景下，保留该关键阶段的可信保底序列
- 避免出现“与点位机械同步”的伪估值波形

## 5. 技术架构

```text
us-valuation-monitor/
├─ apps/
│  ├─ web/                # Web 页面（index.html / app.js / styles.css）
│  └─ miniprogram/        # 小程序工程骨架
├─ packages/
│  ├─ core/               # 共享 types、指标计算、统计逻辑
│  └─ data-pipeline/      # 抓取、清洗、标准化快照生成
├─ cloudfunctions/        # 轻量 API（Node http server）
├─ data/
│  ├─ standardized/       # 估值历史快照
│  └─ runtime/            # 运行时状态（watchlist/alerts 等）
├─ package.json
└─ tsconfig.json
```

## 6. 本地启动

在项目根目录执行：

```bash
cd "/Users/coattail/Documents/New project/us-valuation-monitor"
```

### 6.1 构建数据快照

```bash
npm run build:data
```

输出文件：

- `data/standardized/valuation-history.json`

### 6.2 启动 Web 预览

```bash
npm run start:web
```

浏览地址：

- `http://127.0.0.1:9030/apps/web/`

### 6.3 启动 API（可选）

```bash
npm run start:api
```

API 地址：

- `http://127.0.0.1:9040`

## 7. API 概览

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
- `POST /api/auth/wechat-login`（占位）

## 8. 测试

```bash
npm test
```

当前覆盖：

- 核心统计与规则逻辑
- API 关键集成链路

## 9. 后续建议

- 小程序端视觉与交互补齐（与 Web 风格统一）
- forward PE 数据源持续扩展与精度校准
- 数据更新任务、告警闭环与稳定性强化
