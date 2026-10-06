const STORAGE_KEY = "todos";

const form = document.getElementById("add-form");
const input = document.getElementById("add-input");
const listEl = document.getElementById("todo-list");
const emptyTip = document.getElementById("empty-tip");
const totalCount = document.getElementById("total-count");
const pendingCount = document.getElementById("pending-count");
const clearBtn = document.getElementById("clear-btn");

let todos = load();

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

function render() {
  listEl.innerHTML = "";

  todos.forEach((todo) => {
    const li = document.createElement("li");
    li.className = "item" + (todo.done ? " done" : "");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "item-checkbox";
    checkbox.checked = todo.done;
    checkbox.addEventListener("change", () => {
      todo.done = checkbox.checked;
      save();
      render();
    });

    const text = document.createElement("span");
    text.className = "item-text";
    text.textContent = todo.text;

    const time = document.createElement("span");
    time.className = "item-time";
    time.textContent = formatTime(todo.createdAt);

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

    li.append(checkbox, text, time, del);
    listEl.appendChild(li);
  });

  totalCount.textContent = todos.length;
  pendingCount.textContent = todos.filter((t) => !t.done).length;
  emptyTip.hidden = todos.length > 0;
  clearBtn.hidden = !todos.some((t) => t.done);
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  todos.push({
    id: Date.now() + Math.random(),
    text,
    done: false,
    createdAt: Date.now(),
  });

  input.value = "";
  save();
  render();
  input.focus();
});

clearBtn.addEventListener("click", () => {
  todos = todos.filter((t) => !t.done);
  save();
  render();
});

render();
