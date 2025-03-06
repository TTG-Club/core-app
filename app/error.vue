<script setup lang="ts">
  import ruRU from 'ant-design-vue/locale/ru_RU';
  import type { NuxtError } from '#app';
  import { useTheme } from '~/shared/composables';

  const { theme, themeConfig } = useTheme();

  useHead({
    htmlAttrs: {
      class: theme,
    },
  });

  const { error } = defineProps<{
    error: NuxtError;
  }>();

  const handleError = () => {
    clearError();

    window.location.href = '/';
  };

  const reload = () => {
    clearError();

    window.location.reload();
  };
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
            <NuxtLayout>
              <AFlex
                :style="{ minHeight: '100vh' }"
                :gap="8"
                justify="center"
                vertical
              >
                <ATypographyTitle
                  :level="1"
                  data-allow-mismatch
                >
                  {{ error.statusCode }}
                </ATypographyTitle>

                <ATypographyText
                  v-if="error.statusMessage"
                  data-allow-mismatch
                  type="secondary"
                >
                  {{ error.statusMessage }}
                </ATypographyText>

                <ATypographyText
                  v-if="error.message"
                  data-allow-mismatch
                >
                  {{ error.message }}
                </ATypographyText>

                <AFlex :gap="12">
                  <AButton
                    type="primary"
                    href="/"
                    @click.left.exact.prevent="handleError"
                  >
                    Вернуться на главную
                  </AButton>

                  <AButton @click.left.exact.prevent="reload">
                    Обновить страницу
                  </AButton>
                </AFlex>
              </AFlex>
            </NuxtLayout>
          </div>
        </AApp>
      </AStyleProvider>
    </AExtractStyle>
  </AConfigProvider>
</template>
