<script setup lang="ts">
  import { PwaFavicons } from '../favicons';
  import { PwaManifest } from '../manifest';
  import { PwaThemeColor } from '../theme-color';
</script>

<template>
  <PwaManifest />

  <PwaFavicons />

  <PwaThemeColor />
</template>
