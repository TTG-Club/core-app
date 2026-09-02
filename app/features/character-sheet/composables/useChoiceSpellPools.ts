import type { MaybeRefOrGetter, Ref } from 'vue';

import type { CharacterSpell, ClassChoice, SpellCatalogItem } from '../model';

import { fetchChoiceSpells, getChoiceSpellClassUrls } from '../model';

/**
 * Запись, чьи выборы спрашивают заклинания: черта, дары предыстории, умение
 * класса. Кроме самих выборов, о записи здесь ничего не нужно — иначе умение
 * класса пришлось бы выдавать за черту.
 */
interface ChoiceSpellSource {
  choices: ClassChoice[];
}

interface ChoiceSpellPoolsOptions {
  /** Записи, чьи выборы заклинаний собираются. */
  sources: MaybeRefOrGetter<ChoiceSpellSource[]>;

  /**
   * Ответы игрока по id выбора. Composable их и читает, и чистит: названный
   * игроком класс меняет пул, а прежде выбранных заклинаний в новом пуле нет.
   */
  answers: Ref<Record<string, string[]>>;

  /**
   * Классы, из списков которых собирается пул выбора; пусто — пул не сужен.
   * Своим колбэком, потому что источник черты может назвать класс сам:
   * предыстория «Мудрец» даёт «Посвящённого в магию (Волшебник)» и за игрока
   * уже ответила.
   */
  resolveClassUrls?: (
    choice: ClassChoice,
    source: ChoiceSpellSource,
  ) => string[];
}

interface ChoiceSpellPools {
  /** Заклинания пула по id выбора. */
  pools: Ref<Record<string, SpellCatalogItem[]>>;

  /** Заклинания пула одного выбора: их показывает окно выбора заклинаний. */
  getPool: (choice: ClassChoice) => SpellCatalogItem[];

  /** Названия заклинаний пула — опции пикера выбора. */
  getSpellOptions: (choice: ClassChoice) => string[];

  /** Заклинания, выбранные игроком, записями листа. */
  collectChosenSpells: (source: ChoiceSpellSource) => CharacterSpell[];

  /** Перезапрашивает пулы всех выборов заклинаний. */
  load: () => Promise<void>;
}

/** Выбор заклинания из выборов записи. */
function getSpellChoices(source: ChoiceSpellSource): ClassChoice[] {
  return source.choices.filter((choice) => choice.kind === 'spell');
}

/**
 * Ответы игрока на выборы списка класса: по ним собираются пулы, и их смена
 * пулы перезапрашивает.
 *
 * @param sources записи с выборами.
 * @param answers ответы игрока по id выбора.
 * @returns ответ по id выбора списка.
 */
function getClassAnswers(
  sources: ChoiceSpellSource[],
  answers: Record<string, string[]>,
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const source of sources) {
    for (const choice of source.choices) {
      if (choice.kind === 'spell-list') {
        result[choice.id] = (answers[choice.id] ?? []).join(',');
      }
    }
  }

  return result;
}

/**
 * Пулы заклинаний для выборов записи справочника.
 *
 * Пул собирается поиском по каталогу, а не хранится в самой записи: заклинаний
 * слишком много, и перечень устарел бы при первом же пополнении справочника.
 * Один код на все окна, где такой выбор спрашивают: модалка черт, визарды
 * предыстории и класса спрашивают одно и то же и одинаково сужают пул по
 * названному классу.
 *
 * @param options записи с выборами, ответы игрока и способ сузить пул.
 * @returns пулы заклинаний и работа с ними.
 */
export function useChoiceSpellPools(
  options: ChoiceSpellPoolsOptions,
): ChoiceSpellPools {
  const { sources, answers, resolveClassUrls } = options;

  const pools = ref<Record<string, SpellCatalogItem[]>>({});

  /** Классы пула: названные источником записи либо выбранные игроком. */
  function getClassUrls(
    choice: ClassChoice,
    source: ChoiceSpellSource,
  ): string[] {
    if (resolveClassUrls) {
      return resolveClassUrls(choice, source);
    }

    return getChoiceSpellClassUrls(choice, source.choices, answers.value);
  }

  /** Перезапрашивает пулы всех выборов заклинаний загруженных записей. */
  async function load(): Promise<void> {
    const requests = toValue(sources).flatMap((source) =>
      getSpellChoices(source).flatMap((choice) =>
        choice.spellFilter
          ? [{ source, choice, filter: choice.spellFilter }]
          : [],
      ),
    );

    const loaded = await Promise.all(
      requests.map(async ({ source, choice, filter }) => ({
        id: choice.id,
        spells: await fetchChoiceSpells(filter, getClassUrls(choice, source)),
      })),
    );

    pools.value = Object.fromEntries(
      loaded.map((pool) => [pool.id, pool.spells]),
    );
  }

  const classAnswers = computed(() =>
    getClassAnswers(toValue(sources), answers.value),
  );

  // Цикла нет: обработчик правит ответы только выборов заклинаний, а ключ
  // считается по ответам выборов списка — его значение от этого не меняется.
  watch(classAnswers, (next, previous) => {
    const changed = new Set(
      Object.keys(next).filter((id) => next[id] !== previous[id]),
    );

    if (!changed.size) {
      return;
    }

    // Пул сменился — прежде выбранные заклинания к нему уже не относятся.
    // Чистятся только выборы той записи, чей класс назвали заново: у второй
    // записи в списке ответ остаётся.
    const cleared = { ...answers.value };

    for (const source of toValue(sources)) {
      for (const choice of getSpellChoices(source)) {
        const key = choice.spellFilter?.classesFromChoiceKey;

        const listChoice = key
          ? source.choices.find(
              (candidate) =>
                candidate.kind === 'spell-list'
                && candidate.id.endsWith(`:${key}`),
            )
          : undefined;

        if (listChoice && changed.has(listChoice.id)) {
          cleared[choice.id] = [];
        }
      }
    }

    answers.value = cleared;

    void load();
  });

  /**
   * Заклинания пула одного выбора.
   *
   * @param choice выбор заклинания.
   * @returns заклинания пула; пусто — пул ещё не загрузился или он пуст.
   */
  function getPool(choice: ClassChoice): SpellCatalogItem[] {
    return pools.value[choice.id] ?? [];
  }

  /**
   * Названия заклинаний пула: пикер выбора работает с подписями, а не с записями.
   *
   * @param choice выбор заклинания.
   * @returns названия заклинаний пула.
   */
  function getSpellOptions(choice: ClassChoice): string[] {
    return getPool(choice).map((spell) => spell.name);
  }

  /**
   * Заклинания, выбранные игроком: пул хранит записи каталога, а ответы —
   * названия, поэтому выбранное сверяется по названию.
   *
   * @param source запись с выборами.
   * @returns выбранные заклинания записями листа.
   */
  function collectChosenSpells(source: ChoiceSpellSource): CharacterSpell[] {
    return getSpellChoices(source).flatMap((choice) => {
      const chosen = new Set(answers.value[choice.id] ?? []);

      return (
        getPool(choice)
          .filter((spell) => chosen.has(spell.name))
          // Заклинание записи подготовлено сразу и места среди подготовленных
          // не занимает — как врождённое заклинание вида.
          .map((spell) => ({ ...spell, prepared: true }))
      );
    });
  }

  return {
    pools,
    getPool,
    getSpellOptions,
    collectChosenSpells,
    load,
  };
}
