<script setup lang="ts">
  import { StatusCodes } from 'http-status-codes';

  import { useGameDetail, useParticipantNames } from '~find-game/composables';
  import { GameApplyModal } from '~find-game/form';
  import { GameActions, GameInviteCard, GameOverview } from '~find-game/game';
  import {
    APPLY_LABEL,
    APPLY_SENT_TOAST,
    APPLY_WITHDRAW_LABEL,
    APPLY_WITHDRAWN_TOAST,
    FIND_GAME_NOT_FOUND_MESSAGE,
    FIND_GAME_UNKNOWN_ERROR_MESSAGE,
    GAME_CANCELLED_TOAST,
    GAME_CLOSED_TOAST,
    GAME_DELETED_TOAST,
    GAME_GUEST_NOTICE_DESCRIPTION,
    GAME_GUEST_NOTICE_TITLE,
    GAME_RAISED_TOAST,
    GAME_SIGN_IN_LABEL,
    GAMES_NAVIGATION_LABEL,
    GAMES_ROUTE,
    getFindGameErrorMessage,
    getFindGameStatus,
    INVITE_CODE_QUERY_KEY,
    REGISTRATION_REJECTED_REASON_TITLE,
    SESSION_REGISTRATION_STATUS_COLORS,
    SESSION_REGISTRATION_STATUS_LABELS,
    SESSION_REGISTRATIONS_LABEL,
  } from '~find-game/model';
  import { GameRegistrationsPanel } from '~find-game/registrations';
  import { GameSessions } from '~find-game/sessions';
  import { getGameDescriptionText } from '~find-game/ui';
  import {
    fetchGameNexus,
    getNexusRoute,
    NEXUS_OPEN_LABEL,
  } from '~nexus/model';
  import { UiResult } from '~ui/result';

  const route = useRoute();
  const toast = useToast();

  const { getParticipantName, resolveNames } = useParticipantNames();

  const gameId = computed(() =>
    typeof route.params.gameId === 'string' ? route.params.gameId : '',
  );

  /**
   * Код приглашения живёт ровно в адресе страницы: он не сохраняется ни в
   * localStorage, ни в аналитике — иначе приватная игра утекла бы вместе с
   * устройством или счётчиком.
   */
  const inviteCode = computed(() => {
    const raw = route.query[INVITE_CODE_QUERY_KEY];

    return typeof raw === 'string' && raw ? raw : null;
  });

  const {
    abilities,
    addSession,
    addSessionSeries,
    applyToGame,
    changeAttendance,
    cancel,
    cancelSession,
    close,
    completeSession,
    duplicateSession,
    game,
    gameError,
    gameStatus,
    isGameLoading,
    areSessionsLoading,
    ownParticipationBySession,
    ownRegistration,
    raise,
    refreshAll,
    refreshOwnParticipations,
    remove,
    scheduleSession,
    sessions,
    startSession,
    withdrawFromGame,
  } = useGameDetail(gameId, inviteCode);

  const isBusy = ref(false);
  const isOpeningNexus = ref(false);

  const isNotFound = computed(
    () => getFindGameStatus(gameError.value) === StatusCodes.NOT_FOUND,
  );

  const isError = computed(() => gameStatus.value === 'error');

  const masterName = computed(() =>
    game.value ? getParticipantName(game.value.masterId) : '',
  );

  /**
   * Сессии, чей чат открыт пользователю: мастеру — все, игроку — те, в
   * состав которых он входит.
   */
  useSeoMeta({
    title: () => game.value?.title ?? GAMES_NAVIGATION_LABEL,
    description: () =>
      game.value ? getGameDescriptionText(game.value.description) : '',
  });

  // Мастера подписываем именем из core-api: сервис поиска игр имён не хранит,
  // а сырой UUID пользователю ничего не говорит.
  watch(
    game,
    (loaded) => {
      if (loaded) {
        resolveNames([loaded.masterId]);
      }
    },
    { immediate: true },
  );

  /**
   * Выполняет действие мастера или модератора с уведомлением о результате.
   * @param successTitle Заголовок уведомления об успехе.
   * @param action Само действие.
   */
  async function runAction(
    successTitle: string,
    action: () => Promise<void>,
  ): Promise<boolean> {
    isBusy.value = true;

    try {
      await action();

      toast.add({
        title: successTitle,
        color: 'success',
        icon: 'tabler:check',
      });

      return true;
    } catch (error) {
      toast.add({
        title: FIND_GAME_UNKNOWN_ERROR_MESSAGE,
        description: getFindGameErrorMessage(error),
        color: 'error',
        icon: 'tabler:alert-triangle',
      });

      return false;
    } finally {
      isBusy.value = false;
    }
  }

  /** Завершает игру. */
  function handleClose(): void {
    runAction(GAME_CLOSED_TOAST, close);
  }

  /** Отмечает игру несостоявшейся. */
  function handleCancel(): void {
    runAction(GAME_CANCELLED_TOAST, cancel);
  }

  /** Поднимает игру в каталоге. */
  function handleRaise(): void {
    runAction(GAME_RAISED_TOAST, raise);
  }

  /**
   * Скрывает игру мягким удалением и возвращает в каталог: страницы больше нет.
   * @param reason Причина для административного аудита.
   */
  async function handleRemove(reason: string): Promise<void> {
    const removed = await runAction(GAME_DELETED_TOAST, () => remove(reason));

    if (removed) {
      await navigateTo(GAMES_ROUTE);
    }
  }

  /**
   * Создаёт сессию и обновляет участие: принятый в игру попадает в новую
   * встречу сразу, без отдельной заявки.
   * @param request Параметры сессии.
   */
  async function handleCreateSession(
    ...args: Parameters<typeof addSession>
  ): Promise<void> {
    await addSession(...args);
    await refreshOwnParticipations();
  }

  /**
   * Заводит серию встреч и обновляет участие: принятый в игру попадает во все
   * созданные встречи сразу.
   * @param args Расписание серии.
   */
  async function handleCreateSeries(
    ...args: Parameters<typeof addSessionSeries>
  ): Promise<void> {
    await addSessionSeries(...args);
    await refreshOwnParticipations();
  }

  /**
   * Копирует сессию и обновляет участие.
   * @param args Сессия-источник и параметры копии.
   */
  async function handleCopySession(
    ...args: Parameters<typeof duplicateSession>
  ): Promise<void> {
    await duplicateSession(...args);
    await refreshOwnParticipations();
  }

  /**
   * Открывает комнату игры. Сервис заводит её при первом входе, поэтому
   * ссылки на неё заранее нет — она узнаётся этим же запросом.
   */
  async function openNexus(): Promise<void> {
    isOpeningNexus.value = true;

    try {
      const nexus = await fetchGameNexus(gameId.value);

      await navigateTo(getNexusRoute(nexus.id));
    } catch (error) {
      toast.add({
        title: FIND_GAME_UNKNOWN_ERROR_MESSAGE,
        description: getFindGameErrorMessage(error),
        color: 'error',
        icon: 'tabler:alert-triangle',
      });
    } finally {
      isOpeningNexus.value = false;
    }
  }

  /**
   * Перечитывает всё после решения мастера: меняются и занятые места игры, и
   * состав незакрытых сессий.
   */
  async function handleRegistrationsChanged(): Promise<void> {
    await refreshAll();
    await refreshOwnParticipations();
  }

  const isApplyOpen = ref(false);
  const isRegistrationsOpen = ref(false);

  /** Открывает окно заявки в игру. */
  function openApply(): void {
    isApplyOpen.value = true;
  }

  /**
   * Подаёт заявку в игру.
   * @param request Как игрок представил персонажа.
   */
  async function handleApply(
    ...args: Parameters<typeof applyToGame>
  ): Promise<void> {
    const applied = await runAction(APPLY_SENT_TOAST, () =>
      applyToGame(...args),
    );

    if (applied) {
      isApplyOpen.value = false;
    }
  }

  /** Отзывает собственную заявку. */
  function handleWithdraw(): void {
    runAction(APPLY_WITHDRAWN_TOAST, withdrawFromGame);
  }

  /** Открывает разбор заявок игры. */
  function openRegistrations(): void {
    isRegistrationsOpen.value = true;
  }
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="game?.title"
    :back-to="GAMES_ROUTE"
  >
    <template #actions>
      <GameActions
        v-if="game"
        :abilities="abilities"
        :game-id="game.id"
        :busy="isBusy"
        @close="handleClose"
        @cancel="handleCancel"
        @raise="handleRaise"
        @remove="handleRemove"
      />
    </template>

    <template #default>
      <div
        v-if="isGameLoading"
        class="flex flex-col gap-4"
      >
        <USkeleton class="aspect-video w-full max-w-80 rounded-md" />

        <USkeleton class="h-6 w-1/2" />

        <USkeleton class="h-24 w-full" />
      </div>

      <UiResult
        v-else-if="isNotFound"
        status="404"
        :title="FIND_GAME_NOT_FOUND_MESSAGE"
      >
        <template #extra>
          <UButton
            :to="GAMES_ROUTE"
            :label="GAMES_NAVIGATION_LABEL"
          />
        </template>
      </UiResult>

      <UiResult
        v-else-if="isError || !game"
        status="error"
        :title="FIND_GAME_UNKNOWN_ERROR_MESSAGE"
        :sub-title="getFindGameErrorMessage(gameError)"
      >
        <template #extra>
          <UButton
            icon="tabler:refresh"
            :label="GAMES_NAVIGATION_LABEL"
            @click.left.exact.prevent="refreshAll()"
          />
        </template>
      </UiResult>

      <div
        v-else
        class="flex flex-col gap-8"
      >
        <GameOverview
          :game="game"
          :master-name="masterName"
        />

        <GameInviteCard
          v-if="game.inviteCode"
          :game-id="game.id"
          :invite-code="game.inviteCode"
        />

        <UiResult
          v-if="abilities.needsSignIn"
          status="info"
          :title="GAME_GUEST_NOTICE_TITLE"
          :sub-title="GAME_GUEST_NOTICE_DESCRIPTION"
        >
          <template #extra>
            <UButton
              to="/auth"
              icon="tabler:login"
              :label="GAME_SIGN_IN_LABEL"
            />
          </template>
        </UiResult>

        <template v-else>
          <div class="flex flex-wrap items-center gap-2">
            <UButton
              v-if="abilities.canApply"
              icon="tabler:send"
              :disabled="isBusy"
              :label="APPLY_LABEL"
              @click.left.exact.prevent="openApply"
            />

            <UButton
              v-if="abilities.canWithdraw"
              color="neutral"
              variant="subtle"
              icon="tabler:arrow-back-up"
              :disabled="isBusy"
              :label="APPLY_WITHDRAW_LABEL"
              @click.left.exact.prevent="handleWithdraw"
            />

            <UButton
              v-if="abilities.canReviewRegistrations"
              color="neutral"
              variant="subtle"
              icon="tabler:clipboard-list"
              :label="SESSION_REGISTRATIONS_LABEL"
              @click.left.exact.prevent="openRegistrations"
            />

            <UBadge
              v-if="ownRegistration"
              :color="
                SESSION_REGISTRATION_STATUS_COLORS[ownRegistration.status]
              "
              variant="subtle"
              size="sm"
              :label="
                SESSION_REGISTRATION_STATUS_LABELS[ownRegistration.status]
              "
            />
          </div>

          <!-- Отказ без объяснений выглядит молчанием, поэтому названную
            мастером причину игрок видит рядом со статусом заявки -->
          <UAlert
            v-if="ownRegistration?.rejectionReason"
            color="error"
            variant="subtle"
            icon="tabler:message-off"
            :title="REGISTRATION_REJECTED_REASON_TITLE"
            :description="ownRegistration.rejectionReason"
          />

          <GameSessions
            :game="game"
            :sessions="sessions"
            :abilities="abilities"
            :participation-by-session="ownParticipationBySession"
            :create-session="handleCreateSession"
            :create-session-series="handleCreateSeries"
            :copy-session="handleCopySession"
            :change-attendance="changeAttendance"
            :schedule-session="scheduleSession"
            :complete-session="completeSession"
            :cancel-session="cancelSession"
            :start-session="startSession"
            :loading="areSessionsLoading"
            @refresh="handleRegistrationsChanged"
          />

          <GameApplyModal
            v-model:open="isApplyOpen"
            :game="game"
            :loading="isBusy"
            @submit="handleApply"
          />

          <GameRegistrationsPanel
            v-model:open="isRegistrationsOpen"
            :game="game"
            @changed="handleRegistrationsChanged"
          />

          <!-- Комната игры живёт под её адресом: попасть в неё можно только
            отсюда и только подавшим заявку -->
          <UButton
            v-if="abilities.canOpenNexus"
            class="self-start"
            icon="tabler:door-enter"
            :loading="isOpeningNexus"
            :label="NEXUS_OPEN_LABEL"
            @click.left.exact.prevent="openNexus"
          />
        </template>
      </div>
    </template>
  </NuxtLayout>
</template>
