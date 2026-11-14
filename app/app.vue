<script setup lang="ts">
  import { ru } from '@nuxt/ui/locale';

  import { GRAPHICS_MODE_ATTRIBUTE } from '~/shared/consts';
  import { DiceRollerFloatButton } from '~dice-roller/float-button';
  import { DiceRollerModal } from '~dice-roller/modal';
  import { CookieConsentBanner } from '~infrastructure/cookie-consent/ui';
  import { useMaintenanceGate } from '~infrastructure/maintenance/composables';
  import { MaintenanceScreen } from '~infrastructure/maintenance/ui';
  import { PwaConfig } from '~infrastructure/pwa';
  import { SidebarPanel } from '~infrastructure/sidebar';
  import { SubscriptionExpiryNotice } from '~profile/activation/ui';

  import '~/assets/css/index.scss';

  useThemeHead();

  const { mode: graphicsMode } = useGraphicsMode();

  useHead({
    htmlAttrs: {
      // По режиму графики стили отключают размытие фона
      [GRAPHICS_MODE_ATTRIBUTE]: graphicsMode,
    },
  });

  // Режим «сайт закрыт на обновление»: вместо страницы — заглушка. Сама
  // страница при этом не рендерится вовсе, и её данные не загружаются.
  const { isBlocked: isMaintenanceBlocked } = useMaintenanceGate();
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

    <MaintenanceScreen v-if="isMaintenanceBlocked" />

    <div
      v-else
      class="ttg-app"
    >
      <PwaConfig />

      <SidebarPanel />

      <div class="relative min-h-dvh w-full">
        <NuxtPage />
      </div>

      <ClientOnly>
        <Teleport to="body">
          <DiceRollerFloatButton />

          <DiceRollerModal />

          <CookieConsentBanner />

          <SubscriptionExpiryNotice />
        </Teleport>
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
