<script setup lang="ts">
  import ruRU from 'ant-design-vue/locale/ru_RU';

  import { useTheme } from '~/shared/composables';
  import { ToastsWrapper } from '~ui/toast';

  const { themeName, themeConfig } = useTheme();

  const metaThemeColor = computed(() => themeConfig.value.token.colorBgBase);

  useHead({
    meta: [
      {
        name: 'theme-color',
        content: toValue(metaThemeColor),
      },
    ],
    htmlAttrs: {
      class: themeName,
    },
  });
</script>

<template>
  <AExtractStyle>
    <AConfigProvider
      :locale="ruRU"
      :theme="themeConfig"
    >
      <AApp>
        <NuxtLoadingIndicator
          color="var(--color-primary)"
          error-color="var(--color-error)"
        />

        <div class="ttg-app">
          <slot />
        </div>

        <ToastsWrapper />
      </AApp>
    </AConfigProvider>
  </AExtractStyle>
</template>
