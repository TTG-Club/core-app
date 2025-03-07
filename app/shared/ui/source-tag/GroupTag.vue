<script setup lang="ts">
  import type { SourceGroupResponse } from '~/shared/types';
  import type { PresetColorType } from 'ant-design-vue/es/_util/colors';

  const { group } = defineProps<{
    group: SourceGroupResponse;
  }>();

  const tagColor = computed<PresetColorType | undefined>(() => {
    switch (group.label?.toLowerCase()) {
      case '3rd':
        return 'purple';
      case 'hb':
        return 'green';
      case 'basic':
      case 'ua':
      default:
        return undefined;
    }
  });
</script>

<template>
  <ATooltip
    :title="group.rus"
    :mouse-enter-delay="0.7"
    arrow-point-at-center
    destroy-tooltip-on-hide
  >
    <ATag
      :style="{ marginInlineEnd: 0 }"
      :color="tagColor"
    >
      {{ group.label }}
    </ATag>
  </ATooltip>
</template>
