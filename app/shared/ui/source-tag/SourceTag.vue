<script setup lang="ts">
  import type { TooltipPlacement } from 'ant-design-vue/es/tooltip';
  import type { SourceResponse } from '~/shared/types';

  defineProps<{
    source: SourceResponse;
    placement?: TooltipPlacement;
  }>();
</script>

<template>
  <AFlex :gap="4">
    <ATooltip
      :title="source.group.rus"
      :mouse-enter-delay="0.7"
      :placement="placement"
      arrow-point-at-center
      destroy-tooltip-on-hide
    >
      <ATag :style="{ marginInlineEnd: 0 }">
        {{ source.group.label }}
      </ATag>
    </ATooltip>

    <ATooltip
      :title="`${source.name.rus} [${source.name.eng}]`"
      :mouse-enter-delay="0.7"
      :placement="placement"
      arrow-point-at-center
      destroy-tooltip-on-hide
    >
      <ATag
        :color="`var(--color-badge-${source.group.label.toLowerCase()})`"
        :style="{ marginInlineEnd: 0 }"
      >
        {{ source.name.label }}
      </ATag>
    </ATooltip>
  </AFlex>
</template>
