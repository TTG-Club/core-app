<script setup lang="ts">
  import 'virtual:svg-icons-register';
  import '~/assets/styles/index.scss';
  import ruRU from 'ant-design-vue/locale/ru_RU';
  import { useTheme } from '~/shared/composables';
  import { SidebarPanel } from '~/features/sidebar';

  const { themeConfig } = useTheme();
</script>

<template>
  <AConfigProvider
    :locale="ruRU"
    :theme="themeConfig"
  >
    <AApp>
      <AExtractStyle>
        <NuxtLoadingIndicator
          color="var(--color-primary)"
          error-color="var(--color-error)"
        />

        <div class="ttg-app">
          <SidebarPanel />

          <div :class="$style.container">
            <slot />
          </div>
        </div>
      </AExtractStyle>
    </AApp>
  </AConfigProvider>
</template>

<style module lang="scss">
  .container {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 100vh;
  }
</style>
