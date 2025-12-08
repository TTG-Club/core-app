<script setup lang="ts">
  import { ru } from '@nuxt/ui/locale';
  import { PwaConfig } from '~pwa/config';
  import { SidebarPanel } from '~sidebar/panel';

  import DiceRoller from '~/features/roller/modal/DiceRoller.vue';

  import { DiceRollerFloatButton } from './features/roller';

  import '~/assets/css/index.scss';

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
      position: 'bottom-right',
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

      <DiceRollerFloatButton />

      <DiceRoller />
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
