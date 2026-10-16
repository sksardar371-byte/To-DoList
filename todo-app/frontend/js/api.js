// All communication with the Spring Boot REST API lives here.
class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// Backend URL: value saved from Settings, otherwise the default from config.js
const ApiConfig = {
  get() {
    try { return (localStorage.getItem("apiUrl") || "").trim() || API_URL; } catch (e) { return API_URL; }
  },
  set(url) {
    try { localStorage.setItem("apiUrl", url.trim()); } catch (e) { /* ignore */ }
  },
  reset() {
    try { localStorage.removeItem("apiUrl"); } catch (e) { /* ignore */ }
  },
};

const TaskApi = (() => {
  async function request(path = "", method = "GET", body) {
    let response;
    try {
      response = await fetch(ApiConfig.get() + path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      throw new ApiError("Cannot reach the server. Make sure the backend is running.", 0);
    }

    if (response.status === 204) return null;

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new ApiError((data && data.message) || `Request failed (${response.status})`, response.status);
    }
    return data;
  }

  return {
    list(params = {}) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => v && query.set(k, v));
      const qs = query.toString();
      return request(qs ? "?" + qs : "");
    },
    get: (id) => request("/" + id),
    create: (task) => request("", "POST", task),
    update: (id, task) => request("/" + id, "PUT", task),
    setStatus: (id, status) => request(`/${id}/status`, "PATCH", { status }),
    remove: (id) => request("/" + id, "DELETE"),
  };
})();
