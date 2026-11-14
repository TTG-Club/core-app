import type {
  ScreenAddOutcome,
  ScreenPoint,
  ScreenRect,
  ScreenSize,
  ScreenTile,
  ScreenWindow,
  ScreenWindowRequest,
} from '../model';

import { sortBy } from 'es-toolkit';

import {
  appendScreenWindow,
  arrangeScreenWindows,
  createScreenNotePath,
  DM_SCREEN_BOARD_INSET,
  DM_SCREEN_HIGHLIGHT_DURATION,
  DM_SCREEN_ICONS,
  DM_SCREEN_KEEPALIVE_MAX_BYTES,
  DM_SCREEN_SAVE_DELAY,
  DM_SCREEN_STORAGE_KEY,
  DM_SCREEN_TEXT,
  DM_SCREEN_WINDOW_LIMIT,
  getScreenErrorMessage,
  getScreenTopLayer,
  isScreenNotePath,
  saveScreen,
  screenWindowListSchema,
} from '../model';

/** Изменяемые поля окна. */
type ScreenWindowPatch = Partial<Omit<ScreenWindow, 'id'>>;

/**
 * Читает окна, сохранённые в браузере; чужой формат или битый JSON —
 * пустая ширма.
 * @param storedText - строка из localStorage
 */
function readStoredWindows(storedText: string): Array<ScreenWindow> {
  try {
    const storedWindows = screenWindowListSchema.safeParse(
      JSON.parse(storedText),
    );

    return storedWindows.success ? storedWindows.data : [];
  } catch {
    return [];
  }
}

/**
 * Помещается ли запрос с окнами в тот, что браузер отправит при закрытии
 * страницы.
 * @param windows - окна ширмы
 */
function fitsKeepalive(windows: ReadonlyArray<ScreenWindow>): boolean {
  return (
    new Blob([JSON.stringify({ windows })]).size
    <= DM_SCREEN_KEEPALIVE_MAX_BYTES
  );
}

/**
 * Ширма Мастера: записи сайта и заметки, разложенные окнами. Окна лежат в
 * одном из двух мест: у гостя — в браузере, у пользователя — на сервере.
 * Серверную ширму подключает страница ширмы (`connect`); её изменения
 * уходят на сервер с паузой, а при уходе со страницы — сразу.
 *
 * Побочные действия: пишет окна в localStorage или на сервер, а о сбое
 * сохранения и о пределе окон сообщает уведомлением.
 *
 * Состояние живёт, пока есть хоть один потребитель: окна гостя и так
 * хранит браузер, а серверные перечитываются при следующем открытии.
 */
export const useDmScreen = createSharedComposable(() => {
  const toast = useToast();

  const localWindows = useLocalStorage<Array<ScreenWindow>>(
    DM_SCREEN_STORAGE_KEY,
    [],
    {
      // Окна меняются только заменой списка целиком
      shallow: true,
      serializer: {
        read: readStoredWindows,
        write: (storedWindows) => JSON.stringify(storedWindows),
      },
    },
  );

  /** Ширма с сервера подключена: окна читаются и пишутся в неё. */
  const isAccount = ref(false);

  const accountWindows = shallowRef<Array<ScreenWindow>>([]);

  /** Есть изменения, ещё не ушедшие на сервер. */
  let isDirty = false;

  /**
   * Отправляет окна на сервер, если они менялись.
   * @param options - настройки сохранения
   * @param options.isLeaving - страницу закрывают или прячут: запрос должен
   * пережить её, если помещается в предел браузера
   */
  async function flush(options: { isLeaving?: boolean } = {}): Promise<void> {
    if (!isAccount.value || !isDirty) {
      return;
    }

    const windows = accountWindows.value;

    isDirty = false;

    try {
      await saveScreen(windows, {
        keepalive: options.isLeaving === true && fitsKeepalive(windows),
      });
    } catch (error) {
      // Изменения остались только здесь: следующая правка отправит их снова
      isDirty = true;

      toast.add({
        title: DM_SCREEN_TEXT.saveFailed,
        description: getScreenErrorMessage(error),
        color: 'error',
        icon: DM_SCREEN_ICONS.error,
      });
    }
  }

  const flushLater = useDebounceFn(() => flush(), DM_SCREEN_SAVE_DELAY);

  const windows = computed<Array<ScreenWindow>>({
    get: () => (isAccount.value ? accountWindows.value : localWindows.value),
    set: (nextWindows) => {
      if (!isAccount.value) {
        localWindows.value = nextWindows;

        return;
      }

      accountWindows.value = nextWindows;
      isDirty = true;
      void flushLater();
    },
  });

  /**
   * Подключает ширму с сервера: дальше окна читаются и пишутся в неё.
   * @param initial - окна ширмы с сервера
   */
  function connect(initial: ReadonlyArray<ScreenWindow>): void {
    accountWindows.value = [...initial];
    isDirty = false;
    isAccount.value = true;
  }

  /** Отключает ширму с сервера, досохранив изменения. */
  function disconnect(): void {
    void flush();

    isAccount.value = false;
    accountWindows.value = [];
  }

  /** Убирает гостевую ширму из браузера: её перенесли в аккаунт. */
  function clearLocal(): void {
    localWindows.value = [];
  }

  const { width: viewportWidth, height: viewportHeight } = useWindowSize();

  /** Размер холста, который сообщила страница ширмы. */
  const measuredBoard = shallowRef<ScreenSize>();

  /** Левый верхний угол холста в окне браузера. */
  const boardOrigin = shallowRef<ScreenPoint>({ x: 0, y: 0 });

  /**
   * Размер холста. Пока ширма не открыта (запись кладут с другой
   * страницы), он оценивается по окну браузера.
   */
  const board = computed<ScreenSize>(
    () =>
      measuredBoard.value ?? {
        width: viewportWidth.value - DM_SCREEN_BOARD_INSET.width,
        height: viewportHeight.value - DM_SCREEN_BOARD_INSET.height,
      },
  );

  /**
   * Запоминает место и размер холста; без значений — холста больше нет.
   * @param rect - прямоугольник холста в окне браузера
   */
  function setBoard(rect?: ScreenRect): void {
    measuredBoard.value = rect
      ? { width: rect.width, height: rect.height }
      : undefined;

    boardOrigin.value = rect ? { x: rect.x, y: rect.y } : { x: 0, y: 0 };
  }

  /**
   * Точка холста по точке в окне браузера.
   * @param client - координаты указателя в окне браузера
   */
  function toBoardPoint(client: ScreenPoint): ScreenPoint {
    return {
      x: client.x - boardOrigin.value.x,
      y: client.y - boardOrigin.value.y,
    };
  }

  /** Окно, на которое указали вместо создания нового: недолго подсвечено. */
  const highlightedId = refAutoReset<string | undefined>(
    undefined,
    DM_SCREEN_HIGHLIGHT_DURATION,
  );

  const visibleWindows = computed(() =>
    windows.value.filter((screenWindow) => !screenWindow.isMinimized),
  );

  const minimizedWindows = computed(() =>
    windows.value.filter((screenWindow) => screenWindow.isMinimized),
  );

  /**
   * Меняет поля окна.
   * @param id - окно
   * @param patch - новые значения полей
   */
  function update(id: string, patch: ScreenWindowPatch): void {
    windows.value = windows.value.map((screenWindow) =>
      screenWindow.id === id ? { ...screenWindow, ...patch } : screenWindow,
    );
  }

  /**
   * Записывает место и размер нескольких окон одним изменением ширмы.
   * @param tiles - окна с новым местом и размером
   * @param patch - что ещё поменять у этих окон
   */
  function updateRects(
    tiles: ReadonlyArray<ScreenTile>,
    patch: ScreenWindowPatch = {},
  ): void {
    const rects = new Map(tiles.map((tile) => [tile.id, tile]));

    windows.value = windows.value.map((screenWindow) => {
      const rect = rects.get(screenWindow.id);

      return rect
        ? {
            ...screenWindow,
            ...patch,
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          }
        : screenWindow;
    });
  }

  /**
   * Место и размер окон, пока их меняют за общую границу: окна показывают
   * их сразу, а в ширму они пишутся один раз, когда границу отпускают.
   */
  const previewRects = shallowRef<ReadonlyMap<string, ScreenRect>>(new Map());

  /**
   * Показывает окна на новых местах, не записывая их; без окон — убирает
   * предпросмотр.
   * @param tiles - окна с новым местом и размером
   */
  function setPreviewRects(tiles: ReadonlyArray<ScreenTile> = []): void {
    previewRects.value = new Map(tiles.map((tile) => [tile.id, tile]));
  }

  /**
   * Поднимает окно над остальными.
   * @param id - окно
   */
  function focus(id: string): void {
    const target = windows.value.find((screenWindow) => screenWindow.id === id);
    const topLayer = getScreenTopLayer(windows.value);

    // Окно уже сверху: лишняя запись ширмы не нужна
    if (!target || target.layer === topLayer) {
      return;
    }

    update(id, { layer: topLayer + 1 });
  }

  /**
   * Кладёт запись или заметку окном на ширму. То, что на ширме уже есть,
   * не дублируется: окно разворачивается, встаёт сверху и подсвечивается.
   * @param request - запись, её название и точка клика на холсте
   * @returns чем кончилась просьба
   */
  function add(request: ScreenWindowRequest): ScreenAddOutcome {
    const appended = appendScreenWindow(
      windows.value,
      request,
      board.value,
      crypto.randomUUID(),
    );

    if (appended.isAdded && appended.windows.length > DM_SCREEN_WINDOW_LIMIT) {
      toast.add({
        title: DM_SCREEN_TEXT.limitReached,
        color: 'warning',
        icon: DM_SCREEN_ICONS.error,
      });

      return 'rejected';
    }

    windows.value = appended.windows;

    if (!appended.isAdded) {
      highlightedId.value = appended.windowId;
    }

    return appended.isAdded ? 'added' : 'existing';
  }

  /**
   * Кладёт на ширму пустую заметку. Если пустая заметка уже есть, новая не
   * создаётся — иначе пустые заметки копились бы: та разворачивается,
   * встаёт сверху и подсвечивается.
   * @param origin - точка клика на холсте
   */
  function addNote(origin?: ScreenPoint): void {
    const draft = windows.value.find(
      (screenWindow) =>
        isScreenNotePath(screenWindow.path) && !screenWindow.content?.trim(),
    );

    add({
      path: draft?.path ?? createScreenNotePath(crypto.randomUUID()),
      title: draft?.title ?? DM_SCREEN_TEXT.noteTitle,
      origin,
    });
  }

  /**
   * Открывает в окне другую запись, например подкласс вместо класса.
   * @param id - окно
   * @param path - адрес записи
   */
  function navigate(id: string, path: string): void {
    update(id, { path });
  }

  /**
   * Убирает окно с ширмы.
   * @param id - окно
   */
  function close(id: string): void {
    windows.value = windows.value.filter(
      (screenWindow) => screenWindow.id !== id,
    );
  }

  /** Убирает с ширмы все окна и заметки. */
  function clear(): void {
    windows.value = [];
  }

  /**
   * Сворачивает окно в плашку внизу холста.
   * @param id - окно
   */
  function minimize(id: string): void {
    update(id, { isMinimized: true });
  }

  /** Сворачивает все окна: холст освобождается целиком. */
  function minimizeAll(): void {
    windows.value = windows.value.map((screenWindow) => ({
      ...screenWindow,
      isMinimized: true,
    }));
  }

  /** Разворачивает все свёрнутые окна на их прежних местах. */
  function restoreAll(): void {
    windows.value = windows.value.map((screenWindow) => ({
      ...screenWindow,
      isMinimized: false,
    }));
  }

  /**
   * Разворачивает свёрнутое окно поверх остальных.
   * @param id - окно
   */
  function restore(id: string): void {
    update(id, {
      isMinimized: false,
      layer: getScreenTopLayer(windows.value) + 1,
    });
  }

  /**
   * Раскладывает все окна ровной сеткой, свёрнутые тоже разворачиваются.
   * Порядок — как окна стоят сейчас (сверху вниз, слева направо), свёрнутые
   * встают в конец: раскладка окна не перемешивает.
   */
  function arrange(): void {
    const ordered = sortBy(windows.value, ['isMinimized', 'y', 'x']);

    updateRects(
      arrangeScreenWindows(
        ordered.map((screenWindow) => screenWindow.id),
        board.value,
      ),
      { isMinimized: false },
    );
  }

  return {
    // Наружу только чтение: окна меняют действия ширмы
    windows: computed<ReadonlyArray<ScreenWindow>>(() => windows.value),
    visibleWindows,
    minimizedWindows,
    isAccount: readonly(isAccount),
    connect,
    disconnect,
    flush,
    clearLocal,
    board,
    setBoard,
    toBoardPoint,
    highlightedId: readonly(highlightedId),
    previewRects: shallowReadonly(previewRects),
    setPreviewRects,
    add,
    addNote,
    update,
    updateRects,
    focus,
    navigate,
    close,
    clear,
    minimize,
    minimizeAll,
    restore,
    restoreAll,
    arrange,
  };
});
