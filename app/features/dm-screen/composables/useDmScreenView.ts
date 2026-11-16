import type { ScreenPoint, ScreenRect, ScreenSize, ScreenView } from '../model';

import {
  centerScreenView,
  clampScreenView,
  clampScreenZoom,
  DM_SCREEN_BOARD_INSET,
  DM_SCREEN_FIT_PADDING,
  DM_SCREEN_VIEW_DEFAULT,
  DM_SCREEN_VIEW_STORAGE_KEY,
  DM_SCREEN_ZOOM,
  fitScreenView,
  getScreenBounds,
  getScreenRectCenter,
  getScreenVisibleRect,
  isScreenRectVisible,
  panScreenView,
  screenViewSchema,
  toScreenCanvasRect,
  toScreenFieldPoint,
  zoomScreenView,
} from '../model';

/**
 * Читает обзор, сохранённый в браузере; чужой формат или битый JSON —
 * обычный обзор. Масштаб возвращается в допустимые пределы.
 * @param storedText - строка из localStorage
 */
function readStoredView(storedText: string): ScreenView {
  try {
    const storedView = screenViewSchema.safeParse(JSON.parse(storedText));

    return storedView.success
      ? { ...storedView.data, zoom: clampScreenZoom(storedView.data.zoom) }
      : DM_SCREEN_VIEW_DEFAULT;
  } catch {
    return DM_SCREEN_VIEW_DEFAULT;
  }
}

/**
 * Обзор ширмы. Окна стоят на большом поле, а холст показывает его часть:
 * поле можно двигать во все стороны до его краёв и отдалять (ближе, чем
 * один к одному, оно не подходит). Здесь же перевод точек из окна браузера на
 * холст и на поле.
 *
 * Побочные действия: сдвиг и масштаб хранятся в localStorage — у каждого
 * браузера свой обзор, в аккаунт он не уходит.
 */
export const useDmScreenView = createSharedComposable(() => {
  const storedView = useLocalStorage<ScreenView>(
    DM_SCREEN_VIEW_STORAGE_KEY,
    DM_SCREEN_VIEW_DEFAULT,
    {
      // Обзор меняется только заменой целиком
      shallow: true,
      serializer: {
        read: readStoredView,
        write: (nextView) => JSON.stringify(nextView),
      },
    },
  );

  const { width: viewportWidth, height: viewportHeight } = useWindowSize();

  /** Размер холста, который сообщила страница ширмы. */
  const measuredCanvas = shallowRef<ScreenSize>();

  /** Левый верхний угол холста в окне браузера. */
  const canvasOrigin = shallowRef<ScreenPoint>({ x: 0, y: 0 });

  /**
   * Размер холста на экране. Пока ширма не открыта (запись кладут с другой
   * страницы), он оценивается по окну браузера.
   */
  const canvas = computed<ScreenSize>(
    () =>
      measuredCanvas.value ?? {
        width: viewportWidth.value - DM_SCREEN_BOARD_INSET.width,
        height: viewportHeight.value - DM_SCREEN_BOARD_INSET.height,
      },
  );

  // За края поля обзор не уходит; холст мог стать больше с прошлого раза,
  // поэтому сохранённый обзор сверяется с краями заново
  const view = computed<ScreenView>({
    get: () => clampScreenView(storedView.value, canvas.value),
    set: (nextView) => {
      storedView.value = clampScreenView(nextView, canvas.value);
    },
  });

  /** Видимая часть поля: в ней встают новые окна и раскладки. */
  const board = computed<ScreenRect>(() =>
    getScreenVisibleRect(view.value, canvas.value),
  );

  /**
   * Запоминает место и размер холста; без значений — холста больше нет.
   * @param rect - прямоугольник холста в окне браузера
   */
  function setBoard(rect?: ScreenRect): void {
    measuredCanvas.value = rect
      ? { width: rect.width, height: rect.height }
      : undefined;

    canvasOrigin.value = rect ? { x: rect.x, y: rect.y } : { x: 0, y: 0 };
  }

  /**
   * Точка холста по точке в окне браузера.
   * @param client - координаты указателя в окне браузера
   */
  function toCanvasPoint(client: ScreenPoint): ScreenPoint {
    return {
      x: client.x - canvasOrigin.value.x,
      y: client.y - canvasOrigin.value.y,
    };
  }

  /**
   * Точка поля по точке в окне браузера.
   * @param client - координаты указателя в окне браузера
   */
  function toBoardPoint(client: ScreenPoint): ScreenPoint {
    return toScreenFieldPoint(toCanvasPoint(client), view.value);
  }

  /**
   * Прямоугольник поля, как он сейчас виден на холсте.
   * @param rect - прямоугольник на поле
   */
  function toCanvasRect(rect: ScreenRect): ScreenRect {
    return toScreenCanvasRect(rect, view.value);
  }

  /**
   * Двигает поле за указателем.
   * @param from - обзор в начале жеста
   * @param delta - на сколько сдвинулся указатель на экране
   */
  function pan(from: ScreenView, delta: ScreenPoint): void {
    view.value = panScreenView(from, delta);
  }

  /**
   * Меняет масштаб; точка поля под якорем остаётся на месте.
   * @param zoom - желаемый масштаб
   * @param anchor - точка холста; без неё — его середина
   */
  function zoomTo(zoom: number, anchor?: ScreenPoint): void {
    view.value = zoomScreenView(
      view.value,
      zoom,
      anchor ?? getScreenRectCenter({ x: 0, y: 0, ...canvas.value }),
    );
  }

  /** Приближает поле на шаг. */
  function zoomIn(): void {
    zoomTo(view.value.zoom * DM_SCREEN_ZOOM.step);
  }

  /** Отдаляет поле на шаг. */
  function zoomOut(): void {
    zoomTo(view.value.zoom / DM_SCREEN_ZOOM.step);
  }

  /** Возвращает обычный масштаб, середина холста остаётся на месте. */
  function resetZoom(): void {
    zoomTo(DM_SCREEN_ZOOM.max);
  }

  /**
   * Ставит точку поля в середину холста.
   * @param center - точка поля
   */
  function centerOn(center: ScreenPoint): void {
    view.value = centerScreenView(view.value, center, canvas.value);
  }

  /**
   * Показывает все переданные прямоугольники разом: поле отдаляется, пока
   * они не поместятся. Без них обзор возвращается к началу поля.
   * @param rects - что должно быть видно
   */
  function fit(rects: ReadonlyArray<ScreenRect>): void {
    const bounds = getScreenBounds(rects);

    view.value = bounds
      ? fitScreenView(bounds, canvas.value, DM_SCREEN_FIT_PADDING)
      : DM_SCREEN_VIEW_DEFAULT;
  }

  /**
   * Подводит обзор к прямоугольнику, если его совсем не видно.
   * @param rect - прямоугольник на поле
   */
  function reveal(rect: ScreenRect): void {
    if (!isScreenRectVisible(rect, board.value)) {
      centerOn(getScreenRectCenter(rect));
    }
  }

  return {
    // Наружу только чтение: обзор меняют действия
    view: computed<ScreenView>(() => view.value),
    board,
    canvas,
    setBoard,
    toCanvasPoint,
    toBoardPoint,
    toCanvasRect,
    pan,
    zoomTo,
    zoomIn,
    zoomOut,
    resetZoom,
    centerOn,
    fit,
    reveal,
  };
});
