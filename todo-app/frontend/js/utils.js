// Small helpers: formatting, icons, toasts.
const Utils = {
  esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  },

  // 2026-10-16 -> 16/10/2026
  date(iso) {
    return iso ? iso.split("-").reverse().join("/") : "—";
  },

  // 2026-10-16 -> 16 October 2026
  longDate(iso) {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  },

  cap(text) {
    return text.charAt(0) + text.slice(1).toLowerCase();
  },

  icon(name) {
    return `<svg class="i" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  },

  pill(value) {
    return `<span class="pill ${value}">${Utils.cap(value)}</span>`;
  },

  toast(message, type = "success") {
    const box = document.getElementById("toasts");
    const el = document.createElement("div");
    el.className = "toast " + type;
    el.textContent = message;
    box.appendChild(el);
    setTimeout(() => el.classList.add("show"), 10);
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 300);
    }, type === "error" ? 5000 : 2500);
  },
};
