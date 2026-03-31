<script setup lang="ts">
  /**
   * Горизонтальный скроллер навигационных табов профиля.
   * Визуально оформлен как папки в Telegram: фон, скругления,
   * фейд-градиенты по краям и стрелка-индикатор прокрутки.
   */

  const scrollContainer = useTemplateRef<HTMLElement>('scrollContainer');

  const { arrivedState } = useScroll(scrollContainer, {
    offset: { right: 8 },
  });

  const canScrollLeft = computed(() => !arrivedState.left);
  const canScrollRight = computed(() => !arrivedState.right);

  const fadeMask = computed(() => {
    if (canScrollLeft.value && canScrollRight.value) {
      return 'linear-gradient(to right, transparent, black 72px, black calc(100% - 96px), transparent)';
    }

    if (canScrollRight.value) {
      return 'linear-gradient(to right, black calc(100% - 96px), transparent)';
    }

    if (canScrollLeft.value) {
      return 'linear-gradient(to right, transparent, black 72px)';
    }

    return 'none';
  });
</script>

<template>
  <div
    class="relative flex items-center overflow-hidden rounded-xl border border-default bg-elevated"
  >
    <!-- Индикатор прокрутки влево -->
    <Transition name="fade">
      <div
        v-if="canScrollLeft"
        class="pointer-events-none absolute top-1/2 left-0.5 z-10 flex -translate-y-1/2 items-center"
      >
        <UIcon
          name="tabler:chevron-left"
          class="size-5 animate-pulse text-dimmed"
        />
      </div>
    </Transition>

    <!-- Скроллируемая область -->
    <div
      ref="scrollContainer"
      class="hidden-scrollbar flex gap-1 overflow-x-auto p-1.5"
      :style="{ maskImage: fadeMask, WebkitMaskImage: fadeMask }"
    >
      <slot />
    </div>

    <!-- Индикатор прокрутки вправо -->
    <Transition name="fade">
      <div
        v-if="canScrollRight"
        class="pointer-events-none absolute top-1/2 right-0.5 z-10 flex -translate-y-1/2 items-center"
      >
        <UIcon
          name="tabler:chevron-right"
          class="size-5 animate-pulse text-dimmed"
        />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.2s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>
