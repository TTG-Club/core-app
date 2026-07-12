<script setup lang="ts">
  import { InitiativeTrackerList } from '~initiative/list';
  import { INITIATIVE_TOOL_TITLE } from '~initiative/model';

  useSeoMeta({
    title: 'Трекер инициативы [Initiative Tracker] — D&D 5',
    description:
      'Трекер инициативы для D&D 5: соберите энкаунтер из игроков и существ бестиария, одной кнопкой прокиньте инициативу всем и ведите бой по ходам.',
  });
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="INITIATIVE_TOOL_TITLE"
  >
    <ClientOnly>
      <InitiativeTrackerList />

      <template #fallback>
        <div class="flex justify-center py-16">
          <UIcon
            name="tabler:loader-2"
            class="size-8 animate-spin text-muted"
          />
        </div>
      </template>
    </ClientOnly>
  </NuxtLayout>
</template>
