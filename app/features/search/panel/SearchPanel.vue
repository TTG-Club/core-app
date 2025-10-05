<script setup lang="ts">
  import { useGlobalSearch } from '~search/composable';
  import { HomeGreetings } from '~home/greetings';

  const { open } = useGlobalSearch();
</script>

<template>
  <div class="flex w-full flex-col items-center max-sm:mt-[3dvw] lg:w-1/2">
    <HomeGreetings class="-z-1" />

    <UButton
      class="relative mb-6 rounded-full py-4 hover:bg-accented"
      :class="$style.glowButton"
      variant="subtle"
      color="neutral"
      size="xl"
      block
      @click.left.exact.prevent="open"
    >
      <span class="text-sm">
        Нажмите тут или <UKbd value="\">\</UKbd> для начала поиска
      </span>
    </UButton>
  </div>
</template>

<style module lang="scss">
  .glowButton {
    &:before {
      will-change: background;
      content: '';

      position: absolute;
      z-index: -1;
      inset: 0;

      border-radius: inherit;

      background: conic-gradient(
        from var(--gradient-angle),
        var(--ui-color-primary-100),
        var(--ui-color-primary-200),
        var(--ui-color-primary-300),
        var(--ui-color-primary-400),
        var(--ui-color-primary-500),
        var(--ui-color-primary-600),
        var(--ui-color-primary-700),
        var(--ui-color-primary-800),
        var(--ui-color-primary-900),
        var(--ui-color-primary-950),
        var(--ui-color-primary-900),
        var(--ui-color-primary-800),
        var(--ui-color-primary-700),
        var(--ui-color-primary-600),
        var(--ui-color-primary-500),
        var(--ui-color-primary-400),
        var(--ui-color-primary-300),
        var(--ui-color-primary-200),
        var(--ui-color-primary-100)
      );
      filter: blur(8px);
      backdrop-filter: blur(8px);

      animation: gradient-rotate 10s linear infinite;
    }

    &:hover {
      &:before {
        background: conic-gradient(
          from var(--gradient-angle),
          var(--ui-color-secondary-100),
          var(--ui-color-secondary-200),
          var(--ui-color-secondary-300),
          var(--ui-color-secondary-400),
          var(--ui-color-secondary-500),
          var(--ui-color-secondary-600),
          var(--ui-color-secondary-700),
          var(--ui-color-secondary-800),
          var(--ui-color-secondary-900),
          var(--ui-color-secondary-950),
          var(--ui-color-secondary-900),
          var(--ui-color-secondary-800),
          var(--ui-color-secondary-700),
          var(--ui-color-secondary-600),
          var(--ui-color-secondary-500),
          var(--ui-color-secondary-400),
          var(--ui-color-secondary-300),
          var(--ui-color-secondary-200),
          var(--ui-color-secondary-100)
        );
      }
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
</style>
