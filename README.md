# US Valuation Monitor

[中文文档](./README.zh-CN.md) | [English Documentation](./README.en.md)

US Valuation Monitor is a US equity valuation monitoring platform with:
- a production-oriented Web client
- a lightweight API service
- a multi-source daily-refresh data pipeline

## Quick Start

```bash
git clone https://github.com/Sunny-1991/us-valuation-monitor.git
cd us-valuation-monitor
npm run build:data
npm run start:web
```

Open Web:
- `http://127.0.0.1:9030/apps/web/`

Start API (optional):

```bash
npm run start:api
```

API base URL:
- `http://127.0.0.1:9040`

## Full Documentation

- Chinese: [README.zh-CN.md](./README.zh-CN.md)
- English: [README.en.md](./README.en.md)
