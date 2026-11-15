<script setup lang="ts">
  import { HomeEyebrow } from '~home/ui-kit';

  /**
   * Панель калькулятора в «окованной» рамке: по углам — акцентные уголки,
   * по верхней кромке — тонкая позолота. Все карточки страницы собраны на ней,
   * поэтому выглядят одним набором.
   */
  defineProps<{
    /** Подпись в шапке панели; без неё шапка не рисуется */
    label?: string;
    /** Иконка рядом с подписью */
    icon?: string;
  }>();
</script>

<template>
  <section
    class="relative flex min-w-0 flex-col gap-3 rounded-xl border border-default bg-muted p-3 sm:gap-4 sm:p-4"
    :class="$style.panel"
  >
    <header
      v-if="label"
      class="flex items-center gap-3"
    >
      <HomeEyebrow
        :label
        :icon
      />

      <span
        class="h-px min-w-4 flex-1"
        :class="$style.rule"
        aria-hidden="true"
      />

      <slot name="actions" />
    </header>

    <slot />
  </section>
</template>

<style module lang="scss">
  .panel {
    --corner-size: 1.125rem;

    /* Уголки: рамка акцентного цвета по всему контуру, от которой маска
       оставляет только четыре угла — без лишних элементов в разметке */
    &::before {
      pointer-events: none;
      content: '';

      position: absolute;
      inset: -1px;

      border: 2px solid var(--ui-primary);
      border-radius: inherit;

      opacity: 0.7;

      mask:
        linear-gradient(#000 0 0) top left / var(--corner-size)
          var(--corner-size) no-repeat,
        linear-gradient(#000 0 0) top right / var(--corner-size)
          var(--corner-size) no-repeat,
        linear-gradient(#000 0 0) bottom left / var(--corner-size)
          var(--corner-size) no-repeat,
        linear-gradient(#000 0 0) bottom right / var(--corner-size)
          var(--corner-size) no-repeat;
    }

    /* Позолота верхней кромки */
    &::after {
      pointer-events: none;
      content: '';

      position: absolute;
      top: -1px;
      right: 15%;
      left: 15%;

      height: 1px;

      background: linear-gradient(
        90deg,
        transparent,
        color-mix(in oklab, var(--ui-primary) 70%, transparent),
        transparent
      );
    }
  }

  .rule {
    background: linear-gradient(90deg, var(--ui-border-accented), transparent);
  }
</style>
