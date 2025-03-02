<script setup lang="ts">
  import type { SourceInfo } from './types';

  defineProps<{
    source: SourceInfo;
  }>();
</script>

<template>
  <AFlex :gap="8">
    <ATooltip
      :title="source.group.name"
      placement="bottomRight"
      arrow-point-at-center
    >
      <ATag :style="{ marginInlineEnd: 0 }">
        {{ source.group.label }}
      </ATag>
    </ATooltip>

    <ATooltip
      :title="`${source.name.rus} [${source.name.eng}]`"
      placement="bottomRight"
      arrow-point-at-center
    >
      <ATag
        :color="`var(--color-badge-${source.group.label.toLowerCase()})`"
        :style="{ marginInlineEnd: 0 }"
      >
        {{ source.name.short }}
      </ATag>
    </ATooltip>
  </AFlex>
</template>
