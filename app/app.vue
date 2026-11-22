<script setup lang="ts">
  import { ru } from '@nuxt/ui/locale';

  import { GRAPHICS_MODE_ATTRIBUTE } from '~/shared/consts';
  import { CookieConsentBanner } from '~infrastructure/cookie-consent/ui';
  import { useMaintenanceGate } from '~infrastructure/maintenance/composables';
  import { PwaConfig } from '~infrastructure/pwa';
  import { SidebarPanel } from '~infrastructure/sidebar';

  import '~/assets/css/index.scss';

  // Всё, что ниже, на первом экране не участвует: кубики и напоминание о
  // подписке рисуются только в браузере уже после запуска страницы, заглушка
  // обновления — только пока сайт закрыт. Они грузятся отдельными чанками,
  // чтобы история бросков (IndexedDB), разбор формул кубиков и модели
  // подписки не лежали в стартовом скрипте каждой страницы
  const DiceRollerFloatButton = defineAsyncComponent(() =>
    import('~dice-roller/float-button').then(
      (buttonModule) => buttonModule.DiceRollerFloatButton,
    ),
  );

  const DiceRollerModal = defineAsyncComponent(() =>
    import('~dice-roller/modal').then(
      (modalModule) => modalModule.DiceRollerModal,
    ),
  );

  const SubscriptionExpiryNotice = defineAsyncComponent(() =>
    import('~profile/activation/ui').then(
      (noticeModule) => noticeModule.SubscriptionExpiryNotice,
    ),
  );

  const MaintenanceScreen = defineAsyncComponent(() =>
    import('~infrastructure/maintenance/ui').then(
      (screenModule) => screenModule.MaintenanceScreen,
    ),
  );

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
