<script setup lang="ts">
  import { INITIATIVE_TOOL_TITLE } from '~initiative/model';
  import { InitiativeTrackerWorkspace } from '~initiative/workspace';
  import { useNexusFightBroadcast } from '~nexus/composables';

  const route = useRoute();
  const id = computed(() => String(route.params.id));

  /**
   * Комната, из которой открыли бой. Войти в трекер может только тот, кто
   * ведёт игру, поэтому остальные следят за боем по ленте комнаты — и
   * пересказывает им ход боя эта страница.
   */
  const nexusId = computed(() => {
    const value = route.query.nexus;

    return typeof value === 'string' && value ? value : null;
  });

  useNexusFightBroadcast(nexusId);

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
