import type { CreatureOption } from '~initiative/model';

import type {
  CustomCreatureDraft,
  EncounterCreature,
  EncounterPartyRow,
  EncounterResult,
  EncounterState,
} from '../model';

import {
  calculateEncounter,
  createCustomCreature,
  DEFAULT_CHARACTER_LEVEL,
  DEFAULT_ENCOUNTER_STATE,
  ENCOUNTER_STORAGE_KEY,
  findCustomCreature,
  getExperienceByChallengeRating,
  MAX_CREATURE_ROWS,
  MAX_PARTY_ROWS,
  MAX_ROW_COUNT,
  MIN_ROW_COUNT,
  parseEncounterState,
} from '../model';

/**
 * Сериализатор состояния: пишем JSON, читаем через Zod-валидацию, чтобы
 * повреждённое значение из localStorage не сломало калькулятор.
 */
const stateSerializer = {
  /**
   * Читает состояние из строки хранилища.
   * @param raw Строка из localStorage.
   */
  read: (raw: string): EncounterState => {
    try {
      return parseEncounterState(JSON.parse(raw));
    } catch {
      return DEFAULT_ENCOUNTER_STATE;
    }
  },

  /**
   * Превращает состояние в строку для хранилища.
   * @param value Текущее состояние калькулятора.
   */
  write: (value: EncounterState): string => JSON.stringify(value),
};

/**
 * Прижимает количество к допустимому диапазону строки.
 * @param count Введённое количество.
 */
function clampCount(count: number): number {
  return Math.min(MAX_ROW_COUNT, Math.max(MIN_ROW_COUNT, Math.trunc(count)));
}

/**
 * Состояние калькулятора столкновений: группа, существа и итог расчёта.
 * Состояние хранится в localStorage и переживает перезагрузку страницы.
 */
export function useEncounterCalculator() {
  const state = useLocalStorage<EncounterState>(
    ENCOUNTER_STORAGE_KEY,
    DEFAULT_ENCOUNTER_STATE,
    { serializer: stateSerializer },
  );

  const party = computed(() => state.value.party);
  const creatures = computed(() => state.value.creatures);

  const result = computed<EncounterResult>(() =>
    calculateEncounter(state.value.party, state.value.creatures),
  );

  const canAddPartyRow = computed(
    () => state.value.party.length < MAX_PARTY_ROWS,
  );

  const canAddCreature = computed(
    () => state.value.creatures.length < MAX_CREATURE_ROWS,
  );

  /**
   * Добавляет строку группы: персонажей одного уровня.
   * @param level Уровень персонажей; по умолчанию — уровень последней строки.
   */
  function addPartyRow(level?: number): void {
    if (!canAddPartyRow.value) {
      return;
    }

    const lastLevel =
      state.value.party.at(-1)?.level ?? DEFAULT_CHARACTER_LEVEL;

    state.value = {
      ...state.value,
      party: [
        ...state.value.party,
        { id: crypto.randomUUID(), level: level ?? lastLevel, count: 1 },
      ],
    };
  }

  /**
   * Меняет поля строки группы.
   * @param id Идентификатор строки.
   * @param patch Новые значения уровня и/или количества.
   */
  function updatePartyRow(
    id: string,
    patch: Partial<Pick<EncounterPartyRow, 'level' | 'count'>>,
  ): void {
    state.value = {
      ...state.value,
      party: state.value.party.map((row) =>
        row.id === id
          ? {
              ...row,
              ...patch,
              count: clampCount(patch.count ?? row.count),
            }
          : row,
      ),
    };
  }

  /**
   * Удаляет строку группы.
   * @param id Идентификатор строки.
   */
  function removePartyRow(id: string): void {
    state.value = {
      ...state.value,
      party: state.value.party.filter((row) => row.id !== id),
    };
  }

  /**
   * Кладёт новую строку существа в конец списка.
   * @param creature Новая строка существа.
   */
  function appendCreature(creature: EncounterCreature): void {
    state.value = {
      ...state.value,
      creatures: [...state.value.creatures, creature],
    };
  }

  /**
   * Добавляет существо из поиска бестиария. Если такое существо уже есть,
   * увеличивает его количество вместо новой строки.
   * @param option Выбранная опция автокомплита.
   * @param count Сколько существ добавить.
   */
  function addCreature(option: CreatureOption, count: number): void {
    const existing = state.value.creatures.find(
      (creature) => creature.url === option.url,
    );

    if (existing) {
      updateCreature(existing.id, { count: existing.count + count });

      return;
    }

    if (!canAddCreature.value) {
      return;
    }

    const creature: EncounterCreature = {
      id: crypto.randomUUID(),
      url: option.url,
      name: option.label,
      challengeRating: option.challengeRating,
      experience:
        option.experience
        ?? getExperienceByChallengeRating(option.challengeRating),
      experienceInLair: option.experienceInLair,
      inLair: false,
      count: clampCount(count),
    };

    appendCreature(creature);
  }

  /**
   * Добавляет своего монстра мастера. Если монстр с тем же названием и
   * показателем опасности уже есть, увеличивает его количество.
   * @param draft Название, показатель опасности и количество.
   */
  function addCustomCreature(draft: CustomCreatureDraft): void {
    const existing = findCustomCreature(state.value.creatures, draft);

    if (existing) {
      updateCreature(existing.id, { count: existing.count + draft.count });

      return;
    }

    if (!canAddCreature.value) {
      return;
    }

    appendCreature(
      createCustomCreature(crypto.randomUUID(), {
        ...draft,
        count: clampCount(draft.count),
      }),
    );
  }

  /**
   * Меняет количество существа или признак «в логове».
   * @param id Идентификатор строки.
   * @param patch Новые значения.
   */
  function updateCreature(
    id: string,
    patch: Partial<Pick<EncounterCreature, 'count' | 'inLair'>>,
  ): void {
    state.value = {
      ...state.value,
      creatures: state.value.creatures.map((creature) =>
        creature.id === id
          ? {
              ...creature,
              ...patch,
              count: clampCount(patch.count ?? creature.count),
            }
          : creature,
      ),
    };
  }

  /**
   * Удаляет существо из столкновения.
   * @param id Идентификатор строки.
   */
  function removeCreature(id: string): void {
    state.value = {
      ...state.value,
      creatures: state.value.creatures.filter((creature) => creature.id !== id),
    };
  }

  /** Убирает всех существ, группу оставляет. */
  function clearCreatures(): void {
    state.value = { ...state.value, creatures: [] };
  }

  return {
    party,
    creatures,
    result,
    canAddPartyRow,
    canAddCreature,
    addPartyRow,
    updatePartyRow,
    removePartyRow,
    addCreature,
    addCustomCreature,
    updateCreature,
    removeCreature,
    clearCreatures,
  };
}
