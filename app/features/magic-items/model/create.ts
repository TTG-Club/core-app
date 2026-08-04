import type { ActiveEffect } from '~active-effects/model';
import type { EditorBaseInfoState } from '~ui/editor';

import { z } from 'zod';

import {
  normalizeActiveEffects,
  normalizeLoadedActiveEffects,
} from '~active-effects/model';

export interface MagicItemCreate extends EditorBaseInfoState {
  description: string; // описание маркап
  attunement: MagicItemAttunement;
  charges: number; // заряды
  curse: boolean; // проклятие
  consumable: boolean; // расходуемый
  image: string | undefined;
  rarity: MagicItemRarity;
  category: MagicItemCategory;
  items: Array<string>; // связанные немагические предметы (url) для веса/стоимости и фильтра
  bonuses: MagicItemBonuses; // что магия добавляет поверх немагического предмета
  // Как предмет влияет на лист персонажа. В форме — всегда объект, в теле
  // запроса — `null`, если заполнять было нечего.
  mechanics: MagicItemMechanics | null;
}

const magicItemActivationSchema = z.enum([
  'CARRIED',
  'WORN',
  'HELD',
  'EQUIPPED',
  'CONSUMED',
  'MANUAL',
]);

/**
 * Условие, при котором механика предмета работает. Своего аналога в VTTG нет —
 * там эффекты предмета включает один признак «экипирован», — но листу
 * различение нужно: надетый плащ и зажжённый фонарь ведут себя по-разному.
 */
export type MagicItemActivation = z.infer<typeof magicItemActivationSchema>;

const magicItemRechargeEventSchema = z.enum([
  'DAWN',
  'SHORT_REST',
  'LONG_REST',
]);

/** Событие, по которому предмет восстанавливает заряды. */
export type MagicItemRechargeEvent = z.infer<
  typeof magicItemRechargeEventSchema
>;

/**
 * Заряды предмета. Только описание из каталога: остаток зарядов — состояние
 * конкретного экземпляра и живёт на листе персонажа.
 */
export interface MagicItemResource {
  maxCharges: number | undefined; // максимум зарядов; пусто — зарядов нет
  recharge: string | undefined; // формула восстановления, например «1к6+4»
  rechargeEvent: MagicItemRechargeEvent | undefined; // когда заряды возвращаются
  cost: number | undefined; // сколько зарядов тратит одно применение
}

/**
 * Механика влияния предмета на лист персонажа. Сами изменения описывают
 * активные эффекты в вокабуляре VTTG — та же модель, что у заклинаний.
 */
export interface MagicItemMechanics {
  activation: MagicItemActivation | undefined;
  activeEffects: ActiveEffect[];
  resource: MagicItemResource;
  passive: string; // пассивные свойства для листа, не участвующие в расчётах
}

export interface MagicItemBonuses {
  attack: number; // бонус к броскам атаки; 0 — нет
  damage: number; // бонус к урону; 0 — нет
  armorClass: number; // бонус к КД; 0 — нет
}

export interface MagicItemAttunement {
  requires: boolean; // требуется ли настройка
  description: string | null; // особенности настройки
}

export interface MagicItemCategory {
  type: string | undefined; // категория
  clarification: string | undefined; // описание категории
}

export interface MagicItemRarity {
  type: string | undefined; // редкость
  varies: string | undefined; // текст для магических предметов с варьируемой редкостью
}

/**
 * Пустая механика: предмет на лист не влияет. Форма всегда держит объект
 * целиком, а {@link normalizeMagicItemMechanics} перед отправкой выкидывает то,
 * что осталось незаполненным.
 *
 * @returns механика с незаполненными полями.
 */
export function createEmptyMagicItemMechanics(): MagicItemMechanics {
  return {
    activation: undefined,
    activeEffects: [],
    resource: {
      maxCharges: undefined,
      recharge: undefined,
      rechargeEvent: undefined,
      cost: undefined,
    },
    passive: '',
  };
}

/** Пустая строка формы — это «не заполнено», а не значение. */
function trimmedOrUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();

  return trimmed || undefined;
}

/**
 * Заряды предмета для отправки. Без максимума заряды не существуют: формула
 * восстановления и его событие сами по себе ничего не описывают.
 *
 * @param resource заряды из формы.
 * @returns заряды предмета; null — максимум не задан.
 */
function normalizeMagicItemResource(
  resource: MagicItemResource,
): MagicItemResource | null {
  if (!resource.maxCharges || resource.maxCharges <= 0) {
    return null;
  }

  return {
    maxCharges: resource.maxCharges,
    recharge: trimmedOrUndefined(resource.recharge),
    rechargeEvent: resource.rechargeEvent,
    cost: resource.cost && resource.cost > 0 ? resource.cost : undefined,
  };
}

/**
 * Механика предмета для отправки. Полностью пустая механика уходит как `null`:
 * иначе у каждого предмета появлялся бы блок-пустышка, а лист считал бы, что
 * ему есть что применять.
 *
 * @param mechanics механика из формы.
 * @returns механика для запроса; null — заполнять было нечего.
 */
export function normalizeMagicItemMechanics(
  mechanics: MagicItemMechanics,
): MagicItemMechanics | null {
  const activeEffects = normalizeActiveEffects(mechanics.activeEffects);
  const resource = normalizeMagicItemResource(mechanics.resource);
  const passive = trimmedOrUndefined(mechanics.passive);

  if (!mechanics.activation && !activeEffects.length && !resource && !passive) {
    return null;
  }

  return {
    activation: mechanics.activation,
    activeEffects,
    // Незаполненные заряды формы шлём пустым объектом: `MagicItemResource` в
    // запросе необязателен, и разбирать `null` бэкенду не нужно.
    resource: resource ?? createEmptyMagicItemMechanics().resource,
    passive: passive ?? '',
  };
}

/**
 * Схема загруженной механики. Каждое поле со своим `.catch()`: запись раздела
 * могли сохранить до появления механики, а битое поле не должно стирать
 * соседние. Активные эффекты разбирает своя схема — здесь они `unknown`.
 */
const loadedMagicItemMechanicsSchema = z
  .object({
    activation: magicItemActivationSchema.nullish().catch(null),
    activeEffects: z.unknown(),
    resource: z
      .object({
        maxCharges: z.coerce.number().int().min(0).nullish().catch(null),
        recharge: z.string().nullish().catch(null),
        rechargeEvent: magicItemRechargeEventSchema.nullish().catch(null),
        cost: z.coerce.number().int().min(0).nullish().catch(null),
      })
      .nullish()
      .catch(null),
    passive: z.string().nullish().catch(null),
  })
  .nullish()
  .catch(null);

/**
 * Механика предмета, загруженная из «сырого» ответа раздела. Записи, сохранённые
 * до её появления, приходят без блока — форма получает пустую механику, а не
 * дыру в состоянии.
 *
 * @param raw значение поля `mechanics` из ответа.
 * @returns механика для формы.
 */
export function normalizeLoadedMagicItemMechanics(
  raw: unknown,
): MagicItemMechanics {
  const empty = createEmptyMagicItemMechanics();
  const parsed = loadedMagicItemMechanicsSchema.parse(raw);

  if (!parsed) {
    return empty;
  }

  return {
    activation: parsed.activation ?? undefined,
    activeEffects: normalizeLoadedActiveEffects(parsed.activeEffects),
    resource: {
      maxCharges: parsed.resource?.maxCharges ?? undefined,
      recharge: parsed.resource?.recharge ?? undefined,
      rechargeEvent: parsed.resource?.rechargeEvent ?? undefined,
      cost: parsed.resource?.cost ?? undefined,
    },
    passive: parsed.passive ?? '',
  };
}

/**
 * Приведение «сырого» ответа предмета к состоянию формы: механику надо разобрать
 * отдельно — слияние с начальным состоянием не превратило бы её `null` в пустой
 * блок, и форма осталась бы без полей.
 *
 * Заряды у записей, сохранённых до появления механики, лежат в отдельном поле
 * раздела. Переносим их в механику, чтобы правка старой записи не потеряла
 * заряды и не потребовала вводить их заново.
 *
 * @param raw «сырой» ответ раздела.
 * @returns состояние формы с разобранной механикой.
 */
export function normalizeLoadedMagicItem(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const mechanics = normalizeLoadedMagicItemMechanics(raw.mechanics);

  const legacyCharges = z.coerce
    .number()
    .int()
    .min(0)
    .nullish()
    .catch(null)
    .parse(raw.charges);

  if (!mechanics.resource.maxCharges && legacyCharges) {
    mechanics.resource.maxCharges = legacyCharges;
  }

  return { ...raw, mechanics };
}

/**
 * Заряды для отдельного поля раздела: по нему фильтруется каталог («с
 * зарядами»), поэтому число дублируется из механики, а не вводится второй раз.
 *
 * @param mechanics механика из формы.
 * @returns количество зарядов; 0 — зарядов нет.
 */
export function getMagicItemChargesField(
  mechanics: MagicItemMechanics | null,
): number {
  return mechanics?.resource.maxCharges ?? 0;
}
