<script setup lang="ts">
  import { CopyButton } from '../copy-button';
  import { SvgIcon } from '../icon';

  defineEmits<{
    (e: 'close'): void;
  }>();

  const route = useRoute();

  const urlForCopy = computed(() => {
    return getOrigin() + route.path;
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

  <ATooltip
    title="Закладка"
    :mouse-enter-delay="0.7"
    destroy-tooltip-on-hide
  >
    <AButton
      disabled
      type="text"
    >
      <template #icon>
        <SvgIcon icon="bookmark/outline" />
      </template>
    </AButton>
  </ATooltip>

  <ATooltip
    title="Открыть окно печати"
    :mouse-enter-delay="0.7"
    destroy-tooltip-on-hide
  >
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

  <ATooltip
    title="Закрыть"
    :mouse-enter-delay="0.7"
    destroy-tooltip-on-hide
  >
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
