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

<!--
  Скругление задаёт тот, кто вставляет обложку: в карточке каталога она лежит
  вплотную к краям и скругляется только сверху, а на странице игры и в форме
  стоит отдельным блоком.
-->
<template>
  <div
    class="relative flex aspect-video w-full items-center justify-center overflow-hidden bg-linear-to-br from-elevated via-elevated to-primary/15"
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

    <!-- Заглушка оформлена как знак формата игры, а не как пустое место:
      обложки нет у большинства игр, и ряд серых прямоугольников читался бы
      сломанной вёрсткой. Точечная сетка даёт фактуру, по которой заглушка
      не путается с не загрузившейся картинкой -->
    <template v-else>
      <div
        class="absolute inset-0 bg-[radial-gradient(currentColor_1px,transparent_1px)] bg-size-[14px_14px] text-muted opacity-15"
      />

      <div
        class="relative grid size-16 place-items-center rounded-full bg-accented/60 ring-1 ring-accented"
      >
        <UIcon
          :name="placeholderIcon"
          class="size-8 text-dimmed"
        />
      </div>
    </template>
  </div>
</template>
