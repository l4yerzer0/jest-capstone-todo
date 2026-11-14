// ============================================================
// Модуль todo — капстоун курса Jest.
// ============================================================

// ГОТОВО (образец). Возвращает новую активную задачу.
// Бросает ошибку "Название задачи обязательно" на пустом названии.
export function createTask(title) {
  if (!title) {
    throw new Error("Название задачи обязательно");
  }
  return { title, done: false };
}

// Возвращает КОПИЮ задачи с инвертированным done (исходную не меняет).
export function toggleTask(task) {
  return { ...task, done: !task.done };
}

// Возвращает НОВЫЙ массив с добавленной задачей (использует createTask).
export function addTask(tasks, title) {
  const task = createTask(title);
  return [...tasks, task];
}

// Возвращает НОВЫЙ массив без задачи с этим названием.
export function removeTask(tasks, title) {
  return tasks.filter((task) => task.title !== title);
}

// Возвращает задачу с этим названием или undefined.
export function findTask(tasks, title) {
  return tasks.find((task) => task.title === title);
}

// Возвращает число невыполненных задач.
export function countActive(tasks) {
  return tasks.filter((task) => !task.done).length;
}

// Возвращает объект { total, active, done, titles }.
export function summarizeTasks(tasks) {
  const active = countActive(tasks);
  return {
    total: tasks.length,
    active,
    done: tasks.length - active,
    titles: tasks.map((task) => task.title),
  };
}

// Асинхронная: берёт api.fetchTitles() -> массив названий,
// возвращает массив задач. Ошибку сети пробрасывает.
export async function loadTasks(api) {
  const titles = await api.fetchTitles();
  return titles.map((title) => createTask(title));
}

// Планирует storage.save(tasks) через delay мс (по умолчанию 1000).
// Возвращает id таймера.
export function scheduleAutosave(storage, tasks, delay = 1000) {
  return setTimeout(() => {
    storage.save(tasks);
  }, delay);
}
