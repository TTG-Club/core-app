<script setup lang="ts">
  const { data: greeting } = await useAsyncData('home-greetings', () =>
    $fetch<{ image: string; text: string; persona: string } | null>(
      '/api/v2/notification',
    ),
  );
</script>

<template>
  <div
    v-if="greeting"
    class="flex w-full items-center justify-center px-8 max-sm:hidden sm:h-50"
  >
    <div
      :class="[
        'relative flex items-center justify-center',
        'w-1/2 px-5 py-6',
        'rounded-2xl border border-blue-500',
        'bg-(--color-message) shadow-md',
        'font-semibold text-black',
        $style.message,
      ]"
      v-html="greeting.text"
    />

    <div
      class="block h-50 w-55 bg-cover bg-no-repeat"
      :style="{ backgroundImage: `url(${greeting.image})` }"
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
