<script setup lang="ts">
  import type { SourceGroupResponse } from '~/shared/types';

  const { group } = defineProps<{
    group: SourceGroupResponse;
  }>();

  const tagColor = computed(() => {
    switch (group.label?.toLowerCase()) {
      case '3rd':
        return 'secondary';
      case 'hb':
        return 'success';
      case 'basic':
      case 'ua':
      default:
        return 'neutral';
    }
  });
</script>

<template>
  <UBadge
    :style="{ marginInlineEnd: 0 }"
    :color="tagColor"
    variant="subtle"
    size="sm"
  >
    {{ group.label }}
  </UBadge>
</template>
