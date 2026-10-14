import type { MaybeRefOrGetter } from 'vue';

import type { PlanDocument } from '../model';

import { isEqual } from 'es-toolkit';

import {
  createEmptyPlan,
  fetchBastionPlan,
  getBastionErrorMessage,
  PLAN_HISTORY_LIMIT,
  PLAN_LABELS,
  saveBastionPlan,
} from '../model';

/**
 * Состояние редактора плана: документ, версия, отмена и повтор, сохранение.
 *
 * Документ неизменяемый: каждая правка — новый объект из `plan-edit.ts`.
 * Поэтому отмена хранит сами документы, а мазок кистью или перетаскивание
 * корпуса целиком — один шаг: снимок берётся в начале мазка, а в историю
 * попадает в конце.
 *
 * @param bastionId Бастион.
 * @returns Документ, признаки и действия редактора.
 */
export function usePlanEditor(bastionId: MaybeRefOrGetter<string>) {
  const toast = useToast();

  const document = shallowRef<PlanDocument>(createEmptyPlan());
  const savedDocument = shallowRef<PlanDocument>(createEmptyPlan());
  const version = ref(0);
  const canEdit = ref(false);
  const isSaving = ref(false);

  const undoStack = shallowRef<Array<PlanDocument>>([]);
  const redoStack = shallowRef<Array<PlanDocument>>([]);

  let strokeStart: PlanDocument | undefined;

  const {
    data: loadedPlan,
    status,
    error: loadError,
    refresh,
  } = useAsyncData(
    () => `bastion-plan-${toValue(bastionId)}`,
    () => fetchBastionPlan(toValue(bastionId)),
    { server: false, lazy: true },
  );

  // Загруженный план — точка отсчёта: история и признак «изменено» начинаются
  // с него. Срабатывает на первую загрузку и на ручное обновление после 409.
  watch(
    loadedPlan,
    (plan) => {
      if (!plan) {
        return;
      }

      document.value = plan.document;
      savedDocument.value = plan.document;
      version.value = plan.version;
      canEdit.value = plan.canEdit;
      undoStack.value = [];
      redoStack.value = [];
    },
    { immediate: true },
  );

  const isDirty = computed(() => !isEqual(document.value, savedDocument.value));
  const canUndo = computed(() => undoStack.value.length > 0);
  const canRedo = computed(() => redoStack.value.length > 0);

  const loadErrorMessage = computed(() =>
    getBastionErrorMessage(loadError.value, PLAN_LABELS.loadError),
  );

  /**
   * Кладёт прежний документ в историю отмены, обрезая её до предела.
   *
   * @param previous Документ до правки.
   */
  function pushHistory(previous: PlanDocument): void {
    undoStack.value = [...undoStack.value, previous].slice(-PLAN_HISTORY_LIMIT);
    redoStack.value = [];
  }

  /**
   * Применяет правку одним шагом истории. Та же ссылка — правки не было.
   *
   * @param next Новый документ.
   */
  function commit(next: PlanDocument): void {
    if (next === document.value) {
      return;
    }

    pushHistory(document.value);
    document.value = next;
  }

  /** Начинает мазок: всё до `endStroke` — один шаг отмены. */
  function beginStroke(): void {
    strokeStart = document.value;
  }

  /**
   * Применяет правку внутри мазка, не трогая историю.
   *
   * @param next Новый документ.
   */
  function applyInStroke(next: PlanDocument): void {
    document.value = next;
  }

  /** Заканчивает мазок и кладёт его в историю, если что-то поменялось. */
  function endStroke(): void {
    if (strokeStart && strokeStart !== document.value) {
      pushHistory(strokeStart);
    }

    strokeStart = undefined;
  }

  /** Отменяет последний шаг. */
  function undo(): void {
    const previous = undoStack.value.at(-1);

    if (!previous) {
      return;
    }

    undoStack.value = undoStack.value.slice(0, -1);
    redoStack.value = [...redoStack.value, document.value];
    document.value = previous;
  }

  /** Возвращает отменённый шаг. */
  function redo(): void {
    const next = redoStack.value.at(-1);

    if (!next) {
      return;
    }

    redoStack.value = redoStack.value.slice(0, -1);
    undoStack.value = [...undoStack.value, document.value];
    document.value = next;
  }

  /** Сохраняет план. На 409 показывает, что план уже изменил кто-то другой. */
  async function save(): Promise<void> {
    isSaving.value = true;

    try {
      const saved = await saveBastionPlan(
        toValue(bastionId),
        version.value,
        document.value,
      );

      version.value = saved.version;
      document.value = saved.document;
      savedDocument.value = saved.document;
      toast.add({ title: PLAN_LABELS.saved, color: 'success' });
    } catch (error) {
      toast.add({
        title: PLAN_LABELS.saveError,
        description: getBastionErrorMessage(error, PLAN_LABELS.saveError),
        color: 'error',
      });
    } finally {
      isSaving.value = false;
    }
  }

  return {
    document,
    version,
    canEdit,
    status,
    loadErrorMessage,
    refresh,
    isDirty,
    isSaving,
    canUndo,
    canRedo,
    commit,
    beginStroke,
    applyInStroke,
    endStroke,
    undo,
    redo,
    save,
  };
}
