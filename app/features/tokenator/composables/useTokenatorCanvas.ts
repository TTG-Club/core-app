import { useElementSize, useRafFn } from '@vueuse/core';

import { CANVAS_SIZE, drawBrushStroke, drawToken } from '../model';

import { useTokenatorStore } from './useTokenatorStore';

/**
 * Composable для управления canvas редактора токенов.
 * Обеспечивает отрисовку, работу с маской и реактивное обновление при изменении стора.
 *
 * @param canvasRef - Референс на HTML canvas элемент
 * @param options - Опции отрисовки
 * @param options.clip - Обрезать ли изображение по кругу маски
 * @returns Методы для работы с canvas и его маской
 */
export function useTokenatorCanvas(
  canvasRef: Ref<HTMLCanvasElement | null>,
  options: { clip?: boolean } = {},
) {
  const store = useTokenatorStore();
  const { clip = true } = options;
  const { width, height } = useElementSize(canvasRef);

  // Размер маски теперь фиксированный и большой для сохранения качества
  const MASK_SIDE = 2048;

  // Пытаемся восстановить маску из стора, если она там есть
  const existingMask = store.maskImageCanvas;
  const maskCanvas = document.createElement('canvas');

  // Если маска уже была, отрисовываем её, растягивая на новый размер если нужно
  // Это позволит мигрировать старые маски на новый формат
  if (existingMask) {
    maskCanvas.width = MASK_SIDE;
    maskCanvas.height = MASK_SIDE;

    maskCanvas
      .getContext('2d')
      ?.drawImage(existingMask, 0, 0, MASK_SIDE, MASK_SIDE);
  } else {
    maskCanvas.width = MASK_SIDE;
    maskCanvas.height = MASK_SIDE;
  }

  /**
   * Инициализирует canvas и маску, устанавливает размеры и запускает первую отрисовку.
   */
  function initCanvas() {
    if (!canvasRef.value) {
      return;
    }

    // Маска теперь фиксированного размера, поэтому не меняем её размер при инициализации
    render();
  }

  /**
   * Рисует на маске в указанных координатах.
   * Использует настройки кисти из стора (размер, режим).
   * Автоматически пересчитывает координаты экрана в координаты маски с учетом трансформации холста.
   *
   * @param x - Координата X
   * @param y - Координата Y
   * @param prevX - Предыдущая координата X (для интерполяции линии)
   * @param prevY - Предыдущая координата Y (для интерполяции линии)
   */
  function paintMask(x: number, y: number, prevX?: number, prevY?: number) {
    const ctx = maskCanvas.getContext('2d');

    if (!ctx || !canvasRef.value) {
      return;
    }

    const w = width.value || canvasRef.value.clientWidth || 300;
    const h = height.value || canvasRef.value.clientHeight || 300;

    // Вычисляем размер токена на экране (логика должна совпадать с draw)
    let tokenSize = 500;

    if (clip) {
      tokenSize = Math.min(w, h);
    } else {
      tokenSize = Math.min(500, Math.min(w, h) - 40);
    }

    // Коэффициент масштабирования между экраном и маской
    const scale = MASK_SIDE / tokenSize;

    // Центры координат
    const screenCx = w / 2;
    const screenCy = h / 2;
    const maskCx = MASK_SIDE / 2;
    const maskCy = MASK_SIDE / 2;

    // Получаем трансформацию холста
    const { zoom, pan } = store.canvasViewport;

    // Преобразование координат с учетом трансформации холста:
    // 1. Сдвигаем к центру экрана (0,0)
    // 2. Применяем обратную трансформацию холста (zoom и pan)
    // 3. Масштабируем к размеру маски
    // 4. Сдвигаем к центру маски
    const relX = (x - screenCx - pan.x) / zoom;
    const relY = (y - screenCy - pan.y) / zoom;

    const mx = relX * scale + maskCx;
    const my = relY * scale + maskCy;

    let mPrevX: number | undefined;
    let mPrevY: number | undefined;

    if (prevX !== undefined && prevY !== undefined) {
      const relPrevX = (prevX - screenCx - pan.x) / zoom;
      const relPrevY = (prevY - screenCy - pan.y) / zoom;

      mPrevX = relPrevX * scale + maskCx;
      mPrevY = relPrevY * scale + maskCy;
    }

    try {
      drawBrushStroke({
        ctx,
        x: mx,
        y: my,
        prevX: mPrevX,
        prevY: mPrevY,
        size: store.brush.size * scale, // Размер кисти тоже масштабируем
        mode: store.brush.mode,
        color: store.brush.mode === 'add' ? 'white' : 'black',
      });
    } catch (e) {
      console.error('Failed to paint mask:', e);
    }

    store.maskVersion++;
    render();
  }

  /**
   * Выполняет отрисовку токена на canvas.
   * Автоматически обновляет размеры canvas и маски при изменении размера контейнера.
   */
  async function draw() {
    if (!canvasRef.value) {
      return;
    }

    const ctx = canvasRef.value.getContext('2d');

    if (!ctx) {
      return;
    }

    const w = width.value || canvasRef.value.clientWidth || 300;
    const h = height.value || canvasRef.value.clientHeight || 300;

    // Обновляем размер только экранного канваса
    if (canvasRef.value.width !== w || canvasRef.value.height !== h) {
      canvasRef.value.width = w;
      canvasRef.value.height = h;
    }

    let tokenSize = 500;

    if (clip) {
      tokenSize = Math.min(w, h);
    } else {
      tokenSize = Math.min(500, Math.min(w, h) - 40);
    }

    // Указываем, что размер токена на маске равен полному размеру маски
    store.maskTokenSize = MASK_SIDE;

    try {
      await drawToken({
        ctx,
        backgroundColor: store.backgroundColor,
        currentImage: store.currentImage,
        activeFrameUrl: store.activeFrameUrl,
        frameTint: store.frameTint,
        transform: store.transform,
        clip,
        viewSize: { width: w, height: h },
        tokenSize,
        maskImage: store.maskImageCanvas || maskCanvas,
        maskTokenSize: store.maskTokenSize,
        halfMask: store.brush.halfMask,
        customBackground: store.customBackground,
        backgroundStyle: store.backgroundStyle,
        texts: store.texts,
      });
    } catch (error) {
      console.error('Failed to draw token:', error);
    }
  }

  /**
   * Запускает отрисовку в requestAnimationFrame для оптимальной производительности.
   * Использует useRafFn из VueUse для предотвращения множественных перерисовок.
   */
  const { pause, resume } = useRafFn(
    () => {
      draw();
      pause(); // Отрисовали один раз и остановились
    },
    { immediate: false },
  );

  function render() {
    resume(); // Запускаем отрисовку в следующем frame
  }

  /**
   * Очищает маску и запускает перерисовку.
   */
  function clearMask() {
    const ctx = maskCanvas.getContext('2d');

    if (ctx) {
      ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    }

    store.maskVersion++;
    render();
  }

  // Реактивное обновление при изменении зависимостей
  watch(
    [
      width,
      height,
      () => store.currentImage,
      () => store.activeFrameUrl,
      () => store.backgroundColor,
      () => store.backgroundStyle,
      () => store.frameTint,
      () => store.transform,
      () => store.brush.halfMask,
      () => store.customBackground,
      () => store.texts,
      () => store.maskVersion,
    ],
    () => {
      render();
    },
    { deep: true },
  );

  // Очистка маски при смене изображения
  watch(
    () => store.currentImage,
    () => {
      clearMask();
    },
  );

  return {
    initCanvas,
    render,
    paintMask,
    CANVAS_SIZE,
    maskCanvas,
  };
}
