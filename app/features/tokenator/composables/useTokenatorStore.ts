import { useRefHistory } from '@vueuse/core';
import { defineStore } from 'pinia';

import type { FrameTint, TokenatorFrame, TransformState } from '../types';

export const useTokenatorStore = defineStore('tokenator', () => {
  // State
  const currentImage = ref<string | null>(null); // URL or DataURL
  const currentFrame = ref<TokenatorFrame | null>(null);
  const customFrame = ref<string | null>(null); // URL of uploaded custom frame

  const backgroundColor = ref<string>('#ffffff00'); // Transparent default

  const frameTint = ref<FrameTint>({
    enabled: false,
    type: 'solid',
    colors: ['#ff0000'],
  });

  const transform = ref<TransformState>({
    scale: 1,
    rotate: 0,
    flip: { x: false, y: false },
    position: { x: 0, y: 0 },
    maskScale: 1,
  });

  // History support for transform (undo/redo if needed, but mainly for clean state mgmt)
  const { undo, redo, canUndo, canRedo } = useRefHistory(transform, {
    deep: true,
    capacity: 20,
  });

  // Getters
  const activeFrameUrl = computed(
    () => customFrame.value || currentFrame.value?.url || null,
  );

  // Actions
  function setImage(file: File) {
    if (currentImage.value && currentImage.value.startsWith('blob:')) {
      URL.revokeObjectURL(currentImage.value);
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        currentImage.value = e.target.result;
        resetTransform();
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
        currentFrame.value = null; // Deselect default frame
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
    };
  }

  function resetAll() {
    resetTransform();
    currentImage.value = null;
    customFrame.value = null;
    currentFrame.value = null;
    backgroundColor.value = '#ffffff00';
    frameTint.value = { enabled: false, type: 'solid', colors: ['#ff0000'] };
  }

  function randomizeTint() {
    const randomColor = () =>
      `#${Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, '0')}`;

    frameTint.value.colors = [randomColor()];

    if (frameTint.value.type === 'gradient') {
      frameTint.value.colors.push(randomColor());
    }

    frameTint.value.enabled = true;
  }

  return {
    currentImage,
    currentFrame,
    customFrame,
    activeFrameUrl,
    backgroundColor,
    frameTint,
    transform,

    setImage,
    setCustomFrame,
    selectFrame,
    resetTransform,
    resetAll,
    randomizeTint,

    undo,
    redo,
    canUndo,
    canRedo,
  };
});
