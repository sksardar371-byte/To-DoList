class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const ApiConfig = {
  get() {
    try {
      return (localStorage.getItem("apiUrl") || "").trim() || API_URL;
    } catch (e) {
      return API_URL;
    }
  },

  set(url) {
    try {
      localStorage.setItem("apiUrl", url.trim());
    } catch (e) {
      // Ignore storage errors
    }
  },

  reset() {
    try {
      localStorage.removeItem("apiUrl");
    } catch (e) {
      // Ignore storage errors
    }
  },
};
