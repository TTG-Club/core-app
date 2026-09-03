<script setup lang="ts">
  import type { FightState } from '../model';

  import { InitiativeReel } from '~initiative/workspace';

  import {
    NEXUS_FIGHT_HINT,
    NEXUS_FIGHT_ROUND_LABEL,
    toReelParticipants,
  } from '../model';

  /**
   * Очередь ходов идущего боя.
   *
   * Сам бой ведётся в разделе трекеров, куда группе входа нет: сюда он
   * приходит снимком от клиента мастера, а карусель берётся та же, что и в
   * трекере — на неё и смотрят за столом.
   */
  const { state } = defineProps<{
    state: FightState;
  }>();

  const participants = computed(() => toReelParticipants(state));
</script>

<template>
  <div class="flex flex-col gap-3 rounded-lg border border-default p-4">
    <div class="flex flex-wrap items-center gap-2">
      <UIcon
        name="tabler:swords"
        class="size-5 shrink-0 text-primary"
      />

      <span class="truncate font-semibold text-highlighted">
        {{ state.title }}
      </span>

      <UBadge
        color="primary"
        variant="subtle"
        size="sm"
        :label="`${NEXUS_FIGHT_ROUND_LABEL} ${state.round}`"
      />

      <span class="ms-auto hidden text-xs text-muted sm:inline">
        {{ NEXUS_FIGHT_HINT }}
      </span>
    </div>

    <InitiativeReel
      :participants="participants"
      :current-participant-id="state.currentParticipantId ?? undefined"
      :round="state.round"
    />
  </div>
</template>
