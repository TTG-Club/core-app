<script setup lang="ts">
  import '~/assets/css/index.scss';
  import { ru } from '@nuxt/ui/locale';

  import { PwaConfig } from '~pwa/config';
  import { SidebarPanel } from '~sidebar/panel';

  const { name } = useTheme();

  useHead({
    htmlAttrs: {
      class: name,
    },
  });
</script>

<template>
  <UApp
    :locale="ru"
    :tooltip="{
      disableHoverableContent: true,
    }"
    :toaster="{
      position: 'top-right',
    }"
  >
    <NuxtLoadingIndicator
      color="var(--color-primary)"
      error-color="var(--color-error)"
    />

    <div class="ttg-app">
      <PwaConfig />

      <SidebarPanel />

      <div class="min-h-dvh w-full">
        <NuxtPage />
      </div>
    </div>
  </UApp>
</template>

<style module lang="scss">
  .container {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 100vh;
  }
</style>
