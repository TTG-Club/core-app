<script setup lang="ts">
  import type { RoadmapItem } from '~roadmap/types';
  import { RoadmapEditor } from '~roadmap/editor';
  import { RoadmapFeature } from '~roadmap/feature';
  import { PageGrid } from '~ui/page';
  import { useUserStore } from '~/shared/stores';

  useSeoMeta({
    title: 'Карта разработки',
    ogTitle: 'Карта разработки | TTG Club Онлайн-справочник',
  });

  const { isAdmin } = useUserRoles();
  const { isLoggedIn } = storeToRefs(useUserStore());

  const { data: roadmap, refresh } = useAsyncData(
    'roadmap',
    () => $fetch<Array<RoadmapItem>>('/api/v2/roadmap'),
    {
      server: false,
    },
  );

  watch(isLoggedIn, () => refresh());
</script>

<template>
  <NuxtLayout
    name="detail"
    title="Карта разработки"
  >
    <template #actions>
      <RoadmapEditor
        v-if="isAdmin"
        @update:roadmap="refresh()"
      >
        <UButton
          icon="i-ttg-plus"
          variant="ghost"
          color="neutral"
        />
      </RoadmapEditor>
    </template>

    <template #default>
      <PageGrid :columns="3">
        <RoadmapFeature
          v-for="feature in roadmap"
          :key="feature.url"
          :feature
        />
      </PageGrid>
    </template>
  </NuxtLayout>
</template>
