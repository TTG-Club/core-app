<script setup lang="ts">
  import { SOCIAL_LINKS } from './model';
  import Color from 'colorjs.io';

  const links = computed(() =>
    SOCIAL_LINKS.map((link) => {
      const baseColor = new Color(link.color);
      const borderColor = baseColor.clone();

      borderColor.oklch.l = 0.45;
      borderColor.oklch.c = 0.12;

      return {
        ...link,
        borderColor: !link.disabled ? borderColor.toString() : undefined,
      };
    }),
  );
</script>

<template>
  <div class="flex w-full flex-col gap-3">
    <NuxtLink
      v-for="(link, index) in links"
      :key="index"
      :to="link.url"
      :class="[
        'flex items-center justify-center gap-2',
        'h-12 overflow-hidden no-underline shadow-lg',
        `rounded-md border border-default`,
        'bg-muted hover:bg-elevated',
        'transition-colors duration-200',
        { 'pointer-events-none opacity-50': link.disabled },
      ]"
      :style="{ borderColor: link.borderColor }"
      target="_blank"
    >
      <UIcon
        :style="{ color: !link.disabled ? link.color : undefined }"
        :name="link.icon"
        size="24"
      />

      <span class="font-semibold">{{ link.name }}</span>
    </NuxtLink>
  </div>
</template>
