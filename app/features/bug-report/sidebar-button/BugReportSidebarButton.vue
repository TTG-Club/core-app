<script setup lang="ts">
  import { useBugReport } from '../composables';
  import { BugReportModal } from '../modal';
  import { SelectionReportButton } from '../selection';

  const { openReport } = useBugReport();
</script>

<template>
  <UButton
    icon="tabler:bug"
    variant="ghost"
    color="neutral"
    size="xl"
    @click.left.exact.prevent="openReport"
  />

  <ClientOnly>
    <SelectionReportButton />

    <BugReportModal />
  </ClientOnly>
</template>
