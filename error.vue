<script setup lang="ts">
  import 'virtual:svg-icons-register';
  import ruRU from 'ant-design-vue/locale/ru_RU';
  import type { NuxtError } from '#app';

  const { theme, themeConfig } = useTheme();

  useHead({
    htmlAttrs: {
      class: theme,
    },
  });

  defineProps<{
    error: NuxtError;
  }>();
</script>

<template>
  <AConfigProvider
    :locale="ruRU"
    :theme="themeConfig"
  >
    <AExtractStyle>
      <AStyleProvider>
        <AApp>
          <AFlex
            :class="$style.container"
            justify="center"
            align="center"
          >
            <AFlex vertical>
              <h1 :class="$style.title">
                {{ error.statusCode }}
              </h1>

              <h2 :class="$style.message">
                {{ error.message }}
              </h2>

              <a href="/">Вернуться на главную</a>
            </AFlex>
          </AFlex>
        </AApp>
      </AStyleProvider>
    </AExtractStyle>
  </AConfigProvider>
</template>

<style lang="scss" src="~/assets/styles/index.scss"></style>

<style module>
  .container {
    height: 100%;
    padding: 64px 0;
  }

  .title {
    margin: 0;

    font-size: var(--font-size-h1);
    font-weight: 300;
    line-height: var(--line-height-h1);
    color: var(--color-text-title);
  }

  .message {
    margin: 24px 0 12px;

    font-size: var(--font-size-h4);
    font-weight: 300;
    line-height: var(--line-height-h4);
    color: var(--color-text-title);
  }
</style>
