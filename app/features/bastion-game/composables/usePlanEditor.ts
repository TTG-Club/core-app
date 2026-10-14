import type { MaybeRefOrGetter } from 'vue';
import type { WebsocketProvider } from 'y-websocket';
import type * as Y from 'yjs';

import type {
  PlanDocument,
  PlanParticipant,
  PlanPresencePointer,
  PlanState,
} from '../model';

import { isEqual } from 'es-toolkit';

import {
  createEmptyPlan,
  fetchBastionPlan,
  getBastionErrorMessage,
  getPresenceColor,
  isBastionConflictError,
  PLAN_AUTOSAVE_DELAY_MS,
  PLAN_HISTORY_LIMIT,
  PLAN_LABELS,
  PLAN_POINTER_THROTTLE_MS,
  PLAN_SYNC_TIMEOUT_MS,
  readPlanParticipants,
  saveBastionPlan,
} from '../model';

/** Путь веб-сокета совместного рисования на сервере Nuxt. */
const PLAN_SYNC_PATH = '/bastion-plan-sync';

/**
 * Yjs и общий документ плана загружаются только в браузере, когда открыт
 * редактор: на сервере и на остальных страницах они не нужны.
 *
 * @returns Модули совместного рисования.
 */
async function loadPlanSyncKit() {
  const [yjs, { WebsocketProvider: Provider }, sync] = await Promise.all([
    import('yjs'),
    import('y-websocket'),
    import('../model/plan-sync'),
  ]);

  return { yjs, Provider, sync };
}

type PlanSyncKit = Awaited<ReturnType<typeof loadPlanSyncKit>>;

/** Открытый план: общий документ, соединение и личная отмена. */
interface PlanSession {
  kit: PlanSyncKit;
  doc: Y.Doc;
  provider: WebsocketProvider;
  undoManager: Y.UndoManager;
  syncTimer: ReturnType<typeof setTimeout>;
}

/**
 * Адрес веб-сокета на том же сервере, что и страница: cookie входа уходят
 * вместе с подключением.
 *
 * @returns Адрес без комнаты.
 */
function getPlanSyncUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

  return `${protocol}//${window.location.host}${PLAN_SYNC_PATH}`;
}

/**
 * Состояние редактора плана: общий документ, личная отмена, автосохранение и
 * присутствие соавторов.
 *
 * План рисуют вместе: правки идут в общий документ Yjs через веб-сокет сервера
 * Nuxt и сливаются поштучно, а каждый участник отменяет только свои правки.
 * Документ из базы заводится в общий документ после синхронизации, если его
 * там ещё нет. В базу план сохраняет тот, кто правил, через обычный запрос;
 * на 409 — когда одновременно сохранил соавтор — берётся свежая версия:
 * общий документ уже содержит обе правки.
 *
 * Мазок кистью или перетаскивание корпуса — один шаг отмены: всё между
 * `beginStroke` и `endStroke` склеивается.
 *
 * @param bastionId Бастион.
 * @returns Документ, признаки и действия редактора.
 */
export function usePlanEditor(bastionId: MaybeRefOrGetter<string>) {
  const toast = useToast();
  const { user } = useUser();

  const document = shallowRef<PlanDocument>(createEmptyPlan());
  const savedDocument = shallowRef<PlanDocument>(createEmptyPlan());
  const canEdit = ref(false);
  const isReady = ref(false);
  const isConnected = ref(false);
  const isSaving = ref(false);
  const canUndo = ref(false);
  const canRedo = ref(false);
  const participants = shallowRef<Array<PlanParticipant>>([]);

  /** Источник своих правок: их отслеживает личная отмена и автосохранение. */
  const localOrigin = Symbol('plan-local');
  /** Источник служебных записей: заведение плана и версия после сохранения. */
  const systemOrigin = Symbol('plan-system');

  let session: PlanSession | undefined;
  let isSaveQueued = false;
  let isDisposed = false;
  /** Версия плана в общем документе, от которой отсчитан признак «изменено». */
  let savedVersion: number | undefined;

  const {
    data: loadedPlan,
    status: loadStatus,
    error: loadError,
    refresh,
  } = useAsyncData(
    () => `bastion-plan-${toValue(bastionId)}`,
    () => fetchBastionPlan(toValue(bastionId)),
    { server: false, lazy: true },
  );

  /** Пока общий документ не готов, редактор показывает загрузку. */
  const status = computed(() =>
    loadStatus.value === 'success' && !isReady.value
      ? 'pending'
      : loadStatus.value,
  );

  const isDirty = computed(() => !isEqual(document.value, savedDocument.value));

  const loadErrorMessage = computed(() =>
    getBastionErrorMessage(loadError.value, PLAN_LABELS.loadError),
  );

  const presenceUser = computed(() => {
    const profile = user.value;

    if (!profile?.id) {
      return undefined;
    }

    return {
      id: profile.id,
      name: profile.displayName || profile.username,
      color: getPresenceColor(profile.id),
    };
  });

  const scheduleSave = useDebounceFn(() => save(), PLAN_AUTOSAVE_DELAY_MS);

  /**
   * Отправляет соавторам положение своего указателя.
   *
   * @param pointer Точка на плане или undefined, когда указатель ушёл.
   */
  const setPointer = useThrottleFn(
    (pointer: PlanPresencePointer | undefined) => {
      session?.provider.awareness.setLocalStateField(
        'pointer',
        pointer ?? null,
      );
    },
    PLAN_POINTER_THROTTLE_MS,
    true,
  );

  /** Обновляет признаки отмены и повтора. */
  function updateHistoryFlags(): void {
    canUndo.value = (session?.undoManager.undoStack.length ?? 0) > 0;
    canRedo.value = (session?.undoManager.redoStack.length ?? 0) > 0;
  }

  /**
   * Заводит план из базы, если в общем документе его ещё нет, и открывает
   * редактор. Признак «изменено» отсчитывается от этого состояния.
   *
   * @param current Открытый план.
   * @param plan План из базы.
   */
  function seed(current: PlanSession, plan: PlanState): void {
    const { kit, doc } = current;

    if (!kit.sync.isPlanDocSeeded(doc)) {
      kit.yjs.applyUpdate(
        doc,
        kit.sync.createPlanSeedUpdate(plan.document, plan.version),
        systemOrigin,
      );
    }

    document.value = kit.sync.readPlanFromDoc(doc);
    savedDocument.value = document.value;
    savedVersion = kit.sync.getPlanDocVersion(doc);
    isReady.value = true;
  }

  /** Закрывает общий документ и соединение. */
  function disconnect(): void {
    if (!session) {
      return;
    }

    clearTimeout(session.syncTimer);
    session.provider.destroy();
    session.undoManager.destroy();
    session.doc.destroy();
    session = undefined;

    isReady.value = false;
    isConnected.value = false;
    participants.value = [];
    updateHistoryFlags();
  }

  /**
   * Подключается к общему документу плана.
   *
   * @param plan План из базы.
   */
  async function connect(plan: PlanState): Promise<void> {
    disconnect();

    const kit = await loadPlanSyncKit();

    // Пока грузились модули, план могли перезагрузить или закрыть.
    if (loadedPlan.value !== plan || isDisposed) {
      return;
    }

    const { sync } = kit;
    const doc = new kit.yjs.Doc();

    const undoManager = new kit.yjs.UndoManager(sync.getPlanContentMaps(doc), {
      trackedOrigins: new Set([localOrigin]),
      // Шаги разделяет `stopCapturing`: правка — один шаг, мазок — один шаг.
      captureTimeout: Number.POSITIVE_INFINITY,
    });

    const provider = new kit.Provider(
      getPlanSyncUrl(),
      toValue(bastionId),
      doc,
    );

    // Без связи с сервером план всё равно открывается: рисовать и сохранять
    // можно, соавторы увидят правки после переподключения.
    const syncTimer = setTimeout(() => {
      if (!isReady.value && session) {
        seed(session, plan);
      }
    }, PLAN_SYNC_TIMEOUT_MS);

    const current: PlanSession = { kit, doc, provider, undoManager, syncTimer };

    session = current;
    canEdit.value = plan.canEdit;

    doc.on('update', (_update: Uint8Array, origin: unknown) => {
      if (!isReady.value) {
        return;
      }

      const version = sync.getPlanDocVersion(doc);

      document.value = sync.readPlanFromDoc(doc);

      if (origin === localOrigin || origin === undoManager) {
        void scheduleSave();
      } else if (version !== savedVersion) {
        // Соавтор сохранил план: то, что видно сейчас, уже в базе.
        savedDocument.value = document.value;
      }

      savedVersion = version;
    });

    provider.on('sync', (isSynced: boolean) => {
      if (isSynced && !isReady.value) {
        clearTimeout(syncTimer);
        seed(current, plan);
      }
    });

    provider.on('status', ({ status: connection }) => {
      isConnected.value = connection === 'connected';
    });

    undoManager.on('stack-item-added', () => {
      if (undoManager.undoStack.length > PLAN_HISTORY_LIMIT) {
        undoManager.undoStack.shift();
      }

      updateHistoryFlags();
    });

    undoManager.on('stack-item-popped', updateHistoryFlags);
    undoManager.on('stack-cleared', updateHistoryFlags);

    const { awareness } = provider;

    awareness.on('change', () => {
      participants.value = readPlanParticipants(
        awareness.getStates(),
        doc.clientID,
        presenceUser.value?.id,
      );
    });

    if (presenceUser.value) {
      awareness.setLocalStateField('user', presenceUser.value);
    }
  }

  // Загруженный план — точка отсчёта. Срабатывает на первую загрузку и на
  // ручное обновление после ошибки.
  watch(loadedPlan, (plan) => {
    if (plan) {
      void connect(plan);
    }
  });

  watch(presenceUser, (current) => {
    if (current) {
      session?.provider.awareness.setLocalStateField('user', current);
    }
  });

  /**
   * Применяет правку одним шагом истории. Та же ссылка — правки не было.
   *
   * @param next Новый документ.
   */
  function commit(next: PlanDocument): void {
    if (!session || next === document.value) {
      return;
    }

    const { kit, doc, undoManager } = session;

    undoManager.stopCapturing();
    kit.sync.applyPlanChanges(doc, document.value, next, localOrigin);
    undoManager.stopCapturing();
  }

  /** Начинает мазок: всё до `endStroke` — один шаг отмены. */
  function beginStroke(): void {
    session?.undoManager.stopCapturing();
  }

  /**
   * Применяет правку внутри мазка: она склеивается с остальными правками
   * мазка в один шаг.
   *
   * @param next Новый документ.
   */
  function applyInStroke(next: PlanDocument): void {
    if (session && next !== document.value) {
      session.kit.sync.applyPlanChanges(
        session.doc,
        document.value,
        next,
        localOrigin,
      );
    }
  }

  /** Заканчивает мазок. */
  function endStroke(): void {
    session?.undoManager.stopCapturing();
  }

  /** Отменяет свой последний шаг; правки соавторов остаются. */
  function undo(): void {
    session?.undoManager.undo();
  }

  /** Возвращает свой отменённый шаг. */
  function redo(): void {
    session?.undoManager.redo();
  }

  /**
   * Сохраняет план с версией из общего документа. На 409 — соавтор сохранил
   * одновременно — берёт свежую версию и сохраняет ещё раз: общий документ
   * уже содержит правки обоих.
   *
   * @param current Открытый план.
   * @param snapshot Сохраняемый план.
   * @returns Новая версия.
   */
  async function saveSnapshot(
    current: PlanSession,
    snapshot: PlanDocument,
  ): Promise<number> {
    const id = toValue(bastionId);

    try {
      const saved = await saveBastionPlan(
        id,
        current.kit.sync.getPlanDocVersion(current.doc) ?? 0,
        snapshot,
      );

      return saved.version;
    } catch (error) {
      if (!isBastionConflictError(error)) {
        throw error;
      }

      const fresh = await fetchBastionPlan(id);
      const saved = await saveBastionPlan(id, fresh.version, snapshot);

      return saved.version;
    }
  }

  /** Сохраняет план. Сохранение во время сохранения встаёт в очередь. */
  async function save(): Promise<void> {
    const current = session;

    if (!current || !canEdit.value || !isDirty.value) {
      return;
    }

    if (isSaving.value) {
      isSaveQueued = true;

      return;
    }

    isSaving.value = true;

    const snapshot = document.value;

    try {
      const version = await saveSnapshot(current, snapshot);

      // Новая версия нужна соавторам, иначе их следующее сохранение получит
      // отказ. Документ мог закрыться, пока шёл запрос.
      if (session === current) {
        savedVersion = version;
        current.kit.sync.setPlanDocVersion(current.doc, version, systemOrigin);
      }

      savedDocument.value = snapshot;
    } catch (error) {
      toast.add({
        title: PLAN_LABELS.saveError,
        description: getBastionErrorMessage(error, PLAN_LABELS.saveError),
        color: 'error',
      });
    } finally {
      isSaving.value = false;
    }

    if (isSaveQueued) {
      isSaveQueued = false;
      await save();
    }
  }

  // Уход со страницы не теряет последнюю правку: она сохраняется сразу,
  // не дожидаясь паузы автосохранения.
  onScopeDispose(() => {
    isDisposed = true;
    void save().finally(disconnect);
  });

  return {
    document,
    canEdit,
    status,
    loadErrorMessage,
    refresh,
    isDirty,
    isSaving,
    isConnected,
    canUndo,
    canRedo,
    participants,
    commit,
    beginStroke,
    applyInStroke,
    endStroke,
    undo,
    redo,
    save,
    setPointer,
  };
}
