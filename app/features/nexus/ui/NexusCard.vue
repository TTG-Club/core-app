<script setup lang="ts">
  import type { Nexus } from '../model';

  import {
    getNexusRoute,
    NEXUS_GAME_ROOM_LABEL,
    NEXUS_MEMBERS_COUNT_LABEL,
    NEXUS_OPEN_LABEL,
    NEXUS_OWNER_LABEL,
  } from '../model';

  /** Комната в списке: название, состав и кто её ведёт. */
  const { nexus, ownerName } = defineProps<{
    nexus: Nexus;
    /** Отображаемое имя владельца; сырой UUID показывать нельзя. */
    ownerName: string;
  }>();

  const route = computed(() => getNexusRoute(nexus.id));
</script>

<template>
  <UCard :ui="{ body: 'flex flex-col gap-3 p-4' }">
    <div class="flex flex-wrap items-start justify-between gap-2">
      <h3 class="min-w-0 font-semibold text-highlighted">
        {{ nexus.title }}
      </h3>

      <UBadge
        v-if="nexus.gameId"
        color="neutral"
        variant="subtle"
        size="sm"
        icon="tabler:dice"
        :label="NEXUS_GAME_ROOM_LABEL"
      />
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <UBadge
        color="neutral"
        variant="subtle"
        size="sm"
        icon="tabler:users"
        :label="`${NEXUS_MEMBERS_COUNT_LABEL}: ${nexus.memberCount}`"
      />

      <UBadge
        v-if="nexus.owner"
        color="primary"
        variant="subtle"
        size="sm"
        icon="tabler:crown"
        :label="NEXUS_OWNER_LABEL"
      />
    </div>

    <span class="flex items-center gap-1.5 text-sm text-muted">
      <UIcon
        name="tabler:crown"
        class="size-4"
      />
      {{ ownerName }}
    </span>

    <UButton
      :to="route"
      size="sm"
      color="neutral"
      variant="subtle"
      icon="tabler:door-enter"
      class="self-start"
      :label="NEXUS_OPEN_LABEL"
    />
  </UCard>
</template>
