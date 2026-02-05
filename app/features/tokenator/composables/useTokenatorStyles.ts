import { cloneDeep } from 'es-toolkit';
import {
  BACKGROUND_BLEND_MODES,
  BLEND_MODES,
  DEFAULT_BACKGROUND_STYLE,
  DEFAULT_COLORS,
  DEFAULT_FRAME_TINT,
} from '~tokenator/model';

import { useTokenatorSetting } from './useTokenatorSetting';

import type { BackgroundStyle, FrameTint } from '~tokenator/model';

export function useTokenatorStyles() {
  const { data: backgroundColor } = useTokenatorSetting<string>(
    'background-color',
    DEFAULT_COLORS.BACKGROUND,
  );

  const { data: frameTint } = useTokenatorSetting<FrameTint>(
    'frame-tint',
    DEFAULT_FRAME_TINT,
  );

  const { data: backgroundStyle } = useTokenatorSetting<BackgroundStyle>(
    'background-style',
    DEFAULT_BACKGROUND_STYLE,
  );

  const isBackgroundOpacityChanged = computed(
    () => backgroundStyle.value.opacity !== 100,
  );

  const isBackgroundScaleChanged = computed(
    () => backgroundStyle.value.scale !== 1,
  );

  const isBackgroundRotateChanged = computed(
    () => backgroundStyle.value.rotate !== 0,
  );

  function resetTint1() {
    frameTint.value.colors[0] = DEFAULT_COLORS.TINT;
  }

  function resetTint2() {
    frameTint.value.colors[1] = DEFAULT_COLORS.TINT_TRANSPARENT;
  }

  function resetBackgroundOpacity() {
    backgroundStyle.value.opacity = 100;
  }

  function resetBackgroundScale() {
    backgroundStyle.value.scale = 1;
  }

  function resetBackgroundRotation() {
    backgroundStyle.value.rotate = 0;
  }

  function resetBackgroundColor() {
    const currentAlpha = backgroundColor.value.slice(7);

    backgroundColor.value = `${DEFAULT_COLORS.BACKGROUND}${currentAlpha}`;
  }

  function resetBackgroundStyle() {
    backgroundStyle.value = cloneDeep(DEFAULT_BACKGROUND_STYLE);
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
      frameTint.value.colors = [c2, c1 || DEFAULT_COLORS.TINT_TRANSPARENT];
    }
  }

  function resetFrameTint() {
    frameTint.value = cloneDeep(DEFAULT_FRAME_TINT);
  }

  return {
    backgroundColor,
    frameTint,
    backgroundStyle,
    isBackgroundOpacityChanged,
    isBackgroundScaleChanged,
    isBackgroundRotateChanged,
    resetTint1,
    resetTint2,
    resetBackgroundOpacity,
    resetBackgroundScale,
    resetBackgroundRotation,
    resetBackgroundColor,
    resetBackgroundStyle,
    randomizeTint,
    swapTintColors,
    resetFrameTint,
    BLEND_MODES,
    BACKGROUND_BLEND_MODES,
    DEFAULT_COLORS,
  };
}
