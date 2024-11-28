<script setup lang="ts">
  import 'virtual:svg-icons-register';
  import ruRU from 'ant-design-vue/locale/ru_RU';
  import 'ant-design-vue/dist/reset.css';
  import '~/assets/styles/index.scss';

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
          <div class="ttg-app">
            <NavBar />

            <NuxtLayout>
              <NuxtPage />
            </NuxtLayout>
          </div>
        </AApp>
      </AStyleProvider>
    </AExtractStyle>
  </AConfigProvider>
</template>
