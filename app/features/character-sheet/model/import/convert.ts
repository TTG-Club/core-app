import type { Level } from '~/shared/types';

import type {
  AbilityKey,
  Character,
  CharacterAbilities,
  CharacterBackground,
  CharacterClass,
  CharacterClassResource,
  CharacterCurrency,
  CharacterFeature,
  CharacterHitDie,
  CharacterNote,
  CharacterSkill,
  CharacterSpecies,
  CharacterSpellSlot,
  CharacterToolProficiency,
  ProficiencyCatalogGroup,
  SkillProficiencyLevel,
} from '../types';
import type {
  LssCharacter,
  LssResource,
  LssSpellSlot,
  LssTextBlock,
} from './types';

import { clamp } from 'es-toolkit';

import { LEVELS } from '~/shared/consts';
import {
  CasterType,
  FULL_CASTER_SPELL_SLOTS,
  HALF_CASTER_SPELL_SLOTS,
  THIRD_CASTER_SPELL_SLOTS,
} from '~classes/model';

import {
  ABILITY_SCORE_MAX,
  ABILITY_SCORE_MIN,
  ARMOR_CLASS_BASE_MAX,
  ARMOR_CLASS_BASE_MIN,
  ARMOR_PROFICIENCY_GROUPS,
  CURRENCY_AMOUNT_MAX,
  CURRENCY_AMOUNT_MIN,
  DRAFT_CHARACTER_ID,
  HIT_POINTS_MAX,
  LEVEL_MAX,
  LEVEL_MIN,
  RESOURCE_COUNT_MAX,
  RESOURCE_COUNT_MIN,
  RESOURCE_SHORT_LABEL_MAX_LENGTH,
  SPEED_VALUE_MAX,
  VISION_DISTANCE_MAX,
  VISION_DISTANCE_MIN,
  WEAPON_PROFICIENCY_GROUPS,
} from '../constants';
import { DEFAULT_CHARACTER } from '../mock';
import {
  buildCustomBackgroundUrl,
  buildCustomClassUrl,
  buildCustomSpeciesUrl,
  getCharacterFeatureId,
  getNextLevelExperience,
} from '../utils';
import {
  LSS_ABILITY_KEYS,
  LSS_ARMOR_PROFICIENCY_GROUPS,
  LSS_COIN_KEYS,
  LSS_DEFAULT_HIT_DIE,
  LSS_DETAILS_NOTE_KEY,
  LSS_DETAILS_NOTE_TITLE,
  LSS_FEATURE_TEXT_KEYS,
  LSS_ITEMS_LINK_PATH,
  LSS_NOTE_ID_PREFIX,
  LSS_NOTES_KEY_PATTERN,
  LSS_NOTES_TITLE,
  LSS_SIZE_LABELS,
  LSS_SKILL_EXPERTISE_VALUE,
  LSS_SKILL_NAMES,
  LSS_SOURCE_LABEL,
  LSS_TEXT_TITLES,
  LSS_TOOLS_TEXT_KEY,
  LSS_UNKNOWN_TEXT_TITLE,
  LSS_WEAPON_PROFICIENCY_GROUPS,
} from './constants';
import {
  collectSectionLinks,
  toFeatureDescription,
  toMarkupBlocks,
  toStoredNote,
} from './tiptap';

/**
 * Преобразование персонажа LSS в персонажа листа. Здесь только то, что
 * считается без сети: класс, вид и предыстория заводятся своими (`custom:`), а
 * записями каталога их подменяет `catalog.ts`, если они там нашлись.
 */

/** Таблицы ячеек для распознавания типа заклинательства по выгрузке LSS. */
const CASTER_TYPE_TABLES: Array<{
  casterType: CasterType;
  slots: Record<Level, number[]>;
}> = [
  { casterType: CasterType.FULL, slots: FULL_CASTER_SPELL_SLOTS },
  { casterType: CasterType.HALF, slots: HALF_CASTER_SPELL_SLOTS },
  { casterType: CasterType.THIRD, slots: THIRD_CASTER_SPELL_SLOTS },
];

/**
 * Уровень персонажа из документа: пустое или битое значение даёт первый уровень.
 *
 * @param level уровень из файла.
 * @returns уровень в допустимых пределах.
 */
function toLevel(level: number): number {
  return clamp(Math.trunc(level) || LEVEL_MIN, LEVEL_MIN, LEVEL_MAX);
}

/**
 * Значения характеристик листа. Незаполненная характеристика (ноль) остаётся
 * со значением по умолчанию.
 *
 * @param abilities значения по кодам LSS.
 * @returns характеристики персонажа.
 */
function toAbilities(abilities: Record<string, number>): CharacterAbilities {
  const result: CharacterAbilities = { ...DEFAULT_CHARACTER.abilities };

  for (const [code, score] of Object.entries(abilities)) {
    const key = LSS_ABILITY_KEYS[code];

    if (key && score > 0) {
      result[key] = clamp(
        Math.trunc(score),
        ABILITY_SCORE_MIN,
        ABILITY_SCORE_MAX,
      );
    }
  }

  return result;
}

/**
 * Характеристики, спасбросками которых персонаж владеет.
 *
 * @param codes коды характеристик LSS.
 * @returns ключи характеристик листа.
 */
function toSavingThrows(codes: string[]): AbilityKey[] {
  return codes
    .map((code) => LSS_ABILITY_KEYS[code])
    .filter((key): key is AbilityKey => Boolean(key));
}

/**
 * Уровень владения навыком по значению LSS: 2 — компетентность, дробное —
 * половина бонуса мастерства, остальное — обычное владение.
 *
 * @param value значение `isProf` из файла.
 * @returns уровень владения навыком.
 */
function toSkillProficiency(value: number): SkillProficiencyLevel {
  if (value >= LSS_SKILL_EXPERTISE_VALUE) {
    return 'expertise';
  }

  return value < 1 ? 'half' : 'proficient';
}

/**
 * Навыки листа: список навыков остаётся нашим, из файла берётся только уровень
 * владения.
 *
 * @param skills владения навыками по ключам LSS.
 * @returns навыки персонажа.
 */
function toSkills(skills: Record<string, number>): CharacterSkill[] {
  const levels = new Map<string, SkillProficiencyLevel>();

  for (const [key, value] of Object.entries(skills)) {
    const name = LSS_SKILL_NAMES[key];

    if (name) {
      levels.set(name, toSkillProficiency(value));
    }
  }

  return DEFAULT_CHARACTER.skills.map((skill) => ({
    ...skill,
    proficiency: levels.get(skill.name) ?? 'none',
  }));
}

/**
 * Владения из флагов LSS: флаг включает группу каталога целиком (её подпись и
 * хранит лист).
 *
 * @param flags включённые флаги владений.
 * @param flagGroups группа каталога по флагу.
 * @param groups каталог групп владений.
 * @returns подписи групп владений.
 */
function toGroupProficiencies(
  flags: string[],
  flagGroups: Record<string, string>,
  groups: ProficiencyCatalogGroup[],
): string[] {
  const labels = new Set<string>();

  for (const flag of flags) {
    const groupKey = flagGroups[flag];
    const group = groups.find((catalogGroup) => catalogGroup.key === groupKey);

    if (group) {
      labels.add(group.all);
    }
  }

  return [...labels];
}

/**
 * Владения инструментами: LSS держит их текстом, но названия из справочника
 * стоят в нём ссылками на раздел «Предметы» — по ним и восстанавливается слаг.
 *
 * @param texts текстовые блоки листа LSS.
 * @returns владения инструментами со ссылками.
 */
function toToolProficiencies(
  texts: LssTextBlock[],
): CharacterToolProficiency[] {
  const block = texts.find((text) => text.key === LSS_TOOLS_TEXT_KEY);

  if (!block) {
    return [];
  }

  const tools = new Map<string, CharacterToolProficiency>();

  for (const link of collectSectionLinks(block.doc, LSS_ITEMS_LINK_PATH)) {
    tools.set(link.url, { name: link.name, url: link.url });
  }

  return [...tools.values()];
}

/**
 * Кошелёк персонажа: неизвестные LSS-монеты (итоговая сумма) пропускаются.
 *
 * @param coins монеты по кодам LSS.
 * @returns кошелёк персонажа.
 */
function toCurrency(coins: Record<string, number>): CharacterCurrency {
  const currency: CharacterCurrency = { ...DEFAULT_CHARACTER.currency };

  for (const [code, amount] of Object.entries(coins)) {
    const key = LSS_COIN_KEYS[code];

    if (key) {
      currency[key] = clamp(
        Math.trunc(amount),
        CURRENCY_AMOUNT_MIN,
        CURRENCY_AMOUNT_MAX,
      );
    }
  }

  return currency;
}

/**
 * Счётчики листа из ресурсов LSS. Восстановление коротким отдыхом важнее:
 * счётчик с обоими флагами возвращается уже на коротком.
 *
 * @param resources ресурсы персонажа LSS.
 * @returns счётчики листа.
 */
function toClassResources(resources: LssResource[]): CharacterClassResource[] {
  const result: CharacterClassResource[] = [];

  for (const resource of resources) {
    const max = clamp(
      Math.trunc(resource.max),
      RESOURCE_COUNT_MIN,
      RESOURCE_COUNT_MAX,
    );

    if (max <= 0) {
      continue;
    }

    result.push({
      id: crypto.randomUUID(),
      name: resource.name,
      shortLabel: resource.name.slice(0, RESOURCE_SHORT_LABEL_MAX_LENGTH),
      recovery: resource.shortRest ? 'short-rest' : 'long-rest',
      current: clamp(Math.trunc(resource.current), RESOURCE_COUNT_MIN, max),
      max,
    });
  }

  return result;
}

/**
 * Потраченные ячейки заклинаний: лист хранит только трату, максимум считает по
 * классу. Ячейки договора колдуна ложатся в тот же список — круг у них общий.
 *
 * @param slots ячейки заклинаний LSS.
 * @param pactSlots ячейки договора LSS.
 * @returns трата по кругам.
 */
function toSpellSlots(
  slots: LssSpellSlot[],
  pactSlots: LssSpellSlot[],
): CharacterSpellSlot[] {
  const usedByLevel = new Map<number, number>();

  for (const slot of [...slots, ...pactSlots]) {
    const used = Math.max(0, Math.trunc(slot.used));

    if (used > 0) {
      usedByLevel.set(
        slot.level,
        Math.max(usedByLevel.get(slot.level) ?? 0, used),
      );
    }
  }

  return [...usedByLevel.entries()]
    .map(([level, used]) => ({ level, used }))
    .sort((left, right) => left.level - right.level);
}

/**
 * Количество ячеек по кругам без хвоста из нулей — в таком виде сравниваются
 * выгрузка LSS и наши таблицы прогрессии.
 *
 * @param values количество ячеек по кругам.
 * @returns значения без хвостовых нулей.
 */
function trimSlots(values: number[]): number[] {
  const trimmed = [...values];

  while (trimmed.length && !trimmed[trimmed.length - 1]) {
    trimmed.pop();
  }

  return trimmed;
}

/**
 * Максимумы ячеек из выгрузки LSS по кругам (индекс — круг минус один).
 *
 * @param slots ячейки заклинаний LSS.
 * @returns количество ячеек по кругам.
 */
function toSlotMaximums(slots: LssSpellSlot[]): number[] {
  const topLevel = slots.reduce((top, slot) => Math.max(top, slot.level), 0);
  const maximums: number[] = Array.from({ length: topLevel }, () => 0);

  for (const slot of slots) {
    if (slot.level >= 1) {
      maximums[slot.level - 1] = Math.max(0, Math.trunc(slot.max));
    }
  }

  return maximums;
}

/**
 * Тип заклинательства по ячейкам из файла. Нужен своему классу: без него ячейки
 * на листе не появятся. Ничего не распознано — null: тогда тип определится по
 * названию класса (легаси-правило листа).
 *
 * @param source персонаж LSS.
 * @param level уровень персонажа.
 * @returns тип заклинательства или null.
 */
function detectCasterType(
  source: LssCharacter,
  level: number,
): CasterType | null {
  if (source.pactSpellSlots.some((slot) => slot.max > 0)) {
    return CasterType.PACT;
  }

  const maximums = trimSlots(toSlotMaximums(source.spellSlots));

  if (!maximums.length) {
    return null;
  }

  const tableLevel = LEVELS.find((value) => value === level);

  if (!tableLevel) {
    return null;
  }

  const match = CASTER_TYPE_TABLES.find(({ slots }) => {
    const table = trimSlots(slots[tableLevel]);

    return (
      table.length === maximums.length
      && table.every((value, index) => value === maximums[index])
    );
  });

  // Ячейки есть, но с таблицами не сошлись (мультикласс, самодельный класс) —
  // полный заклинатель ближе всего к выгрузке.
  return match?.casterType ?? CasterType.FULL;
}

/**
 * Кости хитов персонажа: их максимум на листе считается уровнем, из файла
 * берётся номинал и остаток.
 *
 * @param source персонаж LSS.
 * @param level уровень персонажа.
 * @returns кости хитов; пусто — номинал в файле не указан.
 */
function toHitDice(source: LssCharacter, level: number): CharacterHitDie[] {
  if (source.hitDice.die <= 0) {
    return [];
  }

  return [
    {
      die: source.hitDice.die,
      current: clamp(Math.trunc(source.hitDice.current), 0, level),
      max: level,
    },
  ];
}

/**
 * Заголовок текстового блока LSS: пронумерованные заметки нумеруются, а блоку
 * без известного ключа остаётся общий заголовок.
 *
 * @param key ключ блока в шаблоне LSS.
 * @returns заголовок заметки листа.
 */
function getTextTitle(key: string): string {
  const knownTitle = LSS_TEXT_TITLES[key];

  if (knownTitle) {
    return knownTitle;
  }

  const notesNumber = LSS_NOTES_KEY_PATTERN.exec(key)?.[1];

  return notesNumber
    ? `${LSS_NOTES_TITLE} ${notesNumber}`
    : LSS_UNKNOWN_TEXT_TITLE;
}

/**
 * Идентификатор заметки, собранной из текстового блока LSS: устойчивый, чтобы
 * обогащение каталогом нашло заметку снаряжения и переписало её.
 *
 * @param key ключ блока в шаблоне LSS.
 * @returns идентификатор заметки листа.
 */
export function getLssNoteId(key: string): string {
  return `${LSS_NOTE_ID_PREFIX}${key}`;
}

/**
 * Заметка листа из текстового блока LSS.
 *
 * @param key ключ блока в шаблоне LSS.
 * @param content содержимое заметки в хранимой форме редактора.
 * @returns заметка листа; null — блок пустой.
 */
function toNote(key: string, content: string): CharacterNote | null {
  return content
    ? { id: getLssNoteId(key), title: getTextTitle(key), content }
    : null;
}

/**
 * Особенности листа из текстовых блоков LSS с умениями и чертами: там они
 * записаны сплошным текстом, поэтому каждый блок становится одной записью.
 *
 * @param texts текстовые блоки листа LSS.
 * @returns особенности персонажа.
 */
function toFeatures(texts: LssTextBlock[]): CharacterFeature[] {
  const features: CharacterFeature[] = [];

  for (const key of LSS_FEATURE_TEXT_KEYS) {
    const block = texts.find((text) => text.key === key);

    if (!block) {
      continue;
    }

    const description = toFeatureDescription(block.doc);

    if (!description.length) {
      continue;
    }

    features.push({
      id: getCharacterFeatureId('none', `${LSS_NOTE_ID_PREFIX}${key}`),
      name: getTextTitle(key),
      description,
      origin: 'none',
      originName: LSS_SOURCE_LABEL,
      level: null,
      choice: null,
    });
  }

  return features;
}

/**
 * Заметка «О персонаже»: мировоззрение, имя игрока и внешность — полей под них
 * на листе нет, а терять их при импорте не хочется.
 *
 * @param source персонаж LSS.
 * @returns заметка листа; null — подписи не заполнены.
 */
function toDetailsNote(source: LssCharacter): CharacterNote | null {
  if (!source.details.length) {
    return null;
  }

  // Списком, а не абзацами: подписей до восьми, и каждая абзацем растянула бы
  // заметку на весь экран.
  const items = source.details.map((detail) => ({
    type: 'li',
    content: [
      { type: 'bold', content: [`${detail.label}:`] },
      ` ${detail.value}`,
    ],
  }));

  return {
    id: getLssNoteId(LSS_DETAILS_NOTE_KEY),
    title: LSS_DETAILS_NOTE_TITLE,
    content: toStoredNote([{ type: 'list', content: items }]),
  };
}

/**
 * Заметки листа: по одной на текстовый блок LSS плюс подписи шапки. Блоки с
 * умениями и чертами сюда не идут — они становятся особенностями.
 *
 * @param source персонаж LSS.
 * @returns заметки персонажа.
 */
function toNotes(source: LssCharacter): CharacterNote[] {
  const notes: CharacterNote[] = [];

  for (const block of source.texts) {
    if (LSS_FEATURE_TEXT_KEYS.includes(block.key)) {
      continue;
    }

    const note = toNote(block.key, toStoredNote(toMarkupBlocks(block.doc)));

    if (note) {
      notes.push(note);
    }
  }

  const detailsNote = toDetailsNote(source);

  return detailsNote ? [...notes, detailsNote] : notes;
}

/**
 * Заметка со снаряжением после разбора списков в предметы: остаётся всё, что
 * предметом не стало, — заголовки разделов и строки, не похожие на название.
 *
 * @param block текстовый блок снаряжения.
 * @param leftovers строки, не ставшие предметами.
 * @returns заметка листа; null — в блоке ничего не осталось.
 */
export function buildEquipmentNote(
  block: LssTextBlock,
  leftovers: string[],
): CharacterNote | null {
  const blocks = toMarkupBlocks(block.doc, true);

  const content = toStoredNote(
    leftovers.length
      ? [
          ...blocks,
          {
            type: 'list',
            content: leftovers.map((text) => ({ type: 'li', content: [text] })),
          },
        ]
      : blocks,
  );

  return toNote(block.key, content);
}

/**
 * Персонаж листа из персонажа LSS — без обращений к каталогу сайта.
 *
 * @param source персонаж LSS.
 * @returns персонаж листа.
 */
export function convertLssCharacter(source: LssCharacter): Character {
  const level = toLevel(source.level);
  const maxHitPoints = clamp(Math.trunc(source.health.max), 0, HIT_POINTS_MAX);

  const characterClass: CharacterClass | null = source.className
    ? {
        url: buildCustomClassUrl(),
        name: source.className,
        subclassUrl: null,
        subclassName: source.subclassName || null,
        casterType: detectCasterType(source, level),
        hitDie: source.hitDice.die || LSS_DEFAULT_HIT_DIE,
        // Таблицы прогрессии у своего класса нет: число подготовленных
        // заклинаний задаётся на вкладке заклинаний вручную.
        preparedSpells: [],
      }
    : null;

  const species: CharacterSpecies | null = source.speciesName
    ? {
        url: buildCustomSpeciesUrl(),
        name: source.speciesName,
        lineageUrl: null,
        lineageName: null,
        innateSpells: [],
      }
    : null;

  const characterBackground: CharacterBackground | null = source.backgroundName
    ? {
        url: buildCustomBackgroundUrl(),
        name: source.backgroundName,
        featUrl: null,
        abilityBonuses: {},
      }
    : null;

  return {
    ...structuredClone(DEFAULT_CHARACTER),
    id: DRAFT_CHARACTER_ID,
    name: source.name || DEFAULT_CHARACTER.name,
    species,
    size: LSS_SIZE_LABELS[source.size] ?? null,
    characterClass,
    characterBackground,
    level,
    experience: {
      current: Math.max(0, Math.trunc(source.experience)),
      nextLevel: getNextLevelExperience(level),
    },
    inspiration: source.inspiration,
    abilities: toAbilities(source.abilities),
    savingThrowProficiencies: toSavingThrows(source.saves),
    skills: toSkills(source.skills),
    health: {
      current: clamp(Math.trunc(source.health.current), 0, maxHitPoints),
      max: maxHitPoints,
      temporary: clamp(Math.trunc(source.health.temporary), 0, HIT_POINTS_MAX),
      // Прирост максимума по уровням LSS не хранит: снижение уровня на листе
      // такой максимум не тронет, пока уровни не будут взяты заново.
      levelGains: [],
    },
    hitDice: toHitDice(source, level),
    armorClass:
      source.armorClass > 0
        ? {
            base: clamp(
              Math.trunc(source.armorClass),
              ARMOR_CLASS_BASE_MIN,
              ARMOR_CLASS_BASE_MAX,
            ),
            ability: null,
            natural: false,
            // Значение из LSS учитывает и броню, и щит, поэтому автоподсчёт по
            // надетому снаряжению выключен: игрок включит его галкой.
            custom: true,
          }
        : structuredClone(DEFAULT_CHARACTER.armorClass),
    speed: {
      ...structuredClone(DEFAULT_CHARACTER.speed),
      values: {
        ...structuredClone(DEFAULT_CHARACTER.speed.values),
        walk: source.speed
          ? clamp(Math.trunc(source.speed), 0, SPEED_VALUE_MAX)
          : DEFAULT_CHARACTER.speed.values.walk,
      },
    },
    vision: {
      ...structuredClone(DEFAULT_CHARACTER.vision),
      darkvision: clamp(
        Math.trunc(source.darkvision),
        VISION_DISTANCE_MIN,
        VISION_DISTANCE_MAX,
      ),
    },
    classResources: toClassResources(source.resources),
    proficiencies: {
      ...structuredClone(DEFAULT_CHARACTER.proficiencies),
      armor: toGroupProficiencies(
        source.proficiencyFlags,
        LSS_ARMOR_PROFICIENCY_GROUPS,
        ARMOR_PROFICIENCY_GROUPS,
      ),
      weapons: toGroupProficiencies(
        source.proficiencyFlags,
        LSS_WEAPON_PROFICIENCY_GROUPS,
        WEAPON_PROFICIENCY_GROUPS,
      ),
      tools: toToolProficiencies(source.texts),
    },
    currency: toCurrency(source.coins),
    spellcasting: {
      ...structuredClone(DEFAULT_CHARACTER.spellcasting),
      ability: LSS_ABILITY_KEYS[source.spellcastingAbility] ?? null,
    },
    spellSlots: toSpellSlots(source.spellSlots, source.pactSpellSlots),
    features: toFeatures(source.texts),
    notes: toNotes(source),
  };
}
