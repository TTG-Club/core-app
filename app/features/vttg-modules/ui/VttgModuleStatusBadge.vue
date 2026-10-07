<script setup lang="ts">
  import type { SubmissionStatus } from '../model';

  import { SUBMISSION_STATUS_COLORS, SUBMISSION_STATUS_LABELS } from '../model';

  const { status } = defineProps<{
    status: SubmissionStatus;
  }>();

  const label = computed(() => SUBMISSION_STATUS_LABELS[status]);
  const color = computed(() => SUBMISSION_STATUS_COLORS[status]);
</script>

<template>
  <UBadge
    :color
    variant="subtle"
    size="sm"
  >
    {{ label }}
  </UBadge>
</template>
