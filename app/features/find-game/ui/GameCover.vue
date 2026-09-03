<script setup lang="ts">
  import { GAME_TYPE_ICONS } from '../model';

  const { imageUrl, alt, gameType } = defineProps<{
    /** Обложка игры; у большинства игр её нет. */
    imageUrl: string | null;
    alt: string;
    /** Формат игры — по нему подбирается иконка-заглушка. */
    gameType: keyof typeof GAME_TYPE_ICONS;
  }>();

  // Битая ссылка на обложку так же обычна, как её отсутствие: картинки лежат
  // на чужих хостах и умирают молча. Оба случая ведут к одной заглушке.
  const hasLoadError = ref(false);

  const showPlaceholder = computed(() => !imageUrl || hasLoadError.value);

  const placeholderIcon = computed(() => GAME_TYPE_ICONS[gameType]);

  /** Обложка не загрузилась — переключаемся на заглушку. */
  function handleLoadError(): void {
    hasLoadError.value = true;
  }

  // Смена игры в переиспользованной карточке должна снимать прежнюю ошибку,
  // иначе новая обложка не покажется никогда.
  watch(
    () => imageUrl,
    () => {
      hasLoadError.value = false;
    },
  );
</script>

<template>
  <div
    class="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-md bg-elevated"
  >
    <img
      v-if="!showPlaceholder && imageUrl"
      :src="imageUrl"
      :alt="alt"
      loading="lazy"
      decoding="async"
      class="size-full object-cover"
      @error="handleLoadError"
    />

    <UIcon
      v-else
      :name="placeholderIcon"
      class="size-10 text-dimmed"
    />
  </div>
</template>
