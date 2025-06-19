<script setup lang="ts">
  import type { SourceResponse } from '~/shared/types';

  const { source } = defineProps<{
    source: SourceResponse;
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
    <UTooltip :text="source.group.rus">
      <UBadge
        variant="soft"
        size="sm"
      >
        {{ source.group.label }}
      </UBadge>
    </UTooltip>

    <UTooltip :text="`${source.name.rus} [${source.name.eng}]`">
      <UBadge
        variant="soft"
        size="sm"
        :color
      >
        {{ source.name.label }}
      </UBadge>
    </UTooltip>
  </div>
</template>
