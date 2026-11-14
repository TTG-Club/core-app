<script setup lang="ts">
  import type { ButtonProps } from '@nuxt/ui';

  import { useDmScreenAdd } from '../composables';
  import {
    DM_SCREEN_ICONS,
    DM_SCREEN_TEXT,
    isScreenEntryPath,
    toScreenPath,
  } from '../model';

  /**
   * Кнопка «В ширму» на карточке записи: кладёт запись окном на ширму
   * Мастера. У записей разделов, которые ширма показать не умеет, кнопки
   * нет.
   */
  const {
    url,
    title = undefined,
    size = undefined,
  } = defineProps<{
    /** Адрес записи: абсолютный или путь на сайте. */
    url: string;
    /** Название записи, если карточка его знает. */
    title?: string;
    size?: ButtonProps['size'];
  }>();

  const { addToScreen, isPending } = useDmScreenAdd();

  const isAvailable = computed(() => isScreenEntryPath(toScreenPath(url)));

  /** Кладёт запись карточки на ширму. */
  function addEntry(): void {
    void addToScreen(toScreenPath(url), title);
  }
</script>

<template>
  <UTooltip
    v-if="isAvailable"
    :text="DM_SCREEN_TEXT.add"
  >
    <UButton
      :icon="DM_SCREEN_ICONS.add"
      :aria-label="DM_SCREEN_TEXT.add"
      :loading="isPending"
      :size
      variant="ghost"
      color="neutral"
      @click.left.exact.prevent="addEntry"
    />
  </UTooltip>
</template>
