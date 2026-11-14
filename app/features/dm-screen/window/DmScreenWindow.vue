<script setup lang="ts">
  import type {
    ScreenPoint,
    ScreenRect,
    ScreenResizeEdges,
    ScreenWindow,
  } from '../model';

  import { useDmScreen, useDmScreenLayouts } from '../composables';
  import {
    DM_SCREEN_CLASSES_PATH,
    DM_SCREEN_EDITABLE_SELECTOR,
    DM_SCREEN_ICONS,
    DM_SCREEN_LINK_SELECTOR,
    DM_SCREEN_NEW_TAB,
    DM_SCREEN_RESIZE_HANDLES,
    DM_SCREEN_TEXT,
    DM_SCREEN_WINDOW_CLASS,
    getScreenWindowIcon,
    isOutsideScreenControl,
    isScreenNotePath,
    keepScreenWindowReachable,
    magnetScreenWindow,
    normalizeScreenEntryPath,
    resizeScreenWindow,
    resolveScreenEntry,
    toScreenRectStyle,
  } from '../model';
  import DmScreenEntry from './DmScreenEntry.vue';
  import DmScreenNote from './DmScreenNote.vue';

  /** С чего началось перетаскивание или растягивание окна. */
  interface PointerGesture {
    pointer: ScreenPoint;
    rect: ScreenRect;
    /** Стороны, за которые тянут; без них окно двигают целиком. */
    edges?: ScreenResizeEdges;
  }

  /**
   * Окно записи или заметки на холсте ширмы. Тянется за шапку и
   * притягивается к краям холста и соседних окон (Alt — без магнита),
   * растягивается за любую сторону или угол, сворачивается в плашку кнопкой
   * или двойным кликом по шапке и закрывается. Окно, отпущенное у бокового
   * края холста или над местом в панели раскладок, занимает это место.
   *
   * Ссылки внутри окна со страницы ширмы не уводят: запись сайта встаёт
   * новым окном рядом с кликом, подкласс открывается в окне своего класса,
   * остальные страницы — в новой вкладке.
   */
  const { screenWindow } = defineProps<{
    screenWindow: ScreenWindow;
  }>();

  const {
    add,
    navigate,
    close,
    minimize,
    focus,
    update,
    visibleWindows,
    board,
    toBoardPoint,
    highlightedId,
    previewRects,
  } = useDmScreen();

  const {
    startDrag: startLayoutDrag,
    moveDrag: moveLayoutDrag,
    endDrag: endLayoutDrag,
    isDimmed,
  } = useDmScreenLayouts();

  /** Жест, который идёт сейчас. */
  let gesture: PointerGesture | undefined;

  /** Где окно стоит, пока его двигают или растягивают. */
  const liveRect = shallowRef<ScreenRect>();

  // Место окна: под указателем, в предпросмотре общей границы или
  // сохранённое. Сохранённое могло остаться за краем меньшего холста
  const rect = computed<ScreenRect>(
    () =>
      liveRect.value
      ?? previewRects.value.get(screenWindow.id) ?? {
        ...keepScreenWindowReachable(screenWindow, screenWindow, board.value),
        width: screenWindow.width,
        height: screenWindow.height,
      },
  );

  const windowStyle = computed(() => ({
    ...toScreenRectStyle(rect.value),
    zIndex: screenWindow.layer,
  }));

  const stateClass = computed(() => [
    highlightedId.value === screenWindow.id
      ? DM_SCREEN_WINDOW_CLASS.highlighted
      : '',
    isDimmed(screenWindow.id) ? DM_SCREEN_WINDOW_CLASS.dimmed : '',
  ]);

  const isNote = computed(() => isScreenNotePath(screenWindow.path));

  /** Запись сайта в окне; у заметки и у адреса незнакомого раздела её нет. */
  const entry = computed(() => resolveScreenEntry(screenWindow.path));

  const windowIcon = computed(() => getScreenWindowIcon(screenWindow.path));

  // Правку заметки переключает кнопка в шапке окна
  const isNoteEditing = ref(false);

  const noteToggleIcon = computed(() =>
    isNoteEditing.value ? DM_SCREEN_ICONS.done : DM_SCREEN_ICONS.edit,
  );

  const noteToggleLabel = computed(() =>
    isNoteEditing.value ? DM_SCREEN_TEXT.noteDone : DM_SCREEN_TEXT.noteEdit,
  );

  /** Переключает просмотр и правку заметки. */
  function toggleNoteEditing(): void {
    isNoteEditing.value = !isNoteEditing.value;
  }

  /** Остальные развёрнутые окна: к ним окно притягивается. */
  function getOthers(): Array<ScreenWindow> {
    return visibleWindows.value.filter((other) => other.id !== screenWindow.id);
  }

  /**
   * Начало жеста: указатель закрепляется за шапкой или ручкой, чтобы она не
   * терялась, когда он уходит с неё.
   * @param event - нажатие
   * @param edges - стороны, за которые тянут; без них окно двигают
   */
  function startGesture(event: PointerEvent, edges?: ScreenResizeEdges): void {
    if (!(event.currentTarget instanceof HTMLElement)) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);

    gesture = {
      pointer: { x: event.clientX, y: event.clientY },
      rect: rect.value,
      edges,
    };
  }

  /**
   * Окно берут за шапку. С кнопок шапки оно не тянется: иначе указатель
   * закрепился бы за шапкой и клик до кнопки не дошёл бы.
   * @param event - нажатие на шапку
   */
  function startDrag(event: PointerEvent): void {
    if (!isOutsideScreenControl(event.target)) {
      return;
    }

    event.preventDefault();
    startGesture(event);
    startLayoutDrag(screenWindow.id);
  }

  /**
   * Окно берут за сторону или угол.
   * @param edges - за какие стороны тянут
   * @param event - нажатие на ручку
   */
  function startResize(edges: ScreenResizeEdges, event: PointerEvent): void {
    startGesture(event, edges);
  }

  /**
   * Указатель двигается: окно идёт за ним или меняет размер. С зажатым Alt
   * магнита нет, но выше холста окно не уходит и тогда.
   * @param event - движение указателя
   */
  function moveGesture(event: PointerEvent): void {
    if (!gesture) {
      return;
    }

    const delta = {
      x: event.clientX - gesture.pointer.x,
      y: event.clientY - gesture.pointer.y,
    };

    const others = event.altKey ? undefined : getOthers();

    if (gesture.edges) {
      liveRect.value = resizeScreenWindow(
        gesture.rect,
        gesture.edges,
        delta,
        board.value,
        others,
      );

      return;
    }

    const moved = {
      ...gesture.rect,
      x: gesture.rect.x + delta.x,
      y: gesture.rect.y + delta.y,
    };

    const position = others
      ? magnetScreenWindow(moved, others, board.value)
      : moved;

    liveRect.value = {
      ...moved,
      x: position.x,
      y: Math.max(position.y, 0),
    };

    moveLayoutDrag({ x: event.clientX, y: event.clientY });
  }

  /**
   * Жест закончился: место и размер окна записываются в ширму. Окно,
   * отпущенное над местом раскладки, занимает его целиком; шапка, утащенная
   * за край холста, возвращается на него.
   */
  function endGesture(): void {
    const finished = gesture;
    const current = liveRect.value;

    gesture = undefined;
    liveRect.value = undefined;

    if (!finished) {
      return;
    }

    const zoneRect = finished.edges ? undefined : endLayoutDrag();

    if (zoneRect) {
      update(screenWindow.id, zoneRect);

      return;
    }

    // Нажали и отпустили, не сдвинув: менять в ширме нечего
    if (!current) {
      return;
    }

    update(screenWindow.id, {
      ...current,
      ...keepScreenWindowReachable(current, current, board.value),
    });
  }

  /** Поднимает окно над остальными: по нему нажали. */
  function focusWindow(): void {
    focus(screenWindow.id);
  }

  /** Сворачивает окно в плашку. */
  function minimizeWindow(): void {
    minimize(screenWindow.id);
  }

  /** Убирает окно с ширмы. */
  function closeWindow(): void {
    close(screenWindow.id);
  }

  /**
   * Двойной клик по шапке сворачивает окно, как в оконных системах.
   * @param event - двойной клик
   */
  function minimizeByHeader(event: MouseEvent): void {
    if (isOutsideScreenControl(event.target)) {
      minimizeWindow();
    }
  }

  /**
   * Название загруженной записи в шапке окна.
   * @param title - название записи
   */
  function syncTitle(title: string): void {
    if (title !== screenWindow.title) {
      update(screenWindow.id, { title });
    }
  }

  /**
   * Открывает в этом же окне другую запись.
   * @param path - адрес записи
   */
  function navigateWindow(path: string): void {
    navigate(screenWindow.id, path);
  }

  /**
   * Обе записи — из раздела классов: подкласс открывается в окне класса.
   * @param path - адрес записи, на которую ведёт ссылка
   */
  function isSameClassEntry(path: string): boolean {
    return [path, screenWindow.path].every(
      (entryPath) =>
        resolveScreenEntry(entryPath)?.section.path === DM_SCREEN_CLASSES_PATH,
    );
  }

  /**
   * Клик по внутренней ссылке в окне. Перехватывается раньше самой ссылки,
   * поэтому её собственный переход или дровер не срабатывает.
   * @param event - клик левой кнопкой без модификаторов
   */
  function handleLinkClick(event: MouseEvent): void {
    if (!(event.target instanceof Element)) {
      return;
    }

    // В редакторе заметки по ссылке ставят курсор, а не переходят
    if (event.target.closest(DM_SCREEN_EDITABLE_SELECTOR)) {
      return;
    }

    const link = event.target.closest(DM_SCREEN_LINK_SELECTOR);
    const href = link?.getAttribute('href');

    // Внешние ссылки и так открываются в новой вкладке
    if (!link || !href?.startsWith('/')) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const entryPath = normalizeScreenEntryPath(href);

    if (!entryPath) {
      window.open(href, DM_SCREEN_NEW_TAB.target, DM_SCREEN_NEW_TAB.features);

      return;
    }

    if (isSameClassEntry(entryPath)) {
      navigateWindow(entryPath);

      return;
    }

    add({
      path: entryPath,
      title: link.textContent?.trim() || entryPath,
      origin: toBoardPoint({ x: event.clientX, y: event.clientY }),
    });
  }
</script>

<template>
  <section
    role="dialog"
    aria-modal="false"
    :aria-label="screenWindow.title"
    :style="windowStyle"
    class="absolute flex flex-col overflow-hidden rounded-lg border border-default bg-default shadow-xl"
    :class="stateClass"
    @pointerdown.capture="focusWindow"
  >
    <header
      class="flex shrink-0 cursor-move touch-none items-center gap-1 border-b border-default bg-elevated py-1 pr-1 pl-3 select-none"
      @pointerdown.left="startDrag"
      @pointermove="moveGesture"
      @pointerup="endGesture"
      @pointercancel="endGesture"
      @dblclick.left.exact.prevent="minimizeByHeader"
    >
      <UIcon
        :name="windowIcon"
        class="size-4 shrink-0 text-primary"
      />

      <span class="ml-1 min-w-0 flex-auto truncate text-sm text-highlighted">
        {{ screenWindow.title }}
      </span>

      <UTooltip
        v-if="isNote"
        :text="noteToggleLabel"
      >
        <UButton
          :icon="noteToggleIcon"
          :aria-label="noteToggleLabel"
          color="neutral"
          variant="ghost"
          size="sm"
          @click.left.exact.prevent="toggleNoteEditing"
        />
      </UTooltip>

      <UTooltip
        v-else
        :text="DM_SCREEN_TEXT.openPage"
      >
        <UButton
          :href="screenWindow.path"
          :icon="DM_SCREEN_ICONS.openPage"
          :aria-label="DM_SCREEN_TEXT.openPage"
          target="_blank"
          color="neutral"
          variant="ghost"
          size="sm"
        />
      </UTooltip>

      <UTooltip :text="DM_SCREEN_TEXT.minimize">
        <UButton
          :icon="DM_SCREEN_ICONS.minimize"
          :aria-label="DM_SCREEN_TEXT.minimize"
          color="neutral"
          variant="ghost"
          size="sm"
          @click.left.exact.prevent="minimizeWindow"
        />
      </UTooltip>

      <UTooltip :text="DM_SCREEN_TEXT.close">
        <UButton
          :icon="DM_SCREEN_ICONS.close"
          :aria-label="DM_SCREEN_TEXT.close"
          color="neutral"
          variant="ghost"
          size="sm"
          @click.left.exact.prevent="closeWindow"
        />
      </UTooltip>
    </header>

    <div
      class="flex min-h-0 flex-auto flex-col gap-3 overflow-y-auto p-4"
      @click.left.exact.capture="handleLinkClick"
    >
      <DmScreenNote
        v-if="isNote"
        v-model:editing="isNoteEditing"
        :screen-window="screenWindow"
      />

      <DmScreenEntry
        v-else-if="entry"
        :key="screenWindow.path"
        :entry="entry"
        @loaded="syncTitle"
        @navigate="navigateWindow"
      />

      <UEmpty
        v-else
        :icon="DM_SCREEN_ICONS.unknown"
        :title="DM_SCREEN_TEXT.unknownEntry"
      />
    </div>

    <!-- Ручки поверх краёв окна: углы после сторон, поэтому выше них -->
    <div
      v-for="resizeHandle in DM_SCREEN_RESIZE_HANDLES"
      :key="resizeHandle.key"
      aria-hidden="true"
      class="absolute touch-none"
      :class="resizeHandle.class"
      @pointerdown.left.prevent="startResize(resizeHandle.edges, $event)"
      @pointermove="moveGesture"
      @pointerup="endGesture"
      @pointercancel="endGesture"
    />
  </section>
</template>
