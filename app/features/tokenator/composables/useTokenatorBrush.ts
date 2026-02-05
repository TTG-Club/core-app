import { cloneDeep } from 'es-toolkit';
import { DEFAULT_BRUSH_CONFIG, validateBrushSize } from '~tokenator/model';

import { useTokenatorSetting } from './useTokenatorSetting';

import type { BrushState } from '~tokenator/model';

export function useTokenatorBrush() {
  const { data: brush } = useTokenatorSetting<BrushState>(
    'brush',
    DEFAULT_BRUSH_CONFIG,
  );

  const maskImageCanvas = ref<HTMLCanvasElement | null>(null);
  const maskVersion = ref(0);
  const maskTokenSize = ref(500);

  function resetBrush() {
    brush.value = cloneDeep(DEFAULT_BRUSH_CONFIG);
  }

  function clearMask() {
    if (!maskImageCanvas.value) {
      return;
    }

    const ctx = maskImageCanvas.value.getContext('2d');

    if (ctx) {
      ctx.clearRect(
        0,
        0,
        maskImageCanvas.value.width,
        maskImageCanvas.value.height,
      );
    }

    maskVersion.value++;
  }

  function setBrushSize(size: number) {
    brush.value.size = validateBrushSize(size);
  }

  return {
    brush,
    maskImageCanvas,
    maskVersion,
    maskTokenSize,
    resetBrush,
    clearMask,
    setBrushSize,
  };
}
