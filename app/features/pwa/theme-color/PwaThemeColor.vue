<script setup lang="ts">
  import { useTheme } from '~/shared/composables';

  const { themeName } = useTheme();

  const {
    app: { pwa },
  } = useRuntimeConfig();

  const themeColor = computed<string>(() => pwa.themeColor[themeName.value]);
</script>

<template>
  <Meta
    name="theme-color"
    :content="themeColor"
  />
</template>
