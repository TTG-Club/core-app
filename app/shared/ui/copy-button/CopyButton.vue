<script setup lang="ts">
  import type { ButtonProps } from '@nuxt/ui';

  import { COPY_BUTTON_LABELS } from './constants';

  const { url = '', size = undefined } = defineProps<{
    url?: string;
    disabled?: boolean;
    size?: ButtonProps['size'];
  }>();

  const { isApple } = useDevice();
  const { share } = useCopyAndShare();
</script>

<template>
  <UTooltip
    v-if="url"
    :text="COPY_BUTTON_LABELS.share"
  >
    <UButton
      :href="url"
      :icon="isApple ? 'tabler:share-2' : 'tabler:share'"
      variant="ghost"
      color="neutral"
      :disabled
      :size
      @click.left.exact.prevent="share(url)"
    />
  </UTooltip>
</template>
