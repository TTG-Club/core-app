<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type { ScreenPoint, ScreenView } from '../model';

  import { ConfirmDialog } from '~initiative/ui-kit';

  import {
    useDmScreen,
    useDmScreenLayouts,
    useDmScreenView,
  } from '../composables';
  import {
    DM_SCREEN_BACKDROP,
    DM_SCREEN_BOARD_CLASS,
    DM_SCREEN_ICON,
    DM_SCREEN_ICONS,
    DM_SCREEN_PANNING_CLASS,
    DM_SCREEN_PICKER_OPTIONS,
    DM_SCREEN_POINTER_BUTTON,
    DM_SCREEN_TEXT,
    DM_SCREEN_TITLE,
    DM_SCREEN_ZOOM,
    getScreenBackdropStep,
    getScreenFieldOffset,
    isScreenRectVisible,
  } from '../model';
  import { DmScreenWindow } from '../window';
  import DmScreenDock from './DmScreenDock.vue';
  import DmScreenLayoutOverlay from './DmScreenLayoutOverlay.vue';
  import DmScreenList from './DmScreenList.vue';
  import DmScreenNavigator from './DmScreenNavigator.vue';
  import DmScreenSearch from './DmScreenSearch.vue';
  import DmScreenSplitters from './DmScreenSplitters.vue';

  /** Поле начали тянуть: где был указатель и какой был обзор. */
  interface PanGesture {
    pointer: ScreenPoint;
    view: ScreenView;
  }

  /**
   * Ширма Мастера: шапка с поиском и кнопками, под ней холст. На широком
   * экране записи стоят окнами на большом поле, а холст показывает его
   * часть; на телефоне записи идут списком. Холст занимает всё место под
   * шапкой и сам сообщает ширме свои размеры.
   *
   * Поле двигают, потянув за пустое место или средней кнопкой мыши где
   * угодно, и отдаляют колёсиком: над пустым местом — сразу, над окном — с
   * зажатым Ctrl (без него колёсико листает запись в окне).
   */
  defineSlots<{
    /** Подсказка под описанием пустой ширмы, например приглашение войти. */
    emptyNote?: () => unknown;
  }>();

  const {
    windows,
    visibleWindows,
    setBoard,
    toBoardPoint,
    addNote,
    arrange,
    minimizeAll,
    restoreAll,
    clear,
  } = useDmScreen();

  const { pickerPlacement, setPickerPlacement } = useDmScreenLayouts();

  const { view, board, toCanvasPoint, pan, zoomTo, fit } = useDmScreenView();

  const { isMobile } = useBreakpoints();

  const isWindowed = computed(() => !isMobile.value);

  const canvas = useTemplateRef<HTMLElement>('canvas');

  const {
    left: canvasLeft,
    top: canvasTop,
    width: canvasWidth,
    height: canvasHeight,
  } = useElementBounding(canvas);

  // Без холста (телефон, страница закрыта) ширма считает место по окну
  // браузера
  watchEffect(() => {
    if (isWindowed.value && canvasWidth.value > 0 && canvasHeight.value > 0) {
      setBoard({
        x: canvasLeft.value,
        y: canvasTop.value,
        width: canvasWidth.value,
        height: canvasHeight.value,
      });
    } else {
      setBoard();
    }
  });

  onBeforeUnmount(() => {
    setBoard();
  });

  const hasVisibleWindows = computed(() => visibleWindows.value.length > 0);

  // Окна могли остаться вдали от сохранённого обзора (ширму аккаунта
  // собрали на другом устройстве): тогда холст сразу показывает их все
  whenever(
    () => isWindowed.value && canvasWidth.value > 0 && hasVisibleWindows.value,
    () => {
      const isAnyVisible = visibleWindows.value.some((screenWindow) =>
        isScreenRectVisible(screenWindow, board.value),
      );

      if (!isAnyVisible) {
        fit(visibleWindows.value);
      }
    },
    { once: true },
  );

  const fieldOffset = computed(() => getScreenFieldOffset(view.value));

  // Слой поля: окна стоят в нём по координатам поля, а сдвиг и масштаб
  // задаёт обзор
  const fieldStyle = computed(() => ({
    transform: `translate(${fieldOffset.value.x}px, ${fieldOffset.value.y}px) scale(${view.value.zoom})`,
  }));

  // Точки на пустом месте едут вместе с полем: видно, что оно двигается
  const backdropStyle = computed(() => {
    const step = getScreenBackdropStep(view.value.zoom);

    return {
      backgroundImage: DM_SCREEN_BACKDROP.image,
      backgroundSize: `${step}px ${step}px`,
      backgroundPosition: `${fieldOffset.value.x}px ${fieldOffset.value.y}px`,
    };
  });

  const surface = useTemplateRef<HTMLElement>('surface');

  /** Жест, которым сейчас тянут поле. */
  let panGesture: PanGesture | undefined;

  const isPanning = ref(false);

  const canvasClass = computed(() =>
    isPanning.value ? DM_SCREEN_PANNING_CLASS : '',
  );

  /**
   * Поле начинают тянуть: основной кнопкой за пустое место или средней где
   * угодно — когда окна закрывают холст целиком, пустого места нет.
   * @param event - нажатие на холст
   */
  function startPan(event: PointerEvent): void {
    const isSurfaceDrag =
      event.button === DM_SCREEN_POINTER_BUTTON.main
      && event.target === surface.value;

    const isMiddleDrag = event.button === DM_SCREEN_POINTER_BUTTON.middle;

    if (
      !(isSurfaceDrag || isMiddleDrag)
      || !(event.currentTarget instanceof HTMLElement)
    ) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    panGesture = {
      pointer: { x: event.clientX, y: event.clientY },
      view: view.value,
    };

    isPanning.value = true;
  }

  /**
   * Поле тянут: оно едет за указателем.
   * @param event - движение указателя
   */
  function movePan(event: PointerEvent): void {
    if (!panGesture) {
      return;
    }

    pan(panGesture.view, {
      x: event.clientX - panGesture.pointer.x,
      y: event.clientY - panGesture.pointer.y,
    });
  }

  /** Поле отпустили. */
  function endPan(): void {
    panGesture = undefined;
    isPanning.value = false;
  }

  /**
   * Колёсико меняет масштаб вокруг указателя: над пустым местом — сразу,
   * над окном — только с Ctrl, иначе оно листает запись в окне. Щипок на
   * тачпаде браузер присылает тем же колёсиком с Ctrl.
   * @param event - прокрутка колёсика
   */
  function zoomByWheel(event: WheelEvent): void {
    if (!event.ctrlKey && event.target !== surface.value) {
      return;
    }

    event.preventDefault();

    const distance =
      event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? event.deltaY * DM_SCREEN_ZOOM.wheelLineHeight
        : event.deltaY;

    zoomTo(
      view.value.zoom * Math.exp(-distance * DM_SCREEN_ZOOM.wheelRate),
      toCanvasPoint({ x: event.clientX, y: event.clientY }),
    );
  }

  // Не через шаблон: страницу прокрутка двигать не должна, а отменить её
  // можно только в непассивном обработчике
  useEventListener(canvas, 'wheel', zoomByWheel, { passive: false });

  const isEmpty = computed(() => !windows.value.length);

  const hasWindows = computed(() => !isEmpty.value);

  // Кнопки раскладки видны, пока на ширме есть записи, в том числе когда
  // все окна свёрнуты: «Выровнять» их и развернёт
  const isLayoutControlsVisible = computed(
    () => isWindowed.value && hasWindows.value,
  );

  // Когда свёрнуты все окна, кнопка «Свернуть все» разворачивает их обратно
  const isAllMinimized = computed(
    () => hasWindows.value && !visibleWindows.value.length,
  );

  const minimizeToggle = computed(() =>
    isAllMinimized.value
      ? {
          label: DM_SCREEN_TEXT.restoreAll,
          icon: DM_SCREEN_ICONS.restoreAll,
          toggle: restoreAll,
        }
      : {
          label: DM_SCREEN_TEXT.minimizeAll,
          icon: DM_SCREEN_ICONS.minimizeAll,
          toggle: minimizeAll,
        },
  );

  /** Сворачивает все окна, а если свёрнуты все — разворачивает их. */
  function toggleMinimizeAll(): void {
    minimizeToggle.value.toggle();
  }

  // Где показывать панель раскладок, пока окно тащат: сверху, снизу, нигде
  const pickerMenu = computed<Array<DropdownMenuItem>>(() => [
    { type: 'label', label: DM_SCREEN_TEXT.pickerSettings },
    ...DM_SCREEN_PICKER_OPTIONS.map(
      (option): DropdownMenuItem => ({
        type: 'checkbox',
        label: option.label,
        icon: option.icon,
        checked: pickerPlacement.value === option.placement,
        onSelect: () => setPickerPlacement(option.placement),
      }),
    ),
  ]);

  const rootClass = computed(() =>
    isWindowed.value
      ? DM_SCREEN_BOARD_CLASS.windowed
      : DM_SCREEN_BOARD_CLASS.list,
  );

  /**
   * Кладёт пустую заметку рядом с кнопкой.
   * @param event - клик по кнопке
   */
  function createNote(event: MouseEvent): void {
    addNote(toBoardPoint({ x: event.clientX, y: event.clientY }));
  }

  const isClearOpen = ref(false);

  /** Спрашивает, очистить ли ширму. */
  function openClear(): void {
    isClearOpen.value = true;
  }

  /** Убирает с ширмы все окна: очистку подтвердили. */
  function confirmClear(): void {
    clear();

    isClearOpen.value = false;
  }
</script>

<template>
  <div
    class="flex flex-col"
    :class="rootClass"
  >
    <!-- Шапка выше холста по слою: список поиска ложится поверх окон -->
    <header
      class="relative z-10 flex shrink-0 flex-wrap items-center gap-x-6 gap-y-3 border-b border-default px-4 py-3"
    >
      <h1 class="flex items-center gap-2 text-2xl text-highlighted">
        <UIcon
          :name="DM_SCREEN_ICON"
          class="size-6 shrink-0 text-primary"
        />

        {{ DM_SCREEN_TITLE }}
      </h1>

      <div
        class="ml-auto flex flex-auto flex-wrap items-center justify-end gap-2"
      >
        <DmScreenSearch />

        <UButton
          :icon="DM_SCREEN_ICONS.note"
          :label="DM_SCREEN_TEXT.addNote"
          color="neutral"
          variant="outline"
          @click.left.exact.prevent="createNote"
        />

        <UTooltip
          v-if="isLayoutControlsVisible"
          :text="DM_SCREEN_TEXT.arrange"
        >
          <UButton
            :icon="DM_SCREEN_ICONS.arrange"
            :aria-label="DM_SCREEN_TEXT.arrange"
            color="neutral"
            variant="outline"
            @click.left.exact.prevent="arrange"
          />
        </UTooltip>

        <UTooltip
          v-if="isLayoutControlsVisible"
          :text="minimizeToggle.label"
        >
          <UButton
            :icon="minimizeToggle.icon"
            :aria-label="minimizeToggle.label"
            color="neutral"
            variant="outline"
            @click.left.exact.prevent="toggleMinimizeAll"
          />
        </UTooltip>

        <UDropdownMenu
          v-if="isWindowed"
          :items="pickerMenu"
        >
          <UTooltip :text="DM_SCREEN_TEXT.pickerSettings">
            <UButton
              :icon="DM_SCREEN_ICONS.pickerSettings"
              :aria-label="DM_SCREEN_TEXT.pickerSettings"
              color="neutral"
              variant="outline"
            />
          </UTooltip>
        </UDropdownMenu>

        <UButton
          v-if="hasWindows"
          :icon="DM_SCREEN_ICONS.clear"
          :label="DM_SCREEN_TEXT.clear"
          color="error"
          variant="outline"
          @click.left.exact.prevent="openClear"
        />
      </div>
    </header>

    <div
      v-if="isWindowed"
      ref="canvas"
      class="relative min-h-0 flex-auto overflow-hidden"
      :class="canvasClass"
      @pointerdown="startPan"
      @pointermove="movePan"
      @pointerup="endPan"
      @pointercancel="endPan"
    >
      <!-- Пустое место поля: за него поле тянут -->
      <div
        ref="surface"
        aria-hidden="true"
        :style="backdropStyle"
        class="absolute inset-0 cursor-grab touch-none"
      />

      <div
        v-if="isEmpty"
        class="absolute inset-0 flex items-center justify-center overflow-y-auto p-4"
      >
        <div class="flex max-w-lg flex-col items-center gap-4">
          <UEmpty
            :icon="DM_SCREEN_ICON"
            :title="DM_SCREEN_TEXT.emptyTitle"
            :description="DM_SCREEN_TEXT.emptyDescription"
          />

          <slot name="emptyNote" />
        </div>
      </div>

      <!--
        Слой поля. Свой слой: номера слоёв окон не спорят с остальной
        страницей. Сам слой места не занимает, поэтому не закрывает пустое
        место поля от указателя
      -->
      <div
        :style="fieldStyle"
        class="absolute top-0 left-0 isolate origin-top-left"
      >
        <DmScreenWindow
          v-for="screenWindow in visibleWindows"
          :key="screenWindow.id"
          :screen-window="screenWindow"
        />
      </div>

      <!-- Общие границы — в координатах поля, но поверх всех окон -->
      <div
        :style="fieldStyle"
        class="absolute top-0 left-0 origin-top-left"
      >
        <DmScreenSplitters />
      </div>

      <DmScreenLayoutOverlay />

      <DmScreenDock />

      <DmScreenNavigator />
    </div>

    <div
      v-else-if="isEmpty"
      class="m-auto flex max-w-lg flex-col items-center gap-4 p-4"
    >
      <UEmpty
        :icon="DM_SCREEN_ICON"
        :title="DM_SCREEN_TEXT.emptyTitle"
        :description="DM_SCREEN_TEXT.emptyDescription"
      />

      <slot name="emptyNote" />
    </div>

    <DmScreenList v-else />

    <ConfirmDialog
      v-model:open="isClearOpen"
      :title="DM_SCREEN_TEXT.clearTitle"
      :description="DM_SCREEN_TEXT.clearDescription"
      :confirm-label="DM_SCREEN_TEXT.clear"
      :confirm-icon="DM_SCREEN_ICONS.clear"
      confirm-color="error"
      @confirm="confirmClear"
    />
  </div>
</template>
