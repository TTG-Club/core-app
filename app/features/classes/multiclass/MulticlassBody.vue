<script setup lang="ts">
  import {
    MulticlassStatsBlock,
    MulticlassTable,
    MulticlassProficiency,
  } from './ui';
  import type { MulticlassData } from './types';

  defineProps<{
    data: MulticlassData;
  }>();
</script>

<template>
  <div class="@container">
    <div class="flex flex-col gap-6 @min-3xl:flex-row @min-3xl:gap-7">
      <div
        :class="[
          'flex w-full flex-shrink-0 flex-col gap-4',
          '@min-xl:@max-3xl:flex-row @min-3xl:w-80',
        ]"
      >
        <MulticlassStatsBlock :data="data" />
      </div>

      <div class="flex min-w-0 flex-auto flex-col gap-6">
        <div class="flex min-w-0 flex-col gap-2">
          <MulticlassTable :data="data" />
        </div>

        <MulticlassProficiency :data="data" />
      </div>
    </div>
  </div>
</template>
