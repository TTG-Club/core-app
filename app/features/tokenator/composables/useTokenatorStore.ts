import { useRefHistory } from '@vueuse/core';
import { defineStore } from 'pinia';
import { v4 as uuid } from 'uuid';

import type { FrameTint, TokenatorFrame, TransformState } from '../types';

export const DEFAULT_BACKGROUND_COLOR = '#22c55e';
export const DEFAULT_TINT_COLOR = '#ff0000';
export const DEFAULT_TINT_COLOR_TRANSPARENT = '#ff000000';
export const DEFAULT_GRADIENT_COLOR = '#0000ff';

export interface TokenText {
  id: string;
  content: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  rotation: number;
  fontWeight: number;
  fontFamily: string;
  align: 'left' | 'center' | 'right';
  arc: number;
}

export const useTokenatorStore = defineStore('tokenator', () => {
  const currentImage = ref<string | null>(null);
  const currentFrame = ref<TokenatorFrame | null>(null);
  const customFrame = ref<string | null>(null);
  const customBackground = ref<string | null>(null);

  const texts = ref<TokenText[]>([]);
  const activeTextId = ref<string | null>(null);
  const maskImageCanvas = ref<HTMLCanvasElement | null>(null);
  const maskVersion = ref(0);
  const maskTokenSize = ref(500);

  const backgroundColor = ref<string>(DEFAULT_BACKGROUND_COLOR);

  const frameTint = ref<FrameTint>({
    enabled: true,
    type: 'gradient',
    colors: [DEFAULT_TINT_COLOR_TRANSPARENT, DEFAULT_TINT_COLOR_TRANSPARENT],
    blendMode: 'source-atop',
  });

  const transform = ref<TransformState>({
    scale: 1,
    rotate: 0,
    flip: { x: false, y: false },
    position: { x: 0, y: 0 },
    maskScale: 1,
    frameScale: 1,
    frameRotate: 0,
  });

  const brush = ref<{
    enabled: boolean;
    size: number;
    mode: 'add' | 'remove';
    halfMask: boolean;
  }>({
    enabled: false,
    size: 20,
    mode: 'add',
    halfMask: false,
  });

  const { undo, redo, canUndo, canRedo } = useRefHistory(transform, {
    deep: true,
    capacity: 20,
  });

  const activeFrameUrl = computed(
    () => customFrame.value || currentFrame.value?.url || null,
  );

  function addText(content: string) {
    if (!content.trim()) {
      return;
    }

    const id = uuid();

    texts.value.push({
      id,
      content,
      x: 0,
      y: 0,
      fontSize: 40,
      color: '#ffffff',
      rotation: 0,
      fontWeight: 700,
      fontFamily: 'Inter',
      align: 'center',
      arc: 0,
    });

    activeTextId.value = id;
  }

  function removeText(id: string) {
    const index = texts.value.findIndex((t) => t.id === id);

    if (index !== -1) {
      texts.value.splice(index, 1);

      if (activeTextId.value === id) {
        activeTextId.value = null;
      }
    }
  }

  function updateText(id: string, updates: Partial<TokenText>) {
    const text = texts.value.find((t) => t.id === id);

    if (text) {
      Object.assign(text, updates);
    }
  }

  function setImage(file: File) {
    if (currentImage.value && currentImage.value.startsWith('blob:')) {
      URL.revokeObjectURL(currentImage.value);
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        const savedMaskScale = transform.value.maskScale;
        const savedFrameScale = transform.value.frameScale;

        currentImage.value = e.target.result;
        resetTransform();

        transform.value.maskScale = savedMaskScale;
        transform.value.frameScale = savedFrameScale;
      }
    };

    reader.readAsDataURL(file);
  }

  function setCustomFrame(file: File) {
    if (customFrame.value && customFrame.value.startsWith('blob:')) {
      URL.revokeObjectURL(customFrame.value);
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        customFrame.value = e.target.result;
      }
    };

    reader.readAsDataURL(file);
  }

  function setCustomBackground(file: File) {
    if (customBackground.value && customBackground.value.startsWith('blob:')) {
      URL.revokeObjectURL(customBackground.value);
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        customBackground.value = e.target.result;
      }
    };

    reader.readAsDataURL(file);
  }

  function selectFrame(frame: TokenatorFrame) {
    if (customFrame.value) {
      URL.revokeObjectURL(customFrame.value);
      customFrame.value = null;
    }

    currentFrame.value = frame;
  }

  function resetTransform() {
    transform.value = {
      scale: 1,
      rotate: 0,
      flip: { x: false, y: false },
      position: { x: 0, y: 0 },
      maskScale: 1,
      frameScale: 1,
      frameRotate: 0,
    };
  }

  function resetAll() {
    resetTransform();
    currentImage.value = null;
    customFrame.value = null;
    currentFrame.value = null;
    backgroundColor.value = DEFAULT_BACKGROUND_COLOR;

    frameTint.value = {
      enabled: true,
      type: 'gradient',
      colors: [DEFAULT_TINT_COLOR_TRANSPARENT, DEFAULT_TINT_COLOR_TRANSPARENT],
      blendMode: 'source-atop',
    };
  }

  function randomizeTint() {
    const randomColor = () =>
      `#${Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, '0')}`;

    frameTint.value.colors = [randomColor(), randomColor()];
    frameTint.value.enabled = true;
  }

  function swapTintColors() {
    const c1 = frameTint.value.colors[0];
    const c2 = frameTint.value.colors[1];

    if (c2) {
      frameTint.value.colors = [c2, c1 || DEFAULT_TINT_COLOR_TRANSPARENT];
    }
  }

  return {
    currentImage,
    currentFrame,
    customFrame,
    customBackground,
    activeFrameUrl,
    backgroundColor,
    frameTint,
    transform,
    brush,

    setImage,
    setCustomFrame,
    setCustomBackground,
    selectFrame,
    resetTransform,
    resetAll,
    randomizeTint,
    swapTintColors,

    undo,
    redo,
    canUndo,
    canRedo,

    texts,
    activeTextId,
    addText,
    removeText,
    updateText,
    maskImageCanvas,
    maskVersion,
    maskTokenSize,
  };
});
