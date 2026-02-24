const { request } = require("../../utils/api");

function formatPercent(value) {
  return `${(Number(value || 0) * 100).toFixed(1)}%`;
}

Page({
  data: {
    unreadCount: 0,
    rows: [],
  },

  onShow() {
    this.loadAlerts();
  },

  async loadAlerts() {
    try {
      const payload = await request("/api/alerts");
      const rows = (payload.rows || []).map((item) => ({
        ...item,
        percentileText: formatPercent(item.percentile),
        directionText: item.direction === "high" ? "高估" : "低估",
      }));
      this.setData({
        unreadCount: payload.unreadCount,
        rows,
      });
    } catch (error) {
      wx.showToast({ title: "加载失败", icon: "none" });
      console.error(error);
    }
  },

  async markAllRead() {
    try {
      await request("/api/alerts/ack", "POST", {});
      wx.showToast({ title: "已标记", icon: "success" });
      this.loadAlerts();
    } catch (error) {
      wx.showToast({ title: "操作失败", icon: "none" });
      console.error(error);
    }
  },
});
