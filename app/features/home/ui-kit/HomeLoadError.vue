<script setup lang="ts">
  import {
    HOME_LOAD_ERROR_HINT,
    HOME_LOAD_ERROR_TEXT,
    HOME_LOAD_RETRY_LABEL,
  } from './model';

  defineProps<{
    /** Запрос сейчас идёт — кнопка показывает загрузку */
    retrying?: boolean;
  }>();

  const emit = defineEmits<{
    retry: [];
  }>();
</script>

<template>
  <!-- Та же пунктирная рамка, что у заглушки «пока нет», чтобы раскладка ленты
    не прыгала, но с честной причиной: «пока нет» на сбое вводит в
    заблуждение — посетитель решит, что на сайте ничего нет -->
  <div
    class="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-default px-3 py-6 text-center"
    role="status"
  >
    <UIcon
      name="tabler:cloud-off"
      class="size-5 text-dimmed"
    />

    <p class="text-sm text-muted">
      {{ HOME_LOAD_ERROR_TEXT }}
    </p>

    <p class="text-xs text-dimmed">
      {{ HOME_LOAD_ERROR_HINT }}
    </p>

    <UButton
      :label="HOME_LOAD_RETRY_LABEL"
      :loading="retrying"
      icon="tabler:refresh"
      size="xs"
      variant="soft"
      color="neutral"
      @click.left.exact.prevent="emit('retry')"
    />
  </div>
</template>
