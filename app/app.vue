<script setup lang="ts">
  import 'virtual:svg-icons-register';
  import ruRU from 'ant-design-vue/locale/ru_RU';
  import 'ant-design-vue/dist/reset.css';
  import '~/assets/styles/index.scss';
  import { useTheme } from '~/shared/composables';
  import { SidebarPanel } from '~/features/sidebar';

  const { theme, themeConfig } = useTheme();

  useHead({
    htmlAttrs: {
      class: theme,
    },
  });
</script>

<template>
  <AConfigProvider
    :locale="ruRU"
    :theme="themeConfig"
  >
    <AExtractStyle>
      <AStyleProvider>
        <AApp>
          <NuxtLoadingIndicator
            color="var(--color-primary)"
            error-color="var(--color-error)"
          />

          <div class="ttg-app">
            <SidebarPanel />

            <NuxtLayout>
              <NuxtPage />
            </NuxtLayout>
          </div>
        </AApp>
      </AStyleProvider>
    </AExtractStyle>
  </AConfigProvider>
</template>
