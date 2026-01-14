<script setup lang="ts">
  import type { ButtonProps } from '@nuxt/ui';

  const { url = '', size = undefined } = defineProps<{
    url?: string;
    disabled?: boolean;
    size?: ButtonProps['size'];
  }>();

  const { share } = useCopy();
</script>

<template>
  <UTooltip
    v-if="url"
    text="Скопировать ссылку"
  >
    <UButton
      :href="url"
      icon="i-ttg-copy"
      variant="ghost"
      color="neutral"
      :disabled
      :size
      @click.left.exact.prevent="share(url)"
    />
  </UTooltip>
</template>
