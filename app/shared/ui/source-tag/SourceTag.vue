<script setup lang="ts">
  import type { SourceResponse } from '~/shared/types';

  const {
    source,
    showGroup = false,
    showTooltip = false,
  } = defineProps<{
    source: SourceResponse;
    showGroup?: boolean;
    showTooltip?: boolean;
  }>();

  const color = computed(() => {
    switch (source.group.label?.toLowerCase()) {
      case '3rd':
        return 'secondary';
      case 'hb':
        return 'success';
      default:
        return 'neutral';
    }
  });
</script>

<template>
  <div class="flex gap-1">
    <UTooltip
      :text="`${source.name.rus} [${source.name.eng}]`"
      :disabled="!showTooltip"
    >
      <UBadge
        variant="subtle"
        size="sm"
        :color
      >
        {{ source.name.label }}
      </UBadge>
    </UTooltip>

    <UTooltip
      v-if="showGroup"
      :text="source.group.rus"
      :disabled="!showTooltip"
    >
      <UBadge
        variant="subtle"
        size="sm"
      >
        {{ source.group.label }}
      </UBadge>
    </UTooltip>
  </div>
</template>
