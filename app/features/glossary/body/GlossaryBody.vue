<script setup lang="ts">
  import { TopBar, DescriptionsBlock } from './ui';

  import type { GlossaryDetailResponse } from '~/shared/types';

  defineProps<{
    glossary: GlossaryDetailResponse;
  }>();
</script>

<template>
  <div class="@container flex flex-col gap-4">
    <div class="flex flex-col gap-3 @min-3xl:flex-row @min-3xl:gap-7">
      <div class="flex w-full flex-col gap-3 @min-3xl:max-w-80">
        <TopBar :tags="glossary.tagCategory" />
      </div>

      <div class="flex flex-auto flex-col gap-3">
        <DescriptionsBlock :description="glossary.description" />
      </div>
    </div>
  </div>
</template>
