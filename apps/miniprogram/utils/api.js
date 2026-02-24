const API_BASE = "http://127.0.0.1:9040";

function getToken() {
  return wx.getStorageSync("usvm-dev-token") || "";
}

function request(path, method = "GET", data = null) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE}${path}`,
      method,
      data,
      header: {
        "Content-Type": "application/json",
        "X-Dev-Token": getToken(),
      },
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      },
      fail(error) {
        reject(error);
      },
    });
  });
}

function devLogin(userId = "mini-user") {
  return request("/api/auth/dev-login", "POST", { userId });
}

module.exports = {
  request,
  devLogin,
};
