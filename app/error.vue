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

  const { error } = defineProps<{
    error: NuxtError;
  }>();

  const message = computed(() => getStatusMessage(error.statusCode));

  const handleError = () => clearError({ redirect: '/' });

  const reload = () => {
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
            <NavBar />

            <NuxtLayout>
              <AFlex
                :style="{ minHeight: '100vh' }"
                :gap="8"
                justify="center"
                vertical
              >
                <ATypographyTitle :level="1">
                  {{ error.statusCode }}
                </ATypographyTitle>

                <ATypographyText>
                  {{ message }}
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
