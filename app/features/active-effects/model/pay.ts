/**
 * «Цена» эффекта ресурсом: чем платят за применение, включение, каст или
 * срабатывание.
 *
 * Правила сплошь и рядом берут плату не действием, а ресурсом: «потратьте
 * ячейку заклинания», «бросьте одну или две свои Кости Хитов», «потратьте 6
 * очков удали». Цена описывает плату одной формой на три места — эффект
 * (каст, применение, включение) и срабатывание: список платежей, каждый —
 * своего вида.
 *
 * Здесь форма данных, её запись из формы и фраза для сводки; списывает ресурс
 * сам VTTG.
 *
 * Зеркало: dnd5-test-migrate/src/engine/effectPayTypes.ts
 */

import {
  EFFECT_PRICE_HIT_DICE_FORMS,
  EFFECT_PRICE_ITEM_USES_FORMS,
  EFFECT_PRICE_PHRASES,
} from './constants';
import { MIN_SPELL_SLOT_LEVEL } from './triggerTypes';

/** Чем платят: виды цены. */
export const EFFECT_PRICE_KINDS = [
  'counter',
  'hitDice',
  'spellSlot',
  'itemUses',
  'inspiration',
] as const;

/**
 * Вид цены: счётчик листа, кости хитов, ячейка заклинания, заряды предмета или
 * героическое вдохновение.
 */
export type EffectPriceKind = (typeof EFFECT_PRICE_KINDS)[number];

/** Вид новой строки цены: счётчик листа — самый частый. */
export const DEFAULT_EFFECT_PRICE_KIND: EffectPriceKind = 'counter';

/** Сколько единиц тратит цена без поля `amount`. */
export const DEFAULT_PRICE_AMOUNT = '1';

/** Больше платежей у одной цены не бывает. */
export const MAX_EFFECT_PRICES = 4;

/** Самая длинная формула количества и ключ счётчика. */
export const MAX_PRICE_TEXT_LENGTH = 100;

/**
 * Количество цены: сколько единиц и до скольких может выбрать игрок.
 *
 * `amount` — число или формула (`@castLevel`, `1 + @mod.con`); нет — одна
 * единица. `max` — верхняя граница выбора: игрок платит от `amount` до `max`
 * («одну или две кости», «от 1 до 5 единиц»). `amount: "0"` с `max` — цена по
 * желанию: ноль значит «не тратить».
 */
export interface EffectPriceAmount {
  /** Сколько единиц: число или формула; нет — одна. */
  amount?: string;
  /** Верхняя граница выбора; нет — ровно `amount`. */
  max?: string;
}

/** Счётчик листа VTTG: очки, использования умения. */
export interface EffectCounterPrice extends EffectPriceAmount {
  kind: 'counter';
  /** Ключ счётчика листа. */
  counter: string;
}

/**
 * Кости хитов платящего. Бросаются при оплате один раз — сумма уходит в
 * `@paid.hitDiceRoll`, число и грань — в `@paid.hitDice` и `@paid.hitDie`.
 */
export interface EffectHitDicePrice extends EffectPriceAmount {
  kind: 'hitDice';
}

/** Ячейка заклинания: круг выбирает игрок в пределах. */
export interface EffectSpellSlotPrice {
  kind: 'spellSlot';
  /** Наименьший круг ячейки; нет — первый. */
  minLevel?: number;
  /** Наибольший круг ячейки; нет — девятый. */
  maxLevel?: number;
  /** Только ячейка договора колдуна. */
  pact?: true;
}

/**
 * Заряды предмета, с которого пришёл эффект: своя цена у каждого свойства
 * («первое слово — бесплатно, третье — 5 зарядов»). Ноль — свойство зарядов не
 * тратит. Заменяет обычный расход применения предмета.
 */
export interface EffectItemUsesPrice extends EffectPriceAmount {
  kind: 'itemUses';
}

/** Героическое вдохновение платящего. */
export interface EffectInspirationPrice {
  kind: 'inspiration';
}

/** Платёж с количеством: счётчик, кости хитов и заряды предмета. */
export type EffectAmountPrice =
  | EffectCounterPrice
  | EffectHitDicePrice
  | EffectItemUsesPrice;

/** Один платёж цены. */
export type EffectPrice =
  | EffectAmountPrice
  | EffectSpellSlotPrice
  | EffectInspirationPrice;

/**
 * Цена: список платежей, платятся ВСЕ («кость хитов и использование умения»).
 * Платит тот, кто применяет, включает или колдует; у срабатывания — носитель
 * эффекта.
 */
export type EffectPay = EffectPrice[];

/**
 * Что потрачено: числа, которые подставляются вместо токенов `@paid.*`.
 * Хранятся у наложенного или включённого эффекта — как круг каста.
 */
export interface EffectPaid {
  /** Сколько единиц счётчиков потрачено (`@paid.counter`). */
  counter?: number;
  /** Сколько костей хитов потрачено (`@paid.hitDice`). */
  hitDice?: number;
  /** Грань потраченных костей хитов (`@paid.hitDie`). */
  hitDie?: number;
  /** Сумма броска потраченных костей хитов (`@paid.hitDiceRoll`). */
  hitDiceRoll?: number;
  /** Круг потраченной ячейки (`@paid.slotLevel`). */
  slotLevel?: number;
  /** Сколько зарядов предмета потрачено (`@paid.itemUses`). */
  itemUses?: number;
}

/**
 * Есть ли у платежа количество: ячейка и вдохновение тратятся по одной.
 *
 * @param price платёж.
 * @returns `true`, если у платежа читаются `amount` и `max`.
 */
export function priceHasAmount(price: EffectPrice): price is EffectAmountPrice {
  return (
    price.kind === 'counter'
    || price.kind === 'hitDice'
    || price.kind === 'itemUses'
  );
}

/**
 * Новый платёж выбранного вида. Поля прежнего вида не переносятся — у каждого
 * вида свои.
 *
 * @param kind вид цены.
 * @returns платёж.
 */
export function createEffectPrice(kind: EffectPriceKind): EffectPrice {
  return kind === 'counter' ? { kind, counter: '' } : { kind };
}

/**
 * Формула количества цены из поля: пустое поле — отсутствие формулы (одна
 * единица), а не пустая строка. Пробелы по краям снимает запись, чтобы не
 * мешать набору.
 *
 * @param enteredFormula текст поля «Сколько» или «До».
 * @returns формула либо `undefined`.
 */
export function toDraftPriceFormula(
  enteredFormula: string,
): string | undefined {
  return enteredFormula.trim() ? enteredFormula : undefined;
}

/**
 * Цена черновика: пустой список платежей — отсутствие цены.
 *
 * @param prices платежи из формы.
 * @returns цена либо `undefined`.
 */
export function toDraftEffectPay(
  prices: readonly EffectPrice[],
): EffectPay | undefined {
  return prices.length > 0 ? [...prices] : undefined;
}

/**
 * Цена для записи: формулы без пробелов по краям, пустая формула — отсутствием
 * поля (одна единица), платёж счётчиком без ключа не пишется вовсе — разбор
 * записи его всё равно отбросит. Пустая цена — отсутствием поля.
 *
 * @param pay цена из черновика.
 * @returns цена либо `undefined`.
 */
export function normalizeDraftPay(
  pay: EffectPay | undefined,
): EffectPay | undefined {
  const prices = (pay ?? []).flatMap((price): EffectPrice[] => {
    if (!priceHasAmount(price)) {
      return [price];
    }

    const amount = price.amount?.trim() || undefined;
    const max = price.max?.trim() || undefined;

    if (price.kind !== 'counter') {
      return [{ kind: price.kind, amount, max }];
    }

    const counter = price.counter.trim();

    return counter ? [{ kind: 'counter', counter, amount, max }] : [];
  });

  return toDraftEffectPay(prices);
}

/**
 * Количество платежа словами: «2», «1–2», «0–@castLevel».
 *
 * @param price платёж с количеством.
 * @returns количество.
 */
function formatPriceAmount(price: EffectPriceAmount): string {
  const amount = price.amount ?? DEFAULT_PRICE_AMOUNT;

  return price.max === undefined || price.max === amount
    ? amount
    : `${amount}${EFFECT_PRICE_PHRASES.amountRange}${price.max}`;
}

/**
 * Форма слова по количеству словами: у числа — по числу, у диапазона и формулы
 * — множественная («1–2 костей хитов» читается хуже, чем «кости»).
 *
 * @param amountText количество словами.
 * @param forms формы слова: одна, две, пять.
 * @returns форма слова.
 */
function pluralizePriceAmount(
  amountText: string,
  forms: [string, string, string],
): string {
  const numericAmount = Number(amountText);

  return Number.isInteger(numericAmount)
    ? getPlural(numericAmount, forms)
    : forms[1];
}

/**
 * Ячейка заклинания словами: «ячейка», «ячейка от 4 круга», «ячейка договора
 * до 5 круга».
 *
 * @param price платёж ячейкой.
 * @returns фраза.
 */
function describeSpellSlotPrice(price: EffectSpellSlotPrice): string {
  const slotName = price.pact
    ? EFFECT_PRICE_PHRASES.pactSlot
    : EFFECT_PRICE_PHRASES.slot;

  const minLevel = price.minLevel ?? MIN_SPELL_SLOT_LEVEL;

  const fromText =
    minLevel > MIN_SPELL_SLOT_LEVEL
      ? `${EFFECT_PRICE_PHRASES.slotFrom}${minLevel}`
      : '';

  const upToText =
    price.maxLevel === undefined
      ? ''
      : `${EFFECT_PRICE_PHRASES.slotUpTo}${price.maxLevel}`;

  return fromText || upToText
    ? `${slotName}${fromText}${upToText}${EFFECT_PRICE_PHRASES.slotLevelSuffix}`
    : slotName;
}

/**
 * Платёж словами — для сводки эффекта: «ячейка от 4 круга», «1–2 кости хитов»,
 * «6 «grit»». Формула количества остаётся формулой: числа платящего здесь
 * неизвестны.
 *
 * @param price платёж.
 * @returns платёж словами.
 */
export function describeEffectPrice(price: EffectPrice): string {
  if (price.kind === 'spellSlot') {
    return describeSpellSlotPrice(price);
  }

  if (price.kind === 'inspiration') {
    return EFFECT_PRICE_PHRASES.inspiration;
  }

  const amountText = formatPriceAmount(price);

  if (price.kind === 'counter') {
    return `${amountText} «${price.counter}»`;
  }

  const forms =
    price.kind === 'hitDice'
      ? EFFECT_PRICE_HIT_DICE_FORMS
      : EFFECT_PRICE_ITEM_USES_FORMS;

  return `${amountText} ${pluralizePriceAmount(amountText, forms)}`;
}

/**
 * Цена словами: платежи через «и».
 *
 * @param pay цена.
 * @returns цена словами; пусто — цены нет.
 */
export function describeEffectPay(pay: EffectPay | undefined): string {
  return (pay ?? [])
    .map(describeEffectPrice)
    .join(EFFECT_PRICE_PHRASES.payJoiner);
}

/**
 * Цена в сводке эффекта и во фразе срабатывания: «, цена: ячейка договора».
 *
 * @param pay цена.
 * @returns продолжение фразы либо пустая строка.
 */
export function describeEffectPayClause(pay: EffectPay | undefined): string {
  const payText = describeEffectPay(pay);

  return payText ? `${EFFECT_PRICE_PHRASES.payClausePrefix}${payText}` : '';
}
