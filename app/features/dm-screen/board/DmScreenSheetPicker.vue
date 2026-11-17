<script setup lang="ts">
  import type { ScreenSheetOption } from '../model';

  import { useDmScreen, useDmScreenSheets } from '../composables';
  import {
    DM_SCREEN_ICONS,
    DM_SCREEN_SEARCH_MARK_CLASS,
    DM_SCREEN_SHEET_SOURCE_LABEL,
    DM_SCREEN_SHEET_WINDOW_SIZE,
    DM_SCREEN_TEXT,
  } from '../model';

  /**
   * Кнопка «Персонаж» в шапке ширмы: список листов персонажей, которые
   * мастер может поставить на ширму окном, — свои и чужие, к которым ему
   * дали доступ. В окне встаёт настоящий лист: свой правится и сохраняется,
   * чужой открыт на просмотр. Гостю кнопка не показывается: листы есть только у
   * вошедшего. Список перечитывается при каждом открытии.
   */
  const { add, windows } = useDmScreen();

  const { options, isLoading, hasError, isAuthorized, load } =
    useDmScreenSheets();

  const isOpen = ref(false);

  watch(isOpen, (opened) => {
    if (opened) {
      void load();
    }
  });

  const isEmpty = computed(
    () => !isLoading.value && !hasError.value && !options.value.length,
  );

  const addedPaths = computed(
    () => new Set(windows.value.map((screenWindow) => screenWindow.path)),
  );

  const optionViews = computed(() =>
    options.value.map((option) => ({
      option,
      sourceLabel: DM_SCREEN_SHEET_SOURCE_LABEL[option.source],
      markClass: addedPaths.value.has(option.path)
        ? DM_SCREEN_SEARCH_MARK_CLASS.added
        : DM_SCREEN_SEARCH_MARK_CLASS.idle,
    })),
  );

  /**
   * Ставит лист персонажа окном на ширму и закрывает список.
   * @param option - выбранный лист
   */
  function addSheet(option: ScreenSheetOption): void {
    add({
      path: option.path,
      title: option.name,
      size: DM_SCREEN_SHEET_WINDOW_SIZE,
    });

    isOpen.value = false;
  }
</script>

<template>
  <UPopover
    v-if="isAuthorized"
    v-model:open="isOpen"
  >
    <UButton
      :icon="DM_SCREEN_ICONS.sheet"
      :label="DM_SCREEN_TEXT.addSheet"
      color="neutral"
      variant="outline"
    />

    <template #content>
      <div class="flex max-h-[60dvh] w-80 flex-col overflow-y-auto p-1">
        <p class="flex items-center gap-2 px-3 py-2 text-sm text-muted">
          {{ DM_SCREEN_TEXT.sheetsTitle }}

          <UIcon
            v-if="isLoading"
            :name="DM_SCREEN_ICONS.loading"
            class="size-4 animate-spin"
          />
        </p>

        <p
          v-if="hasError"
          class="px-3 py-2 text-sm text-error"
        >
          {{ DM_SCREEN_TEXT.sheetsFailed }}
        </p>

        <p
          v-if="isEmpty"
          class="px-3 py-2 text-sm text-muted"
        >
          {{ DM_SCREEN_TEXT.sheetsEmpty }}
        </p>

        <button
          v-for="view in optionViews"
          :key="view.option.path"
          type="button"
          class="flex items-center gap-3 rounded px-3 py-2 text-left transition-colors hover:bg-elevated"
          @click.left.exact.prevent="addSheet(view.option)"
        >
          <UAvatar
            :src="view.option.avatarUrl"
            :alt="view.option.name"
            :icon="DM_SCREEN_ICONS.sheetAvatar"
            size="lg"
            class="rounded-md"
          />

          <span class="min-w-0 flex-auto">
            <span class="block truncate text-highlighted">
              {{ view.option.name }}
            </span>

            <span class="block truncate text-sm text-muted">
              {{ view.option.subtitle }}
            </span>

            <span class="block truncate text-xs text-dimmed">
              {{ view.sourceLabel }}
            </span>
          </span>

          <UIcon
            :name="DM_SCREEN_ICONS.add"
            class="size-5 shrink-0"
            :class="view.markClass"
          />
        </button>
      </div>
    </template>
  </UPopover>
</template>
