<script setup lang="ts">
  import type { ButtonProps } from '@nuxt/ui';

  const { url = '', size = undefined } = defineProps<{
    url?: string;
    disabled?: boolean;
    size?: ButtonProps['size'];
  }>();

  const { share } = useCopyAndShare();
</script>

<template>
  <UTooltip
    v-if="url"
    text="Поделиться ссылкой"
  >
    <UButton
      :href="url"
      icon="i-fluent-share-24-regular"
      variant="ghost"
      color="neutral"
      :disabled
      :size
      @click.left.exact.prevent="share(url)"
    />
  </UTooltip>
</template>
