<script setup lang="ts">
  import { TopBar, DescriptionsBlock } from './ui';

  import type { ArticlesDetailResponse } from '../types';

  defineProps<{
    articles: ArticlesDetailResponse;
  }>();
</script>

<template>
  <div class="@container flex flex-col gap-4">
    <div class="flex flex-col gap-3 @min-[800px]:flex-row @min-[800px]:gap-7">
      <div class="@min-[800px]:mix-w-80 flex flex-col gap-3">
        <TopBar :tags="articles.categories" />
      </div>

      <div class="flex flex-auto flex-col gap-3">
        <DescriptionsBlock :description="articles.description" />
      </div>
    </div>
  </div>
</template>
