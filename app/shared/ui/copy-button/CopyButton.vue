<script setup lang="ts">
  import type { ButtonProps } from '@nuxt/ui';

  const { url = '', size = undefined } = defineProps<{
    url?: string;
    disabled?: boolean;
    size?: ButtonProps['size'];
  }>();

  const { copy } = useCopy();
</script>

<template>
  <UTooltip
    v-if="url"
    text="Скопировать ссылку"
  >
    <UButton
      icon="i-ttg-copy"
      variant="ghost"
      color="neutral"
      :disabled
      :size
      @click.left.exact.prevent="copy(url, 'Ссылка успешно скопирована')"
    />
  </UTooltip>
</template>
