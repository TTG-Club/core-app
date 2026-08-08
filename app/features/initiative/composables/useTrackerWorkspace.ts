import type { MaybeRefOrGetter } from 'vue';

import type {
  AddParticipantRequest,
  ConditionExpiry,
  ConditionKey,
  ParticipantColor,
  SheetPlayerOption,
  TrackerDetailed,
  TrackerParticipant,
  UpdateParticipantRequest,
} from '~initiative/model';

import {
  ADD_SHEET_PLAYER_ERROR_TITLE,
  addParticipants,
  countParticipantsByType,
  deleteTracker,
  fetchTracker,
  getFetchStatus,
  getTrackerErrorMessage,
  MAX_CREATURES,
  MAX_PLAYERS,
  nextTurn,
  previousTurn,
  removeParticipant,
  rollParticipant as requestRollParticipant,
  REROLL_EACH_ROUND_ERROR_TITLE,
  resetTracker,
  rollInitiative,
  startTracker,
  toParticipantSheetLink,
  updateParticipant,
  updateTracker,
} from '~initiative/model';

import { useInitiativeStorage } from './useInitiativeStorage';
import { useSheetHitPointsSync } from './useSheetHitPointsSync';

/**
 * Состояние одного трекера и все действия над ним.
 *
 * Любой ответ мутации — это полный `TrackerDetailed`, поэтому после каждого
 * действия просто заменяем состояние из ответа. Для анонимного владельца ключ
 * доступа (`X-Tracker-Key`) резолвится из localStorage по id трекера.
 *
 * @param trackerIdSource Идентификатор трекера (ref/getter — реагирует на смену
 * маршрута без размонтирования компонента).
 */
export function useTrackerWorkspace(trackerIdSource: MaybeRefOrGetter<string>) {
  const toast = useToast();
  const { keyForTracker, clearSlot } = useInitiativeStorage();

  const trackerId = computed(() => toValue(trackerIdSource));
  const accessKey = computed(() => keyForTracker(trackerId.value));
  const isAnonymous = computed(() => Boolean(accessKey.value));

  const tracker = ref<TrackerDetailed | null>(null);
  const isLoading = ref(false);
  const isMutating = ref(false);
  const loadError = ref<unknown>(null);

  const isPreparing = computed(() => tracker.value?.status === 'PREPARING');
  const isActive = computed(() => tracker.value?.status === 'ACTIVE');

  const participants = computed(() => tracker.value?.participants ?? []);

  const playerCount = computed(() =>
    countParticipantsByType(participants.value, 'PLAYER'),
  );

  const creatureCount = computed(() =>
    countParticipantsByType(participants.value, 'CREATURE'),
  );

  const canAddPlayer = computed(() => playerCount.value < MAX_PLAYERS);

  const remainingCreatures = computed(() =>
    Math.max(0, MAX_CREATURES - creatureCount.value),
  );

  const canAddCreature = computed(() => remainingCreatures.value > 0);

  const { syncHitPoints } = useSheetHitPointsSync();

  /**
   * Участник по идентификатору — состояние боя правится поверх того, что уже
   * пришло с сервера.
   * @param participantId Идентификатор участника.
   */
  function findParticipant(
    participantId: string,
  ): TrackerParticipant | undefined {
    return participants.value.find(
      (participant) => participant.id === participantId,
    );
  }

  /**
   * Записывает текущие хиты участника: в трекер — всегда, а игроку, собранному
   * из листа персонажа, — ещё и в сам лист (только текущие: максимум считает
   * лист, и трекер его не трогает). Свой лист правится напрямую, чужой — по
   * сохранённой ссылке, поэтому мастер ведёт хиты и своих персонажей, и тех,
   * чьи листы ему прислали.
   * @param participantId Идентификатор участника.
   * @param value Новое значение хитов.
   */
  async function setHitPoints(
    participantId: string,
    value: number,
  ): Promise<void> {
    const currentHitPoints = Math.max(0, value);
    const link = findParticipant(participantId)?.sheetLink;

    await editParticipant(participantId, { currentHitPoints });

    if (link) {
      syncHitPoints(link, currentHitPoints);
    }

    await syncDeadByHitPoints(participantId, currentHitPoints);
  }

  /**
   * Прокидывает максимум хитов существа: он же ставит текущие «на полных»,
   * поэтому существо, помеченное повержённым, возвращается в бой.
   * @param participantId Идентификатор участника.
   * @param value Прокинутый максимум хитов.
   */
  async function setMaxHitPoints(
    participantId: string,
    value: number,
  ): Promise<void> {
    const maxHitPoints = Math.max(1, value);

    await editParticipant(participantId, {
      maxHitPoints,
      currentHitPoints: maxHitPoints,
    });

    await syncDeadByHitPoints(participantId, maxHitPoints);
  }

  /**
   * Задаёт КД игрока (у существа КД своё, из статблока).
   * @param participantId Идентификатор участника.
   * @param value Новое значение КД.
   */
  function setArmorClass(
    participantId: string,
    value: number,
  ): Promise<boolean> {
    return editParticipant(participantId, { armorClass: value });
  }

  /**
   * Задаёт цвет иконки участника.
   * @param participantId Идентификатор участника.
   * @param value Новый цвет.
   */
  function setParticipantColor(
    participantId: string,
    value: ParticipantColor,
  ): Promise<boolean> {
    return editParticipant(participantId, { color: value });
  }

  /**
   * Накладывает состояние. Повторное наложение того же состояния не плодит
   * записей — обновляется его длительность. Срок считается от текущего раунда, а
   * спадает состояние на ходу самого участника (это делает бэк).
   * @param participantId Идентификатор участника.
   * @param key Ключ состояния.
   * @param rounds Длительность в раундах; `0` — до снятия вручную.
   */
  function addCondition(
    participantId: string,
    key: ConditionKey,
    rounds: number,
    expiresOn: ConditionExpiry,
  ): Promise<boolean> {
    const participant = findParticipant(participantId);

    if (!participant) {
      return Promise.resolve(false);
    }

    const round = tracker.value?.round ?? 0;

    // Бой не начат — считать раунды не от чего, состояние держится до снятия.
    const expiresAtRound = rounds > 0 && round > 0 ? round + rounds : null;

    const rest = participant.conditions.filter(
      (condition) => condition.key !== key,
    );

    return editParticipant(participantId, {
      conditions: [...rest, { key, expiresAtRound, expiresOn }],
    });
  }

  /**
   * Снимает состояние с участника.
   * @param participantId Идентификатор участника.
   * @param key Ключ состояния.
   */
  function removeCondition(
    participantId: string,
    key: ConditionKey,
  ): Promise<boolean> {
    const participant = findParticipant(participantId);

    if (!participant) {
      return Promise.resolve(false);
    }

    return editParticipant(participantId, {
      conditions: participant.conditions.filter(
        (condition) => condition.key !== key,
      ),
    });
  }

  /**
   * Ведёт признак «повержен» по хитам существа: ноль и ниже — выбывает из
   * очереди хода, снова больше нуля — возвращается. Игроков не трогаем: на нуле
   * персонаж не выбывает, а падает без сознания, и его судьбу решает мастер.
   * @param participantId Идентификатор участника.
   * @param hitPoints Новое значение хитов.
   */
  async function syncDeadByHitPoints(
    participantId: string,
    hitPoints: number,
  ): Promise<void> {
    const participant = findParticipant(participantId);

    if (!participant || participant.type !== 'CREATURE') {
      return;
    }

    const isDefeated = hitPoints <= 0;

    // Лишний PUT не шлём: хиты правят часто, а признак меняется на переходе
    // через ноль.
    if (isDefeated === participant.dead) {
      return;
    }

    await setDead(participantId, isDefeated);
  }

  /** Листы, уже стоящие в бою — форма выбора помечает их, чтобы не дублировать. */
  const linkedSheetIds = computed(
    () =>
      new Set(
        participants.value.flatMap((participant) =>
          participant.sheetLink ? [participant.sheetLink.sheetId] : [],
        ),
      ),
  );

  /**
   * Обрабатывает ошибку доступа: для анонима 401/403/404 = ключ невалиден или
   * трекер уже удалён. Чистим слот, чтобы лендинг не пинал обратно редиректом
   * (без слота он показывает экран сборки нового боя).
   * @param error Пойманная ошибка.
   */
  function handleAccessError(error: unknown): void {
    const status = getFetchStatus(error);
    const isStaleSlot = status === 401 || status === 403 || status === 404;

    if (isStaleSlot && isAnonymous.value) {
      clearSlot();
    }
  }

  /**
   * Загружает актуальное состояние трекера.
   */
  async function load(): Promise<void> {
    isLoading.value = true;
    loadError.value = null;
    // Сбрасываем прежнее состояние: при смене id без размонтирования компонента
    // иначе на экране остаётся старый трекер (спиннер завязан на !tracker).
    tracker.value = null;

    try {
      tracker.value = await fetchTracker(trackerId.value, accessKey.value);
    } catch (error) {
      handleAccessError(error);
      loadError.value = error;
      tracker.value = null;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Выполняет мутацию и перерисовывает состояние из её ответа.
   * @param action Функция мутации, возвращающая полное состояние трекера.
   * @param errorTitle Заголовок тоста при ошибке.
   */
  async function runMutation(
    action: () => Promise<TrackerDetailed>,
    errorTitle: string,
  ): Promise<boolean> {
    isMutating.value = true;

    try {
      tracker.value = await action();

      return true;
    } catch (error) {
      // Признак фиксируем ДО handleAccessError: он вызывает clearSlot(), после
      // чего computed `isAnonymous` синхронно пересчитывается в false и проверка
      // ниже стала бы мёртвой (экран восстановления не показался бы).
      const wasAnonymous = isAnonymous.value;

      handleAccessError(error);

      if (getFetchStatus(error) === 403 && wasAnonymous) {
        loadError.value = error;
        tracker.value = null;
      } else {
        toast.add({
          title: errorTitle,
          description: getTrackerErrorMessage(error),
          color: 'error',
          icon: 'tabler:alert-triangle',
        });
      }

      return false;
    } finally {
      isMutating.value = false;
    }
  }

  /**
   * Переименовывает трекер.
   * @param name Новое имя.
   */
  function rename(name: string): Promise<boolean> {
    return runMutation(
      () => updateTracker(trackerId.value, { name }, accessKey.value),
      'Не удалось переименовать трекер',
    );
  }

  /**
   * Включает или выключает переброс инициативы в начале каждого раунда. Сам
   * переброс делает бэк на переходе раунда — трекеру достаточно хранить опцию.
   * @param value Новое состояние опции.
   */
  function setRerollEachRound(value: boolean): Promise<boolean> {
    return runMutation(
      () =>
        updateTracker(
          trackerId.value,
          { rerollEachRound: value },
          accessKey.value,
        ),
      REROLL_EACH_ROUND_ERROR_TITLE,
    );
  }

  /**
   * Добавляет игрока с заданным мастером КД — одним запросом, вместе с ним.
   * @param name Имя игрока.
   * @param initiativeBonus Бонус инициативы.
   * @param armorClass Класс доспеха, заданный мастером.
   */
  function addPlayer(
    name: string,
    initiativeBonus: number,
    armorClass: number,
  ): Promise<boolean> {
    return runMutation(
      () =>
        addParticipants(
          trackerId.value,
          { type: 'PLAYER', name, initiativeBonus, armorClass },
          accessKey.value,
        ),
      'Не удалось добавить игрока',
    );
  }

  /**
   * Добавляет игрока из листа персонажа: имя, бонус, КД, хиты и привязка к листу
   * уходят одним запросом — id нового участника для этого не нужен. Лист без
   * максимума хитов (персонаж только собирается) хиты не задаёт: плитка
   * останется прочерком, как у игрока, заведённого вручную.
   * @param option Выбранный лист персонажа.
   */
  function addSheetPlayer(option: SheetPlayerOption): Promise<boolean> {
    const hitPoints =
      option.maxHitPoints > 0
        ? {
            maxHitPoints: option.maxHitPoints,
            currentHitPoints: option.currentHitPoints,
          }
        : {};

    return runMutation(
      () =>
        addParticipants(
          trackerId.value,
          {
            type: 'PLAYER',
            name: option.name,
            initiativeBonus: option.initiativeBonus,
            armorClass: option.armorClass,
            sheetLink: toParticipantSheetLink(option),
            ...hitPoints,
          },
          accessKey.value,
        ),
      ADD_SHEET_PLAYER_ERROR_TITLE,
    );
  }

  /**
   * Добавляет существ пачкой.
   * @param creatureUrl Слаг существа из бестиария.
   * @param count Количество.
   * @param name Переопределение базового имени (опционально).
   */
  function addCreatures(
    creatureUrl: string,
    count: number,
    name?: string,
  ): Promise<boolean> {
    const body: AddParticipantRequest = name
      ? { type: 'CREATURE', creatureUrl, count, name }
      : { type: 'CREATURE', creatureUrl, count };

    return runMutation(
      () => addParticipants(trackerId.value, body, accessKey.value),
      'Не удалось добавить существ',
    );
  }

  /**
   * Изменяет участника (только заполненные поля).
   * @param participantId Идентификатор участника.
   * @param patch Поля для изменения.
   */
  function editParticipant(
    participantId: string,
    patch: UpdateParticipantRequest,
  ): Promise<boolean> {
    return runMutation(
      () =>
        updateParticipant(
          trackerId.value,
          participantId,
          patch,
          accessKey.value,
        ),
      'Не удалось изменить участника',
    );
  }

  /**
   * Убирает участника из трекера (полное удаление).
   * @param participantId Идентификатор участника.
   */
  function deleteParticipant(participantId: string): Promise<boolean> {
    return runMutation(
      () => removeParticipant(trackerId.value, participantId, accessKey.value),
      'Не удалось убрать участника',
    );
  }

  /**
   * Помечает участника повержённым/живым (partial PUT `{ dead }`). Повержённый
   * остаётся в списке на своей позиции, но бэк пропускает его в очереди хода.
   * Если помечаем ТЕКУЩЕГО в бою — бэк указатель не сдвигает сам, поэтому сразу
   * передаём ход дальше.
   * @param participantId Идентификатор участника.
   * @param dead Новое состояние (true — повержен, false — вернуть в бой).
   */
  async function setDead(
    participantId: string,
    dead: boolean,
  ): Promise<boolean> {
    const shouldAdvanceTurn =
      dead
      && isActive.value
      && tracker.value?.currentParticipantId === participantId;

    const isUpdated = await editParticipant(participantId, { dead });

    if (isUpdated && shouldAdvanceTurn) {
      await advanceTurn();
    }

    return isUpdated;
  }

  /**
   * Прокидывает инициативу конкретному участнику (перебросить одного —
   * доступно и в подготовке, и в бою).
   * @param participantId Идентификатор участника.
   */
  function rollParticipant(participantId: string): Promise<boolean> {
    return runMutation(
      () =>
        requestRollParticipant(trackerId.value, participantId, accessKey.value),
      'Не удалось прокинуть инициативу участнику',
    );
  }

  /**
   * Прокидывает инициативу всем и начинает бой (или полностью ре-роллит).
   */
  function roll(): Promise<boolean> {
    return runMutation(
      () => rollInitiative(trackerId.value, accessKey.value),
      'Не удалось прокинуть инициативу',
    );
  }

  /**
   * Прокидывает инициативу только существам — игроки кидают свои кости сами.
   * Отдельного эндпоинта на бэке нет, поэтому последовательно зовём
   * per-participant `/roll` для каждого существа: каждый ответ — полное
   * состояние трекера, промежуточные сразу показываем (кубики оживают один за
   * другим). Ошибка на середине прервёт цикл — уже брошенное останется, а
   * повторный клик просто перебросит существ заново.
   */
  function rollCreatures(): Promise<boolean> {
    const [firstCreatureId, ...restCreatureIds] = participants.value
      .filter((participant) => participant.type === 'CREATURE')
      .map((participant) => participant.id);

    // Кнопка задизейблена без существ; guard заодно сужает тип первого id.
    if (!firstCreatureId) {
      return Promise.resolve(false);
    }

    return runMutation(async () => {
      let state = await requestRollParticipant(
        trackerId.value,
        firstCreatureId,
        accessKey.value,
      );

      for (const participantId of restCreatureIds) {
        tracker.value = state;

        state = await requestRollParticipant(
          trackerId.value,
          participantId,
          accessKey.value,
        );
      }

      return state;
    }, 'Не удалось прокинуть инициативу существам');
  }

  /**
   * Начинает бой, не перебрасывая уже брошенное (ручная раздача по одному).
   */
  function startCombat(): Promise<boolean> {
    return runMutation(
      () => startTracker(trackerId.value, accessKey.value),
      'Не удалось начать бой',
    );
  }

  /**
   * Передаёт ход следующему участнику.
   */
  function advanceTurn(): Promise<boolean> {
    return runMutation(
      () => nextTurn(trackerId.value, accessKey.value),
      'Не удалось передать ход',
    );
  }

  /**
   * Возвращает ход предыдущему участнику (откат случайного «Следующего хода»).
   */
  function rewindTurn(): Promise<boolean> {
    return runMutation(
      () => previousTurn(trackerId.value, accessKey.value),
      'Не удалось вернуть ход',
    );
  }

  /**
   * Завершает бой: броски и состояния очищаются, повержённые оживают, состав
   * сохраняется, статус — PREPARING. Всё это делает бэк одним запросом.
   */
  function reset(): Promise<boolean> {
    return runMutation(
      () => resetTracker(trackerId.value, accessKey.value),
      'Не удалось завершить бой',
    );
  }

  /**
   * Удаляет трекер. У анонима дополнительно очищается слот localStorage.
   */
  async function destroy(): Promise<boolean> {
    isMutating.value = true;

    try {
      const wasAnonymous = isAnonymous.value;

      await deleteTracker(trackerId.value, accessKey.value);

      if (wasAnonymous) {
        clearSlot();
      }

      return true;
    } catch (error) {
      toast.add({
        title: 'Не удалось удалить трекер',
        description: getTrackerErrorMessage(error),
        color: 'error',
        icon: 'tabler:alert-triangle',
      });

      return false;
    } finally {
      isMutating.value = false;
    }
  }

  return {
    tracker,
    isAnonymous,
    isLoading,
    isMutating,
    loadError,

    isPreparing,
    isActive,
    participants,
    playerCount,
    creatureCount,
    canAddPlayer,
    canAddCreature,
    remainingCreatures,
    linkedSheetIds,

    load,
    rename,
    setRerollEachRound,
    addPlayer,
    addSheetPlayer,
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
    setMaxHitPoints,
    setArmorClass,
    setParticipantColor,
    addCondition,
    removeCondition,
  };
}
