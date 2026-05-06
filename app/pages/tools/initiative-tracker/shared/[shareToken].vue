<script setup lang="ts">
  import { createError, useRoute, useSeoMeta } from '#imports';
  import { useInitiativeTracker } from '~initiative-tracker/composable';
  import {
    ActiveStatBlockPanel,
    CurrentTurnPanel,
    EncounterDifficultyPanel,
    InitiativeTrackerToolbar,
    ParticipantList,
  } from '~initiative-tracker/ui';

  const route = useRoute();
  const shareTokenParam = route.params.shareToken;

  if (typeof shareTokenParam !== 'string' || !shareTokenParam) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Shared-трекер не найден',
    });
  }

  useSeoMeta({
    title: 'Просмотр инициативы',
    description: 'Shared-страница трекера инициативы только для просмотра.',
  });

  const initiativeTracker = useInitiativeTracker({
    shareToken: shareTokenParam,
    readonly: true,
  });

  await initiativeTracker.fetchTracker();
  await initiativeTracker.fetchActiveBlock();

  const activeParticipant = computed(() => {
    const tracker = initiativeTracker.tracker.value;

    if (!tracker?.currentParticipantId) {
      return undefined;
    }

    return tracker.participants.find((participant) => {
      return participant.id === tracker.currentParticipantId;
    });
  });
</script>

<template>
  <NuxtLayout name="default">
    <div
      v-if="initiativeTracker.tracker.value"
      class="grid min-h-dvh gap-4 pb-8"
    >
      <InitiativeTrackerToolbar
        readonly
        :tracker="initiativeTracker.tracker.value"
      />

      <main class="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)_360px]">
        <div class="order-2 lg:order-1">
          <ParticipantList
            readonly
            :participants="initiativeTracker.tracker.value.participants"
            :current-participant-id="
              initiativeTracker.tracker.value.currentParticipantId
            "
          />
        </div>

        <div class="order-1 grid content-start gap-4 lg:order-2">
          <CurrentTurnPanel
            readonly
            :tracker="initiativeTracker.tracker.value"
            :active-participant
          />

          <EncounterDifficultyPanel
            readonly
            :difficulty="initiativeTracker.tracker.value.encounterDifficulty"
          />
        </div>

        <div class="order-3">
          <ActiveStatBlockPanel
            readonly
            :participant="activeParticipant"
            :active-block="initiativeTracker.activeBlock.value"
          />
        </div>
      </main>
    </div>

    <UAlert
      v-else
      class="mt-4"
      icon="tabler:alert-circle"
      color="error"
      variant="soft"
      title="Shared-трекер не загрузился"
    />
  </NuxtLayout>
</template>
