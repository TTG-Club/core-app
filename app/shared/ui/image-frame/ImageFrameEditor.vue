<script setup lang="ts">
  import type { ImageFrame } from '~/shared/types';

  import type { ImageFrameGeometry, ImageFrameOffset } from './utils';

  import {
    IMAGE_FRAME_BUTTON_ZOOM_STEP,
    IMAGE_FRAME_KEYBOARD_MOVES,
    IMAGE_FRAME_LABELS,
    IMAGE_FRAME_MAX_ZOOM,
    IMAGE_FRAME_MIN_ZOOM,
    IMAGE_FRAME_ZOOM_IN_KEYS,
    IMAGE_FRAME_ZOOM_OUT_KEYS,
    IMAGE_FRAME_ZOOM_STEP,
  } from './constants';
  import {
    getImageFrameStyle,
    getWheelZoomFactor,
    isDefaultImageFrame,
    moveImageFrame,
    normalizeImageFrame,
    shiftImageFrame,
    toStoredImageFrame,
    zoomImageFrame,
  } from './utils';

  const { src, alt = '' } = defineProps<{
    /** Картинка обложки. */
    src: string;
    alt?: string;
  }>();

  /** Кадр; null — не настроен, картинка стоит по центру. */
  const frameModel = defineModel<ImageFrame | null | undefined>();

  const viewportRef = useTemplateRef<HTMLElement>('viewportRef');

  const imageRef = useTemplateRef<HTMLImageElement>('imageRef');

  /**
   * Текущий кадр живёт и в самом редакторе: модель обновляется только после
   * отрисовки родителя, а колёсико тачпада и перетаскивание шлют события
   * чаще — без своей копии каждое следующее событие считалось бы от старого
   * кадра. Наблюдатель только подтягивает кадр извне (загрузка формы, сброс
   * при замене картинки) и модель не пишет, поэтому цикла нет.
   */
  const frame = ref<ImageFrame>(normalizeImageFrame(null));

  watchImmediate(frameModel, (value) => {
    frame.value = normalizeImageFrame(value);
  });

  const frameStyle = computed(() => getImageFrameStyle(frame.value));

  const isDefault = computed(() => isDefaultImageFrame(frame.value));

  /** Последняя точка указателя при перетаскивании; null — не тащат. */
  const dragPoint = ref<ImageFrameOffset | null>(null);

  const cursorClass = computed(() =>
    dragPoint.value ? 'cursor-grabbing' : 'cursor-grab',
  );

  const isZoomOutDisabled = computed(
    () => frame.value.zoom <= IMAGE_FRAME_MIN_ZOOM,
  );

  const isZoomInDisabled = computed(
    () => frame.value.zoom >= IMAGE_FRAME_MAX_ZOOM,
  );

  /**
   * Записывает кадр. Кадр без сдвига и приближения не хранится.
   *
   * @param next новый кадр.
   */
  function setFrame(next: ImageFrame): void {
    frame.value = next;
    frameModel.value = toStoredImageFrame(next);
  }

  /**
   * Размеры рамки и картинки; null — картинка ещё не загрузилась. Размеры
   * читаются с самой картинки в момент перетаскивания, а не из события
   * загрузки: картинка из серверной разметки грузится раньше, чем страница
   * оживает, и событие до компонента не доходит.
   */
  function getGeometry(): ImageFrameGeometry | null {
    const viewport = viewportRef.value;
    const image = imageRef.value;

    if (!viewport || !image?.naturalWidth || !image.naturalHeight) {
      return null;
    }

    return {
      frameWidth: viewport.clientWidth,
      frameHeight: viewport.clientHeight,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
    };
  }

  /**
   * Сдвигает картинку на заданное число пикселей экрана.
   *
   * @param offset сдвиг, px.
   */
  function moveBy(offset: ImageFrameOffset): void {
    const geometry = getGeometry();

    if (!geometry) {
      return;
    }

    setFrame(moveImageFrame(frame.value, offset, geometry));
  }

  /**
   * Меняет приближение.
   *
   * @param zoom новое приближение.
   */
  function zoomTo(zoom: number): void {
    setFrame(zoomImageFrame(frame.value, zoom));
  }

  /**
   * Начало перетаскивания: указатель захватывается, чтобы движение за
   * пределами рамки не обрывало его.
   *
   * @param event нажатие указателя.
   */
  function handlePointerDown(event: PointerEvent): void {
    if (event.button !== 0) {
      return;
    }

    viewportRef.value?.setPointerCapture(event.pointerId);
    dragPoint.value = { x: event.clientX, y: event.clientY };
  }

  /**
   * Перетаскивание: картинка едет за указателем.
   *
   * @param event движение указателя.
   */
  function handlePointerMove(event: PointerEvent): void {
    if (!dragPoint.value) {
      return;
    }

    moveBy({
      x: event.clientX - dragPoint.value.x,
      y: event.clientY - dragPoint.value.y,
    });

    dragPoint.value = { x: event.clientX, y: event.clientY };
  }

  /** Конец перетаскивания. */
  function handlePointerUp(): void {
    dragPoint.value = null;
  }

  /**
   * Колёсико приближает и отдаляет.
   *
   * @param event прокрутка колёсика.
   */
  function handleWheel(event: WheelEvent): void {
    zoomTo(frame.value.zoom * getWheelZoomFactor(event));
  }

  /**
   * Клавиатура: стрелки двигают картинку, плюс и минус приближают.
   *
   * @param event нажатие клавиши.
   */
  function handleKeydown(event: KeyboardEvent): void {
    // С Ctrl, Cmd или Alt это команды браузера (например, масштаб страницы)
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    const move = IMAGE_FRAME_KEYBOARD_MOVES[event.key];

    if (move) {
      event.preventDefault();
      setFrame(shiftImageFrame(frame.value, move));

      return;
    }

    if (IMAGE_FRAME_ZOOM_IN_KEYS.includes(event.key)) {
      event.preventDefault();
      zoomTo(frame.value.zoom + IMAGE_FRAME_ZOOM_STEP);

      return;
    }

    if (IMAGE_FRAME_ZOOM_OUT_KEYS.includes(event.key)) {
      event.preventDefault();
      zoomTo(frame.value.zoom - IMAGE_FRAME_ZOOM_STEP);
    }
  }

  /**
   * Ползунок приближения.
   *
   * @param zoom значение ползунка.
   */
  function handleZoomUpdate(zoom: number | undefined): void {
    if (zoom === undefined) {
      return;
    }

    zoomTo(zoom);
  }

  /** Кнопка «отдалить». */
  function handleZoomOut(): void {
    zoomTo(frame.value.zoom - IMAGE_FRAME_BUTTON_ZOOM_STEP);
  }

  /** Кнопка «приблизить». */
  function handleZoomIn(): void {
    zoomTo(frame.value.zoom + IMAGE_FRAME_BUTTON_ZOOM_STEP);
  }

  /** Сброс: центр без приближения. */
  function handleReset(): void {
    setFrame(normalizeImageFrame(null));
  }
</script>

<template>
  <div class="flex flex-col gap-3">
    <div
      ref="viewportRef"
      tabindex="0"
      role="application"
      :aria-label="IMAGE_FRAME_LABELS.viewport"
      :title="IMAGE_FRAME_LABELS.viewport"
      :class="[
        'relative aspect-square w-full touch-none overflow-hidden rounded-lg bg-elevated select-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        cursorClass,
      ]"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerUp"
      @wheel.prevent="handleWheel"
      @keydown="handleKeydown"
    >
      <img
        ref="imageRef"
        :key="src"
        :src="src"
        :alt="alt"
        draggable="false"
        class="pointer-events-none size-full object-cover"
        :style="frameStyle"
      />
    </div>

    <div class="flex items-center gap-2">
      <UButton
        icon="tabler:zoom-out"
        color="neutral"
        variant="ghost"
        size="sm"
        :aria-label="IMAGE_FRAME_LABELS.zoomOut"
        :disabled="isZoomOutDisabled"
        @click.left.exact.prevent="handleZoomOut"
      />

      <USlider
        class="flex-1"
        :model-value="frame.zoom"
        :min="IMAGE_FRAME_MIN_ZOOM"
        :max="IMAGE_FRAME_MAX_ZOOM"
        :step="IMAGE_FRAME_ZOOM_STEP"
        :aria-label="IMAGE_FRAME_LABELS.zoom"
        @update:model-value="handleZoomUpdate"
      />

      <UButton
        icon="tabler:zoom-in"
        color="neutral"
        variant="ghost"
        size="sm"
        :aria-label="IMAGE_FRAME_LABELS.zoomIn"
        :disabled="isZoomInDisabled"
        @click.left.exact.prevent="handleZoomIn"
      />

      <UButton
        icon="tabler:focus-centered"
        color="neutral"
        variant="ghost"
        size="sm"
        :aria-label="IMAGE_FRAME_LABELS.reset"
        :title="IMAGE_FRAME_LABELS.reset"
        :disabled="isDefault"
        @click.left.exact.prevent="handleReset"
      />
    </div>

    <p class="text-xs text-muted">
      {{ IMAGE_FRAME_LABELS.hint }}
    </p>
  </div>
</template>
