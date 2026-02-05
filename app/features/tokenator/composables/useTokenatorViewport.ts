import { cloneDeep } from 'es-toolkit';
import { DEFAULT_CANVAS_VIEWPORT } from '~tokenator/model';

import { useTokenatorSetting } from './useTokenatorSetting';

import type { CanvasViewport } from '~tokenator/model';

export function useTokenatorViewport() {
  const { data: canvasViewport } = useTokenatorSetting<CanvasViewport>(
    'canvas-viewport',
    DEFAULT_CANVAS_VIEWPORT,
  );

  const isZoomChanged = computed(() => canvasViewport.value.zoom !== 1);

  const isPanChanged = computed(
    () => canvasViewport.value.pan.x !== 0 || canvasViewport.value.pan.y !== 0,
  );

  function resetCanvasSettings() {
    canvasViewport.value = cloneDeep(DEFAULT_CANVAS_VIEWPORT);
  }

  function resetCanvasZoom() {
    canvasViewport.value.zoom = 1;
  }

  function setCanvasZoom(zoom: number) {
    canvasViewport.value.zoom = Math.max(0.5, Math.min(3, zoom));
  }

  function setCanvasPan(x: number, y: number) {
    canvasViewport.value.pan = { x, y };
  }

  function resetPan() {
    canvasViewport.value.pan.x = 0;
    canvasViewport.value.pan.y = 0;
  }

  return {
    canvasViewport,
    isZoomChanged,
    isPanChanged,
    resetCanvasSettings,
    resetCanvasZoom,
    setCanvasZoom,
    setCanvasPan,
    resetPan,
  };
}
