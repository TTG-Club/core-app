<script setup lang="ts">
  import { HomeGreetings } from '~home/greetings';

  import { useGlobalSearch } from '../composable';
  import { SEARCH_PANEL_PLACEHOLDER, SEARCH_PANEL_SHORTCUT } from './model';

  const { open } = useGlobalSearch();
  const { isDesktop } = useDevice();
</script>

<template>
  <div
    class="relative z-10 flex w-full max-w-3xl flex-col items-center 2xl:max-w-4xl"
  >
    <HomeGreetings class="-z-1" />

    <!--
      Поле поиска, а не кнопка: так строка читается как то, во что можно
      печатать. Клик и горячая клавиша всё так же открывают палитру поиска —
      набор идёт уже в ней.
    -->
    <button
      type="button"
      :class="[
        $style.field,
        'group relative flex w-full cursor-pointer items-center gap-3',
        'rounded-xl border border-accented bg-default px-4 py-3.5',
        'text-left transition-colors duration-200',
        'hover:border-primary/60 hover:bg-elevated',
      ]"
      @click.left.exact.prevent="open"
    >
      <UIcon
        name="tabler:search"
        class="size-5 shrink-0 text-dimmed transition-colors group-hover:text-primary"
      />

      <span class="min-w-0 flex-1 truncate text-sm text-muted sm:text-base">
        {{ SEARCH_PANEL_PLACEHOLDER }}
      </span>

      <UKbd
        v-if="isDesktop"
        :value="SEARCH_PANEL_SHORTCUT"
        class="shrink-0"
      />
    </button>
  </div>
</template>

<style module lang="scss">
  /* Вращающееся свечение по контуру поля — единственный «магический» штрих в
     строгой шапке. Лежит под полем (z-index: -1) и не перехватывает клики.

     ВАЖНО: заливка самого поля должна быть НЕПРОЗРАЧНОЙ (`bg-default`). Стоит
     сделать её полупрозрачной — размытый градиент просвечивает внутрь и
     превращается в грязное пятно под текстом; наружу должен выходить только
     ореол за краями. */
  .field {
    &:before {
      will-change: background;
      content: '';

      position: absolute;
      z-index: -1;
      inset: -3px;

      border-radius: inherit;

      opacity: 0.5;
      background: conic-gradient(
        from var(--gradient-angle),
        var(--ui-color-primary-800),
        var(--ui-color-primary-400),
        var(--ui-color-primary-700),
        var(--ui-color-primary-300),
        var(--ui-color-primary-800)
      );
      filter: blur(7px);

      transition: opacity 200ms ease;
      animation: gradient-rotate 12s linear infinite;
    }

    &:hover:before,
    &:focus-visible:before {
      opacity: 0.9;
    }
  }

  @property --gradient-angle {
    inherits: false;
    initial-value: 0deg;
    syntax: '<angle>';
  }

  @keyframes gradient-rotate {
    0% {
      --gradient-angle: 0deg;
    }

    100% {
      --gradient-angle: 360deg;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .field:before {
      animation: none;
    }
  }
</style>
