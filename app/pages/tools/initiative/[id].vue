<script setup lang="ts">
  import { INITIATIVE_TOOL_TITLE } from '~initiative/model';
  import { InitiativeTrackerWorkspace } from '~initiative/workspace';

  const route = useRoute();
  const id = computed(() => String(route.params.id));

  // Приватные/эфемерные страницы конкретного трекера не индексируем.
  useSeoMeta({
    title: `${INITIATIVE_TOOL_TITLE} — D&D 5`,
    description:
      'Ведите бой по инициативе: порядок хода, текущий участник, номер раунда и управление составом.',
    robots: 'noindex, nofollow',
  });
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="INITIATIVE_TOOL_TITLE"
  >
    <ClientOnly>
      <InitiativeTrackerWorkspace :id="id" />

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
