<script setup lang="ts">
  const {
    public: { pwa },
  } = useRuntimeConfig();

  const favicons = computed(() => [
    {
      rel: 'icon',
      type: 'image/svg+xml',
      href: '/favicons/favicon.svg',
    },
    {
      rel: 'apple-touch-icon',
      href: '/favicons/apple-touch-icon.png',
    },
    ...pwa.favicons.map((size: number) => ({
      rel: 'icon',
      type: 'image/png',
      sizes: `${size}x${size}`,
      href: `/favicons/${size}x${size}.png`,
    })),
  ]);
</script>

<template>
  <Link
    v-for="favicon in favicons"
    :key="favicon.href"
    v-bind="favicon"
  />
</template>
