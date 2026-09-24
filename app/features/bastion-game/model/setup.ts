import type {
  CatalogFacility,
  FacilitySetupRequest,
  PlayerBastionMember,
  SelectedChoice,
} from './schema';

import { STARTING_BASIC_SPACES } from './constants';

export type StartingBasicSpace = (typeof STARTING_BASIC_SPACES)[number];

const STARTING_BASIC_SPACE_SET: ReadonlySet<string> = new Set(
  STARTING_BASIC_SPACES,
);

/** Выбранное специализированное сооружение и его выборы (название выбора → варианты). */
export interface SpecialFacilityDraft {
  facilityUrl: string;
  choices: Record<string, Array<string>>;
}

/** Черновик стартового выбора сооружений персонажа. */
export interface FacilitySetupDraft {
  basic: Record<StartingBasicSpace, string | undefined>;
  special: Array<SpecialFacilityDraft>;
}

/**
 * Проверяет, что пространство — одно из стартовых для базовых сооружений.
 *
 * @param space Код пространства.
 * @returns true для тесного и вместительного.
 */
function isStartingBasicSpace(space: string): space is StartingBasicSpace {
  return STARTING_BASIC_SPACE_SET.has(space);
}

/**
 * Собирает черновик из уже выбранных сооружений персонажа.
 *
 * @param member Персонаж в бастионе.
 * @returns Черновик для экрана выбора.
 */
export function createSetupDraft(
  member: PlayerBastionMember,
): FacilitySetupDraft {
  const draft: FacilitySetupDraft = {
    basic: { CRAMPED: undefined, ROOMY: undefined },
    special: [],
  };

  for (const facility of member.facilities) {
    if (facility.category?.value === 'BASIC') {
      if (isStartingBasicSpace(facility.space.value)) {
        draft.basic[facility.space.value] = facility.facilityUrl;
      }

      continue;
    }

    draft.special.push({
      facilityUrl: facility.facilityUrl,
      choices: Object.fromEntries(
        facility.choices.map((choice) => [choice.name, [...choice.options]]),
      ),
    });
  }

  return draft;
}

/**
 * Превращает черновик в запрос: пустые слоты и невыбранные варианты
 * выбрасываются — сервер принимает и частичный выбор.
 *
 * @param draft Черновик.
 * @param version Версия бастиона, с которой начата правка.
 * @returns Тело запроса.
 */
export function toSetupRequest(
  draft: FacilitySetupDraft,
  version: number,
): FacilitySetupRequest {
  const basic = STARTING_BASIC_SPACES.flatMap((space) => {
    const facilityUrl = draft.basic[space];

    return facilityUrl ? [{ facilityUrl, space }] : [];
  });

  const special = draft.special.map((selection) => ({
    facilityUrl: selection.facilityUrl,
    choices: Object.entries(selection.choices)
      .filter(([, options]) => options.length > 0)
      .map(([name, options]): SelectedChoice => ({ name, options })),
  }));

  return { basic, special, version };
}

/**
 * Базовые сооружения справочника по алфавиту.
 *
 * @param catalog Справочник.
 * @returns Базовые сооружения.
 */
export function getBasicFacilities(
  catalog: ReadonlyArray<CatalogFacility>,
): Array<CatalogFacility> {
  return catalog
    .filter((facility) => facility.category?.value === 'BASIC')
    .sort((first, second) => first.name.rus.localeCompare(second.name.rus));
}

/**
 * Специализированные сооружения, доступные персонажу: уровень сооружения не
 * выше уровня персонажа. Порядок — как в книге: по уровню, затем по алфавиту.
 *
 * @param catalog Справочник.
 * @param characterLevel Уровень персонажа.
 * @returns Доступные сооружения.
 */
export function getAvailableSpecialFacilities(
  catalog: ReadonlyArray<CatalogFacility>,
  characterLevel: number,
): Array<CatalogFacility> {
  return catalog
    .filter(
      (facility) =>
        facility.category?.value === 'SPECIAL'
        && (facility.level ?? 0) <= characterLevel,
    )
    .sort(
      (first, second) =>
        (first.level ?? 0) - (second.level ?? 0)
        || first.name.rus.localeCompare(second.name.rus),
    );
}

/**
 * Сколько раз сооружение уже выбрано в черновике.
 *
 * @param draft Черновик.
 * @param facilityUrl Сооружение.
 * @returns Число выборов.
 */
export function countSelected(
  draft: FacilitySetupDraft,
  facilityUrl: string,
): number {
  return draft.special.filter(
    (selection) => selection.facilityUrl === facilityUrl,
  ).length;
}

/**
 * Можно ли добавить ещё одно такое сооружение: лимит по уровню не исчерпан, и
 * сооружение либо ещё не выбрано, либо помечено «можно несколько».
 *
 * @param draft Черновик.
 * @param facility Сооружение справочника.
 * @param limit Лимит специализированных сооружений персонажа.
 * @returns true, если добавить можно.
 */
export function canAddSpecial(
  draft: FacilitySetupDraft,
  facility: CatalogFacility,
  limit: number,
): boolean {
  if (draft.special.length >= limit) {
    return false;
  }

  return !!facility.repeatable || countSelected(draft, facility.url) === 0;
}
