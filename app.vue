<script setup lang="ts">
import 'virtual:svg-icons-register';
import ruRU from 'ant-design-vue/locale/ru_RU';
import '~/assets/styles/index.scss';

const { theme, themeConfig } = useTheme();

useHead({
  htmlAttrs: {
    class: theme.value,
  },
});
</script>

<template>
  <AConfigProvider
    :locale="ruRU"
    :wave="{ disabled: true }"
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
