import {
  createTask,
  toggleTask,
  addTask,
  removeTask,
  findTask,
  countActive,
  summarizeTasks,
  loadTasks,
  scheduleAutosave,
} from "./todo";

describe("createTask", () => {
  test("создаёт активную задачу", () => {
    expect(createTask("Хлеб")).toEqual({ title: "Хлеб", done: false });
  });

  test.each([[""], [null], [undefined]])(
    "бросает ошибку на входе %p",
    (bad) => {
      expect(() => createTask(bad)).toThrow("Название задачи обязательно");
    }
  );
});

describe("toggleTask", () => {
  test("инвертирует статус done у задачи", () => {
    const task = { title: "Купить молоко", done: false };
    expect(toggleTask(task)).toEqual({ title: "Купить молоко", done: true });

    const doneTask = { title: "Купить молоко", done: true };
    expect(toggleTask(doneTask)).toEqual({ title: "Купить молоко", done: false });
  });

  test("не мутирует исходную задачу (иммутабельность)", () => {
    const original = Object.freeze({ title: "Выучить Jest", done: false });
    const toggled = toggleTask(original);

    expect(toggled).toEqual({ title: "Выучить Jest", done: true });
    expect(original.done).toBe(false);
    expect(toggled).not.toBe(original);
  });
});

describe("addTask", () => {
  test("добавляет новую задачу в конец списка", () => {
    const initialTasks = [{ title: "Задача 1", done: false }];
    const result = addTask(initialTasks, "Задача 2");

    expect(result).toEqual([
      { title: "Задача 1", done: false },
      { title: "Задача 2", done: false },
    ]);
  });

  test("не мутирует исходный массив (иммутабельность)", () => {
    const initialTasks = Object.freeze([
      Object.freeze({ title: "Задача 1", done: false }),
    ]);
    const result = addTask(initialTasks, "Задача 2");

    expect(initialTasks).toHaveLength(1);
    expect(result).not.toBe(initialTasks);
  });

  test("бросает ошибку при пустом названии задачи", () => {
    const tasks = [];
    expect(() => addTask(tasks, "")).toThrow("Название задачи обязательно");
  });
});

describe("removeTask", () => {
  test("удаляет задачу с указанным названием", () => {
    const tasks = [
      { title: "Купить хлеб", done: false },
      { title: "Купить сыр", done: true },
    ];
    const result = removeTask(tasks, "Купить хлеб");

    expect(result).toEqual([{ title: "Купить сыр", done: true }]);
  });

  test("возвращает новый массив без изменений, если задача не найдена", () => {
    const tasks = [{ title: "Купить хлеб", done: false }];
    const result = removeTask(tasks, "Купить молоко");

    expect(result).toEqual([{ title: "Купить хлеб", done: false }]);
  });

  test("не мутирует исходный массив (иммутабельность)", () => {
    const tasks = Object.freeze([
      Object.freeze({ title: "Купить хлеб", done: false }),
      Object.freeze({ title: "Купить сыр", done: false }),
    ]);
    const result = removeTask(tasks, "Купить хлеб");

    expect(tasks).toHaveLength(2);
    expect(result).not.toBe(tasks);
  });
});

describe("findTask", () => {
  const tasks = [
    { title: "Купить хлеб", done: false },
    { title: "Купить масло", done: true },
  ];

  test("находит существующую задачу по названию", () => {
    const found = findTask(tasks, "Купить масло");
    expect(found).toBeDefined();
    expect(found).toEqual({ title: "Купить масло", done: true });
  });

  test("возвращает undefined, если задача не найдена", () => {
    const notFound = findTask(tasks, "Купить колбасу");
    expect(notFound).toBeUndefined();
  });
});

describe("countActive", () => {
  test("возвращает 0 для пустого списка", () => {
    expect(countActive([])).toBe(0);
  });

  test("корректно считает число невыполненных задач в смешанном списке", () => {
    const tasks = [
      { title: "Задача 1", done: false },
      { title: "Задача 2", done: true },
      { title: "Задача 3", done: false },
    ];
    expect(countActive(tasks)).toBe(2);
  });

  test("возвращает 0, если все задачи выполнены", () => {
    const tasks = [
      { title: "Задача 1", done: true },
      { title: "Задача 2", done: true },
    ];
    expect(countActive(tasks)).toBe(0);
  });
});

describe("summarizeTasks", () => {
  test("формирует сводку по списку задач и соответствует снимку", () => {
    const tasks = [
      { title: "Купить продукты", done: true },
      { title: "Сделать уборку", done: false },
      { title: "Позвонить маме", done: false },
    ];
    const summary = summarizeTasks(tasks);

    expect(summary).toMatchSnapshot();
  });

  test("формирует корректную сводку для пустого списка задач", () => {
    const summary = summarizeTasks([]);

    expect(summary).toMatchSnapshot();
  });
});

describe("loadTasks", () => {
  test("успешно загружает задачи через api и возвращает массив задач", async () => {
    const mockApi = {
      fetchTitles: jest.fn().mockResolvedValue(["Задача 1", "Задача 2"]),
    };

    const tasks = await loadTasks(mockApi);

    expect(mockApi.fetchTitles).toHaveBeenCalledTimes(1);
    expect(tasks).toEqual([
      { title: "Задача 1", done: false },
      { title: "Задача 2", done: false },
    ]);
  });

  test("пробрасывает ошибку сети, если api.fetchTitles завершается с ошибкой", async () => {
    const mockApi = {
      fetchTitles: jest.fn().mockRejectedValue(new Error("Ошибка сети")),
    };

    await expect(loadTasks(mockApi)).rejects.toThrow("Ошибка сети");
    expect(mockApi.fetchTitles).toHaveBeenCalledTimes(1);
  });
});

describe("scheduleAutosave", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("планирует сохранение через кастомную задержку delay", () => {
    const mockStorage = {
      save: jest.fn(),
    };
    const tasks = [{ title: "Задача 1", done: false }];
    const delay = 500;

    const timerId = scheduleAutosave(mockStorage, tasks, delay);

    expect(timerId).toBeDefined();
    expect(mockStorage.save).not.toHaveBeenCalled();

    jest.advanceTimersByTime(delay - 1);
    expect(mockStorage.save).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(mockStorage.save).toHaveBeenCalledTimes(1);
    expect(mockStorage.save).toHaveBeenCalledWith(tasks);
  });

  test("использует задержку по умолчанию 1000 мс", () => {
    const mockStorage = {
      save: jest.fn(),
    };
    const tasks = [{ title: "Задача 1", done: false }];

    scheduleAutosave(mockStorage, tasks);

    expect(mockStorage.save).not.toHaveBeenCalled();

    jest.advanceTimersByTime(999);
    expect(mockStorage.save).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(mockStorage.save).toHaveBeenCalledTimes(1);
    expect(mockStorage.save).toHaveBeenCalledWith(tasks);
  });
});
