const API_URL = "https://to-dolist-2.onrender.com/api/tasks";

const ApiConfig = (() => {
  const STORAGE_KEY = "todo-api-url";

  return {
    get() {
      return localStorage.getItem(STORAGE_KEY) || API_URL;
    },
    set(url) {
      localStorage.setItem(STORAGE_KEY, url.trim().replace(/\/+$/, ""));
    },
    reset() {
      localStorage.removeItem(STORAGE_KEY);
    },
  };
})();
