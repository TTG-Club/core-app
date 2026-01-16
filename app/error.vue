<script setup lang="ts">
  import { PwaConfig } from '~pwa/config';

  import { ru } from '#ui/locale';

  import type { NuxtError } from '#app';

  import '~assets/css/index.scss';

  const { error } = defineProps<{
    error: NuxtError;
  }>();

  const { name } = useTheme();

  useHead({
    htmlAttrs: {
      class: name,
    },
  });

  function handleError() {
    clearError();

    window.location.href = '/';
  }

  function reload() {
    clearError();

    window.location.reload();
  }
</script>

<template>
  <UApp
    :locale="ru"
    :tooltip="{
      disableHoverableContent: true,
    }"
    :toaster="{
      position: 'top-right',
    }"
  >
    <div class="ttg-app">
      <PwaConfig />

      <div
        class="mx-auto flex min-h-dvh w-full flex-col lg:max-w-330 lg:flex-row"
      >
        <div
          class="flex min-h-dvh flex-auto flex-col justify-center gap-4 px-4 pb-4 lg:pt-4"
        >
          <h1 class="font-mono text-7xl font-semibold">
            {{ error.statusCode }}
          </h1>

          <span
            v-if="error.message"
            class="text-secondary"
          >
            {{ error.message }}
          </span>

          <div class="flex gap-3">
            <UButton
              href="/"
              @click.left.exact.prevent="handleError"
            >
              Вернуться на главную
            </UButton>

            <UButton
              variant="soft"
              @click.left.exact.prevent="reload"
            >
              Обновить страницу
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </UApp>
</template>
