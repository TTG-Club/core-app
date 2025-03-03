<script setup lang="ts">
  import { SvgIcon } from '~/shared/ui';
  import { CopyButton } from '../copy-button';

  defineEmits<{
    (e: 'close'): void;
  }>();

  const route = useRoute();

  const urlForCopy = computed(() => {
    if (import.meta.browser) {
      return window.location.origin + route.path;
    }

    return undefined;
  });

  const openPrintWindow = () => {
    window.print();

    // sendShareMetrics({
    //   method: 'page_print',
    //   id: route.path,
    // });
  };
</script>

<template>
  <CopyButton :url="urlForCopy" />

  <ATooltip title="Закладка">
    <AButton
      disabled
      type="text"
    >
      <template #icon>
        <SvgIcon icon="bookmark/outline" />
      </template>
    </AButton>
  </ATooltip>

  <ATooltip title="Открыть окно печати">
    <AButton
      disabled
      type="text"
      @click.left.exact.prevent="openPrintWindow"
    >
      <template #icon>
        <SvgIcon icon="print" />
      </template>
    </AButton>
  </ATooltip>

  <ATooltip title="Закрыть">
    <AButton
      type="text"
      @click.left.exact.prevent="$emit('close')"
    >
      <template #icon>
        <SvgIcon icon="close" />
      </template>
    </AButton>
  </ATooltip>
</template>
