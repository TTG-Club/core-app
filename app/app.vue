<script setup lang="ts">
  import 'virtual:svg-icons-register';
  import '~/assets/styles/index.scss';
  import { SidebarPanel } from '~sidebar/panel';
  import { DrawerCollection } from '~ui/drawer';
</script>

<template>
  <NuxtLayout>
    <SidebarPanel />

    <div :class="$style.container">
      <NuxtPage />
    </div>

    <ClientOnly>
      <DrawerCollection />
    </ClientOnly>
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
