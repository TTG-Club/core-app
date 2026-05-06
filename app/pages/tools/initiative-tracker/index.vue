<script setup lang="ts">
  import type {
    CreatureParticipantPayload,
    HpAmountPayload,
    HpPatchPayload,
    InitiativeParticipantState,
    PlayerParticipantPayload,
    TrackerSettingsPayload,
  } from '~initiative-tracker/model';

  import { useSeoMeta } from '#imports';
  import { useInitiativeTracker } from '~initiative-tracker/composable';
  import {
    ActiveStatBlockPanel,
    CreatureParticipantForm,
    CurrentTurnPanel,
    EncounterDifficultyPanel,
    InitiativeSettingsPanel,
    InitiativeTrackerToolbar,
    ParticipantList,
    PlayerParticipantForm,
    ShareTrackerDialog,
  } from '~initiative-tracker/ui';

  useSeoMeta({
    title: 'Трекер инициативы',
    description: 'Рабочий инструмент для ведения инициативы, хитов и раундов.',
  });

  const initiativeTracker = useInitiativeTracker();
  const isShareDialogOpen = ref(false);

  await initiativeTracker.fetchTracker();

  await Promise.all([
    initiativeTracker.fetchActiveBlock(),
    initiativeTracker.fetchDifficulty(),
  ]);

  onMounted(() => {
    if (!initiativeTracker.isLocalMode.value) {
      return;
    }

    initiativeTracker.fetchTracker();
  });

  const activeParticipant = computed(() => {
    const tracker = initiativeTracker.tracker.value;

    if (!tracker?.currentParticipantId) {
      return undefined;
    }

    return tracker.participants.find((participant) => {
      return participant.id === tracker.currentParticipantId;
    });
  });

  const isSetup = computed(() => {
    return initiativeTracker.tracker.value?.status === 'SETUP';
  });

  function openShareDialog(): void {
    isShareDialogOpen.value = true;
  }

  async function handleSettingsSave(
    payload: TrackerSettingsPayload,
  ): Promise<void> {
    await initiativeTracker.updateSettings(payload);
  }

  async function handlePlayerAdd(
    payload: PlayerParticipantPayload,
  ): Promise<void> {
    await initiativeTracker.addPlayer(payload);
  }

  async function handleCreatureAdd(
    payload: CreatureParticipantPayload,
  ): Promise<void> {
    await initiativeTracker.addCreature(payload);
  }

  async function handleDamage(
    participantId: string,
    payload: HpAmountPayload,
  ): Promise<void> {
    await initiativeTracker.damageParticipant(participantId, payload);
  }

  async function handleHeal(
    participantId: string,
    payload: HpAmountPayload,
  ): Promise<void> {
    await initiativeTracker.healParticipant(participantId, payload);
  }

  async function handleTemporaryHp(
    participantId: string,
    payload: HpAmountPayload,
  ): Promise<void> {
    await initiativeTracker.setTemporaryHp(participantId, payload);
  }

  async function handlePatchHp(
    participantId: string,
    payload: HpPatchPayload,
  ): Promise<void> {
    await initiativeTracker.patchParticipantHp(participantId, payload);
  }

  async function handlePatchState(
    participantId: string,
    payload: { state: InitiativeParticipantState },
  ): Promise<void> {
    await initiativeTracker.patchParticipantState(participantId, payload);
  }
</script>

<template>
  <NuxtLayout name="default">
    <div
      v-if="initiativeTracker.tracker.value"
      class="grid min-h-dvh gap-4 pb-8"
    >
      <InitiativeTrackerToolbar
        :tracker="initiativeTracker.tracker.value"
        :readonly="initiativeTracker.isLocalMode.value"
        @open-share="openShareDialog"
      />

      <main class="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)_360px]">
        <div class="order-2 grid content-start gap-4 lg:order-1">
          <ParticipantList
            :participants="initiativeTracker.tracker.value.participants"
            :current-participant-id="
              initiativeTracker.tracker.value.currentParticipantId
            "
            @damage="handleDamage"
            @heal="handleHeal"
            @temporary-hp="handleTemporaryHp"
            @patch-hp="handlePatchHp"
            @patch-state="handlePatchState"
          />
        </div>

        <div class="order-1 grid content-start gap-4 lg:order-2">
          <UAlert
            v-if="initiativeTracker.isLocalMode.value"
            icon="tabler:device-gamepad"
            color="info"
            variant="soft"
            title="Локальный режим"
            description="Трекер открыт без авторизации: состояние хранится только в этом браузере и не отправляется на сервер."
          />

          <CurrentTurnPanel
            :tracker="initiativeTracker.tracker.value"
            :active-participant
            :pending-action="initiativeTracker.pendingAction.value"
            @start="initiativeTracker.startBattle"
            @previous-turn="initiativeTracker.previousTurn"
            @next-turn="initiativeTracker.nextTurn"
            @previous-round="initiativeTracker.previousRound"
            @next-round="initiativeTracker.nextRound"
            @reroll-round="initiativeTracker.rerollRound"
            @finish="initiativeTracker.finishBattle"
          />

          <InitiativeSettingsPanel
            v-if="isSetup"
            :tracker="initiativeTracker.tracker.value"
            :pending="initiativeTracker.pendingAction.value === 'settings'"
            @save="handleSettingsSave"
          />

          <div
            v-if="isSetup"
            class="grid gap-4"
          >
            <PlayerParticipantForm
              :pending="initiativeTracker.pendingAction.value === 'add-player'"
              @add="handlePlayerAdd"
            />

            <CreatureParticipantForm
              :pending="
                initiativeTracker.pendingAction.value === 'add-creature'
              "
              @add="handleCreatureAdd"
            />
          </div>

          <EncounterDifficultyPanel
            :difficulty="initiativeTracker.difficulty.value"
            :pending="initiativeTracker.pendingAction.value === 'difficulty'"
            @recalculate="initiativeTracker.recalculateDifficulty"
          />
        </div>

        <div class="order-3 grid content-start gap-4">
          <ActiveStatBlockPanel
            :participant="activeParticipant"
            :active-block="initiativeTracker.activeBlock.value"
            @damage="handleDamage"
            @heal="handleHeal"
            @temporary-hp="handleTemporaryHp"
            @patch-hp="handlePatchHp"
            @patch-state="handlePatchState"
          />
        </div>
      </main>

      <ShareTrackerDialog
        v-if="!initiativeTracker.isLocalMode.value"
        v-model:open="isShareDialogOpen"
        :tracker="initiativeTracker.tracker.value"
        :pending="initiativeTracker.pendingAction.value === 'share'"
        @enable="initiativeTracker.enableShare"
        @disable="initiativeTracker.disableShare"
      />
    </div>

    <UAlert
      v-else
      class="mt-4"
      icon="tabler:alert-circle"
      color="error"
      variant="soft"
      title="Трекер инициативы не загрузился"
      description="Проверьте доступ к API и обновите страницу."
    />
  </NuxtLayout>
</template>
