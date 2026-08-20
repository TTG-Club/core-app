import type { FeatEntityRef } from './mechanics';

import { getAbilityInfo, isAbilityKey } from '~/shared/types';

import { CLASS_FEATURE_REQUIREMENT_OPTIONS } from './constants';

/**
 * Сборка человекочитаемого предварительного условия из разобранных требований.
 *
 * Раньше условие писали строкой руками и так же показывали. Строка осталась
 * («Условие строкой» на вкладке «Требования»), но источником для карточки быть
 * перестала: разобранные требования — те же данные, только сверяемые, и держать
 * два независимых текста одного и того же значит рано или поздно их разойтись.
 *
 * Внутри одного требования значения соединяются по «или» («Сила или Ловкость
 * 13 и выше»), сами требования — запятой: подходить надо всем сразу.
 */

/**
 * Требование к характеристике, как оно приходит с сервера.
 *
 * Детальный ответ отдаёт условие разреженным — пустые поля из JSON выброшены
 * (`@JsonInclude(NON_NULL)`), поэтому здесь необязательно всё. Полная структура
 * есть только в форме мастерской: её достраивает разбор `/raw`.
 */
interface FeatPrerequisiteSourceAbility {
  anyOf?: Array<string>;
  minValue?: number;
}

/** Разобранное условие в том виде, в каком оно приходит с сервера. */
export interface FeatPrerequisiteSource {
  minCharacterLevel?: number;
  abilities?: Array<FeatPrerequisiteSourceAbility>;
  feats?: Array<FeatEntityRef>;
  anyDragonmark?: boolean;
  classFeatures?: Array<string>;
  classes?: Array<FeatEntityRef>;
  species?: Array<FeatEntityRef>;
  backgrounds?: Array<FeatEntityRef>;
  armorProficiency?: Array<string>;
  campaign?: string;
  custom?: string;
}

/** Подписи, из которых собирается условие. */
const PREREQUISITE_TEXT = {
  /** Соединитель перед последним значением требования. */
  anyOf: ' или ',

  /** Соединитель остальных значений требования. */
  listSeparator: ', ',

  /** Соединитель требований между собой. */
  separator: ', ',

  abilityMinimumSuffix: 'и выше',
  levelSuffix: 'уровень',
  classFeaturePrefix: 'умение',
  armorPrefix: 'владение доспехами:',
  featPrefix: 'черта',
  classPrefix: 'класс',
  speciesPrefix: 'вид',
  backgroundPrefix: 'предыстория',
  settingPrefix: 'сеттинг',
  anyDragonmark: 'любая черта метки дракона',
} as const;

/** Подписи классовых умений по коду — из тех же вариантов, что и в форме. */
const CLASS_FEATURE_LABELS = new Map(
  CLASS_FEATURE_REQUIREMENT_OPTIONS.map((option) => [
    option.value,
    option.label,
  ]),
);

/**
 * Подпись ссылки на запись справочника: снимок названия, а если его нет —
 * ссылка. Ссылку показывать некрасиво, но честно: молча пропустив требование,
 * карточка соврала бы, что его нет.
 *
 * @param reference ссылка на запись справочника.
 * @returns название записи либо её ссылка.
 */
function getRefLabel(reference: FeatEntityRef): string {
  return reference.name?.trim() || reference.url;
}

/**
 * Перечисление значений одного требования: «или» ставится только перед
 * последним, остальные разделяются запятой — «Интеллект, Мудрость или
 * Харизма», а не «Интеллект или Мудрость или Харизма».
 *
 * @param values подписи значений одного требования.
 * @returns перечисление одной строкой.
 */
function joinAnyOf(values: Array<string>): string {
  if (values.length < 2) {
    return values.join('');
  }

  const last = values[values.length - 1] ?? '';

  return `${values.slice(0, -1).join(PREREQUISITE_TEXT.listSeparator)}${PREREQUISITE_TEXT.anyOf}${last}`;
}

/**
 * Требование к записям справочника: «черта «Отмеченный драконом»».
 *
 * @param prefix слово перед перечислением.
 * @param refs требуемые записи; пусто — требования нет.
 * @returns строка требования; `undefined` — записей нет.
 */
function formatRefs(
  prefix: string,
  refs: Array<FeatEntityRef>,
): string | undefined {
  if (!refs.length) {
    return undefined;
  }

  return `${prefix} ${joinAnyOf(refs.map((reference) => `«${getRefLabel(reference)}»`))}`;
}

/**
 * Собирает предварительное условие черты из разобранных требований.
 *
 * @param prerequisite разобранные требования; не заданы — условия нет.
 * @param armorLabels подписи категорий доспехов из словаря по коду; без них
 *   владение доспехами показывается кодом.
 * @returns требования по одному; пусто — черта доступна всем.
 */
export function getFeatPrerequisiteParts(
  prerequisite: FeatPrerequisiteSource | undefined,
  armorLabels: Map<string, string> = new Map(),
): Array<string> {
  if (!prerequisite) {
    return [];
  }

  const parts: Array<string> = [];

  for (const requirement of prerequisite.abilities ?? []) {
    // Чужой ключ характеристики отбрасывается: `getAbilityInfo` на нём бросает,
    // а ронять карточку из-за одного значения нельзя
    const abilityKeys = (requirement.anyOf ?? []).filter(isAbilityKey);

    if (!abilityKeys.length) {
      continue;
    }

    const abilities = joinAnyOf(
      abilityKeys.map((ability) => getAbilityInfo(ability).label),
    );

    parts.push(
      requirement.minValue
        ? `${abilities} ${requirement.minValue} ${PREREQUISITE_TEXT.abilityMinimumSuffix}`
        : abilities,
    );
  }

  if (prerequisite.minCharacterLevel) {
    parts.push(
      `${prerequisite.minCharacterLevel} ${PREREQUISITE_TEXT.levelSuffix}`,
    );
  }

  if (prerequisite.classFeatures?.length) {
    const features = joinAnyOf(
      prerequisite.classFeatures.map(
        (feature) => `«${CLASS_FEATURE_LABELS.get(feature) ?? feature}»`,
      ),
    );

    parts.push(`${PREREQUISITE_TEXT.classFeaturePrefix} ${features}`);
  }

  if (prerequisite.armorProficiency?.length) {
    const armor = joinAnyOf(
      prerequisite.armorProficiency.map(
        (category) => armorLabels.get(category) ?? category,
      ),
    );

    parts.push(`${PREREQUISITE_TEXT.armorPrefix} ${armor}`);
  }

  const refRequirements: Array<[string, Array<FeatEntityRef>]> = [
    [PREREQUISITE_TEXT.featPrefix, prerequisite.feats ?? []],
    [PREREQUISITE_TEXT.classPrefix, prerequisite.classes ?? []],
    [PREREQUISITE_TEXT.speciesPrefix, prerequisite.species ?? []],
    [PREREQUISITE_TEXT.backgroundPrefix, prerequisite.backgrounds ?? []],
  ];

  for (const [prefix, refs] of refRequirements) {
    const formatted = formatRefs(prefix, refs);

    if (formatted) {
      parts.push(formatted);
    }
  }

  if (prerequisite.anyDragonmark) {
    parts.push(PREREQUISITE_TEXT.anyDragonmark);
  }

  if (prerequisite.campaign?.trim()) {
    parts.push(
      `${PREREQUISITE_TEXT.settingPrefix} «${prerequisite.campaign.trim()}»`,
    );
  }

  if (prerequisite.custom?.trim()) {
    parts.push(prerequisite.custom.trim());
  }

  return parts;
}

/**
 * Предварительное условие одной строкой.
 *
 * @param prerequisite разобранные требования.
 * @param armorLabels подписи категорий доспехов по коду.
 * @returns строка условия; пусто — требований нет.
 */
export function getFeatPrerequisiteText(
  prerequisite: FeatPrerequisiteSource | undefined,
  armorLabels: Map<string, string> = new Map(),
): string {
  return getFeatPrerequisiteParts(prerequisite, armorLabels).join(
    PREREQUISITE_TEXT.separator,
  );
}
