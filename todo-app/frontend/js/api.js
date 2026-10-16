class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
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
      throw new ApiError("Cannot reach the server.", 0);
    }

    if (response.status === 204) return null;

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new ApiError(
        (data && data.message) || `Request failed (${response.status})`,
        response.status
      );
    }

    return data;
  }

  return {
    list(params = {}) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v) query.set(k, v);
      });

      const qs = query.toString();
      return request(qs ? "?" + qs : "");
    },

    get: (id) => request("/" + id),
    create: (task) => request("", "POST", task),
    update: (id, task) => request("/" + id, "PUT", task),
    setStatus: (id, status) =>
      request(`/${id}/status`, "PATCH", { status }),
    remove: (id) => request("/" + id, "DELETE"),
  };
})();
