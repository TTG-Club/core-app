<script setup lang="ts">
  import { CopyButton } from '../../copy-button';
  import { SvgIcon } from '../../icon';

  defineEmits<{
    (e: 'close'): void;
  }>();

  defineProps<{
    url?: string;
  }>();
</script>

<template>
  <AFlex
    :gap="8"
    justify="flex-end"
  >
    <AButton
      v-if="url"
      :href="url"
      size="small"
      type="text"
      @click.left.exact.prevent="
        navigateTo(url, {
          open: {
            target: '_blank',
            windowFeatures: {
              noreferrer: true,
              noopener: true,
            },
          },
        })
      "
    >
      <template #icon>
        <SvgIcon icon="new-page" />
      </template>
    </AButton>

    <CopyButton
      v-if="url"
      :url
      size="small"
    />

    <ATooltip
      title="Закладка"
      :mouse-enter-delay="0.7"
      destroy-tooltip-on-hide
    >
      <AButton
        size="small"
        type="text"
        disabled
      >
        <template #icon>
          <SvgIcon icon="bookmark/outline" />
        </template>
      </AButton>
    </ATooltip>

    <AButton
      size="small"
      type="text"
      @click.left.exact.prevent="$emit('close')"
    >
      <template #icon>
        <SvgIcon icon="close" />
      </template>
    </AButton>
  </AFlex>
</template>
