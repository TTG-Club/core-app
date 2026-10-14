<script setup lang="ts">
  import type { BastionFacilityDetailResponse } from '../model';

  import { MarkupRender } from '~ui/markup';

  import {
    FacilityExtras,
    FacilityOrderOptions,
    FacilityStatsBlock,
  } from './ui';

  defineProps<{
    facility: BastionFacilityDetailResponse;
  }>();
</script>

<template>
  <div class="@container flex flex-col gap-4">
    <div class="flex flex-col gap-3 @min-3xl:flex-row @min-3xl:gap-7">
      <div class="flex w-full flex-col gap-3 @min-3xl:max-w-80">
        <FacilityStatsBlock :facility />
      </div>

      <div class="flex flex-auto flex-col gap-4">
        <MarkupRender :render-node="facility.description" />

        <FacilityOrderOptions :facility />

        <FacilityExtras :facility />
      </div>
    </div>
  </div>
</template>
