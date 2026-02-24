const { devLogin } = require("./utils/api");

App({
  globalData: {
    token: "",
    userId: "demo-user",
    theme: "fresh",
  },

  async onLaunch() {
    try {
      const login = await devLogin("mini-user");
      this.globalData.token = login.token;
      this.globalData.userId = login.userId;
      wx.setStorageSync("usvm-dev-token", login.token);
      wx.setStorageSync("usvm-user-id", login.userId);
    } catch (error) {
      console.error(error);
    }
  },
});
