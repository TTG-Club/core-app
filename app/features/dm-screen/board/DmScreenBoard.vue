<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import { ConfirmDialog } from '~initiative/ui-kit';

  import { useDmScreen, useDmScreenLayouts } from '../composables';
  import {
    DM_SCREEN_BOARD_CLASS,
    DM_SCREEN_ICON,
    DM_SCREEN_ICONS,
    DM_SCREEN_PICKER_OPTIONS,
    DM_SCREEN_TEXT,
    DM_SCREEN_TITLE,
  } from '../model';
  import { DmScreenWindow } from '../window';
  import DmScreenDock from './DmScreenDock.vue';
  import DmScreenLayoutOverlay from './DmScreenLayoutOverlay.vue';
  import DmScreenList from './DmScreenList.vue';
  import DmScreenSearch from './DmScreenSearch.vue';
  import DmScreenSplitters from './DmScreenSplitters.vue';

  /**
   * Ширма Мастера: шапка с поиском и кнопками, под ней холст. На широком
   * экране записи стоят на холсте окнами, на телефоне идут списком. Холст
   * занимает всё место под шапкой и сам сообщает ширме свои размеры: окна
   * считают место от его левого верхнего угла.
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
    >
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

      <!-- Свой слой: номера слоёв окон не спорят с остальной страницей -->
      <div class="absolute inset-0 isolate">
        <DmScreenWindow
          v-for="screenWindow in visibleWindows"
          :key="screenWindow.id"
          :screen-window="screenWindow"
        />
      </div>

      <DmScreenSplitters />

      <DmScreenLayoutOverlay />

      <DmScreenDock />
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
