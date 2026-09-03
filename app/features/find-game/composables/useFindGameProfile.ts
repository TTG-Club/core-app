import type { FindGameProfileFormState, FindGameUserProfile } from '../model';

import { isEqual } from 'es-toolkit';

import {
  fetchFindGameProfile,
  findGameProfileRequestSchema,
  getFindGameErrorMessage,
  PROFILE_SAVE_ERROR_TITLE,
  PROFILE_SAVED_TITLE,
  PROFILE_UNSAVED_CONFIRM,
  updateFindGameProfile,
} from '../model';

/**
 * Приводит профиль сервиса к состоянию формы.
 *
 * Пол в сервисе необязателен, а в форме выбор всегда чем-то занят, поэтому
 * пустое значение показывается как «Не указан» — то же самое сервис примет
 * обратно без потери смысла.
 *
 * @param profile Профиль из сервиса.
 */
function toFormState(profile: FindGameUserProfile): FindGameProfileFormState {
  return {
    birthYear: profile.birthYear,
    gender: profile.gender ?? 'NOT_SPECIFIED',
    tabletopExperienceYears: profile.tabletopExperienceYears,
    masterAbout: profile.masterAbout,
    playerAbout: profile.playerAbout,
  };
}

/** Пустая форма — до того, как профиль загрузился. */
function createEmptyFormState(): FindGameProfileFormState {
  return {
    birthYear: null,
    gender: 'NOT_SPECIFIED',
    tabletopExperienceYears: null,
    masterAbout: '',
    playerAbout: '',
  };
}

/**
 * Профиль поиска игр: общая часть и две независимые анкеты — Мастера и Игрока.
 *
 * Отдельного создания профиля не существует: первый `GET` заводит его на
 * стороне сервиса, поэтому форма всегда открывается на готовых данных.
 */
export function useFindGameProfile() {
  const toast = useToast();

  const form = ref<FindGameProfileFormState>(createEmptyFormState());
  const isSaving = ref(false);
  const saveError = ref<string | null>(null);

  // Снимок сохранённого состояния: по нему считаются несохранённые изменения.
  const savedForm = ref<FindGameProfileFormState>(createEmptyFormState());

  const {
    data: profile,
    error,
    status,
    refresh,
  } = useAsyncData('find-game-profile', () => fetchFindGameProfile(), {
    server: false,
    deep: false,
  });

  const isLoading = computed(
    () => status.value !== 'success' && status.value !== 'error',
  );

  const isDirty = computed(() => !isEqual(form.value, savedForm.value));

  watch(profile, (loaded) => {
    if (!loaded) {
      return;
    }

    const state = toFormState(loaded);

    form.value = { ...state };
    savedForm.value = { ...state };
  });

  /** Возвращает форму к последнему сохранённому состоянию. */
  function resetForm(): void {
    form.value = { ...savedForm.value };
    saveError.value = null;
  }

  /**
   * Сохраняет профиль. Анкеты независимы, но сервис принимает их только
   * вместе, поэтому обе уходят в каждом запросе.
   */
  async function save(): Promise<boolean> {
    isSaving.value = true;
    saveError.value = null;

    try {
      const request = findGameProfileRequestSchema.parse({
        birthYear: form.value.birthYear,
        gender: form.value.gender,
        tabletopExperienceYears: form.value.tabletopExperienceYears,
        master: { about: form.value.masterAbout },
        player: { about: form.value.playerAbout },
      });

      const saved = await updateFindGameProfile(request);
      const state = toFormState(saved);

      form.value = { ...state };
      savedForm.value = { ...state };

      toast.add({
        title: PROFILE_SAVED_TITLE,
        color: 'success',
        icon: 'tabler:check',
      });

      return true;
    } catch (saveFailure) {
      saveError.value = getFindGameErrorMessage(saveFailure);

      toast.add({
        title: PROFILE_SAVE_ERROR_TITLE,
        description: saveError.value,
        color: 'error',
        icon: 'tabler:alert-triangle',
      });

      return false;
    } finally {
      isSaving.value = false;
    }
  }

  /**
   * Уход с несохранёнными правками — самый частый способ их потерять.
   * Закрытие вкладки перехватывает браузер сам, а переход внутри сайта
   * останавливается здесь и ждёт ответа пользователя: `pendingLeave` держит
   * `resolve` открытого вопроса, и навигация продолжается только после него.
   */
  const pendingLeave = ref<((confirmed: boolean) => void) | null>(null);

  const isLeaveConfirmOpen = computed({
    get: () => !!pendingLeave.value,
    set: (opened: boolean) => {
      if (!opened) {
        // Закрытие крестиком или Esc равнозначно отказу уходить.
        resolveLeave(false);
      }
    },
  });

  /**
   * Отвечает на вопрос об уходе со страницы.
   * @param confirmed Уходим, потеряв правки.
   */
  function resolveLeave(confirmed: boolean): void {
    const resolve = pendingLeave.value;

    pendingLeave.value = null;
    resolve?.(confirmed);
  }

  onBeforeRouteLeave(() => {
    if (!isDirty.value) {
      return true;
    }

    return new Promise<boolean>((resolve) => {
      pendingLeave.value = resolve;
    });
  });

  useEventListener('beforeunload', (event: BeforeUnloadEvent) => {
    if (!isDirty.value) {
      return;
    }

    event.preventDefault();
  });

  return {
    form,
    isLeaveConfirmOpen,
    leaveConfirmMessage: PROFILE_UNSAVED_CONFIRM,
    profile,

    error,
    isDirty,
    isLoading,
    isSaving,
    saveError,
    status,

    confirmLeave: () => resolveLeave(true),
    refresh,
    resetForm,
    save,
  };
}
