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
    <!-- Opaque backdrop: colored subtle badges have a translucent background -->
    <span class="flex rounded-sm bg-default">
      <UBadge
        variant="subtle"
        size="sm"
        :color
        :title="`${source.name.rus} [${source.name.eng}]`"
      >
        {{ source.name.label }}
      </UBadge>
    </span>

    <UTooltip
      v-if="source?.group && showGroup"
      :text="source.group.rus"
      :disabled="!showTooltip"
    >
      <span class="flex rounded-sm bg-default">
        <UBadge
          variant="subtle"
          size="sm"
        >
          {{ source.group.label }}
        </UBadge>
      </span>
    </UTooltip>
  </div>
</template>
