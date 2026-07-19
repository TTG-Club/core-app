<script setup lang="ts">
  import { SHEET_EMPTY_LABELS } from '../../model';
  import SheetPanel from './SheetPanel.vue';

  defineProps<{
    resources: string[];
  }>();
</script>

<template>
  <SheetPanel title="Ресурсы класса">
    <div
      v-if="resources.length"
      class="flex flex-wrap gap-1.5"
    >
      <span
        v-for="resourceName in resources"
        :key="resourceName"
        class="rounded border border-default bg-default/40 px-2.5 py-1 text-[11px] text-toned"
      >
        {{ resourceName }}
      </span>
    </div>

    <span
      v-else
      class="text-xs text-dimmed italic"
    >
      {{ SHEET_EMPTY_LABELS.classResources }}
    </span>
  </SheetPanel>
</template>
