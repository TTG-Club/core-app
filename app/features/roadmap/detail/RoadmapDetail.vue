<script setup lang="ts">
  import type { RoadmapItem } from '~roadmap/types';
  import { MarkupRender } from '~ui/markup';
  import { RoadmapEditor } from '~roadmap/editor';
  import { UiDrawer } from '~ui/drawer';

  const { feature } = defineProps<{
    feature: RoadmapItem;
  }>();

  const { isAdmin } = useUserRoles();
</script>

<template>
  <UiDrawer :title="feature.name">
    <template #actions>
      <RoadmapEditor
        v-if="isAdmin"
        :url="feature.url"
      >
        <UButton
          variant="ghost"
          color="neutral"
          icon="i-ttg-edit"
          size="sm"
        />
      </RoadmapEditor>
    </template>

    <UCard
      v-if="feature.preview"
      variant="soft"
      class="mb-2"
      :ui="{
        body: 'sm:p-4',
      }"
    >
      {{ feature.preview }}
    </UCard>

    <MarkupRender :render-node="feature.description" />
  </UiDrawer>
</template>
