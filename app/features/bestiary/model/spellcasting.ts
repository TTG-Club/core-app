import { AbilityKey } from '~/shared/types';

/**
 * Как ограничены применения порции заклинаний.
 *
 * Существо в редакции 2024 ячеек не тратит: у него либо заклинание «по
 * желанию», либо счётчик применений. Счётчик бывает двух смыслов, и путать их
 * нельзя — «1/день каждое» даёт по применению КАЖДОМУ заклинанию списка, а
 * «1/день» даёт одно применение на ВЕСЬ список.
 *
 * Разбор 715 существ прода дал ровно эти заголовки: «По желанию»,
 * «Неограниченно», «N/день каждое» и «N/день» (N от 1 до 3). Отдых,
 * перезарядка и постоянное действие встречаются у одиночных записей — «Щит
 * (1/отдых)», «Очарование (перезарядка 5–6)», — и теперь заводятся тем же
 * блоком.
 */
export type CreatureSpellUsageMode =
  | 'AT_WILL'
  | 'PER_DAY_EACH'
  | 'PER_DAY_POOL'
  | 'PER_REST_EACH'
  | 'PER_REST_POOL'
  | 'RECHARGE'
  | 'CONSTANT';

/** Какой отдых возвращает применения порции. */
export type CreatureSpellRestKind = 'SHORT' | 'LONG';

/** Заклинание порции: ссылка на карточку сайта и оговорки статблока. */
export interface CreatureSpellRef {
  /** Слаг карточки заклинания. */
  url: string | undefined;

  /**
   * Название на момент выбора. Снимок обязателен: имя в JSONB бэкенд не
   * подставляет, и без него строка показывала бы слаг.
   */
  name: string | undefined;

  /**
   * Круг, на котором существо накладывает заклинание: «Воображаемый убийца
   * (версия 6 уровня)». Пусто — заклинание идёт своим кругом.
   */
  castLevel: number | undefined;

  /** Оговорка статблока: «только на себя», «длительностью 24 часа». */
  note: string | undefined;
}

/** Порция блока: список заклинаний под одним ограничением применений. */
export interface CreatureSpellGroup {
  mode: CreatureSpellUsageMode;

  /** Число применений; смысл задаёт режим — на каждое заклинание или на список. */
  count: number | undefined;

  /** Какой отдых возвращает применения; только у режимов «за отдых». */
  rest: CreatureSpellRestKind | undefined;

  /** Значение словаря перезарядки («5-6»); только у режима перезарядки. */
  recharge: string | undefined;

  /** Своя подпись порции вместо выведенной из режима. */
  label: string | undefined;

  spells: Array<CreatureSpellRef>;
}

/**
 * Блок заклинаний существа: одна заклинательная характеристика, одна Сл и один
 * набор порций.
 *
 * Блоков бывает несколько, и параметры у них разные: у зелёной карги «Магия
 * шабаша» считается от Интеллекта со Сл 11, а собственное «Использование
 * заклинаний» — от Мудрости со Сл 12 и бонусом атаки +4. Поэтому
 * характеристика и Сл живут у блока, а не у существа целиком.
 */
export interface CreatureSpellcastingBlock {
  /**
   * Свой уникальный ключ блока. Проставляется формой и в неё же возвращается:
   * названия для этого мало — их у существа два одинаковых («Использование
   * заклинаний» в форме юань-ти и вне её), а виртуальному столу нужно за что-то
   * держаться, когда блок переименуют или переставят местами.
   */
  id: string;

  name: string;

  /**
   * Условие блока текстом: «находясь в пределах 30 футов от как минимум двух
   * союзных карг». Числами такое не выразить, а терять его нельзя.
   */
  note: string | undefined;

  ability: AbilityKey | undefined;

  /** Сложность спасброска плоским числом: у существа она не выводится. */
  saveDc: number | undefined;

  /** Бонус к броску атаки заклинанием — тоже плоское число. */
  attackBonus: number | undefined;

  /** Компоненты, которые блоку НЕ нужны: «без материальных компонентов». */
  ignoredComponents: CreatureSpellComponents;

  groups: Array<CreatureSpellGroup>;
}

/** Отметки «компонент не требуется» у блока. */
export interface CreatureSpellComponents {
  verbal: boolean;
  somatic: boolean;
  material: boolean;
}

/** Режимы, у которых спрашивается число применений. */
const COUNTED_MODES: ReadonlySet<CreatureSpellUsageMode> = new Set([
  'PER_DAY_EACH',
  'PER_DAY_POOL',
  'PER_REST_EACH',
  'PER_REST_POOL',
]);

/** Режимы, у которых спрашивается вид отдыха. */
const REST_MODES: ReadonlySet<CreatureSpellUsageMode> = new Set([
  'PER_REST_EACH',
  'PER_REST_POOL',
]);

/**
 * Число применений спрашивается у этой порции.
 *
 * @param mode режим порции.
 * @returns `true` — поле количества показывается.
 */
export function isCreatureSpellCountMode(
  mode: CreatureSpellUsageMode,
): boolean {
  return COUNTED_MODES.has(mode);
}

/**
 * Вид отдыха спрашивается у этой порции.
 *
 * @param mode режим порции.
 * @returns `true` — поле отдыха показывается.
 */
export function isCreatureSpellRestMode(mode: CreatureSpellUsageMode): boolean {
  return REST_MODES.has(mode);
}

/** Пустая строка заклинания порции. */
export function createEmptyCreatureSpellRef(): CreatureSpellRef {
  return {
    url: undefined,
    name: undefined,
    castLevel: undefined,
    note: undefined,
  };
}

/** Пустая порция: по умолчанию «по желанию» — самый частый режим в книгах. */
export function createEmptyCreatureSpellGroup(): CreatureSpellGroup {
  return {
    mode: 'AT_WILL',
    count: undefined,
    rest: undefined,
    recharge: undefined,
    label: undefined,
    spells: [],
  };
}

/** Приставка ключа блока: по ней в данных видно, чей это ключ. */
const SPELLCASTING_BLOCK_ID_PREFIX = 'spellcasting';

/**
 * Пустой блок заклинаний. Название подставлено книжное: так называется запись
 * в 94 статблоках из 715, и переписывать его приходится редко.
 */
export function createEmptyCreatureSpellcastingBlock(): CreatureSpellcastingBlock {
  return {
    id: createEntityId(SPELLCASTING_BLOCK_ID_PREFIX),
    name: 'Использование заклинаний',
    note: undefined,
    ability: undefined,
    saveDc: undefined,
    attackBonus: undefined,
    ignoredComponents: {
      verbal: false,
      somatic: false,
      material: false,
    },
    groups: [],
  };
}

/**
 * Готовит блоки заклинаний к отправке.
 *
 * Чистится только заведомый мусор: строки без слага (по ним ни VTTG заклинание
 * не найдёт, ни форма его не покажет) и поля, не относящиеся к режиму порции —
 * иначе у порции «по желанию» уехало бы количество, оставшееся от прежнего
 * режима. Пустые блоки и порции не выбрасываются: их оставляют
 * недозаполненными между заходами, как и записи боевого блока.
 *
 * @param blocks блоки из формы.
 * @returns блоки для запроса.
 */
export function normalizeCreatureSpellcasting(
  blocks: Array<CreatureSpellcastingBlock>,
): Array<CreatureSpellcastingBlock> {
  return blocks.map((block) => ({
    ...block,
    // Ключ добивается на отправке, а не только при создании: блоки, заведённые
    // до его появления, приезжают из `/raw` без ключа, и без этого он не
    // появился бы у них никогда
    id: block.id || createEntityId(SPELLCASTING_BLOCK_ID_PREFIX),
    groups: block.groups.map((group) => ({
      ...group,
      count: isCreatureSpellCountMode(group.mode) ? group.count : undefined,
      rest: isCreatureSpellRestMode(group.mode) ? group.rest : undefined,
      recharge: group.mode === 'RECHARGE' ? group.recharge : undefined,
      spells: group.spells.filter((spell) => Boolean(spell.url)),
    })),
  }));
}

/** Значения полей-перечислений: всё чужое схема отбрасывает. */
const USAGE_MODES: Array<CreatureSpellUsageMode> = [
  'AT_WILL',
  'PER_DAY_EACH',
  'PER_DAY_POOL',
  'PER_REST_EACH',
  'PER_REST_POOL',
  'RECHARGE',
  'CONSTANT',
];

const REST_KINDS: Array<CreatureSpellRestKind> = ['SHORT', 'LONG'];

const ABILITY_KEYS: Array<AbilityKey> = Object.values(AbilityKey);

/** Строка заклинания из «сырого» ответа. */
const loadedSpellRefSchema = z
  .object({
    url: z.string().nullish().catch(null),
    name: z.string().nullish().catch(null),
    castLevel: z.coerce.number().nullish().catch(null),
    note: z.string().nullish().catch(null),
  })
  .catch({ url: null, name: null, castLevel: null, note: null })
  .transform(
    (spell): CreatureSpellRef => ({
      url: spell.url ?? undefined,
      name: spell.name ?? undefined,
      castLevel: spell.castLevel ?? undefined,
      note: spell.note ?? undefined,
    }),
  );

/** Порция из «сырого» ответа. */
const loadedSpellGroupSchema = z
  .object({
    mode: z.string().nullish().catch(null),
    count: z.coerce.number().nullish().catch(null),
    rest: z.string().nullish().catch(null),
    recharge: z.string().nullish().catch(null),
    label: z.string().nullish().catch(null),
    spells: z.array(loadedSpellRefSchema).nullish().catch(null),
  })
  .catch({
    mode: null,
    count: null,
    rest: null,
    recharge: null,
    label: null,
    spells: null,
  })
  .transform(
    (group): CreatureSpellGroup => ({
      mode: USAGE_MODES.find((mode) => mode === group.mode) ?? 'AT_WILL',
      count: group.count ?? undefined,
      rest: REST_KINDS.find((rest) => rest === group.rest),
      recharge: group.recharge ?? undefined,
      label: group.label ?? undefined,
      spells: group.spells ?? [],
    }),
  );

/** Блок из «сырого» ответа. */
const loadedSpellcastingBlockSchema = z
  .object({
    id: z.string().nullish().catch(null),
    name: z.string().catch(''),
    note: z.string().nullish().catch(null),
    ability: z.string().nullish().catch(null),
    saveDc: z.coerce.number().nullish().catch(null),
    attackBonus: z.coerce.number().nullish().catch(null),
    ignoredComponents: z
      .object({
        verbal: z.boolean().catch(false),
        somatic: z.boolean().catch(false),
        material: z.boolean().catch(false),
      })
      .nullish()
      .catch(null),
    groups: z.array(loadedSpellGroupSchema).nullish().catch(null),
  })
  .transform(
    (block): CreatureSpellcastingBlock => ({
      id: block.id ?? createEntityId(SPELLCASTING_BLOCK_ID_PREFIX),
      name: block.name,
      note: block.note ?? undefined,
      ability: ABILITY_KEYS.find((ability) => ability === block.ability),
      saveDc: block.saveDc ?? undefined,
      attackBonus: block.attackBonus ?? undefined,
      ignoredComponents: {
        verbal: block.ignoredComponents?.verbal ?? false,
        somatic: block.ignoredComponents?.somatic ?? false,
        material: block.ignoredComponents?.material ?? false,
      },
      groups: block.groups ?? [],
    }),
  );

const loadedSpellcastingSchema = z
  .array(loadedSpellcastingBlockSchema)
  .nullish()
  .catch(null);

/**
 * Разбирает блоки заклинаний из ответа `/raw`.
 *
 * Схемой, а не приведением типа: ответ сервера здесь `unknown`, а форме нужны
 * настоящие массивы и значения перечислений — иначе `v-model` порции упёрся бы
 * в `undefined`, а чужой режим молча остался бы в записи.
 *
 * @param raw значение поля `spellcasting` «сырого» ответа.
 * @returns блоки заклинаний для формы.
 */
export function normalizeLoadedCreatureSpellcasting(
  raw: unknown,
): Array<CreatureSpellcastingBlock> {
  return loadedSpellcastingSchema.parse(raw) ?? [];
}

/** Подписи режимов порции — в порядке показа в списке. */
export const CREATURE_SPELL_USAGE_MODE_OPTIONS: Array<{
  label: string;
  value: CreatureSpellUsageMode;
}> = [
  { label: 'По желанию', value: 'AT_WILL' },
  { label: 'N в день, каждое', value: 'PER_DAY_EACH' },
  { label: 'N в день, на весь список', value: 'PER_DAY_POOL' },
  { label: 'N за отдых, каждое', value: 'PER_REST_EACH' },
  { label: 'N за отдых, на весь список', value: 'PER_REST_POOL' },
  { label: 'Перезарядка', value: 'RECHARGE' },
  { label: 'Постоянно активно', value: 'CONSTANT' },
];

/** Подписи видов отдыха. */
export const CREATURE_SPELL_REST_OPTIONS: Array<{
  label: string;
  value: CreatureSpellRestKind;
}> = [
  { label: 'Короткий отдых', value: 'SHORT' },
  { label: 'Продолжительный отдых', value: 'LONG' },
];

/** Части выведенной подписи порции — так же, как заголовки в книгах. */
const GROUP_LABEL_PARTS = {
  atWill: 'По желанию',
  constant: 'Постоянно активно',
  recharge: 'Перезарядка',
  perDay: 'в день',
  perShortRest: 'за короткий отдых',
  perLongRest: 'за продолжительный отдых',
  each: 'каждое',
  pool: 'на весь список',
  unset: 'Порция без числа применений',
} as const;

/**
 * Хвост подписи порции со счётчиком: за какой промежуток возвращаются
 * применения. У режимов «за отдых» промежуток зависит ещё и от вида отдыха.
 *
 * @param group порция.
 * @returns подпись промежутка.
 */
function getGroupPeriodLabel(group: CreatureSpellGroup): string {
  if (!isCreatureSpellRestMode(group.mode)) {
    return GROUP_LABEL_PARTS.perDay;
  }

  return group.rest === 'SHORT'
    ? GROUP_LABEL_PARTS.perShortRest
    : GROUP_LABEL_PARTS.perLongRest;
}

/**
 * Подпись порции: своя, если автор её задал, иначе выведенная из режима —
 * «2 в день, каждое». По ней свёрнутая порция читается, как заголовок в книге.
 *
 * @param group порция.
 * @returns подпись шапки порции.
 */
export function getCreatureSpellGroupLabel(group: CreatureSpellGroup): string {
  if (group.label) {
    return group.label;
  }

  if (group.mode === 'AT_WILL') {
    return GROUP_LABEL_PARTS.atWill;
  }

  if (group.mode === 'CONSTANT') {
    return GROUP_LABEL_PARTS.constant;
  }

  if (group.mode === 'RECHARGE') {
    return group.recharge
      ? `${GROUP_LABEL_PARTS.recharge} ${group.recharge}`
      : GROUP_LABEL_PARTS.recharge;
  }

  const scope =
    group.mode === 'PER_DAY_EACH' || group.mode === 'PER_REST_EACH'
      ? GROUP_LABEL_PARTS.each
      : GROUP_LABEL_PARTS.pool;

  if (group.count === undefined) {
    return GROUP_LABEL_PARTS.unset;
  }

  return `${group.count} ${getGroupPeriodLabel(group)}, ${scope}`;
}

/**
 * Сколько заклинаний заведено в блоке — число для бейджа свёрнутой строки.
 *
 * Считаются строки со слагом: пустая строка ещё не заклинание, и в бейдже она
 * обещала бы то, чего в блоке нет.
 *
 * @param block блок заклинаний.
 * @returns количество выбранных заклинаний блока.
 */
export function getCreatureSpellcastingSpellCount(
  block: CreatureSpellcastingBlock,
): number {
  return block.groups.reduce(
    (total, group) =>
      total + group.spells.filter((spell) => Boolean(spell.url)).length,
    0,
  );
}
