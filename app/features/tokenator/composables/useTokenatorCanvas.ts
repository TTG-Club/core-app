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

  function initCanvas() {
    if (!canvasRef.value) {
      return;
    }

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
    }

    let tokenSize = 500;

    if (clip) {
      tokenSize = Math.min(w, h);
    } else {
      tokenSize = Math.min(500, Math.min(w, h) - 40);
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
    });
  }

  function render() {
    requestAnimationFrame(() => draw());
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
    ],
    () => {
      requestAnimationFrame(() => draw());
    },
    { deep: true },
  );

  return {
    initCanvas,
    render,
    CANVAS_SIZE,
  };
}
