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
    // Initial setup if needed, but resize watcher handles dims
    if (!canvasRef.value) {
      return;
    }

    // Trigger first render
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

    // Current display dimensions
    const w = width.value || canvasRef.value.clientWidth || 300;
    const h = height.value || canvasRef.value.clientHeight || 300;

    // Sync canvas internal resolution with display resolution
    if (canvasRef.value.width !== w || canvasRef.value.height !== h) {
      canvasRef.value.width = w;
      canvasRef.value.height = h;
    }

    // Determine Token Layout
    let tokenSize = 500; // User requested 500

    if (clip) {
      // Preview Mode (sidebar): Fill the container
      tokenSize = Math.min(w, h);
    } else {
      // Editor Mode: Fixed size centered
      // Ensure it fits on small screens
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

  // Watchers
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
      // Debounce slightly for smooth resize/drag
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
