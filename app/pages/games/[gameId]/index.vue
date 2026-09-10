<script setup lang="ts">
  import type { CreateGameReportRequest } from '~find-game/model';

  import { StatusCodes } from 'http-status-codes';

  import {
    useFindGameToast,
    useGameDetail,
    useParticipantNames,
  } from '~find-game/composables';
  import { GameApplyModal } from '~find-game/form';
  import {
    GameActions,
    GameInviteCard,
    GameOverview,
    GameSummaryCard,
  } from '~find-game/game';
  import {
    APPLY_LABEL,
    APPLY_OWN_STATUS_LABEL,
    APPLY_SENT_TOAST,
    APPLY_WITHDRAWN_TOAST,
    FIND_GAME_NOT_FOUND_MESSAGE,
    FIND_GAME_UNKNOWN_ERROR_MESSAGE,
    GAME_CANCELLED_TOAST,
    GAME_CLOSED_TOAST,
    GAME_DELETED_TOAST,
    GAME_DETAIL_TABS,
    GAME_GUEST_NOTICE_DESCRIPTION,
    GAME_GUEST_NOTICE_TITLE,
    GAME_LEFT_TOAST,
    GAME_RAISED_TOAST,
    GAME_RECRUITMENT_CLOSED_TOAST,
    GAME_RECRUITMENT_OPENED_TOAST,
    GAME_REPORT_SENT_TOAST,
    GAME_SIGN_IN_LABEL,
    GAMES_NAVIGATION_LABEL,
    GAMES_ROUTE,
    getFindGameErrorMessage,
    getFindGameStatus,
    getNearestPaidSession,
    getNearestSessionStart,
    getSessionPriceLabel,
    INVITE_CODE_QUERY_KEY,
    REGISTRATION_REJECTED_REASON_TITLE,
    reportGame,
    SESSION_REGISTRATION_STATUS_COLORS,
    SESSION_REGISTRATION_STATUS_LABELS,
  } from '~find-game/model';
  import {
    GameFinancePanel,
    GameParticipantCards,
    GameRegistrationsPanel,
  } from '~find-game/registrations';
  import { GameSessions } from '~find-game/sessions';
  import { getGameDescriptionText } from '~find-game/ui';
  import { UiResult } from '~ui/result';

  const route = useRoute();
  const { showError, showSuccess } = useFindGameToast();

  const { getParticipantName, watchParticipantNames } = useParticipantNames();

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
    closeRecruitment,
    completeSession,
    duplicateSession,
    game,
    gameError,
    gameStatus,
    isGameLoading,
    areSessionsLoading,
    openRecruitment,
    ownParticipationBySession,
    ownRegistration,
    raise,
    refreshAll,
    refreshOwnParticipations,
    remove,
    sessions,
    startSession,
    withdrawFromGame,
  } = useGameDetail(gameId, inviteCode);

  const isBusy = ref(false);

  const isNotFound = computed(
    () => getFindGameStatus(gameError.value) === StatusCodes.NOT_FOUND,
  );

  const isError = computed(() => gameStatus.value === 'error');

  const masterName = computed(() =>
    game.value ? getParticipantName(game.value.masterId) : '',
  );

  const detailTabs = computed(() =>
    abilities.value.canReviewRegistrations && game.value?.costType === 'PAID'
      ? GAME_DETAIL_TABS
      : GAME_DETAIL_TABS.filter((tab) => tab.value !== 'finance'),
  );

  /**
   * Ближайшая встреча для сводки. Своё поле игры сервис заполняет только в
   * выдаче каталога, поэтому здесь дата считается по загруженному расписанию,
   * а поле игры остаётся запасным путём — оно всё, что есть у гостя.
   */
  const nextSessionAt = computed(
    () => getNearestSessionStart(sessions.value, Date.now()) ?? null,
  );

  /** Цена ближайшей платной встречи: пробная бесплатная её не подменяет. */
  const nextPaidSessionPrice = computed(() => {
    const session = getNearestPaidSession(sessions.value, Date.now());

    return session ? getSessionPriceLabel(session) : null;
  });

  useSeoMeta({
    title: () => game.value?.title ?? GAMES_NAVIGATION_LABEL,
    description: () =>
      game.value ? getGameDescriptionText(game.value.description) : '',
  });

  // Мастера подписываем именем из core-api: сервис поиска игр имён не хранит,
  // а сырой UUID пользователю ничего не говорит.
  watchParticipantNames(() => (game.value ? [game.value.masterId] : []));

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

      showSuccess(successTitle);

      return true;
    } catch (error) {
      showError(error);

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

  /** Передаёт жалобу и сообщает об успешной постановке в очередь. */
  function handleReport(request: CreateGameReportRequest): void {
    const reportedGame = game.value;

    if (!reportedGame) {
      return;
    }

    runAction(GAME_REPORT_SENT_TOAST, () =>
      reportGame(reportedGame.id, request),
    );
  }

  /** Закрывает набор: объявление уходит из поиска, игра у своих остаётся. */
  function handleCloseRecruitment(): void {
    runAction(GAME_RECRUITMENT_CLOSED_TOAST, closeRecruitment);
  }

  /** Открывает набор снова. */
  function handleOpenRecruitment(): void {
    runAction(GAME_RECRUITMENT_OPENED_TOAST, openRecruitment);
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
   * Перечитывает всё после решения мастера: меняются и занятые места игры, и
   * состав незакрытых сессий.
   */
  async function handleRegistrationsChanged(): Promise<void> {
    await refreshAll();
    await refreshOwnParticipations();
  }

  const isApplyOpen = ref(false);

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

  /** Отзывает собственную заявку; принятый игрок этим же выходит из игры. */
  function handleWithdraw(): void {
    runAction(
      abilities.value.isApprovedPlayer
        ? GAME_LEFT_TOAST
        : APPLY_WITHDRAWN_TOAST,
      withdrawFromGame,
    );
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
        @close-recruitment="handleCloseRecruitment"
        @open-recruitment="handleOpenRecruitment"
        @cancel="handleCancel"
        @raise="handleRaise"
        @report="handleReport"
        @remove="handleRemove"
      />
    </template>

    <template #default>
      <div
        v-if="isGameLoading"
        class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start"
      >
        <div class="flex flex-col gap-4 lg:col-start-2 lg:row-start-1">
          <USkeleton class="aspect-video w-full rounded-xl" />

          <USkeleton class="h-56 w-full rounded-xl" />
        </div>

        <div class="flex flex-col gap-4 lg:col-start-1 lg:row-start-1">
          <USkeleton class="h-48 w-full rounded-xl" />

          <USkeleton class="h-64 w-full rounded-xl" />
        </div>
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

      <!--
        Страница объявления в два столбца: слева читают — описание, требования
        и расписание, справа решают — обложка, условия, мастер и кнопка
        заявки. На телефоне сводка идёт первой: сначала «что за игра и во
        сколько», потом длинный текст.
      -->
      <div
        v-else
        class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start"
      >
        <div class="flex flex-col gap-4 lg:col-start-2 lg:row-start-1">
          <GameSummaryCard
            :game="game"
            :master-name="masterName"
            :next-session-at="nextSessionAt"
            :next-paid-session-price="nextPaidSessionPrice"
          >
            <template #actions>
              <div
                v-if="!abilities.needsSignIn"
                class="flex flex-col gap-2 border-t border-default pt-4"
              >
                <UButton
                  v-if="abilities.canApply"
                  block
                  icon="tabler:send"
                  :disabled="isBusy"
                  :label="APPLY_LABEL"
                  @click.left.exact.prevent="openApply"
                />

                <div
                  v-if="ownRegistration"
                  class="flex items-center justify-between gap-2 text-sm"
                >
                  <span class="text-muted">{{ APPLY_OWN_STATUS_LABEL }}</span>

                  <UBadge
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
              </div>
            </template>
          </GameSummaryCard>

          <GameInviteCard
            v-if="game.inviteCode"
            :game-id="game.id"
            :invite-code="game.inviteCode"
          />
        </div>

        <div class="flex flex-col gap-4 lg:col-start-1 lg:row-start-1">
          <GameOverview :game="game" />

          <!-- Гостю расписание не отдаётся сервисом, поэтому на его месте
            стоит приглашение войти: иначе непонятно, есть ли встречи вообще -->
          <div
            v-if="abilities.needsSignIn"
            class="rounded-xl border border-default bg-elevated p-4 sm:p-5"
          >
            <UiResult
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
          </div>

          <template v-else>
            <UTabs
              :key="game.id"
              :items="detailTabs"
              :default-value="detailTabs[0]?.value"
              variant="link"
              :unmount-on-hide="false"
              :ui="{ list: 'justify-start', content: 'pt-5' }"
            >
              <template #participants>
                <GameRegistrationsPanel
                  v-if="abilities.canReviewRegistrations"
                  :game="game"
                  @changed="handleRegistrationsChanged"
                />

                <GameParticipantCards
                  v-else
                  :game-id="game.id"
                  :game="game"
                  :own-registration="ownRegistration"
                  :change-attendance="changeAttendance"
                  :busy="isBusy"
                  @withdraw="handleWithdraw"
                />
              </template>

              <template #sessions>
                <GameSessions
                  :game="game"
                  :sessions="sessions"
                  :abilities="abilities"
                  :participation-by-session="ownParticipationBySession"
                  :create-session="handleCreateSession"
                  :create-session-series="handleCreateSeries"
                  :copy-session="handleCopySession"
                  :change-attendance="changeAttendance"
                  :complete-session="completeSession"
                  :cancel-session="cancelSession"
                  :start-session="startSession"
                  :loading="areSessionsLoading"
                  @refresh="handleRegistrationsChanged"
                />
              </template>

              <template #finance>
                <GameFinancePanel :game="game" />
              </template>
            </UTabs>

            <GameApplyModal
              v-model:open="isApplyOpen"
              :game="game"
              :loading="isBusy"
              @submit="handleApply"
            />
          </template>
        </div>
      </div>
    </template>
  </NuxtLayout>
</template>
