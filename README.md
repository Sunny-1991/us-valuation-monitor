# US Valuation Monitor

[中文文档](./README.zh-CN.md) | [English Documentation](./README.en.md)

A professional US equity valuation monitoring toolkit built for **Web + WeChat Mini Program**.

- Web focuses on rich valuation visualization and interaction (the primary production-ready client now).
- Mini Program project scaffold is included and can be extended in the next phase.
- Data pipeline prioritizes free real-world sources and writes unified standardized snapshots.

## Quick Start

```bash
cd "/Users/coattail/Documents/New project/us-valuation-monitor"
npm run build:data
npm run start:web
```

Open: `http://127.0.0.1:9030/apps/web/`

Optional API server:

```bash
npm run start:api
```

API root: `http://127.0.0.1:9040`

For full setup, architecture, and data methodology, please read:

- [README.zh-CN.md](./README.zh-CN.md)
- [README.en.md](./README.en.md)
