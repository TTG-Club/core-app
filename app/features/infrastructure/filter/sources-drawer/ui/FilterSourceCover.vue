<script setup lang="ts">
  import {
    FILTER_SOURCES_COVER_PLACEHOLDER_ICON,
    FILTER_SOURCES_SELECTED_ICON,
  } from '../../model';

  /**
   * Маленькая обложка книги в строке панели источников. Обложка есть не у
   * каждого источника и может не загрузиться — тогда на её месте значок
   * книги, чтобы названия в списке не прыгали по горизонтали.
   */
  const { image = undefined, selected = false } = defineProps<{
    /** Адрес обложки; у источника без обложки его нет. */
    image?: string;

    /** Отмечен ли источник: тогда обложка обведена и на ней стоит отметка. */
    selected?: boolean;
  }>();

  const frameClass = computed(() =>
    selected ? 'ring ring-primary/40' : 'opacity-60',
  );

  const isFailed = ref(false);

  // Строка переиспользуется, когда список меняется под поиском: ошибка
  // загрузки прежней обложки не должна прятать новую.
  watch(
    () => image,
    () => {
      isFailed.value = false;
    },
  );

  const isImageShown = computed(() => !!image && !isFailed.value);

  /** Запоминает, что обложка не загрузилась. */
  function handleError(): void {
    isFailed.value = true;
  }
</script>

<template>
  <span class="relative shrink-0">
    <span
      class="flex h-10 w-7 items-center justify-center overflow-hidden rounded-sm bg-elevated text-dimmed"
      :class="frameClass"
    >
      <img
        v-if="isImageShown"
        :src="image"
        alt=""
        loading="lazy"
        decoding="async"
        class="size-full object-cover"
        @error="handleError"
      />

      <UIcon
        v-else
        :name="FILTER_SOURCES_COVER_PLACEHOLDER_ICON"
        class="size-4"
      />
    </span>

    <span
      v-if="selected"
      class="absolute -right-1.5 -bottom-1 flex size-4 items-center justify-center rounded-full bg-primary text-inverted ring-2 ring-default"
    >
      <UIcon
        :name="FILTER_SOURCES_SELECTED_ICON"
        class="size-3"
      />
    </span>
  </span>
</template>
