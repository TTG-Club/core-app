<script setup lang="ts">
  import type { SourceResponse } from '~/shared/types';

  defineProps<{
    source: SourceResponse;
  }>();
</script>

<template>
  <AFlex :gap="8">
    <ATooltip
      :title="source.group.rus"
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
        {{ source.name.label }}
      </ATag>
    </ATooltip>
  </AFlex>
</template>
