<script setup lang="ts">
  import 'virtual:svg-icons-register';
  import '~/assets/styles/index.scss';
  import { PwaConfig } from '~pwa/config';
  import { SidebarPanel } from '~sidebar/panel';
</script>

<template>
  <NuxtLayout>
    <PwaConfig />

    <SidebarPanel />

    <div :class="$style.container">
      <NuxtPage />
    </div>
  </NuxtLayout>
</template>

<style module lang="scss">
  .container {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 100vh;
  }
</style>
