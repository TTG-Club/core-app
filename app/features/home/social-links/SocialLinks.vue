<script setup lang="ts">
  import Color from 'colorjs.io';

  import { HomePanel } from '~home/ui-kit';

  import { SOCIAL_LINKS, SOCIAL_LINKS_ICON, SOCIAL_LINKS_LABEL } from './model';

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
  <HomePanel
    :label="SOCIAL_LINKS_LABEL"
    :icon="SOCIAL_LINKS_ICON"
    body-class="grid grid-cols-2 gap-2 p-2"
  >
    <NuxtLink
      v-for="(link, index) in links"
      :key="index"
      :to="link.url"
      :class="[
        'flex items-center justify-center gap-2',
        'h-11 overflow-hidden no-underline',
        'rounded-lg border border-default',
        'bg-default/40 hover:bg-elevated',
        'text-sm font-semibold transition-colors duration-200',
        { 'pointer-events-none opacity-50': link.disabled },
      ]"
      :style="{ borderColor: link.borderColor }"
      target="_blank"
    >
      <UIcon
        :style="{ color: !link.disabled ? link.color : undefined }"
        :name="link.icon"
        class="size-5 shrink-0"
      />

      {{ link.name }}
    </NuxtLink>
  </HomePanel>
</template>
