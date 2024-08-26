<script setup lang="ts">
  import 'virtual:svg-icons-register';
  import ruRU from 'ant-design-vue/locale/ru_RU';

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
    <AStyleProvider>
      <AApp>
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
      </AApp>
    </AStyleProvider>
  </AConfigProvider>
</template>

<style lang="scss" src="~/assets/styles/index.scss"></style>
