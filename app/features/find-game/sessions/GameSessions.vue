<script setup lang="ts">
  import type {
    CopyGameSessionRequest,
    CreateGameSessionRequest,
    CreateGameSessionSeriesRequest,
    Game,
    GameSession,
    GameSessionStatus,
    GameViewerAbilities,
    SessionAttendanceStatus,
    SessionParticipant,
    SessionTimelineScale,
  } from '../model';

  import { UiResult } from '~ui/result';

  import {
    ATTENDANCE_SAVED_TOAST,
    CANCEL_LABEL,
    FIND_GAME_UNKNOWN_ERROR_MESSAGE,
    GAME_SESSION_STATUS_LABELS,
    GAME_SESSION_STATUSES,
    GAME_SESSIONS_TITLE,
    getFindGameErrorMessage,
    SESSION_CANCEL_DESCRIPTION,
    SESSION_CANCEL_LABEL,
    SESSION_CANCEL_TITLE,
    SESSION_CANCELLED_TOAST,
    SESSION_COMPLETE_DESCRIPTION,
    SESSION_COMPLETE_LABEL,
    SESSION_COMPLETE_TITLE,
    SESSION_COMPLETED_TOAST,
    SESSION_COPIED_TOAST,
    SESSION_CREATE_LABEL,
    SESSION_CREATED_TOAST,
    SESSION_LIST_VIEW_LABEL,
    SESSION_SERIES_CREATED_TOAST,
    SESSION_SERIES_LABEL,
    SESSION_STARTED_TOAST,
    SESSION_TIMELINE_DEFAULT_SCALE,
    SESSION_TIMELINE_VIEW_LABEL,
    SESSIONS_DEFAULT_STATUSES,
    SESSIONS_EMPTY_FILTERED_DESCRIPTION,
    SESSIONS_EMPTY_FILTERED_TITLE,
    SESSIONS_EMPTY_MASTER_DESCRIPTION,
    SESSIONS_EMPTY_PLAYER_DESCRIPTION,
    SESSIONS_EMPTY_TITLE,
    SESSIONS_FILTER_LABEL,
    SESSIONS_FILTER_PLACEHOLDER,
    SESSIONS_VIEW_LABEL,
  } from '../model';
  import { SessionParticipantsPanel } from '../registrations';
  import {
    SessionCard,
    SessionCopyModal,
    SessionFormModal,
    SessionSeriesModal,
    SessionTimeline,
  } from './ui';

  /**
   * Действия приходят функциями, а не событиями: окно должно закрыться только
   * после успешного ответа сервиса, а отказ — показать причину. Событие
   * вернуть отказ не может, оно синхронное.
   */
  const {
    game,
    sessions,
    abilities,
    participationBySession,
    createSession,
    createSessionSeries,
    copySession,

    changeAttendance,
    completeSession,
    cancelSession,
    startSession,
    loading = false,
  } = defineProps<{
    game: Game;
    sessions: ReadonlyArray<GameSession>;
    abilities: GameViewerAbilities;
    /** Собственные заявки пользователя по идентификатору сессии. */
    /**
     * Собственное участие по сессиям. Участие заводит сервис при приёме
     * заявки в игру — отдельной заявки на встречу больше нет.
     */
    participationBySession: ReadonlyMap<string, SessionParticipant>;
    createSession: (request: CreateGameSessionRequest) => Promise<void>;
    createSessionSeries: (
      request: CreateGameSessionSeriesRequest,
    ) => Promise<void>;
    copySession: (
      sourceSessionId: string,
      request: CopyGameSessionRequest,
    ) => Promise<void>;
    changeAttendance: (
      sessionId: string,
      status: SessionAttendanceStatus,
    ) => Promise<void>;
    completeSession: (sessionId: string) => Promise<void>;
    cancelSession: (sessionId: string) => Promise<void>;
    startSession: (sessionId: string) => Promise<void>;
    loading?: boolean;
  }>();

  const emit = defineEmits<{
    refresh: [];
  }>();

  const toast = useToast();

  // Показ ограничен состояниями: по умолчанию — только набор, остальное
  // мастер включает сам.
  const statusFilter = ref<Array<GameSessionStatus>>([
    ...SESSIONS_DEFAULT_STATUSES,
  ]);

  const statusOptions = GAME_SESSION_STATUSES.map((value) => ({
    value,
    label: GAME_SESSION_STATUS_LABELS[value],
  }));

  // Расписание читают по оси времени: так видно, когда игра идёт и когда в
  // ней перерыв. Список остаётся для разбора накопившегося — в нём у всех
  // сессий сразу открыты действия.
  const isTimeline = ref(true);

  const timelineScale = ref<SessionTimelineScale>(
    SESSION_TIMELINE_DEFAULT_SCALE,
  );

  const visibleSessions = computed(() =>
    statusFilter.value.length
      ? sessions.filter((session) =>
          statusFilter.value.includes(session.status),
        )
      : sessions,
  );

  // Сессии есть, но ни одна не подходит под фильтр — это другой пустой экран.
  const isFilteredOut = computed(
    () => sessions.length > 0 && visibleSessions.value.length === 0,
  );

  const isCreateOpen = ref(false);
  const isSeriesOpen = ref(false);
  const isBusy = ref(false);
  const copySource = ref<GameSession | null>(null);
  const completeTarget = ref<GameSession | null>(null);
  const cancelTarget = ref<GameSession | null>(null);
  const participantsSessionId = ref<string | null>(null);

  const isCopyOpen = computed({
    get: () => !!copySource.value,
    set: (opened: boolean) => {
      if (!opened) {
        copySource.value = null;
      }
    },
  });

  // Завершение необратимо, поэтому спрашиваем подтверждение.
  const isCompleteOpen = computed({
    get: () => !!completeTarget.value,
    set: (opened: boolean) => {
      if (!opened) {
        completeTarget.value = null;
      }
    },
  });

  const isCancelOpen = computed({
    get: () => !!cancelTarget.value,
    set: (opened: boolean) => {
      if (!opened) {
        cancelTarget.value = null;
      }
    },
  });

  const isParticipantsOpen = computed({
    get: () => !!participantsSessionId.value,
    set: (opened: boolean) => {
      if (!opened) {
        participantsSessionId.value = null;
      }
    },
  });

  const participantsSession = computed(
    () =>
      sessions.find((session) => session.id === participantsSessionId.value)
      ?? null,
  );

  const emptyDescription = computed(() =>
    abilities.canCreateSession
      ? SESSIONS_EMPTY_MASTER_DESCRIPTION
      : SESSIONS_EMPTY_PLAYER_DESCRIPTION,
  );

  /**
   * Выполняет действие и показывает результат уведомлением.
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

  /** Открывает форму новой сессии. */
  function openCreate(): void {
    isCreateOpen.value = true;
  }

  /**
   * Создаёт сессию.
   * @param request Параметры сессии.
   */
  async function handleCreate(
    request: CreateGameSessionRequest,
  ): Promise<void> {
    const created = await runAction(SESSION_CREATED_TOAST, () =>
      createSession(request),
    );

    if (created) {
      isCreateOpen.value = false;
    }
  }

  /** Открывает форму серии встреч. */
  function openSeries(): void {
    isSeriesOpen.value = true;
  }

  /**
   * Создаёт серию встреч по расписанию.
   * @param request Расписание серии.
   */
  async function handleCreateSeries(
    request: CreateGameSessionSeriesRequest,
  ): Promise<void> {
    const created = await runAction(SESSION_SERIES_CREATED_TOAST, () =>
      createSessionSeries(request),
    );

    if (created) {
      isSeriesOpen.value = false;
    }
  }

  /**
   * Открывает форму копирования сессии.
   * @param session Сессия-источник.
   */
  function openCopy(session: GameSession): void {
    copySource.value = session;
  }

  /**
   * Копирует сессию.
   * @param sourceSessionId Сессия-источник.
   * @param request Дата и название новой сессии.
   */
  async function handleCopy(
    sourceSessionId: string,
    request: CopyGameSessionRequest,
  ): Promise<void> {
    const copied = await runAction(SESSION_COPIED_TOAST, () =>
      copySession(sourceSessionId, request),
    );

    if (copied) {
      copySource.value = null;
    }
  }

  /**
   * Спрашивает подтверждение на отмену сессии.
   * @param session Сессия, которую отменяют.
   */
  function askCancel(session: GameSession): void {
    cancelTarget.value = session;
  }

  /** Отменяет сессию после подтверждения. */
  async function handleCancel(): Promise<void> {
    const session = cancelTarget.value;

    if (!session) {
      return;
    }

    const cancelled = await runAction(SESSION_CANCELLED_TOAST, () =>
      cancelSession(session.id),
    );

    if (cancelled) {
      cancelTarget.value = null;
    }
  }

  /**
   * Переводит сессию в «идёт».
   * @param session Сессия, которую начинают.
   */
  function handleStart(session: GameSession): void {
    runAction(SESSION_STARTED_TOAST, () => startSession(session.id));
  }

  /**
   * Спрашивает подтверждение на завершение сессии.
   * @param session Сессия, которую завершают.
   */
  function askComplete(session: GameSession): void {
    completeTarget.value = session;
  }

  /** Завершает сессию после подтверждения. */
  async function handleComplete(): Promise<void> {
    const session = completeTarget.value;

    if (!session) {
      return;
    }

    const completed = await runAction(SESSION_COMPLETED_TOAST, () =>
      completeSession(session.id),
    );

    if (completed) {
      completeTarget.value = null;
    }
  }

  /**
   * Собственное участие в сессии; `null` — пользователь не в составе.
   * @param sessionId Идентификатор сессии.
   */
  function participantOf(sessionId: string): SessionParticipant | null {
    return participationBySession.get(sessionId) ?? null;
  }

  /**
   * Меняет присутствие в сессии.
   * @param sessionId Идентификатор сессии.
   * @param status Новый статус присутствия.
   */
  function handleAttend(
    sessionId: string,
    status: SessionAttendanceStatus,
  ): void {
    runAction(ATTENDANCE_SAVED_TOAST, () =>
      changeAttendance(sessionId, status),
    );
  }

  /**
   * Открывает состав сессии.
   * @param sessionId Идентификатор сессии.
   */
  function openParticipants(sessionId: string): void {
    participantsSessionId.value = sessionId;
  }
</script>

<template>
  <section class="flex flex-col gap-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h3 class="text-lg font-semibold text-highlighted">
        {{ GAME_SESSIONS_TITLE }}
      </h3>

      <div class="flex flex-wrap items-center gap-2">
        <!-- Вид переключается значками: подписи вытесняют фильтр на свою строку,
          а сам выбор из двух вариантов очевиден и без них -->
        <UFieldGroup
          size="sm"
          :aria-label="SESSIONS_VIEW_LABEL"
        >
          <UTooltip :text="SESSION_TIMELINE_VIEW_LABEL">
            <UButton
              :color="isTimeline ? 'primary' : 'neutral'"
              :variant="isTimeline ? 'solid' : 'subtle'"
              icon="tabler:timeline-event"
              :aria-label="SESSION_TIMELINE_VIEW_LABEL"
              @click.left.exact.prevent="isTimeline = true"
            />
          </UTooltip>

          <UTooltip :text="SESSION_LIST_VIEW_LABEL">
            <UButton
              :color="isTimeline ? 'neutral' : 'primary'"
              :variant="isTimeline ? 'subtle' : 'solid'"
              icon="tabler:list"
              :aria-label="SESSION_LIST_VIEW_LABEL"
              @click.left.exact.prevent="isTimeline = false"
            />
          </UTooltip>
        </UFieldGroup>

        <USelectMenu
          v-model="statusFilter"
          multiple
          value-key="value"
          size="sm"
          :items="statusOptions"
          :placeholder="SESSIONS_FILTER_PLACEHOLDER"
          :aria-label="SESSIONS_FILTER_LABEL"
          class="w-40"
        />

        <UButton
          v-if="abilities.canCreateSession"
          size="sm"
          icon="tabler:calendar-plus"
          :label="SESSION_CREATE_LABEL"
          @click.left.exact.prevent="openCreate"
        />

        <UButton
          v-if="abilities.canCreateSession"
          size="sm"
          color="neutral"
          variant="subtle"
          icon="tabler:calendar-repeat"
          :label="SESSION_SERIES_LABEL"
          @click.left.exact.prevent="openSeries"
        />
      </div>
    </div>

    <div
      v-if="loading"
      class="flex flex-col gap-2"
    >
      <USkeleton
        v-for="index in 2"
        :key="index"
        class="h-32 w-full rounded-lg"
      />
    </div>

    <UiResult
      v-else-if="isFilteredOut"
      status="info"
      :title="SESSIONS_EMPTY_FILTERED_TITLE"
      :sub-title="SESSIONS_EMPTY_FILTERED_DESCRIPTION"
    />

    <UiResult
      v-else-if="!sessions.length"
      status="info"
      :title="SESSIONS_EMPTY_TITLE"
      :sub-title="emptyDescription"
    />

    <SessionTimeline
      v-else-if="isTimeline"
      v-model:scale="timelineScale"
      :sessions="visibleSessions"
      :game="game"
      :abilities="abilities"
      :participation-by-session="participationBySession"
      :busy="isBusy"
      @attend="handleAttend"
      @copy="openCopy"
      @open-participants="openParticipants"
      @complete="askComplete"
      @start="handleStart"
      @cancel="askCancel"
    />

    <div
      v-else
      class="flex flex-col gap-3"
    >
      <SessionCard
        v-for="session in visibleSessions"
        :key="session.id"
        :session="session"
        :game="game"
        :abilities="abilities"
        :participant="participantOf(session.id)"
        :busy="isBusy"
        @attend="handleAttend"
        @copy="openCopy"
        @open-participants="openParticipants"
        @complete="askComplete"
        @start="handleStart"
        @cancel="askCancel"
      />
    </div>

    <SessionFormModal
      v-model:open="isCreateOpen"
      :cost-type="game.costType"
      :loading="isBusy"
      @submit="handleCreate"
    />

    <SessionSeriesModal
      v-model:open="isSeriesOpen"
      :cost-type="game.costType"
      :loading="isBusy"
      @submit="handleCreateSeries"
    />

    <SessionCopyModal
      v-model:open="isCopyOpen"
      :source="copySource"
      :loading="isBusy"
      @submit="handleCopy"
    />

    <UModal
      v-model:open="isCompleteOpen"
      :title="SESSION_COMPLETE_TITLE"
      :description="SESSION_COMPLETE_DESCRIPTION"
    >
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            variant="ghost"
            color="neutral"
            :disabled="isBusy"
            :label="CANCEL_LABEL"
            @click.left.exact.prevent="isCompleteOpen = false"
          />

          <UButton
            color="error"
            icon="tabler:flag-check"
            :loading="isBusy"
            :label="SESSION_COMPLETE_LABEL"
            @click.left.exact.prevent="handleComplete"
          />
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="isCancelOpen"
      :title="SESSION_CANCEL_TITLE"
      :description="SESSION_CANCEL_DESCRIPTION"
    >
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            variant="ghost"
            color="neutral"
            :disabled="isBusy"
            :label="CANCEL_LABEL"
            @click.left.exact.prevent="isCancelOpen = false"
          />

          <UButton
            color="error"
            icon="tabler:calendar-x"
            :loading="isBusy"
            :label="SESSION_CANCEL_LABEL"
            @click.left.exact.prevent="handleCancel"
          />
        </div>
      </template>
    </UModal>

    <SessionParticipantsPanel
      v-model:open="isParticipantsOpen"
      :game="game"
      :session="participantsSession"
      @changed="emit('refresh')"
    />
  </section>
</template>
