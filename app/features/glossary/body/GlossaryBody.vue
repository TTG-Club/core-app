<script setup lang="ts">
  import type { GlossaryDetailResponse } from '~glossary/model';

  import { UiDetailLayout } from '~ui/detail-layout';

  import { DescriptionsBlock, TopBar } from './ui';

  defineProps<{
    glossary: GlossaryDetailResponse;
  }>();
</script>

<template>
  <UiDetailLayout>
    <template #aside>
      <TopBar :tags="glossary.tagCategory" />
    </template>

    <DescriptionsBlock :description="glossary.description" />
  </UiDetailLayout>
</template>
