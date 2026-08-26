import type {
  Character,
  CharacterBackground,
  CharacterClass,
  CharacterInventoryItem,
  CharacterNote,
  CharacterSpecies,
  ClassOption,
  ClassSummary,
  CustomInventoryItemDraft,
  ItemCatalogItem,
  MagicItemCatalogItem,
} from '../types';
import type { LssCharacter, LssWeapon } from './types';

import { DAMAGE_TYPE_LABELS } from '~ui/damage-formula';

import { fetchItemSummary, fetchMagicItemSummary } from '../api';
import {
  BACKGROUNDS_SEARCH_PATH,
  CLASSES_DETAIL_BASE_PATH,
  CLASSES_SEARCH_PATH,
  CUSTOM_INVENTORY_URL_PREFIX,
  ITEMS_SEARCH_PATH,
  MAGIC_ITEMS_SEARCH_PATH,
  NEW_CUSTOM_INVENTORY_ITEM,
  SPECIES_DETAIL_BASE_PATH,
  SPECIES_SEARCH_PATH,
} from '../constants';
import {
  parseBackgroundOptions,
  parseClassDetail,
  parseClassOptions,
  parseItemCatalog,
  parseMagicItemCatalog,
  parseSpeciesLineages,
  parseSpeciesOptions,
} from '../schemas';
import {
  buildInventoryItem,
  buildMagicItemInventoryItem,
  deriveCantripsScaling,
  derivePreparedSpellsScaling,
  getSelectedCasterType,
  normalizeCatalogName,
  toCustomInventoryItem,
} from '../utils';
import {
  LSS_EQUIPMENT_TEXT_KEYS,
  LSS_ITEM_LOOKUP_LIMIT,
  LSS_ITEM_NAME_MAX_LENGTH,
  LSS_MARTIAL_WEAPON_FLAG,
} from './constants';
import { buildEquipmentNote, getLssNoteId } from './convert';
import { collectListItemTexts } from './tiptap';

/**
 * Привязка импортированного персонажа к каталогу сайта: класс, вид, предыстория
 * и снаряжение ищутся по названию. Всё best-effort — любой отказ запроса или
 * промах оставляет запись такой, какой её собрал `convert.ts` (своей).
 */

/** Кости урона в формуле LSS («1к8», «2d6»). */
const DAMAGE_DICE_PATTERN = /(\d*)\s*[кkdд]\s*(\d+)/i;

/** Собственный бонус урона в формуле LSS. */
const DAMAGE_BONUS_PATTERN = /([+-])\s*(\d+)/;

/** Подстановка модификатора характеристики в формуле LSS (`[str]`). */
const DAMAGE_ABILITY_TOKEN_PATTERN = /\[[^\]]*\]/g;

/** Модификатор Ловкости в формуле урона — признак фехтовального оружия. */
const DEXTERITY_DAMAGE_PATTERN = /\[\s*dex\s*\]/i;

/** Количество копий предмета в строке снаряжения («Рацион х6»). */
const ITEM_QUANTITY_PATTERN = /[х×xX*]\s*(\d+)\s*$/;

/** Ключи типов урона по русским подписям справочника. */
const DAMAGE_TYPE_KEYS = new Map(
  Object.entries(DAMAGE_TYPE_LABELS).map(([key, label]) => [
    normalizeCatalogName(label),
    key,
  ]),
);

/** Строка снаряжения LSS, разобранная в кандидата на предмет инвентаря. */
interface EquipmentCandidate {
  name: string;
  quantity: number;

  /** Оружие из списка атак LSS: у него есть формула урона; null — из списка снаряжения. */
  weapon: LssWeapon | null;
}

/**
 * Название без уточнения в скобках: «Боевой топор (двуручное)» — это тот же
 * боевой топор каталога.
 *
 * @param name название записи.
 * @returns название без хвоста в скобках.
 */
function stripParenthetical(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

/**
 * Уточнение в скобках («Эльф (Высший эльф)» — «Высший эльф»).
 *
 * @param name название записи.
 * @returns текст в скобках; '' — уточнения нет.
 */
function getParenthetical(name: string): string {
  return /\(([^)]*)\)\s*$/.exec(name)?.[1]?.trim() ?? '';
}

/**
 * Запись каталога по названию. Совпадение строгое: сперва точное, затем — без
 * уточнения в скобках с обеих сторон. Вхождения подстроки не ищем: «Топор»
 * нашёлся бы в десятке записей.
 *
 * @param options записи каталога.
 * @param name название из файла.
 * @returns запись каталога либо undefined.
 */
function findByName<TOption extends { name: string }>(
  options: TOption[],
  name: string,
): TOption | undefined {
  const target = normalizeCatalogName(name);

  if (!target) {
    return undefined;
  }

  const exact = options.find(
    (option) => normalizeCatalogName(option.name) === target,
  );

  if (exact) {
    return exact;
  }

  const stripped = normalizeCatalogName(stripParenthetical(name));

  if (!stripped) {
    return undefined;
  }

  return options.find(
    (option) =>
      normalizeCatalogName(option.name) === stripped
      || normalizeCatalogName(stripParenthetical(option.name)) === stripped,
  );
}

/**
 * Загрузка и разбор ответа каталога. Отказ запроса не срывает импорт — запись
 * просто останется своей.
 *
 * @param path эндпоинт раздела.
 * @param parse разбор ответа.
 * @returns записи каталога; пустой список — раздел не ответил.
 */
async function fetchCatalog<TItem>(
  path: string,
  parse: (input: unknown) => TItem[],
): Promise<TItem[]> {
  try {
    const response = await $fetch<unknown>(path, { method: 'GET', retry: 0 });

    return parse(response);
  } catch {
    return [];
  }
}

/**
 * Подкласс каталога по названию из файла.
 *
 * @param classOption выбранный класс каталога.
 * @param subclassName название подкласса из файла.
 * @returns запись подкласса с деталью; null — не нашёлся.
 */
async function resolveSubclass(
  classOption: ClassOption,
  subclassName: string,
): Promise<{ option: ClassOption; detail: ClassSummary | null } | null> {
  if (!subclassName || !classOption.hasSubclasses) {
    return null;
  }

  const subclasses = await fetchCatalog(
    `${CLASSES_DETAIL_BASE_PATH}/${classOption.url}/subclasses`,
    (input) => parseClassOptions(input, true),
  );

  const option = findByName(subclasses, subclassName);

  if (!option) {
    return null;
  }

  try {
    const response = await $fetch<unknown>(
      `${CLASSES_DETAIL_BASE_PATH}/${option.url}`,
      { method: 'GET', retry: 0 },
    );

    return { option, detail: parseClassDetail(response) };
  } catch {
    return { option, detail: null };
  }
}

/**
 * Класс листа по названию из файла: со ссылкой на раздел, костью хитов, типом
 * заклинательства и таблицей подготовленных заклинаний. Умения и владения класса
 * не применяются — они пришли из LSS текстом.
 *
 * @param source персонаж LSS.
 * @param fallback свой класс, собранный без каталога.
 * @returns класс листа.
 */
async function resolveClass(
  source: LssCharacter,
  fallback: CharacterClass | null,
): Promise<CharacterClass | null> {
  if (!fallback) {
    return null;
  }

  const options = await fetchCatalog(CLASSES_SEARCH_PATH, parseClassOptions);
  const option = findByName(options, source.className);

  if (!option) {
    return fallback;
  }

  let detail: ClassSummary | null = null;

  try {
    const response = await $fetch<unknown>(
      `${CLASSES_DETAIL_BASE_PATH}/${option.url}`,
      { method: 'GET', retry: 0 },
    );

    detail = parseClassDetail(response);
  } catch {
    detail = null;
  }

  if (!detail) {
    return fallback;
  }

  const subclass = await resolveSubclass(option, source.subclassName);

  return {
    url: option.url,
    name: option.name,
    level: fallback.level,
    subclassUrl: subclass?.option.url ?? null,
    // Подкласс, которого нет в каталоге, остаётся названием из файла.
    subclassName: subclass?.option.name ?? fallback.subclassName,
    casterType: getSelectedCasterType(detail, subclass?.detail ?? null),
    hitDie: detail.hitDie || fallback.hitDie,
    spellcastingAbility: fallback.spellcastingAbility,
    preparedSpells: derivePreparedSpellsScaling([
      ...detail.table,
      ...(subclass?.detail?.table ?? []),
    ]),
    preparedCantrips: deriveCantripsScaling([
      ...detail.table,
      ...(subclass?.detail?.table ?? []),
    ]),
    // Снаряжение приходит из чужого листа целиком, стартовым набором класса его
    // никто не выдавал — снимать при смене класса нечего.
    startingEquipment: null,
  };
}

/**
 * Происхождение вида по уточнению в скобках («Эльф (Высший эльф)»).
 *
 * @param speciesUrl слаг вида каталога.
 * @param lineageName название происхождения из файла.
 * @returns слаг и название происхождения; null — не нашлось.
 */
async function resolveLineage(
  speciesUrl: string,
  lineageName: string,
): Promise<{ url: string; name: string } | null> {
  if (!lineageName) {
    return null;
  }

  const lineages = await fetchCatalog(
    `${SPECIES_DETAIL_BASE_PATH}/${speciesUrl}/lineages`,
    parseSpeciesLineages,
  );

  const lineage = findByName(lineages, lineageName);

  return lineage ? { url: lineage.url, name: lineage.name } : null;
}

/**
 * Вид листа по названию из файла. Уточнение в скобках проверяется по списку
 * происхождений: у LSS туда пишут и происхождение, и просто описание народа.
 *
 * @param source персонаж LSS.
 * @param fallback свой вид, собранный без каталога.
 * @returns вид листа.
 */
async function resolveSpecies(
  source: LssCharacter,
  fallback: CharacterSpecies | null,
): Promise<CharacterSpecies | null> {
  if (!fallback) {
    return null;
  }

  const options = await fetchCatalog(SPECIES_SEARCH_PATH, parseSpeciesOptions);
  const option = findByName(options, source.speciesName);

  if (!option) {
    return fallback;
  }

  const lineage = option.hasLineages
    ? await resolveLineage(option.url, getParenthetical(source.speciesName))
    : null;

  return {
    url: option.url,
    name: option.name,
    lineageUrl: lineage?.url ?? null,
    lineageName: lineage?.name ?? null,
    innateSpells: [],
  };
}

/**
 * Предыстория листа по названию из файла. Навыки, владения и черту предыстории
 * не применяем: на листе они уже есть из выгрузки LSS.
 *
 * @param source персонаж LSS.
 * @param fallback своя предыстория, собранная без каталога.
 * @returns предыстория листа.
 */
async function resolveBackground(
  source: LssCharacter,
  fallback: CharacterBackground | null,
): Promise<CharacterBackground | null> {
  if (!fallback) {
    return null;
  }

  const options = await fetchCatalog(
    BACKGROUNDS_SEARCH_PATH,
    parseBackgroundOptions,
  );

  const option = findByName(options, source.backgroundName);

  return option
    ? {
        url: option.url,
        name: option.name,
        featUrl: null,
        abilityBonuses: {},
        startingEquipment: null,
      }
    : fallback;
}

/**
 * Похожа ли строка списка на название предмета: заголовки разделов («Набор
 * священника:») и развёрнутые описания предметами не становятся.
 *
 * @param name строка списка снаряжения.
 * @returns true — строку можно искать в каталоге.
 */
function isItemName(name: string): boolean {
  return Boolean(
    name && name.length <= LSS_ITEM_NAME_MAX_LENGTH && !name.endsWith(':'),
  );
}

/**
 * Количество копий из строки снаряжения («Рацион х6»).
 *
 * @param text строка списка снаряжения.
 * @returns название без количества и само количество.
 */
function parseQuantity(text: string): { name: string; quantity: number } {
  const match = ITEM_QUANTITY_PATTERN.exec(text);
  const quantity = Number(match?.[1] ?? 1);

  return {
    name: match ? text.slice(0, match.index).trim() : text,
    quantity: quantity > 0 ? quantity : 1,
  };
}

/**
 * Кандидаты в предметы инвентаря: сперва оружие из списка атак (у него есть
 * урон), затем строки списков снаряжения. Повторы по названию отбрасываются —
 * оружие обычно перечислено и там, и там.
 *
 * @param source персонаж LSS.
 * @returns кандидаты и строки, не похожие на предметы (по ключам блоков).
 */
function collectCandidates(source: LssCharacter): {
  candidates: EquipmentCandidate[];
  leftovers: Map<string, string[]>;
} {
  const candidates: EquipmentCandidate[] = [];
  const leftovers = new Map<string, string[]>();
  const taken = new Set<string>();

  for (const weapon of source.weapons) {
    const key = normalizeCatalogName(stripParenthetical(weapon.name));

    if (taken.has(key)) {
      continue;
    }

    taken.add(key);
    candidates.push({ name: weapon.name, quantity: 1, weapon });
  }

  for (const block of source.texts) {
    if (!LSS_EQUIPMENT_TEXT_KEYS.includes(block.key)) {
      continue;
    }

    const blockLeftovers: string[] = [];

    for (const line of collectListItemTexts(block.doc)) {
      const { name, quantity } = parseQuantity(line);

      if (!isItemName(name)) {
        blockLeftovers.push(line);

        continue;
      }

      const key = normalizeCatalogName(stripParenthetical(name));

      if (taken.has(key)) {
        continue;
      }

      taken.add(key);
      candidates.push({ name, quantity, weapon: null });
    }

    leftovers.set(block.key, blockLeftovers);
  }

  return { candidates, leftovers };
}

/**
 * Разбор формулы урона LSS: кости, собственный бонус и признак фехтовального
 * оружия (модификатор Ловкости в формуле).
 *
 * @param weapon оружие LSS.
 * @returns значения формы своего оружия.
 */
function parseWeaponDamage(weapon: LssWeapon): {
  diceCount: number;
  diceFaces: number;
  bonus: number;
  finesse: boolean;
} {
  // Подстановки модификаторов (`[str]`) убираем: наш лист прибавляет модификатор
  // характеристики сам, а в бонус урона он попасть не должен.
  const formula = weapon.damage.replace(DAMAGE_ABILITY_TOKEN_PATTERN, ' ');
  const dice = DAMAGE_DICE_PATTERN.exec(formula);

  const bonus = DAMAGE_BONUS_PATTERN.exec(
    formula.replace(DAMAGE_DICE_PATTERN, ' '),
  );

  const bonusValue = Number(bonus?.[2] ?? 0);

  return {
    diceCount: Number(dice?.[1] || 1),
    diceFaces: Number(dice?.[2] ?? 0),
    bonus: bonus?.[1] === '-' ? -bonusValue : bonusValue,
    finesse: DEXTERITY_DAMAGE_PATTERN.test(weapon.damage),
  };
}

/**
 * Значения формы своего предмета для кандидата: оружие получает урон из
 * формулы LSS, остальное становится безделушкой.
 *
 * @param candidate кандидат в предметы.
 * @param hasMartialProficiency персонаж владеет воинским оружием.
 * @returns значения формы своего предмета.
 */
function toCustomDraft(
  candidate: EquipmentCandidate,
  hasMartialProficiency: boolean,
): CustomInventoryItemDraft {
  if (!candidate.weapon) {
    return {
      ...NEW_CUSTOM_INVENTORY_ITEM,
      kind: 'trinket',
      name: candidate.name,
      quantity: candidate.quantity,
    };
  }

  const damage = parseWeaponDamage(candidate.weapon);

  return {
    ...NEW_CUSTOM_INVENTORY_ITEM,
    kind: 'weapon',
    name: candidate.name,
    quantity: candidate.quantity,
    // Категория оружия на подсчёты не влияет — это подпись в строке предмета,
    // поэтому берём ту, которой персонаж владеет.
    weaponCategory: hasMartialProficiency ? 'martial' : 'simple',
    finesse: damage.finesse,
    damageDiceCount: damage.diceCount,
    damageDiceFaces: damage.diceFaces,
    damageBonus: damage.bonus,
    damageType:
      DAMAGE_TYPE_KEYS.get(normalizeCatalogName(candidate.weapon.damageType))
      ?? '',
  };
}

/**
 * Свой предмет инвентаря из кандидата (в каталоге его не нашлось).
 *
 * @param candidate кандидат в предметы.
 * @param hasMartialProficiency персонаж владеет воинским оружием.
 * @returns предмет инвентаря; null — пустое название.
 */
function toCustomItem(
  candidate: EquipmentCandidate,
  hasMartialProficiency: boolean,
): CharacterInventoryItem | null {
  return toCustomInventoryItem(
    `${CUSTOM_INVENTORY_URL_PREFIX}${crypto.randomUUID()}`,
    toCustomDraft(candidate, hasMartialProficiency),
  );
}

/**
 * Предмет инвентаря по кандидату: сперва раздел «Предметы», затем «Магические
 * предметы», иначе — свой предмет. Найденный доспех сразу надевается, чтобы
 * автоподсчёт КД заработал, как только игрок его включит.
 *
 * @param candidate кандидат в предметы.
 * @param catalogs каталоги разделов.
 * @param catalogs.items записи раздела «Предметы».
 * @param catalogs.magicItems записи раздела «Магические предметы».
 * @param hasMartialProficiency персонаж владеет воинским оружием.
 * @returns предмет инвентаря; null — предмет не собрался.
 */
async function toInventoryItem(
  candidate: EquipmentCandidate,
  catalogs: { items: ItemCatalogItem[]; magicItems: MagicItemCatalogItem[] },
  hasMartialProficiency: boolean,
): Promise<CharacterInventoryItem | null> {
  const catalogItem = findByName(catalogs.items, candidate.name);

  if (catalogItem) {
    try {
      const summary = await fetchItemSummary(catalogItem.url);

      if (summary) {
        const item = buildInventoryItem(summary);

        return {
          ...item,
          quantity: candidate.quantity,
          equipped: Boolean(item.armor),
        };
      }
    } catch {
      // Деталь не загрузилась — предмет всё равно попадёт на лист своим.
    }
  }

  const magicItem = findByName(catalogs.magicItems, candidate.name);

  if (magicItem) {
    return {
      ...buildMagicItemInventoryItem(
        magicItem,
        await fetchMagicItemSummary(magicItem.url),
      ),
      quantity: candidate.quantity,
    };
  }

  return toCustomItem(candidate, hasMartialProficiency);
}

/**
 * Инвентарь листа из оружия и списков снаряжения LSS.
 *
 * @param source персонаж LSS.
 * @param hasMartialProficiency персонаж владеет воинским оружием.
 * @returns предметы инвентаря и заметки со снаряжением по ключам блоков.
 */
async function resolveInventory(
  source: LssCharacter,
  hasMartialProficiency: boolean,
): Promise<{
  inventory: CharacterInventoryItem[];
  notes: Map<string, CharacterNote | null>;
}> {
  const { candidates, leftovers } = collectCandidates(source);

  const notes = new Map<string, CharacterNote | null>();

  for (const block of source.texts) {
    if (!LSS_EQUIPMENT_TEXT_KEYS.includes(block.key)) {
      continue;
    }

    notes.set(
      getLssNoteId(block.key),
      buildEquipmentNote(block, leftovers.get(block.key) ?? []),
    );
  }

  if (!candidates.length) {
    return { inventory: [], notes };
  }

  const [catalogItems, magicItems] = await Promise.all([
    fetchCatalog(ITEMS_SEARCH_PATH, parseItemCatalog),
    fetchCatalog(MAGIC_ITEMS_SEARCH_PATH, parseMagicItemCatalog),
  ]);

  const catalogs = { items: catalogItems, magicItems };

  const results = await Promise.all(
    candidates
      .slice(0, LSS_ITEM_LOOKUP_LIMIT)
      .map((candidate) =>
        toInventoryItem(candidate, catalogs, hasMartialProficiency),
      ),
  );

  // Строки сверх предела ищем не в каталоге, а сразу заводим своими: сотня
  // запросов ради длинного списка снаряжения того не стоит.
  const rest = candidates
    .slice(LSS_ITEM_LOOKUP_LIMIT)
    .map((candidate) => toCustomItem(candidate, hasMartialProficiency));

  return {
    inventory: [...results, ...rest].filter(
      (item): item is CharacterInventoryItem => item !== null,
    ),
    notes,
  };
}

/**
 * Заметки листа с переписанными блоками снаряжения: строки, ставшие предметами,
 * из них ушли, а опустевшие блоки убираются целиком.
 *
 * @param notes заметки, собранные без каталога.
 * @param replacements заметки снаряжения по идентификаторам.
 * @returns заметки листа.
 */
function mergeNotes(
  notes: CharacterNote[],
  replacements: Map<string, CharacterNote | null>,
): CharacterNote[] {
  const result: CharacterNote[] = [];

  for (const note of notes) {
    if (!replacements.has(note.id)) {
      result.push(note);

      continue;
    }

    const replacement = replacements.get(note.id);

    if (replacement) {
      result.push(replacement);
    }
  }

  return result;
}

/**
 * Привязка импортированного персонажа к каталогу сайта.
 *
 * @param character персонаж, собранный без каталога.
 * @param source персонаж LSS.
 * @returns персонаж со ссылками на разделы и разобранным снаряжением.
 */
export async function enrichFromCatalog(
  character: Character,
  source: LssCharacter,
): Promise<Character> {
  const hasMartialProficiency = source.proficiencyFlags.includes(
    LSS_MARTIAL_WEAPON_FLAG,
  );

  const [characterClass, species, characterBackground, equipment] =
    await Promise.all([
      resolveClass(source, character.characterClass),
      resolveSpecies(source, character.species),
      resolveBackground(source, character.characterBackground),
      resolveInventory(source, hasMartialProficiency),
    ]);

  return {
    ...character,
    characterClass,
    species,
    characterBackground,
    inventory: equipment.inventory,
    notes: mergeNotes(character.notes, equipment.notes),
  };
}
