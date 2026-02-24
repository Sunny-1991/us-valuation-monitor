const { request } = require("../../utils/api");

function markChecked(allIndices, selectedIds) {
  const selected = new Set(selectedIds || []);
  return (allIndices || []).map((item) => ({
    ...item,
    checked: selected.has(item.id),
  }));
}

Page({
  data: {
    upper: 85,
    lower: 15,
    cooldownTradingDays: 5,
    allIndices: [],
    selectedIds: [],
  },

  onShow() {
    this.loadConfig();
  },

  async loadConfig() {
    try {
      const [meta, watchlist] = await Promise.all([request("/api/meta"), request("/api/watchlist")]);
      this.setData({
        allIndices: markChecked(meta.indices, watchlist.watchIndexIds),
        selectedIds: watchlist.watchIndexIds,
        upper: watchlist.alertRule.upper,
        lower: watchlist.alertRule.lower,
        cooldownTradingDays: watchlist.alertRule.cooldownTradingDays,
      });
    } catch (error) {
      wx.showToast({ title: "加载失败", icon: "none" });
      console.error(error);
    }
  },

  onUpperChange(event) {
    this.setData({ upper: Number(event.detail.value) });
  },

  onLowerChange(event) {
    this.setData({ lower: Number(event.detail.value) });
  },

  onCooldownInput(event) {
    this.setData({ cooldownTradingDays: Number(event.detail.value) || 1 });
  },

  onWatchlistChange(event) {
    const selectedIds = event.detail.value;
    this.setData({
      selectedIds,
      allIndices: markChecked(this.data.allIndices, selectedIds),
    });
  },

  async saveConfig() {
    try {
      await request("/api/watchlist", "POST", {
        watchIndexIds: this.data.selectedIds,
        alertRule: {
          upper: this.data.upper,
          lower: this.data.lower,
          cooldownTradingDays: this.data.cooldownTradingDays,
        },
      });
      wx.showToast({ title: "保存成功", icon: "success" });
    } catch (error) {
      wx.showToast({ title: "保存失败", icon: "none" });
      console.error(error);
    }
  },
});
