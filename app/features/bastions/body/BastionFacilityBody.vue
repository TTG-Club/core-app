<script setup lang="ts">
  import type { BastionFacilityDetailResponse } from '../model';

  import { UiDetailLayout } from '~ui/detail-layout';
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
  <UiDetailLayout>
    <template #aside>
      <FacilityStatsBlock :facility />
    </template>

    <div class="flex flex-col gap-4">
      <MarkupRender :render-node="facility.description" />

      <FacilityOrderOptions :facility />

      <FacilityExtras :facility />
    </div>
  </UiDetailLayout>
</template>
