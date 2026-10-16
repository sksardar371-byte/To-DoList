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
      throw new ApiError(
        "Cannot reach the server. Make sure the backend is running.",
        0
      );
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
      Object.entries(params).forEach(([k, v]) => v && query.set(k, v));
      const qs = query.toString();
      return request("/tasks" + (qs ? "?" + qs : ""));
    },

    get: (id) => request("/tasks/" + id),
    create: (task) => request("/tasks", "POST", task),
    update: (id, task) => request("/tasks/" + id, "PUT", task),
    setStatus: (id, status) =>
      request(`/tasks/${id}/status`, "PATCH", { status }),
    remove: (id) => request("/tasks/" + id, "DELETE"),
  };
})();
