<script setup lang="ts">
  import {
    useInitiativeStorage,
    useTrackerWorkspace,
  } from '~initiative/composables';
  import {
    createTracker,
    deleteTracker,
    getFetchStatus,
    getTrackerErrorMessage,
    INITIATIVE_TOOL_ROUTE,
  } from '~initiative/model';
  import { UiResult } from '~ui/result';

  import { TrackerBoard, TrackerHeader } from './ui';

  const { id } = defineProps<{
    id: string;
  }>();

  const toast = useToast();
  const { saveSlot, keyForTracker } = useInitiativeStorage();

  const {
    tracker,
    isAnonymous,
    isLoading,
    isMutating,
    loadError,
    isActive,
    participants,
    playerCount,
    creatureCount,
    canAddPlayer,
    canAddCreature,
    remainingCreatures,
    currentHitPoints,
    load,
    rename,
    addPlayer,
    addCreatures,
    editParticipant,
    deleteParticipant,
    setDead,
    rollParticipant,
    roll,
    rollCreatures,
    startCombat,
    advanceTurn,
    rewindTurn,
    reset,
    destroy,
    setHitPoints,
  } = useTrackerWorkspace(() => id);

  onMounted(load);

  watch(
    () => id,
    () => {
      load();
    },
  );

  const errorStatus = computed(() => getFetchStatus(loadError.value));

  const errorResultStatus = computed<'404' | '403' | 'error'>(() => {
    switch (errorStatus.value) {
      case 404:
        return '404';
      case 403:
        return '403';
      default:
        return 'error';
    }
  });

  const errorTitle = computed(() => {
    switch (errorStatus.value) {
      case 404:
        return 'Трекер не найден';
      case 403:
        return 'Доступ к трекеру запрещён';
      case 401:
        return 'Требуется авторизация';
      default:
        return 'Не удалось загрузить трекер';
    }
  });

  function goToTool(): void {
    navigateTo(INITIATIVE_TOOL_ROUTE);
  }

  async function handleRemove(): Promise<void> {
    const isDeleted = await destroy();

    if (isDeleted) {
      navigateTo(INITIATIVE_TOOL_ROUTE);
    }
  }

  /**
   * Анонимная «замена» трекера: создаём новый, перезаписываем слот и лучшим
   * усилием удаляем старый (его ключ считываем до перезаписи слота).
   */
  async function handleReplace(): Promise<void> {
    const previousId = id;
    const previousKey = keyForTracker(previousId);

    try {
      const created = await createTracker();

      if (!created.accessKey) {
        toast.add({
          title: 'Не удалось создать трекер',
          description: 'Сервер не вернул ключ доступа.',
          color: 'error',
          icon: 'tabler:alert-triangle',
        });

        return;
      }

      saveSlot(created.id, created.accessKey);

      try {
        await deleteTracker(previousId, previousKey);
      } catch (error) {
        consola.error('Не удалось удалить прежний анонимный трекер:', error);
      }

      navigateTo(`${INITIATIVE_TOOL_ROUTE}/${created.id}`);
    } catch (error) {
      toast.add({
        title: 'Не удалось создать трекер',
        description: getTrackerErrorMessage(error),
        color: 'error',
        icon: 'tabler:alert-triangle',
      });
    }
  }

  /**
   * Авторизованный: собираем ещё один бой (в пределах лимита), не трогая
   * текущий, и сразу открываем его. Лимит держит бэк — при превышении покажем
   * ошибку тостом.
   */
  async function handleCreateAnother(): Promise<void> {
    try {
      const created = await createTracker();

      navigateTo(`${INITIATIVE_TOOL_ROUTE}/${created.id}`);
    } catch (error) {
      toast.add({
        title: 'Не удалось создать трекер',
        description: getTrackerErrorMessage(error),
        color: 'error',
        icon: 'tabler:alert-triangle',
      });
    }
  }
</script>

<template>
  <div class="flex flex-col gap-6">
    <div
      v-if="isLoading && !tracker"
      class="flex justify-center py-16"
    >
      <UIcon
        name="tabler:loader-2"
        class="size-8 animate-spin text-muted"
      />
    </div>

    <template v-else-if="tracker">
      <TrackerHeader
        :tracker="tracker"
        :is-anonymous="isAnonymous"
        :is-mutating="isMutating"
        @rename="rename"
        @remove="handleRemove"
        @create-new="handleReplace"
        @create-another="handleCreateAnother"
      />

      <TrackerBoard
        :participants="participants"
        :is-active="isActive"
        :current-participant-id="tracker.currentParticipantId"
        :round="tracker.round"
        :player-count="playerCount"
        :creature-count="creatureCount"
        :can-add-player="canAddPlayer"
        :can-add-creature="canAddCreature"
        :remaining-creatures="remainingCreatures"
        :is-mutating="isMutating"
        :current-hit-points="currentHitPoints"
        @add-player="addPlayer"
        @add-creatures="addCreatures"
        @edit-participant="editParticipant"
        @remove-participant="deleteParticipant"
        @roll-participant="rollParticipant"
        @toggle-dead="setDead"
        @set-hit-points="setHitPoints"
        @roll="roll"
        @roll-creatures="rollCreatures"
        @start="startCombat"
        @next="advanceTurn"
        @prev="rewindTurn"
        @reset="reset"
      />
    </template>

    <UiResult
      v-else
      :status="errorResultStatus"
      :title="errorTitle"
      :sub-title="getTrackerErrorMessage(loadError)"
    >
      <template #extra>
        <UButton @click.left.exact.prevent="load"> Обновить </UButton>

        <UButton
          variant="soft"
          @click.left.exact.prevent="goToTool"
        >
          Вернуться к инструменту
        </UButton>
      </template>
    </UiResult>
  </div>
</template>
