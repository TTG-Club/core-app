import { useElementSize } from '@vueuse/core';

import { CANVAS_SIZE, drawToken } from '../utils/draw';

import { useTokenatorStore } from './useTokenatorStore';

export function useTokenatorCanvas(
  canvasRef: Ref<HTMLCanvasElement | null>,
  options: { clip?: boolean } = {},
) {
  const store = useTokenatorStore();
  const { clip = true } = options;
  const { width, height } = useElementSize(canvasRef);

  const maskCanvas = document.createElement('canvas');

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

  function render() {
    requestAnimationFrame(() => draw());
  }

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
