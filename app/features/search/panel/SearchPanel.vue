<script setup lang="ts">
  import { useGlobalSearch } from '~search/composable';

  const { open } = useGlobalSearch();
</script>

<template>
  <div class="flex w-full flex-col items-center max-sm:mt-[3dvw] lg:w-1/2">
    <div
      class="flex w-full items-center justify-center px-8 max-sm:hidden"
      :class="$style['message-block']"
    >
      <div
        class="relative flex w-1/2 items-center justify-center rounded-2xl border-1 border-blue-500 px-5 py-6 shadow-md"
        :class="$style['message']"
      >
        Смотри-ка, новый паладин правил! Брось на харизму, чтобы не утонуть в
        деталях.
      </div>

      <div :class="$style['greeter']"></div>
    </div>

    <UButton
      class="relative mb-6 rounded-full py-4 hover:bg-accented"
      :class="$style['glow-button']"
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
  .message-block {
    z-index: -1;
    .message {
      color: #000;
      background-color: #f5eaea;

      &:after {
        content: '';

        position: absolute;
        top: 30%;
        right: -10px;
        transform: translateY(-50%);

        width: 0;
        height: 0;
        border-top: 10px solid transparent;
        border-bottom: 10px solid transparent;
        border-left: 10px solid var(--color-blue-500); /* Цвет фона */
      }
    }

    .greeter {
      display: block;

      width: 220px;
      height: 200px;

      background-image: url('/s3/sections/greeter.png');
      background-repeat: no-repeat;
      background-size: cover;
    }
  }
  .glow-button {
    &:before {
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
