import type { Character } from '~character-sheet/model';

import type {
  ConditionKey,
  ParticipantColor,
  ParticipantSheetLink,
  ParticipantType,
  SheetPlayerOption,
  TrackerParticipant,
} from './types';

import { clamp } from 'es-toolkit';

import {
  CHARACTER_SHEET_ROUTE,
  CHARACTER_SHEET_SHARED_ROUTE,
  getArmorClassValue,
  getClassesDisplayLabel,
  getDisplayLevel,
  getInitiativeBonus,
} from '~character-sheet/model';

import {
  CONDITION_CATALOG,
  MAX_ARMOR_CLASS,
  MAX_D20,
  MAX_INITIATIVE_BONUS,
  MAX_PARTICIPANT_NAME_LENGTH,
  MIN_ARMOR_CLASS,
  MIN_D20,
  MIN_INITIATIVE_BONUS,
  PARTICIPANT_COLOR_CLASS,
  SHEET_PLAYER_FORM_LABELS,
} from './constants';

/**
 * Считает участников заданного типа.
 * @param participants Список участников.
 * @param type Тип участника.
 */
export function countParticipantsByType(
  participants: Array<TrackerParticipant>,
  type: ParticipantType,
): number {
  return participants.filter((participant) => participant.type === type).length;
}

/**
 * Форматирует бонус инициативы со знаком: `+2`, `0`, `-1`.
 * @param bonus Числовой бонус.
 */
export function formatInitiativeBonus(bonus: number): string {
  return bonus > 0 ? `+${bonus}` : String(bonus);
}

/**
 * Признак того, что участнику уже прокинута инициатива.
 * @param participant Участник.
 */
export function isParticipantRolled(participant: TrackerParticipant): boolean {
  return typeof participant.initiativeTotal === 'number';
}

/**
 * Ссылка на статблок существа в бестиарии.
 * @param creatureUrl Слаг существа.
 */
export function getCreatureRoute(creatureUrl: string): string {
  return `/bestiary/${creatureUrl}`;
}

/**
 * Извлекает числовое значение КД из строки статблока:
 * `15 (кожаный доспех)` → `15`. Пустая строка — значение не распознано.
 * @param armorClass Строка КД из детального ответа бестиария.
 */
export function extractArmorClassValue(armorClass: string): string {
  return armorClass.match(/\d+/)?.[0] ?? '';
}

/**
 * Клиентский бросок к20 — для бросков с преимуществом/помехой, где нужны две
 * кости сразу (обычный одиночный бросок делает бэк).
 */
export function rollD20(): number {
  return Math.floor(Math.random() * MAX_D20) + MIN_D20;
}

/**
 * Известен ли ключ состояния справочнику. Ключи приходят с сервера, а справочник
 * ведёт фронт: незнакомое состояние (запись из будущей версии) отбрасывается.
 * @param value Ключ состояния из ответа сервера.
 */
export function isConditionKey(value: string): value is ConditionKey {
  return Object.hasOwn(CONDITION_CATALOG, value);
}

/**
 * Известен ли цвет иконки участника палитре.
 * @param value Ключ цвета из ответа сервера.
 */
export function isParticipantColor(value: string): value is ParticipantColor {
  return Object.hasOwn(PARTICIPANT_COLOR_CLASS, value);
}

/**
 * Лист персонажа как вариант добавления игрока: имя, бонус инициативы, КД и
 * хиты лист считает сам, поэтому трекер берёт их готовыми. Значения приводятся
 * к пределам трекера — иначе бэк отклонил бы слишком длинное имя, а контролы
 * строки не показали бы бонус или КД за границей своего диапазона.
 * @param character Персонаж листа.
 * @param link Идентификация листа: id, источник и токен ссылки.
 */
export function buildSheetPlayerOption(
  character: Character,
  link: Omit<ParticipantSheetLink, 'avatarUrl'>,
): SheetPlayerOption {
  const classes = getClassesDisplayLabel(character);
  const maxHitPoints = Math.max(0, character.health.max);

  return {
    ...link,
    name: character.name.slice(0, MAX_PARTICIPANT_NAME_LENGTH),
    subtitle:
      classes
      || `${SHEET_PLAYER_FORM_LABELS.level} ${getDisplayLevel(character)}`,
    initiativeBonus: clamp(
      getInitiativeBonus(character),
      MIN_INITIATIVE_BONUS,
      MAX_INITIATIVE_BONUS,
    ),
    armorClass: clamp(
      getArmorClassValue(character),
      MIN_ARMOR_CLASS,
      MAX_ARMOR_CLASS,
    ),
    maxHitPoints,
    currentHitPoints: clamp(character.health.current, 0, maxHitPoints),
    avatarUrl: character.avatarUrl,
  };
}

/**
 * Привязка участника к листу персонажа — то, что остаётся в localStorage после
 * добавления (сам вариант выбора трекеру больше не нужен).
 * @param option Выбранный вариант листа персонажа.
 */
export function toParticipantSheetLink(
  option: SheetPlayerOption,
): ParticipantSheetLink {
  return {
    sheetId: option.sheetId,
    source: option.source,
    shareToken: option.shareToken,
    savedId: option.savedId ?? null,
    avatarUrl: option.avatarUrl,
  };
}

/**
 * Ссылка на привязанный лист персонажа: свой открывается по идентификатору,
 * чужой — по токену ссылки «поделиться». Пустая строка — открывать нечем
 * (сохранённая запись осталась без токена).
 * @param link Привязка участника к листу персонажа.
 */
export function getSheetPlayerRoute(link: ParticipantSheetLink): string {
  if (link.source === 'own') {
    return `${CHARACTER_SHEET_ROUTE}/${link.sheetId}`;
  }

  return link.shareToken
    ? `${CHARACTER_SHEET_SHARED_ROUTE}/${link.shareToken}`
    : '';
}
