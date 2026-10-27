import {
  DAMAGE_FORMULA_DICE_SYMBOL,
  DAMAGE_FORMULA_SEPARATOR,
  DAMAGE_FORMULA_TAG_PREFIX,
  DAMAGE_TYPE_TAG_PREFIX,
  DAMAGE_TYPE_TAGS,
} from './constants';
import {
  DAMAGE_FORMULA_TYPE_CHOICE_TOKEN_SOURCE,
  readDamageFormulaTypeChoices,
} from './type-choice';

/**
 * Символы, после которых арифметический разделитель не нужен: слагаемого слева
 * ещё нет, либо оператор уже стоит.
 */
const DAMAGE_FORMULA_OPERATORS = new Set(['+', '-', '*', '/', '(']);

/** Формула после вставки и новая позиция курсора в ней. */
export interface DamageFormulaInsertion {
  formula: string;
  cursor: number;
}

/**
 * Возвращает шаблон поиска кости указанного размера в формуле.
 *
 * @param diceValue размер кости.
 * @returns регулярное выражение с захватом количества.
 */
function getDamageFormulaDicePattern(diceValue: number): RegExp {
  return new RegExp(
    `(^|[^\\d])([1-9]\\d*)?${DAMAGE_FORMULA_DICE_SYMBOL}${diceValue}(?!\\d)`,
  );
}

/**
 * Добавляет кость в формулу или увеличивает количество уже указанной кости.
 *
 * @param formula текущая формула.
 * @param diceValue размер кости.
 * @returns формула с добавленной или наращённой костью.
 */
export function incrementDamageFormulaDice(
  formula: string,
  diceValue: number,
): string {
  const dicePattern = getDamageFormulaDicePattern(diceValue);
  const diceMatch = dicePattern.exec(formula);

  if (!diceMatch) {
    return formula
      ? `${formula}${DAMAGE_FORMULA_SEPARATOR}1${DAMAGE_FORMULA_DICE_SYMBOL}${diceValue}`
      : `1${DAMAGE_FORMULA_DICE_SYMBOL}${diceValue}`;
  }

  const diceCount = diceMatch[2] ? Number(diceMatch[2]) : 1;
  const nextDiceCount = diceCount + 1;

  return formula.replace(
    dicePattern,
    `${diceMatch[1]}${nextDiceCount}${DAMAGE_FORMULA_DICE_SYMBOL}${diceValue}`,
  );
}

/**
 * Вставляет текст в формулу на место выделения (или позицию курсора) и
 * сообщает, куда после этого встанет курсор.
 *
 * Вставка именно по курсору, а не в конец: тип урона и условие относятся к
 * своему слагаемому, а в формуле из нескольких слагаемых нужное обычно не
 * последнее.
 *
 * @param formula текущая формула.
 * @param text вставляемый текст.
 * @param selectionStart начало выделения (позиция курсора).
 * @param selectionEnd конец выделения; равен началу, если выделения нет.
 * @returns новая формула и позиция курсора после вставленного текста.
 */
export function insertIntoDamageFormula(
  formula: string,
  text: string,
  selectionStart: number,
  selectionEnd: number,
): DamageFormulaInsertion {
  const start = Math.min(Math.max(selectionStart, 0), formula.length);
  const end = Math.min(Math.max(selectionEnd, start), formula.length);

  return {
    formula: `${formula.slice(0, start)}${text}${formula.slice(end)}`,
    cursor: start + text.length,
  };
}

/**
 * Собирает тег формулы: теги прилипают к своему слагаемому без разделителя
 * (`8к6@dmg.fire`).
 *
 * @param tag тег без приставки `@`.
 * @returns тег с приставкой.
 */
export function buildDamageFormulaTag(tag: string): string {
  return `${DAMAGE_FORMULA_TAG_PREFIX}${tag}`;
}

/**
 * Собирает вставку модификатора: он — отдельное слагаемое, поэтому слева от
 * него нужен арифметический разделитель. Разделитель не добавляется в начало
 * формулы и после уже стоящего оператора — иначе вышло бы `8к6++@mod.str`.
 *
 * @param formula текущая формула.
 * @param modifier модификатор без приставки `@`.
 * @param selectionStart позиция вставки.
 * @returns текст вставки вместе с нужным разделителем.
 */
export function buildDamageFormulaModifier(
  formula: string,
  modifier: string,
  selectionStart: number,
): string {
  const tag = buildDamageFormulaTag(modifier);
  const before = formula.slice(0, selectionStart).trimEnd();
  const previousSymbol = before.at(-1) ?? '';

  if (!before || DAMAGE_FORMULA_OPERATORS.has(previousSymbol)) {
    return tag;
  }

  return `${DAMAGE_FORMULA_SEPARATOR}${tag}`;
}

/**
 * Лечит ли часть: вид части задаёт только тег `@heal`/`@heal.temp` в формуле —
 * так же, как в VTTG (`damagePartIsHealing`).
 *
 * @param formula формула части.
 * @returns `true`, если часть лечит.
 */
export function isHealingDamageFormula(formula: string): boolean {
  return formula.includes(`${DAMAGE_FORMULA_TAG_PREFIX}heal`);
}

/**
 * Ключ типа урона справочника по токену формулы: `dmg.fire` → `FIRE`. Обратная
 * карта к {@link DAMAGE_TYPE_TAGS}; у огня два ключа (`FAIR` — прежнее имя), и
 * побеждает последний, то есть актуальный.
 */
const DAMAGE_TYPE_KEY_BY_TAG: Record<string, string> = Object.fromEntries(
  Object.entries(DAMAGE_TYPE_TAGS).map(([key, tag]) => [tag, key]),
);

/** Токен типа урона в формуле: `@dmg.<тип>`. */
const DAMAGE_FORMULA_TYPE_PATTERN = /@(dmg\.[a-z]+)/i;

/**
 * Все токены типа урона в формуле — у формулы их бывает несколько. Тип на
 * выбор (`@dmg.choice(acid,cold)`) идёт первым: иначе шаблон принял бы
 * `choice` за тип.
 */
const DAMAGE_FORMULA_TYPES_PATTERN = new RegExp(
  `${DAMAGE_FORMULA_TYPE_CHOICE_TOKEN_SOURCE}|@(dmg\\.[a-z]+)`,
  'gi',
);

/**
 * Теги типов урона одного токена: обычный токен даёт свой тег, тип на выбор —
 * теги всех типов своего списка.
 *
 * @param token токен типа урона целиком (`@dmg.fire`, `@dmg.choice(acid,cold)`).
 * @param plainTag тег обычного токена (`dmg.fire`); `undefined` — токен на выбор.
 * @returns теги типов урона (`dmg.acid`).
 */
function getDamageTypeTokenTags(
  token: string,
  plainTag: string | undefined,
): Array<string> {
  if (plainTag) {
    return [plainTag.toLowerCase()];
  }

  return readDamageFormulaTypeChoices(token).flatMap((typeChoice) =>
    typeChoice.damageTypes.map(
      (damageType) => `${DAMAGE_TYPE_TAG_PREFIX}${damageType}`,
    ),
  );
}

/**
 * Ключи типов урона справочника из всех токенов `@dmg.*` формулы, в порядке
 * появления; у типа на выбор — все типы его списка. Незнакомый токен
 * пропускается.
 *
 * @param formula формула части урона.
 * @returns ключи типов урона (`FIRE`); пустой список — типа в формуле нет.
 */
export function getDamageFormulaTypes(formula: string): Array<string> {
  return [...formula.matchAll(DAMAGE_FORMULA_TYPES_PATTERN)]
    .flatMap((match) => getDamageTypeTokenTags(match[0], match[1]))
    .map((typeTag) => DAMAGE_TYPE_KEY_BY_TAG[typeTag])
    .filter((typeKey) => typeKey !== undefined);
}

/**
 * Любой токен формулы — при разборе костей их отбрасываем. Тип на выбор и
 * токен состояния идут первыми: общий шаблон оставил бы в костях хвост списка
 * типов (`(acid,cold)`) или ключа состояния с дефисом
 * (`@target.status.marked-k3j2x9`).
 */
const DAMAGE_FORMULA_TAG_PATTERN = new RegExp(
  `${DAMAGE_FORMULA_TYPE_CHOICE_TOKEN_SOURCE}|@(?:self|target)\\.status\\.[a-z0-9][a-z0-9-]*|@[\\w.]+`,
  'gi',
);

/** Простой бросок: `2к6`, `1к8+1`, `1d10-1`. Кость — русская «к» или «d». */
const DAMAGE_FORMULA_DICE_PATTERN =
  /^(\d+)\s*[кkd]\s*(\d+)\s*(?:([+-])\s*(\d+))?$/i;

/** Кости формулы урона: количество, грани, плоская прибавка и тип урона. */
export interface DamageFormulaDice {
  diceCount: number;
  /** Количество граней кости (8 — к8). */
  diceFaces: number;
  /** Плоская прибавка формулы; 0 — её нет. */
  bonus: number;
  /** Ключ типа урона справочника (`FIRE`); '' — тип в формуле не указан. */
  type: string;
}

/**
 * Разбирает формулу простого броска в кости, прибавку и тип урона.
 *
 * Формулу сложнее простых костей (с модификаторами `@mod.*`, условиями по цели,
 * арифметикой) разобрать нельзя — такая часть возвращает `undefined`, и
 * потребитель решает сам, чем её заменить. Токены при разборе костей
 * отбрасываются: тип урона едет отдельным полем результата.
 *
 * @param formula формула части урона.
 * @returns кости формулы; `undefined` — формула сложнее простых костей.
 */
export function parseDamageFormulaDice(
  formula: string | undefined,
): DamageFormulaDice | undefined {
  const cleaned = (formula ?? '')
    .replace(DAMAGE_FORMULA_TAG_PATTERN, '')
    .trim();

  const diceMatch = DAMAGE_FORMULA_DICE_PATTERN.exec(cleaned);

  if (!diceMatch) {
    return undefined;
  }

  const [, diceCount, diceFaces, sign, bonus] = diceMatch;
  const signedBonus = sign === '-' ? -Number(bonus) : Number(bonus);

  return {
    diceCount: Number(diceCount),
    diceFaces: Number(diceFaces),
    bonus: bonus === undefined ? 0 : signedBonus,
    type: getDamageFormulaFirstType(formula ?? ''),
  };
}

/**
 * Ключ типа урона справочника из первого токена `@dmg.*` формулы.
 *
 * @param formula формула части урона.
 * @returns ключ типа урона (`FIRE`); '' — типа в формуле нет или он незнаком.
 */
function getDamageFormulaFirstType(formula: string): string {
  const typeTag = DAMAGE_FORMULA_TYPE_PATTERN.exec(formula)?.[1];

  return typeTag ? (DAMAGE_TYPE_KEY_BY_TAG[typeTag.toLowerCase()] ?? '') : '';
}

/** Плоский урон: одно число без костей — `1` у духовой трубки. */
const DAMAGE_FORMULA_FLAT_PATTERN = /^\d+$/;

/** Плоский урон формулы: число и тип урона. */
export interface DamageFormulaFlat {
  /** Урон числом. */
  amount: number;
  /** Ключ типа урона справочника (`FIRE`); '' — тип в формуле не указан. */
  type: string;
}

/**
 * Разбирает формулу плоского урона — одного числа без костей (`1@dmg.piercing`).
 *
 * Как и у костей, формулу сложнее (с модификаторами, арифметикой) разобрать
 * нельзя — такая возвращает `undefined`.
 *
 * @param formula формула части урона.
 * @returns плоский урон формулы; `undefined` — формула не одно число.
 */
export function parseDamageFormulaFlat(
  formula: string | undefined,
): DamageFormulaFlat | undefined {
  const cleaned = (formula ?? '')
    .replace(DAMAGE_FORMULA_TAG_PATTERN, '')
    .trim();

  if (!DAMAGE_FORMULA_FLAT_PATTERN.test(cleaned)) {
    return undefined;
  }

  return {
    amount: Number(cleaned),
    type: getDamageFormulaFirstType(formula ?? ''),
  };
}
