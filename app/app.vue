<script setup lang="ts">
  import { ru } from '@nuxt/ui/locale';
  import { DiceRollerFloatButton } from '~dice-roller/float-button';
  import { DiceRollerModal as DiceRoller } from '~dice-roller/modal';
  import { PwaConfig } from '~pwa/config';
  import { SidebarPanel } from '~sidebar/panel';

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

      <ClientOnly>
        <DiceRollerFloatButton />

        <DiceRoller />
      </ClientOnly>
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
