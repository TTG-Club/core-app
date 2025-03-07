<script setup lang="ts">
  import { SvgIcon } from '~/shared/ui';
  import { useCopy } from '~/shared/composables';
  import type { ButtonProps } from 'ant-design-vue';

  const { url } = defineProps<{
    url?: string;
    disabled?: boolean;
    size?: ButtonProps['size'];
  }>();

  const { copy } = useCopy();
</script>

<template>
  <ATooltip
    v-if="url"
    :mouse-enter-delay="0.7"
    title="Скопировать ссылку"
  >
    <AButton
      :disabled
      :size
      type="text"
      @click.left.exact.prevent="copy(url, 'Ссылка успешно скопирована')"
    >
      <template #icon>
        <SvgIcon icon="copy" />
      </template>
    </AButton>
  </ATooltip>
</template>
