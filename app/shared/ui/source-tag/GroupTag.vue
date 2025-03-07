<script setup lang="ts">
  import type { SourceGroupResponse } from '~/shared/types';
  import type { PresetColorType } from 'ant-design-vue/es/_util/colors';
  import type { TooltipPlacement } from 'ant-design-vue/es/tooltip';

  const { group } = defineProps<{
    group: SourceGroupResponse;
    placement?: TooltipPlacement;
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
  <ATag
    :style="{ marginInlineEnd: 0 }"
    :color="tagColor"
  >
    {{ group.label }}
  </ATag>
</template>
