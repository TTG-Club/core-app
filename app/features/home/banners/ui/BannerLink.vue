<script setup lang="ts">
  defineProps<{
    to: string;
    title: string;
    description: string;
    backgroundUrl: string;
  }>();
</script>

<template>
  <NuxtLink
    :class="[
      'relative flex flex-col gap-3 bg-muted p-6',
      'rounded-lg border border-default shadow-lg',
      'group overflow-hidden no-underline',
    ]"
    :to
  >
    <img
      :class="[
        'absolute inset-0 block size-full object-cover object-center opacity-40',
        'transition-transform duration-200 group-hover:scale-115',
      ]"
      :src="backgroundUrl"
      :alt="title"
    />

    <span class="relative z-10 text-2xl">{{ title }}</span>

    <p class="relative z-10">{{ description }}</p>
  </NuxtLink>
</template>
