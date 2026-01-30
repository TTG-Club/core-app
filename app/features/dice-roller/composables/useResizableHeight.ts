import type { MaybeRefOrGetter } from 'vue';

interface UseResizableHeightOptions {
  handleElement: MaybeRefOrGetter<HTMLElement | null>;
  minHeight: number;
  maxHeightRatio: number;
  initialHeight: number;
  disabled?: MaybeRefOrGetter<boolean>;
}

/**
 * Composable для управления изменением высоты элемента через drag.
 * Использует useDraggable из VueUse для обработки событий перетаскивания.
 * Поддерживает ограничения минимальной и максимальной высоты.
 *
 * @param options - Настройки для изменения размера
 * @param options.handleElement - Ref на элемент-ручку для изменения размера
 * @param options.minHeight - Минимальная высота в пикселях
 * @param options.maxHeightRatio - Максимальная высота как доля от высоты окна (0-1)
 * @param options.initialHeight - Начальная высота в пикселях
 * @param options.disabled - MaybeRefOrGetter для отключения функциональности resize
 * @returns Объект с реактивной высотой и флагом активного resize
 *
 * @example
 * const resizeHandle = useTemplateRef<HTMLElement>('resizeHandle');
 *
 * const { height, isResizing } = useResizableHeight({
 *   handleElement: resizeHandle,
 *   minHeight: 300,
 *   maxHeightRatio: 0.9,
 *   initialHeight: 450,
 *   disabled: isMobile,
 * });
 */
export function useResizableHeight(options: UseResizableHeightOptions) {
  const { handleElement, minHeight, maxHeightRatio, initialHeight, disabled } =
    options;

  const height = ref(initialHeight);
  const startHeight = ref(initialHeight);
  const startY = ref(0);

  const { isDragging } = useDraggable(handleElement, {
    axis: 'y',
    preventDefault: true,
    stopPropagation: true,
    onStart(_position, event) {
      if (toValue(disabled)) {
        return false;
      }

      startHeight.value = height.value;
      startY.value = event.clientY;

      return undefined;
    },
    onMove(_position, event) {
      const delta = startY.value - event.clientY;
      const maxHeight = window.innerHeight * maxHeightRatio;

      height.value = Math.max(
        minHeight,
        Math.min(maxHeight, startHeight.value + delta),
      );
    },
  });

  return {
    height,
    isResizing: isDragging,
  };
}
