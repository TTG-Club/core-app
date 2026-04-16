<script setup lang="ts">
  import { MarkupRender } from '~ui/markup';

  const { data: greeting } = await useAsyncData('home-greetings', () =>
    $fetch<{ image: string; text: string; persona: string } | null>(
      '/api/v2/notification',
    ),
  );
</script>

<template>
  <div
    v-if="greeting"
    class="flex w-10/12 items-center justify-center"
  >
    <div
      :class="[
        'relative flex items-center justify-center',
        'w-100 px-5 py-6 max-sm:p-2',
        'rounded-xl border border-blue-500',
        'bg-(--color-message) shadow-md',
        'font-semibold text-black max-sm:text-xs',
        $style.message,
      ]"
    >
      <span class="text-center">
        <MarkupRender :render-node="greeting.text" />
      </span>
    </div>

    <img
      :src="greeting.image"
      :alt="greeting.persona"
      class="h-45 w-50 shrink-0 self-end object-contain object-bottom max-sm:h-30 max-sm:w-30"
    />
  </div>
</template>

<style module lang="scss">
  .message {
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
</style>
