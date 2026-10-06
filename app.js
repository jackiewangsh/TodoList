const STORAGE_KEY = "todos";

const form = document.getElementById("add-form");
const input = document.getElementById("add-input");
const dueInput = document.getElementById("due-input");
const listEl = document.getElementById("todo-list");
const emptyTip = document.getElementById("empty-tip");
const totalCount = document.getElementById("total-count");
const pendingCount = document.getElementById("pending-count");
const doneCount = document.getElementById("done-count");
const filterEl = document.getElementById("filter");
const sortBtn = document.getElementById("sort-btn");
const clearBtn = document.getElementById("clear-btn");
const exportBtn = document.getElementById("export-btn");

let todos = load();
let filter = "all";
let sortMode = 0;

const SORT_LABELS = ["排序：默认", "排序：截止升序", "排序：截止降序"];

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function formatTime(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatDue(value) {
  const [y, m, d] = value.split("-").map(Number);
  return `${y}年${m}月${d}日`;
}

function dueState(todo) {
  if (todo.done || !todo.due) return "";
  if (todo.due < today()) return "overdue";
  if (todo.due === today()) return "today";
  return "";
}

function visibleTodos() {
  let list = todos;
  if (filter === "pending") list = list.filter((t) => !t.done);
  if (filter === "done") list = list.filter((t) => t.done);
  if (sortMode === 0) return list;

  const withDue = list.filter((t) => t.due);
  const noDue = list.filter((t) => !t.due);

  withDue.sort((a, b) => {
    if (a.due !== b.due) {
      const r = a.due < b.due ? -1 : 1;
      return sortMode === 1 ? r : -r;
    }
    return a.createdAt - b.createdAt;
  });

  return [...withDue, ...noDue];
}

function setStatus(todo, done) {
  todo.done = done;
  todo.doneAt = done ? Date.now() : null;
  save();
  render();
}

function render() {
  listEl.innerHTML = "";

  visibleTodos().forEach((todo) => {
    const li = document.createElement("li");
    li.className = "item" + (todo.done ? " done" : "");

    const status = document.createElement("button");
    status.type = "button";
    status.className = "status-btn" + (todo.done ? " is-done" : "");
    status.textContent = todo.done ? "已完成" : "待完成";
    status.title = todo.done ? "点击标记为待完成" : "点击标记为已完成";
    status.addEventListener("click", () => setStatus(todo, !todo.done));

    const text = document.createElement("span");
    text.className = "item-text";
    text.textContent = todo.text;

    const time = document.createElement("span");
    time.className = "item-time";
    time.textContent = todo.done && todo.doneAt
      ? "完成 " + formatTime(todo.doneAt)
      : "创建 " + formatTime(todo.createdAt);

    const del = document.createElement("button");
    del.type = "button";
    del.className = "delete-btn";
    del.textContent = "\u00d7";
    del.title = "删除";
    del.addEventListener("click", () => {
      todos = todos.filter((t) => t.id !== todo.id);
      save();
      render();
    });

    if (todo.due) {
      const due = document.createElement("span");
      const state = dueState(todo);
      due.className = "item-due" + (state ? " " + state : "");
      due.textContent = "截止 " + formatDue(todo.due);
      if (state === "overdue") due.title = "已逾期";
      if (state === "today") due.title = "今天到期";
      li.append(status, text, time, due, del);
    } else {
      li.append(status, text, time, del);
    }

    listEl.appendChild(li);
  });

  const done = todos.filter((t) => t.done).length;
  totalCount.textContent = todos.length;
  pendingCount.textContent = todos.length - done;
  doneCount.textContent = done;
  emptyTip.hidden = todos.length > 0;
  emptyTip.textContent =
    filter === "all"
      ? "暂无待办事项，添加一条开始吧"
      : filter === "pending"
        ? "没有待完成的事项"
        : "还没有已完成的事项";
  clearBtn.hidden = done === 0;

  [...filterEl.children].forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === filter);
  });

  sortBtn.textContent = SORT_LABELS[sortMode];
  sortBtn.classList.toggle("active", sortMode !== 0);
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  todos.push({
    id: Date.now() + Math.random(),
    text,
    due: dueInput.value || null,
    done: false,
    createdAt: Date.now(),
  });

  input.value = "";
  dueInput.value = "";
  save();
  render();
  input.focus();
});

filterEl.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-filter]");
  if (!btn) return;
  filter = btn.dataset.filter;
  render();
});

function buildExportText() {
  const done = todos.filter((t) => t.done).length;
  const lines = [
    "待办事项导出",
    "导出时间：" + formatTime(Date.now()),
    `共 ${todos.length} 项，待完成 ${todos.length - done} 项，已完成 ${done} 项`,
    "".padEnd(40, "-"),
    "",
  ];

  if (!todos.length) {
    lines.push("（暂无待办事项）", "");
  }

  todos.forEach((todo, index) => {
    lines.push(`${index + 1}. [${todo.done ? "已完成" : "待完成"}] ${todo.text}`);
    lines.push(`   创建：${formatTime(todo.createdAt)}`);
    if (todo.due) lines.push(`   截止：${formatDue(todo.due)}`);
    if (todo.done && todo.doneAt) lines.push(`   完成：${formatTime(todo.doneAt)}`);
    lines.push("");
  });

  return lines.join("\r\n");
}

function exportTxt() {
  const blob = new Blob(["\ufeff" + buildExportText()], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const stamp =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  const link = document.createElement("a");
  link.href = url;
  link.download = `待办事项_${stamp}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

exportBtn.addEventListener("click", exportTxt);

sortBtn.addEventListener("click", () => {
  sortMode = (sortMode + 1) % 3;
  render();
});

clearBtn.addEventListener("click", () => {
  todos = todos.filter((t) => !t.done);
  save();
  render();
});

render();
