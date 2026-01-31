import { useElementSize } from '@vueuse/core';

import { CANVAS_SIZE, drawToken } from '../utils/draw';

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

  const maskCanvas = document.createElement('canvas');

  /**
   * Инициализирует canvas и маску, устанавливает размеры и запускает первую отрисовку.
   */
  function initCanvas() {
    if (!canvasRef.value) {
      return;
    }

    const w = width.value || canvasRef.value.clientWidth || 300;
    const h = height.value || canvasRef.value.clientHeight || 300;

    maskCanvas.width = w;
    maskCanvas.height = h;

    render();
  }

  /**
   * Рисует на маске в указанных координатах.
   * Использует настройки кисти из стора (размер, режим).
   *
   * @param x - Координата X
   * @param y - Координата Y
   */
  function paintMask(x: number, y: number) {
    const ctx = maskCanvas.getContext('2d');

    if (!ctx) {
      return;
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, store.brush.size / 2, 0, Math.PI * 2);
    ctx.fillStyle = store.brush.mode === 'add' ? 'white' : 'black';

    if (store.brush.mode === 'remove') {
      ctx.globalCompositeOperation = 'destination-out';
    }

    ctx.fill();
    ctx.restore();

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

    if (canvasRef.value.width !== w || canvasRef.value.height !== h) {
      canvasRef.value.width = w;
      canvasRef.value.height = h;

      const temp = document.createElement('canvas');

      temp.width = maskCanvas.width;
      temp.height = maskCanvas.height;
      temp.getContext('2d')?.drawImage(maskCanvas, 0, 0);

      maskCanvas.width = w;
      maskCanvas.height = h;
      maskCanvas.getContext('2d')?.drawImage(temp, 0, 0);
    }

    let tokenSize = 500;

    if (clip) {
      tokenSize = Math.min(w, h);
    } else {
      tokenSize = Math.min(500, Math.min(w, h) - 40);
    }

    if (!clip) {
      store.maskTokenSize = tokenSize;
    }

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
      texts: store.texts,
    });
  }

  /**
   * Запускает отрисовку в requestAnimationFrame для оптимальной производительности.
   */
  function render() {
    requestAnimationFrame(() => draw());
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

  watch(
    [
      width,
      height,
      () => store.currentImage,
      () => store.activeFrameUrl,
      () => store.backgroundColor,
      () => store.frameTint,
      () => store.transform,
      () => store.brush.halfMask,
      () => store.customBackground,
      () => store.texts,
      () => store.maskVersion,
    ],
    () => {
      requestAnimationFrame(() => draw());
    },
    { deep: true },
  );

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
