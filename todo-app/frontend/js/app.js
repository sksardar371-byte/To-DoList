// Page logic: state, rendering and event handling.
(() => {
  const $ = (id) => document.getElementById(id);

  const state = {
    tab: "ALL",          // ALL | PENDING | COMPLETED | OVERDUE
    search: "",
    priority: "",
    dueDate: "",
    tasks: [],
    page: 1,
    rows: 10,
    loading: false,
    error: null,
    editingId: null,
    menuTaskId: null,
  };

  let requestCounter = 0;   // ignore out-of-date responses

  /* ------------------------------------------------------------------ load */
  async function loadTasks() {
    const myRequest = ++requestCounter;
    state.loading = true;
    state.error = null;
    render();

    try {
      const params = { search: state.search };
      if (state.tab === "PENDING" || state.tab === "COMPLETED") params.status = state.tab;

      let list = await TaskApi.list(params);
      if (state.tab === "OVERDUE") list = list.filter((t) => t.overdue);
      if (state.priority) list = list.filter((t) => t.priority === state.priority);
      if (state.dueDate) list = list.filter((t) => t.deadline === state.dueDate);

      if (myRequest !== requestCounter) return;
      state.tasks = list;
    } catch (e) {
      if (myRequest !== requestCounter) return;
      state.tasks = [];
      state.error = e.message;
    }
    state.loading = false;
    render();
    refreshBell();
  }

  // red badge on the bell = number of overdue tasks
  async function refreshBell() {
    try {
      const pending = await TaskApi.list({ status: "PENDING" });
      const count = pending.filter((t) => t.overdue).length;
      $("bellCount").textContent = count;
      $("bellCount").classList.toggle("hidden", count === 0);
    } catch (e) { /* ignore */ }
  }

  /* ---------------------------------------------------------------- render */
  function render() {
    const total = state.tasks.length;
    const maxPage = Math.max(1, Math.ceil(total / state.rows));
    if (state.page > maxPage) state.page = maxPage;
    const start = (state.page - 1) * state.rows;
    const visible = state.tasks.slice(start, start + state.rows);

    const body = $("rows");
    if (state.loading) {
      body.innerHTML = `<tr class="state-row"><td colspan="7"><div class="spinner"></div>Loading tasks...</td></tr>`;
    } else if (state.error) {
      body.innerHTML = `<tr class="state-row"><td colspan="7">
        <div class="state-icon error">${Utils.icon("alert")}</div>
        <p>${Utils.esc(state.error)}</p>
        <button class="btn btn-accent" id="retryBtn">Try again</button></td></tr>`;
      $("retryBtn").onclick = loadTasks;
    } else if (!visible.length) {
      body.innerHTML = `<tr class="state-row"><td colspan="7">
        <div class="state-icon">${Utils.icon("list")}</div>
        <p>No tasks found</p><small>Click “Create New Task” to add one.</small></td></tr>`;
    } else {
      body.innerHTML = visible.map(rowHtml).join("");
    }

    $("range").textContent = total && !state.loading ? `${start + 1}-${Math.min(start + state.rows, total)} of ${total}` : "0-0 of 0";
    $("prev").disabled = state.page <= 1;
    $("next").disabled = start + state.rows >= total;
  }

  const actBtn = (action, cls, icon, label) =>
    `<button class="act ${cls}" data-action="${action}" title="${label}" aria-label="${label}">${Utils.icon(icon)}</button>`;

  function rowHtml(t) {
    const done = t.status === "COMPLETED";
    // like the design: completed tasks are read-only (download + view), others get edit + delete
    const actions = done
      ? actBtn("download", "blue", "filedown", "Download") + actBtn("view", "gray", "eye", "View details")
      : actBtn("download", "blue", "filedown", "Download") + actBtn("edit", "purple", "edit", "Edit") + actBtn("delete", "pink", "trash", "Delete");

    return `
    <tr data-id="${t.id}">
      <td data-label="Title" class="cell-title">
        <span class="t-name">${Utils.esc(t.title)}</span>
        ${t.description ? `<small title="${Utils.esc(t.description)}">${Utils.esc(t.description)}</small>` : ""}
      </td>
      <td data-label="Priority">${Utils.pill(t.priority)}</td>
      <td data-label="Status">${Utils.pill(t.status)}</td>
      <td data-label="Created by">${Utils.esc(t.createdBy || "Me")}</td>
      <td data-label="Date Assigned">${Utils.date(t.createdDate)}</td>
      <td data-label="Due Date" class="${t.overdue ? "late" : ""}">${Utils.date(t.deadline)}${t.overdue ? '<span class="chip-late">Overdue</span>' : ""}</td>
      <td class="cell-actions"><div class="actions">${actions}${actBtn("menu", "more", "more", "More options")}</div></td>
    </tr>`;
  }

  /* --------------------------------------------------------- task actions */
  const findTask = (id) => state.tasks.find((t) => t.id === Number(id));

  async function toggleTask(task) {
    const done = task.status === "COMPLETED";
    await TaskApi.setStatus(task.id, done ? "PENDING" : "COMPLETED");
    Utils.toast(done ? "Marked as pending" : "Task completed 🎉");
    loadTasks();
  }

  async function deleteTask(task) {
    if (!(await confirmDelete(task))) return;
    await TaskApi.remove(task.id);
    Utils.toast("Task deleted");
    loadTasks();
  }

  async function duplicateTask(task) {
    await TaskApi.create({
      title: task.title + " (copy)",
      description: task.description,
      deadline: task.deadline,
      priority: task.priority,
      status: "PENDING",
      createdBy: task.createdBy,
    });
    Utils.toast("Task duplicated");
    loadTasks();
  }

  function downloadTask(t) {
    const text = [
      `Title: ${t.title}`,
      `Description: ${t.description || "-"}`,
      `Priority: ${Utils.cap(t.priority)}`,
      `Status: ${Utils.cap(t.status)}`,
      `Created by: ${t.createdBy || "Me"}`,
      `Date assigned: ${Utils.date(t.createdDate)}`,
      `Due date: ${Utils.date(t.deadline)}`,
    ].join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    link.download = `task-${t.id}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  $("rows").addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const task = findTask(btn.closest("tr").dataset.id);
    try {
      switch (btn.dataset.action) {
        case "download": downloadTask(task); break;
        case "view": openDetails(task); break;
        case "edit": openTaskDialog(task); break;
        case "delete": await deleteTask(task); break;
        case "menu": openRowMenu(btn, task); break;
      }
    } catch (err) {
      Utils.toast(err.message, "error");
    }
  });

  /* ------------------------------------------------------------- row menu */
  const menu = $("rowMenu");

  function openRowMenu(button, task) {
    state.menuTaskId = task.id;
    const done = task.status === "COMPLETED";
    menu.innerHTML = `
      <button role="menuitem" data-menu="view">${Utils.icon("eye")} View details</button>
      <button role="menuitem" data-menu="toggle">${Utils.icon(done ? "undo" : "check")} Mark as ${done ? "pending" : "completed"}</button>
      <button role="menuitem" data-menu="duplicate">${Utils.icon("copy")} Duplicate</button>
      <button role="menuitem" data-menu="delete" class="danger">${Utils.icon("trash")} Delete</button>`;
    menu.classList.remove("hidden");

    const r = button.getBoundingClientRect();
    let top = r.bottom + 6;
    if (top + menu.offsetHeight > window.innerHeight - 8) top = r.top - menu.offsetHeight - 6;
    menu.style.top = Math.max(8, top) + "px";
    menu.style.left = Math.max(8, r.right - menu.offsetWidth) + "px";
  }

  const closeMenu = () => menu.classList.add("hidden");
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#rowMenu") && !e.target.closest('[data-action="menu"]')) closeMenu();
  });
  window.addEventListener("scroll", closeMenu, true);
  window.addEventListener("resize", closeMenu);

  menu.addEventListener("click", async (e) => {
    const item = e.target.closest("[data-menu]");
    if (!item) return;
    closeMenu();
    const task = findTask(state.menuTaskId);
    try {
      if (item.dataset.menu === "view") openDetails(task);
      if (item.dataset.menu === "toggle") await toggleTask(task);
      if (item.dataset.menu === "duplicate") await duplicateTask(task);
      if (item.dataset.menu === "delete") await deleteTask(task);
    } catch (err) {
      Utils.toast(err.message, "error");
    }
  });

  /* ---------------------------------------------------------- dialogs */
  function openDetails(t) {
    $("dTitle").textContent = t.title;
    $("dDescription").textContent = t.description || "No description";
    $("dPriority").innerHTML = Utils.pill(t.priority);
    $("dStatus").innerHTML = Utils.pill(t.status);
    $("dBy").textContent = t.createdBy || "Me";
    $("dCreated").textContent = Utils.date(t.createdDate);
    $("dDue").textContent = Utils.date(t.deadline) + (t.overdue ? " (overdue)" : "");
    $("detailsDialog").showModal();
  }
  $("dClose").onclick = () => $("detailsDialog").close();

  function confirmDelete(task) {
    return new Promise((resolve) => {
      const dlg = $("confirmDialog");
      $("confirmText").textContent = `“${task.title}” will be permanently deleted.`;
      const done = (answer) => { dlg.close(); resolve(answer); };
      $("confirmYes").onclick = () => done(true);
      $("confirmNo").onclick = () => done(false);
      dlg.oncancel = () => resolve(false);
      dlg.showModal();
    });
  }

  function openTaskDialog(task = null) {
    state.editingId = task ? task.id : null;
    $("taskDialogTitle").textContent = task ? "Edit Task" : "Create New Task";
    $("title").value = task ? task.title : "";
    $("description").value = task && task.description ? task.description : "";
    $("deadline").value = task && task.deadline ? task.deadline : "";
    $("priority").value = task ? task.priority : "MEDIUM";
    $("status").value = task ? task.status : "PENDING";
    $("createdBy").value = task && task.createdBy ? task.createdBy : "";
    setTitleError("");
    $("taskDialog").showModal();
    $("title").focus();
  }

  function setTitleError(message) {
    $("titleError").textContent = message;
    $("title").classList.toggle("invalid", !!message);
  }

  $("addBtn").onclick = () => openTaskDialog();
  $("cancelBtn").onclick = () => $("taskDialog").close();
  $("title").addEventListener("input", () => setTitleError(""));

  $("taskForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = $("title").value.trim();

    // input validation (the backend validates again)
    if (!title) {
      setTitleError("Title cannot be empty");
      $("title").focus();
      return;
    }

    const payload = {
      title,
      description: $("description").value.trim() || null,
      deadline: $("deadline").value || null,
      priority: $("priority").value,
      status: $("status").value,
      createdBy: $("createdBy").value.trim() || null,
    };

    $("saveBtn").disabled = true;
    try {
      if (state.editingId) {
        await TaskApi.update(state.editingId, payload);
        Utils.toast("Task updated");
      } else {
        await TaskApi.create(payload);
        Utils.toast("Task created");
      }
      $("taskDialog").close();
      loadTasks();
    } catch (err) {
      setTitleError(err.message);
    } finally {
      $("saveBtn").disabled = false;
    }
  });

  /* -------------------------------------------------- settings (API URL) */
  $("settingsBtn").onclick = () => {
    $("apiUrl").value = ApiConfig.get();
    $("settingsDialog").showModal();
  };
  $("settingsSave").onclick = () => {
    const url = $("apiUrl").value.trim();
    if (url) ApiConfig.set(url); else ApiConfig.reset();
    $("settingsDialog").close();
    Utils.toast("Settings saved");
    loadTasks();
  };
  $("settingsReset").onclick = () => {
    ApiConfig.reset();
    $("apiUrl").value = ApiConfig.get();
    Utils.toast("Using default URL");
    loadTasks();
  };

  /* ------------------------------------------------- tabs, filters, search */
  function setTab(tab) {
    state.tab = tab;
    state.page = 1;
    document.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
    loadTasks();
  }
  document.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => setTab(b.dataset.tab)));
  $("bellBtn").onclick = () => setTab("OVERDUE");

  // date field shows "29 July 2023" like the design
  function syncDateText() {
    const value = $("fDate").value;
    $("dateText").textContent = value ? Utils.longDate(value) : "Select due date";
    $("dateText").classList.toggle("placeholder", !value);
    $("dateClear").classList.toggle("hidden", !value);
  }
  $("dateBtn").onclick = () => {
    try { $("fDate").showPicker(); } catch (e) { $("fDate").focus(); }
  };
  $("fDate").addEventListener("change", syncDateText);
  $("dateClear").onclick = () => { $("fDate").value = ""; syncDateText(); };

  $("filterBtn").onclick = () => {
    state.priority = $("fPriority").value;
    state.dueDate = $("fDate").value;
    state.page = 1;
    loadTasks();
  };

  // expanding search (icon in the top bar)
  $("searchBtn").onclick = () => {
    const open = $("searchBox").classList.toggle("open");
    if (open) $("search").focus();
    else if ($("search").value) { $("search").value = ""; state.search = ""; state.page = 1; loadTasks(); }
  };

  let searchTimer;
  $("search").addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { state.search = e.target.value.trim(); state.page = 1; loadTasks(); }, 300);
  });

  /* ---------------------------------------------------------------- pager */
  $("rowsPer").onchange = (e) => { state.rows = Number(e.target.value); state.page = 1; render(); };
  $("prev").onclick = () => { state.page--; render(); };
  $("next").onclick = () => { state.page++; render(); };

  /* ------------------------------------------------------------ color theme */
  const LIGHT_THEMES = ["teal", "ocean", "sage", "graphite", "indigo", "clay"];
  const DARK_THEMES = ["midnight", "forest", "plum", "obsidian", "deepsea", "rose"];
  let colorTheme = "teal";
  let darkToggle = false;       // moon icon (dark version of a light theme)

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } },
  };

  function refreshDark() {
    document.body.classList.toggle("dark", darkToggle || DARK_THEMES.includes(colorTheme));
  }

  function applyTheme(name) {
    if (!LIGHT_THEMES.includes(name) && !DARK_THEMES.includes(name)) name = "teal";
    colorTheme = name;
    if (name === "teal") document.body.removeAttribute("data-theme");
    else document.body.setAttribute("data-theme", name);
    refreshDark();
    document.querySelectorAll(".swatch").forEach((b) => b.classList.toggle("active", b.dataset.theme === name));
  }

  document.querySelectorAll(".swatch").forEach((b) =>
    b.addEventListener("click", () => {
      const name = b.dataset.theme;
      if (LIGHT_THEMES.includes(name)) store.set("lightTheme", name);
      store.set("colorTheme", name);
      applyTheme(name);
    }));

  // moon icon: toggles dark mode; on a dark theme it goes back to your last light theme
  $("themeBtn").onclick = () => {
    if (DARK_THEMES.includes(colorTheme)) {
      darkToggle = false;
      const light = store.get("lightTheme") || "teal";
      store.set("colorTheme", light);
      applyTheme(light);
    } else {
      darkToggle = !darkToggle;
      store.set("theme", darkToggle ? "dark" : "light");
      refreshDark();
    }
  };

  darkToggle = store.get("theme") === "dark";
applyTheme(store.get("colorTheme") || "midnight");

  loadTasks();
})();
