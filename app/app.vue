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
          <div :class="['ttg-app', $style.app]">
            <NavBar />

            <div :class="$style.container">
              <NuxtLayout>
                <NuxtPage />
              </NuxtLayout>
            </div>
          </div>
        </AApp>
      </AStyleProvider>
    </AExtractStyle>
  </AConfigProvider>
</template>

<style module lang="scss">
  .app {
    display: flex;
    flex-flow: column-reverse;

    @include media-min($md) {
      flex-flow: row;
    }
  }

  .container {
    position: relative;

    overflow: auto;

    width: 100%;
    height: var(--max-vh);
    margin: auto;
    padding: 0 16px;

    @include media-min($xl) {
      padding: 0 24px;
    }
  }
</style>
