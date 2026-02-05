import { useRefHistory } from '@vueuse/core';
import { cloneDeep } from 'es-toolkit';
import {
  DEFAULT_TRANSFORM,
  validateRotation,
  validateScale,
} from '~tokenator/model';

import { useTokenatorSetting } from './useTokenatorSetting';

import type { TransformState } from '~tokenator/model';

export function useTokenatorTransforms() {
  const { data: transform } = useTokenatorSetting<TransformState>(
    'transform',
    DEFAULT_TRANSFORM,
  );

  const { undo, redo, canUndo, canRedo } = useRefHistory(transform, {
    deep: true,
    capacity: 20,
  });

  const MASK_SIDES_VALUES = [0, 3, 4, 5, 6, 8, 10, 12, 16, 18, 20];

  const isPositionChanged = computed(
    () => transform.value.position.x !== 0 || transform.value.position.y !== 0,
  );

  const isScaleChanged = computed(() => transform.value.scale !== 1);
  const isRotateChanged = computed(() => transform.value.rotate !== 0);
  const isMaskScaleChanged = computed(() => transform.value.maskScale !== 1);
  const isMaskRotateChanged = computed(() => transform.value.maskRotate !== 0);
  const isMaskSidesChanged = computed(() => transform.value.maskSides !== 0);
  const isFrameScaleChanged = computed(() => transform.value.frameScale !== 1);

  const isFrameRotateChanged = computed(
    () => transform.value.frameRotate !== 0,
  );

  const maskSidesIndex = computed({
    get: () => {
      const currentValue = transform.value.maskSides || 0;

      return MASK_SIDES_VALUES.indexOf(currentValue);
    },
    set: (index: number) => {
      transform.value.maskSides = MASK_SIDES_VALUES[index] || 0;
    },
  });

  function resetMaskScale() {
    transform.value.maskScale = 1;
  }

  function resetMaskRotate() {
    transform.value.maskRotate = 0;
  }

  function resetMaskSides() {
    transform.value.maskSides = 0;
  }

  function resetPosition() {
    transform.value.position.x = 0;
    transform.value.position.y = 0;
  }

  function resetScale() {
    transform.value.scale = 1;
  }

  function resetRotation() {
    transform.value.rotate = 0;
  }

  function toggleFlipX() {
    transform.value.flip.x = !transform.value.flip.x;
  }

  function toggleFlipY() {
    transform.value.flip.y = !transform.value.flip.y;
  }

  function resetFrameScale() {
    transform.value.frameScale = 1;
  }

  function resetFrameRotation() {
    transform.value.frameRotate = 0;
  }

  function resetBaseSettings() {
    // Сохраняем настройки рамки
    const savedFrameScale = transform.value.frameScale;
    const savedFrameRotate = transform.value.frameRotate;

    // Сбрасываем все трансформации
    transform.value = cloneDeep(DEFAULT_TRANSFORM);

    // Восстанавливаем настройки рамки
    transform.value.frameScale = savedFrameScale;
    transform.value.frameRotate = savedFrameRotate;
  }

  function resetTransform() {
    resetBaseSettings();
  }

  function resetFrameTransform() {
    transform.value.frameScale = DEFAULT_TRANSFORM.frameScale;
    transform.value.frameRotate = DEFAULT_TRANSFORM.frameRotate;
  }

  function setScale(scale: number) {
    transform.value.scale = validateScale(scale);
  }

  function setRotation(rotation: number) {
    transform.value.rotate = validateRotation(rotation);
  }

  function setFrameRotation(rotation: number) {
    transform.value.frameRotate = validateRotation(rotation);
  }

  watchEffect(() => {
    if (transform.value.maskScale === undefined) {
      resetMaskScale();
    }

    if (transform.value.maskRotate === undefined) {
      resetMaskRotate();
    }

    if (transform.value.maskSides === undefined) {
      resetMaskSides();
    }
  });

  return {
    transform,
    undo,
    redo,
    canUndo,
    canRedo,
    isPositionChanged,
    isScaleChanged,
    isRotateChanged,
    isMaskScaleChanged,
    isMaskRotateChanged,
    isMaskSidesChanged,
    isFrameScaleChanged,
    isFrameRotateChanged,
    maskSidesIndex,
    resetMaskScale,
    resetMaskRotate,
    resetMaskSides,
    resetPosition,
    resetScale,
    resetRotation,
    toggleFlipX,
    toggleFlipY,
    resetFrameScale,
    resetFrameRotation,
    resetBaseSettings,
    resetTransform,
    resetFrameTransform,
    setScale,
    setRotation,
    setFrameRotation,
  };
}
