<script setup lang="ts">
  import type { ScreenSplitter, ScreenTile } from '../model';

  import { useDmScreen } from '../composables';
  import {
    DM_SCREEN_SPLITTER_ACTIVE_CLASS,
    DM_SCREEN_SPLITTER_CLASS,
    findScreenSplitters,
    getScreenSplitterPointer,
    getScreenSplitterRect,
    moveScreenSplitter,
    toScreenRectStyle,
  } from '../model';

  /** Граница, которую тянут: откуда начали и что получилось. */
  interface SplitterDrag {
    splitter: ScreenSplitter;
    /** Где был указатель вдоль оси движения в начале. */
    origin: number;
    position: number;
    tiles: Array<ScreenTile>;
  }

  /**
   * Общие границы соседних окон. Между окнами, стоящими через обычный
   * промежуток, при наведении появляется полоска: за неё тянут, и окна по
   * обе стороны меняют размер разом, а промежуток остаётся. Пока границу
   * тянут, окна лишь показывают новый размер; в ширму он пишется, когда
   * границу отпускают.
   */
  const { visibleWindows, setPreviewRects, updateRects } = useDmScreen();

  const splitters = computed(() => findScreenSplitters(visibleWindows.value));

  const drag = shallowRef<SplitterDrag>();

  const splitterViews = computed(() =>
    splitters.value.map((splitter) => {
      const active =
        drag.value?.splitter.key === splitter.key ? drag.value : undefined;

      const look = splitter.isVertical
        ? DM_SCREEN_SPLITTER_CLASS.vertical
        : DM_SCREEN_SPLITTER_CLASS.horizontal;

      return {
        splitter,
        style: toScreenRectStyle(
          getScreenSplitterRect(splitter, active?.position),
        ),
        rootClass: look.root,
        barClass: active
          ? [look.bar, DM_SCREEN_SPLITTER_ACTIVE_CLASS]
          : [look.bar],
      };
    }),
  );

  /**
   * Границу начали тянуть: указатель закрепляется за ней, чтобы она не
   * терялась, когда он уходит с неё.
   * @param splitter - граница
   * @param event - нажатие на границу
   */
  function startDrag(splitter: ScreenSplitter, event: PointerEvent): void {
    if (!(event.currentTarget instanceof HTMLElement)) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);

    drag.value = {
      splitter,
      origin: getScreenSplitterPointer(splitter, {
        x: event.clientX,
        y: event.clientY,
      }),
      position: splitter.position,
      tiles: [],
    };
  }

  /**
   * Границу тянут: окна по обе стороны показывают новый размер.
   * @param event - движение указателя
   */
  function moveDrag(event: PointerEvent): void {
    const active = drag.value;

    if (!active) {
      return;
    }

    const moved = moveScreenSplitter(
      active.splitter,
      getScreenSplitterPointer(active.splitter, {
        x: event.clientX,
        y: event.clientY,
      }) - active.origin,
      visibleWindows.value,
    );

    drag.value = { ...active, ...moved };
    setPreviewRects(moved.tiles);
  }

  /** Границу отпустили: новый размер окон записывается в ширму. */
  function endDrag(): void {
    const active = drag.value;

    if (!active) {
      return;
    }

    drag.value = undefined;

    updateRects(active.tiles);
    setPreviewRects();
  }
</script>

<template>
  <div
    v-for="view in splitterViews"
    :key="view.splitter.key"
    aria-hidden="true"
    :style="view.style"
    class="group absolute flex touch-none items-center justify-center"
    :class="view.rootClass"
    @pointerdown.left.prevent="startDrag(view.splitter, $event)"
    @pointermove="moveDrag"
    @pointerup="endDrag"
    @pointercancel="endDrag"
  >
    <div
      class="rounded-full bg-primary opacity-0 transition-opacity group-hover:opacity-100"
      :class="view.barClass"
    />
  </div>
</template>
