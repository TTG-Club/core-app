<script setup lang="ts">
  import type { GlossaryDetailResponse } from '~glossary/model';

  import { UiDetailLayout } from '~ui/detail-layout';

  import { CategoryNote, DescriptionsBlock } from './ui';

  defineProps<{
    glossary: GlossaryDetailResponse;
  }>();
</script>

<template>
  <UiDetailLayout>
    <DescriptionsBlock :description="glossary.description" />

    <CategoryNote
      v-if="glossary.tagCategory"
      :category="glossary.tagCategory"
    />
  </UiDetailLayout>
</template>
