<script setup lang="ts">
  import type { SourceResponse } from '~/shared/types';

  const {
    source,
    showGroup = false,
    showTooltip = false,
  } = defineProps<{
    source: SourceResponse | undefined;
    showGroup?: boolean;
    showTooltip?: boolean;
  }>();

  const color = computed(() => {
    switch (source?.group.label?.toLowerCase()) {
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
  <div
    v-if="source?.name || source?.group"
    class="flex gap-1"
  >
    <UTooltip
      v-if="source?.name"
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
      v-if="source?.group && showGroup"
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
