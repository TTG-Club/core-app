import type { MaybeRefOrGetter } from 'vue';

import type {
  CopyGameSessionRequest,
  CreateGameRegistrationRequest,
  CreateGameSessionRequest,
  CreateGameSessionSeriesRequest,
  SessionAttendanceStatus,
  SessionParticipant,
} from '../model';

import {
  cancelGame,
  cancelGameSession,
  closeGame,
  closeGameRecruitment,
  completeGameSession,
  copyGameSession,
  createGameRegistration,
  createGameSession,
  createGameSessionSeries,
  deleteGame,
  fetchGame,
  fetchGameSessions,
  fetchOwnGameRegistration,
  fetchOwnSessionParticipation,
  openGameRecruitment,
  raiseGame,
  resolveGameViewerAbilities,
  startGameSession,
  updateSessionAttendance,
  withdrawGameRegistration,
} from '../model';

/**
 * Страница игры: сама игра, её сессии, собственные заявки пользователя и
 * вытекающие из них права.
 *
 * Код приглашения приходит из адреса и подставляется в каждый запрос, которому
 * он нужен: игра, сессии и подача заявки. Нигде не сохраняется — ни в
 * localStorage, ни в аналитике: он живёт ровно столько, сколько открыт адрес.
 *
 * @param gameId Идентификатор игры из адреса.
 * @param inviteCode Код приглашения из адреса или `null`.
 */
export function useGameDetail(
  gameId: MaybeRefOrGetter<string>,
  inviteCode: MaybeRefOrGetter<string | null>,
) {
  const { user, isLoggedIn } = useUser();
  const { roles } = useUserRoles();

  const currentGameId = computed(() => toValue(gameId));
  const currentInviteCode = computed(() => toValue(inviteCode));
  const currentUserId = computed(() => user.value?.id ?? null);

  const {
    data: game,
    error: gameError,
    status: gameStatus,
    refresh: refreshGame,
  } = useAsyncData(
    () => `find-game-detail-${toValue(gameId)}`,
    () => fetchGame(currentGameId.value, currentInviteCode.value),
    { watch: [currentGameId, currentInviteCode], deep: false },
  );

  // Список сессий сервис отдаёт только авторизованным, поэтому гостю его даже
  // не запрашиваем: 401 в консоли ничего не объясняет, а на экране гость и так
  // видит приглашение войти.
  const {
    data: sessions,
    error: sessionsError,
    status: sessionsStatus,
    refresh: refreshSessions,
  } = useAsyncData(
    () => `find-game-sessions-${toValue(gameId)}`,
    async () => {
      // Гостю сервис сессии не отдаёт: запрашивать их до входа — это
      // гарантированный 401 в консоли вместо данных.
      if (!isLoggedIn.value) {
        return [];
      }

      return await fetchGameSessions(
        currentGameId.value,
        currentInviteCode.value,
      );
    },
    {
      watch: [currentGameId, currentInviteCode, isLoggedIn],
      deep: false,
      server: false,
      default: () => [],
    },
  );

  const isMaster = computed(
    () => !!currentUserId.value && game.value?.masterId === currentUserId.value,
  );

  /**
   * Собственная заявка в игру.
   *
   * Одна на игру: из неё следует и состав, и доступ к чатам, и возможность
   * отозваться. Вычислить статус по `registeredPlayerIds` сессии нельзя —
   * там только участники встречи, и `PENDING` от `REJECTED` по этому списку
   * не отличить. Мастеру запрос не нужен: он в собственную игру заявок не
   * подаёт.
   */
  const { data: ownRegistration, refresh: refreshOwnRegistrations } =
    useAsyncData(
      () => `find-game-own-registration-${toValue(gameId)}`,
      async () => {
        if (!isLoggedIn.value || isMaster.value) {
          return null;
        }

        return await fetchOwnGameRegistration(
          currentGameId.value,
          currentInviteCode.value,
        ).catch(() => null);
      },
      {
        watch: [currentGameId, isMaster, isLoggedIn],
        deep: false,
        server: false,
        default: () => null,
      },
    );

  /**
   * Собственное участие по сессиям — для отметки присутствия и оплаты.
   *
   * Спрашивается только по тем встречам, в составе которых пользователь уже
   * есть: состав виден в `registeredPlayerIds`, а присутствие и оплата — нет,
   * их сервис отдаёт отдельно.
   */
  const { data: ownParticipations, refresh: refreshOwnParticipations } =
    useAsyncData(
      () => `find-game-own-participation-${toValue(gameId)}`,
      async () => {
        const playerId = currentUserId.value;

        if (!playerId || !sessions.value?.length) {
          return [];
        }

        const mine = sessions.value.filter((session) =>
          session.registeredPlayerIds.includes(playerId),
        );

        const found = await Promise.all(
          mine.map((session) =>
            fetchOwnSessionParticipation(
              currentGameId.value,
              session.id,
              currentInviteCode.value,
            ).catch(() => null),
          ),
        );

        return found.filter(
          (participation): participation is SessionParticipant =>
            !!participation,
        );
      },
      {
        watch: [sessions, currentUserId],
        deep: false,
        server: false,
        default: () => [],
      },
    );

  const ownParticipationBySession = computed(() => {
    const bySession = new Map<string, SessionParticipant>();

    for (const participation of ownParticipations.value ?? []) {
      bySession.set(participation.sessionId, participation);
    }

    return bySession;
  });

  const abilities = computed(() =>
    resolveGameViewerAbilities({
      game: game.value ?? null,
      userId: currentUserId.value,
      roles: roles.value ?? [],
      registration: ownRegistration.value ?? null,
    }),
  );

  const isGameLoading = computed(
    () => gameStatus.value !== 'success' && gameStatus.value !== 'error',
  );

  const areSessionsLoading = computed(
    () =>
      isLoggedIn.value
      && sessionsStatus.value !== 'success'
      && sessionsStatus.value !== 'error',
  );

  /** Перечитывает всё, что зависит от состава сессий и заявок. */
  async function refreshAll(): Promise<void> {
    await refreshGame();

    if (isLoggedIn.value) {
      await refreshSessions();
      await refreshOwnRegistrations();
    }
  }

  /**
   * Подаёт заявку в игру.
   * @param request Как игрок представил персонажа: лист, ссылка или имя.
   */
  async function applyToGame(
    request: CreateGameRegistrationRequest,
  ): Promise<void> {
    await createGameRegistration(
      currentGameId.value,
      request,
      currentInviteCode.value,
    );

    await refreshOwnRegistrations();
  }

  /** Отзывает собственную заявку в игру. */
  async function withdrawFromGame(): Promise<void> {
    await withdrawGameRegistration(currentGameId.value);

    await Promise.all([refreshSessions(), refreshOwnRegistrations()]);
  }

  /**
   * Меняет собственное присутствие в сессии.
   * @param sessionId Идентификатор сессии.
   * @param attendanceStatus Новый статус присутствия.
   */
  async function changeAttendance(
    sessionId: string,
    attendanceStatus: SessionAttendanceStatus,
  ): Promise<void> {
    await updateSessionAttendance(
      currentGameId.value,
      sessionId,
      attendanceStatus,
    );

    await refreshOwnParticipations();
  }

  /**
   * Создаёт сессию игры.
   * @param request Параметры сессии.
   */
  async function addSession(request: CreateGameSessionRequest): Promise<void> {
    await createGameSession(currentGameId.value, request);

    await refreshSessions();
  }

  /**
   * Заводит серию встреч по расписанию.
   * @param request Расписание серии.
   */
  async function addSessionSeries(
    request: CreateGameSessionSeriesRequest,
  ): Promise<void> {
    await createGameSessionSeries(currentGameId.value, request);

    await refreshSessions();
  }

  /**
   * Создаёт сессию копированием предыдущей.
   * @param sourceSessionId Сессия-источник.
   * @param request Дата новой сессии и необязательное название.
   */
  async function duplicateSession(
    sourceSessionId: string,
    request: CopyGameSessionRequest,
  ): Promise<void> {
    await copyGameSession(currentGameId.value, sourceSessionId, request);

    await refreshSessions();
  }

  /**
   * Завершает сессию игры.
   * @param sessionId Идентификатор сессии.
   */
  async function completeSession(sessionId: string): Promise<void> {
    await completeGameSession(currentGameId.value, sessionId);

    await refreshSessions();
  }

  /**
   * Переводит сессию в «идёт».
   * @param sessionId Идентификатор сессии.
   */
  async function startSession(sessionId: string): Promise<void> {
    await startGameSession(currentGameId.value, sessionId);

    await refreshSessions();
  }

  /**
   * Отменяет сессию: она не состоялась.
   * @param sessionId Идентификатор сессии.
   */
  async function cancelSession(sessionId: string): Promise<void> {
    await cancelGameSession(currentGameId.value, sessionId);

    await refreshSessions();
  }

  /** Отмечает игру несостоявшейся. */
  async function cancel(): Promise<void> {
    await cancelGame(currentGameId.value);

    await refreshGame();
  }

  /** Завершает игру. */
  async function close(): Promise<void> {
    await closeGame(currentGameId.value);

    await refreshGame();
  }

  /** Закрывает набор досрочно: группа собрана. */
  async function closeRecruitment(): Promise<void> {
    await closeGameRecruitment(currentGameId.value);

    await refreshGame();
  }

  /** Открывает набор снова. */
  async function openRecruitment(): Promise<void> {
    await openGameRecruitment(currentGameId.value);

    await refreshGame();
  }

  /** Поднимает игру в начало каталога. */
  async function raise(): Promise<void> {
    await raiseGame(currentGameId.value);

    await refreshGame();
  }

  /**
   * Мягко удаляет игру (администратор или модератор).
   * @param reason Причина для административного аудита.
   */
  async function remove(reason: string): Promise<void> {
    await deleteGame(currentGameId.value, reason);
  }

  return {
    game,
    sessions: computed(() => sessions.value ?? []),
    ownRegistration: computed(() => ownRegistration.value ?? null),
    ownParticipationBySession,
    refreshOwnParticipations,
    abilities,
    inviteCode: currentInviteCode,
    currentUserId,

    gameError,
    gameStatus,
    sessionsError,
    isGameLoading,
    areSessionsLoading,

    addSession,
    addSessionSeries,
    applyToGame,
    cancel,
    cancelSession,
    changeAttendance,
    close,
    closeRecruitment,
    completeSession,
    duplicateSession,
    openRecruitment,
    raise,
    refreshAll,
    refreshGame,
    refreshOwnRegistrations,
    refreshSessions,
    remove,
    startSession,
    withdrawFromGame,
  };
}
