<script setup lang="ts">
  import { StatusCodes } from 'http-status-codes';

  import { Role } from '~/shared/types';
  import { useParticipantNames } from '~find-game/composables';
  import {
    getFindGameErrorMessage,
    getFindGameStatus,
    getGameRoute,
  } from '~find-game/model';
  import { NexusChat } from '~nexus/chat';
  import {
    useNexus,
    useNexusFight,
    useNexusSheets,
    useNexusTrackers,
  } from '~nexus/composables';
  import {
    NEXUS_EVICTED_TOAST,
    NEXUS_GAME_ROOM_LABEL,
    NEXUS_LEFT_TOAST,
    NEXUS_MEMBERS_COUNT_LABEL,
    NEXUS_MEMBERS_LABEL,
    NEXUS_NOT_FOUND_DESCRIPTION,
    NEXUS_NOT_FOUND_TITLE,
    NEXUS_ROUTE,
    NEXUS_SHEET_ADDED_TOAST,
    NEXUS_SHEET_REMOVED_TOAST,
    NEXUS_SHEET_TRANSFERRED_TOAST,
    NEXUS_SHEETS_TITLE,
    NEXUS_TRACKER_CREATED_TOAST,
    NEXUS_TRACKER_REMOVED_TOAST,
    NEXUS_TRACKERS_TITLE,
    NEXUS_UNKNOWN_ERROR_MESSAGE,
  } from '~nexus/model';
  import {
    NexusFightReel,
    NexusInvite,
    NexusMembers,
    NexusSheetPicker,
    NexusSheets,
    NexusTrackers,
  } from '~nexus/ui';
  import { UiResult } from '~ui/result';

  definePageMeta({
    auth: { roles: [Role.USER] },
  });

  const route = useRoute();
  const toast = useToast();

  const nexusId = computed(() => {
    const raw = route.params.nexusId;

    return typeof raw === 'string' && raw ? raw : null;
  });

  const {
    areMembersLoading,
    error,
    isLoading,
    members,
    nexus,
    removeMember,
    status,
  } = useNexus(nexusId);

  const {
    add: addSheet,
    isLoading: areSheetsLoading,
    remove: removeSheet,
    sheets,
    transfer: transferSheet,
  } = useNexusSheets(nexusId);

  const {
    create: createTracker,
    isLoading: areTrackersLoading,
    remove: removeTracker,
    trackers,
  } = useNexusTrackers(nexusId);

  const {
    isActive: isFightOn,
    load: loadFight,
    reset: resetFight,
    state: fightState,
  } = useNexusFight();

  // Первый снимок берём запросом — вошедший посреди боя должен увидеть очередь
  // ходов сразу, — а дальше они приходят живой подпиской чата.
  watch(
    nexusId,
    (id) => {
      resetFight(id);

      if (id) {
        void loadFight(id);
      }
    },
    { immediate: true },
  );

  const { getParticipantName, resolveNames } = useParticipantNames();

  const { user } = useUser();

  const currentUserId = computed(() => user.value?.id ?? null);

  const isNotFound = computed(
    () => getFindGameStatus(error.value) === StatusCodes.NOT_FOUND,
  );

  const isError = computed(() => status.value === 'error');

  const isBusy = ref(false);
  const isSheetPickerOpen = ref(false);

  // Три коротких списка рядом растягивали страницу вниз, поэтому они делят
  // одно место и переключаются вкладками.
  const activeTab = ref('members');

  const tabItems = [
    { value: 'members', label: NEXUS_MEMBERS_LABEL, icon: 'tabler:users' },
    { value: 'sheets', label: NEXUS_SHEETS_TITLE, icon: 'tabler:user-circle' },
    { value: 'trackers', label: NEXUS_TRACKERS_TITLE, icon: 'tabler:swords' },
  ];

  useSeoMeta({
    title: () => nexus.value?.title ?? NEXUS_NOT_FOUND_TITLE,
  });

  // Имена участников живут в core-api: сервис комнат знает только
  // идентификаторы.
  watch(
    members,
    (list) => {
      void resolveNames(list.map((member) => member.userId));
    },
    { immediate: true },
  );

  /**
   * Выполняет действие над листами и показывает результат уведомлением.
   * @param successTitle Заголовок уведомления об успехе.
   * @param action Само действие.
   */
  async function runSheetAction(
    successTitle: string,
    action: () => Promise<void>,
  ): Promise<void> {
    isBusy.value = true;

    try {
      await action();

      toast.add({
        title: successTitle,
        color: 'success',
        icon: 'tabler:check',
      });
    } catch (cause) {
      toast.add({
        title: NEXUS_UNKNOWN_ERROR_MESSAGE,
        description: getFindGameErrorMessage(cause),
        color: 'error',
        icon: 'tabler:alert-triangle',
      });
    } finally {
      isBusy.value = false;
    }
  }

  /**
   * Выкладывает лист в комнату.
   * @param shareToken Токен общего доступа листа.
   * @param characterName Подпись персонажа.
   */
  async function handleAddSheet(
    shareToken: string,
    characterName: string,
  ): Promise<void> {
    await runSheetAction(NEXUS_SHEET_ADDED_TOAST, () =>
      addSheet(shareToken, characterName),
    );

    isSheetPickerOpen.value = false;
  }

  /**
   * Убирает лист из комнаты.
   * @param sheetId Идентификатор листа в комнате.
   */
  function handleRemoveSheet(sheetId: string): void {
    void runSheetAction(NEXUS_SHEET_REMOVED_TOAST, () => removeSheet(sheetId));
  }

  /**
   * Передаёт лист другому участнику.
   * @param sheetId Идентификатор листа в комнате.
   * @param ownerId Кому переходит лист.
   */
  function handleTransferSheet(sheetId: string, ownerId: string): void {
    void runSheetAction(NEXUS_SHEET_TRANSFERRED_TOAST, () =>
      transferSheet(sheetId, ownerId),
    );
  }

  /**
   * Ставит бой: персонажи со стола встают в него сразу.
   * @param title Название боя.
   */
  function handleCreateTracker(title: string): void {
    void runSheetAction(NEXUS_TRACKER_CREATED_TOAST, async () => {
      await createTracker(title, sheets.value);
    });
  }

  /**
   * Убирает бой из комнаты.
   * @param trackerRecordId Идентификатор записи трекера в комнате.
   */
  function handleRemoveTracker(trackerRecordId: string): void {
    void runSheetAction(NEXUS_TRACKER_REMOVED_TOAST, () =>
      removeTracker(trackerRecordId),
    );
  }

  /**
   * Выводит участника или выходит сам.
   * @param memberId Кого выводят.
   */
  async function handleRemove(memberId: string): Promise<void> {
    const leaving = memberId === currentUserId.value;

    isBusy.value = true;

    try {
      await removeMember(memberId);

      toast.add({
        title: leaving ? NEXUS_LEFT_TOAST : NEXUS_EVICTED_TOAST,
        color: 'success',
        icon: 'tabler:check',
      });

      // Вышедший комнату больше не видит: оставаться на её странице ему
      // некуда.
      if (leaving) {
        await navigateTo(NEXUS_ROUTE);
      }
    } catch (cause) {
      toast.add({
        title: NEXUS_UNKNOWN_ERROR_MESSAGE,
        description: getFindGameErrorMessage(cause),
        color: 'error',
        icon: 'tabler:alert-triangle',
      });
    } finally {
      isBusy.value = false;
    }
  }
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="nexus?.title ?? NEXUS_NOT_FOUND_TITLE"
    :back-to="NEXUS_ROUTE"
  >
    <USkeleton
      v-if="isLoading"
      class="h-64 w-full rounded-lg"
    />

    <UiResult
      v-else-if="isNotFound"
      status="404"
      :title="NEXUS_NOT_FOUND_TITLE"
      :sub-title="NEXUS_NOT_FOUND_DESCRIPTION"
    />

    <UiResult
      v-else-if="isError"
      status="error"
      :title="NEXUS_UNKNOWN_ERROR_MESSAGE"
      :sub-title="getFindGameErrorMessage(error)"
    />

    <!-- Комната слева, чат справа отдельным столбцом: разговор идут читать
      не отрываясь от состава и листов. На узком экране столбцы схлопываются
      в один, и чат уходит вниз -->
    <div
      v-else-if="nexus"
      class="grid items-start gap-6 lg:grid-cols-[1fr_minmax(0,26rem)]"
    >
      <div class="flex min-w-0 flex-col gap-6">
        <div class="flex flex-wrap items-center gap-2">
          <UBadge
            color="neutral"
            variant="subtle"
            size="sm"
            icon="tabler:users"
            :label="`${NEXUS_MEMBERS_COUNT_LABEL}: ${nexus.memberCount}`"
          />

          <!-- У комнаты игры показываем, откуда она: состав и права идут
            оттуда, и без ссылки на игру это неочевидно -->
          <UButton
            v-if="nexus.gameId"
            :to="getGameRoute(nexus.gameId)"
            size="sm"
            color="neutral"
            variant="subtle"
            icon="tabler:dice"
            :label="NEXUS_GAME_ROOM_LABEL"
          />
        </div>

        <!-- Код приглашения сервис отдаёт только владельцу самостоятельной
          комнаты, поэтому блок и появляется только у него -->
        <NexusInvite
          v-if="nexus.inviteCode"
          :invite-code="nexus.inviteCode"
        />

        <!-- Бой идёт в разделе трекеров, куда группе входа нет: очередь
          ходов доезжает сюда снимком от мастера -->
        <NexusFightReel
          v-if="isFightOn && fightState"
          :state="fightState"
        />

        <UTabs
          v-model="activeTab"
          :items="tabItems"
          :content="false"
          size="sm"
        />

        <NexusSheets
          v-if="activeTab === 'sheets'"
          :nexus="nexus"
          :sheets="sheets"
          :members="members"
          :current-user-id="currentUserId"
          :get-member-name="getParticipantName"
          :loading="areSheetsLoading"
          :busy="isBusy"
          @add="isSheetPickerOpen = true"
          @remove="handleRemoveSheet"
          @transfer="handleTransferSheet"
        />

        <NexusTrackers
          v-else-if="activeTab === 'trackers'"
          :nexus="nexus"
          :trackers="trackers"
          :loading="areTrackersLoading"
          :busy="isBusy"
          @create="handleCreateTracker"
          @remove="handleRemoveTracker"
        />

        <NexusMembers
          v-else
          :nexus="nexus"
          :members="members"
          :current-user-id="currentUserId"
          :get-member-name="getParticipantName"
          :loading="areMembersLoading"
          :busy="isBusy"
          @remove="handleRemove"
        />
      </div>

      <!-- Столбец чата не уезжает при прокрутке комнаты и занимает высоту
        экрана: за разговором следят, пока смотрят остальное -->
      <NexusChat
        :nexus-id="nexus.id"
        :current-user-id="currentUserId"
        class="lg:sticky lg:top-4 lg:h-[calc(100vh-10rem)]"
      />

      <!-- Чужие листы выкладывает владелец комнаты: игрок приносит своего
        персонажа, а мастер раздаёт заготовленных -->
      <NexusSheetPicker
        v-model:open="isSheetPickerOpen"
        :can-pick-others="nexus.owner"
        :busy="isBusy"
        @submit="handleAddSheet"
      />
    </div>
  </NuxtLayout>
</template>
