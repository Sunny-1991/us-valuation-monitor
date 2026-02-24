const { request } = require("../../utils/api");

function toPercent(value) {
  return `${(Number(value || 0) * 100).toFixed(1)}%`;
}

Page({
  data: {
    generatedAt: "",
    snapshotRows: [],
    heatmapRows: [],
    loading: true,
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      const [snapshot, heatmap] = await Promise.all([
        request("/api/snapshot"),
        request("/api/heatmap?group=all"),
      ]);

      const snapshotRows = (snapshot.rows || []).map((item) => ({
        ...item,
        percentileText: toPercent(item.percentile_full),
      }));
      const heatmapRows = (heatmap.rows || []).map((item) => ({
        ...item,
        percentileText: toPercent(item.percentile_full),
      }));

      this.setData({
        generatedAt: snapshot.generatedAt,
        snapshotRows,
        heatmapRows,
      });
    } catch (error) {
      wx.showToast({ title: "加载失败", icon: "none" });
      console.error(error);
    } finally {
      this.setData({ loading: false });
    }
  },

  openDetail(event) {
    const indexId = event.currentTarget.dataset.indexId;
    wx.navigateTo({
      url: `/pages/detail/detail?indexId=${indexId}`,
    });
  },
});
