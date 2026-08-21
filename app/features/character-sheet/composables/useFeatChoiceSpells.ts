import type { MaybeRefOrGetter, Ref } from 'vue';

import type {
  CharacterSpell,
  ClassChoice,
  FeatSummary,
  SpellCatalogItem,
} from '../model';

import { fetchChoiceSpells, getChoiceSpellClassUrls } from '../model';

interface FeatChoiceSpellsOptions {
  /** Черты, чьи выборы заклинаний собираются. */
  summaries: MaybeRefOrGetter<FeatSummary[]>;

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
  resolveClassUrls?: (choice: ClassChoice, summary: FeatSummary) => string[];
}

interface FeatChoiceSpells {
  /** Заклинания пула по id выбора. */
  pools: Ref<Record<string, SpellCatalogItem[]>>;

  /** Заклинания пула одного выбора: их показывает окно выбора заклинаний. */
  getPool: (choice: ClassChoice) => SpellCatalogItem[];

  /** Названия заклинаний пула — опции пикера выбора. */
  getSpellOptions: (choice: ClassChoice) => string[];

  /** Заклинания, выбранные игроком, записями листа. */
  collectChosenSpells: (summary: FeatSummary) => CharacterSpell[];

  /** Перезапрашивает пулы всех выборов заклинаний. */
  load: () => Promise<void>;
}

/** Выбор заклинания из выборов черты. */
function getSpellChoices(summary: FeatSummary): ClassChoice[] {
  return summary.choices.filter((choice) => choice.kind === 'spell');
}

/**
 * Ответы игрока на выборы списка класса: по ним собираются пулы, и их смена
 * пулы перезапрашивает.
 *
 * @param summaries черты.
 * @param answers ответы игрока по id выбора.
 * @returns ответ по id выбора списка.
 */
function getClassAnswers(
  summaries: FeatSummary[],
  answers: Record<string, string[]>,
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const summary of summaries) {
    for (const choice of summary.choices) {
      if (choice.kind === 'spell-list') {
        result[choice.id] = (answers[choice.id] ?? []).join(',');
      }
    }
  }

  return result;
}

/**
 * Пулы заклинаний для выборов черты.
 *
 * Пул собирается поиском по каталогу, а не хранится в самой черте: заклинаний
 * слишком много, и перечень устарел бы при первом же пополнении справочника.
 * Один код на все окна, где черту берут: и модалка черт, и визард предыстории
 * спрашивают одно и то же и одинаково сужают пул по названному классу.
 *
 * @param options черты, ответы игрока и способ сузить пул.
 * @returns пулы заклинаний и работа с ними.
 */
export function useFeatChoiceSpells(
  options: FeatChoiceSpellsOptions,
): FeatChoiceSpells {
  const { summaries, answers, resolveClassUrls } = options;

  const pools = ref<Record<string, SpellCatalogItem[]>>({});

  /** Классы пула: названные источником черты либо выбранные игроком. */
  function getClassUrls(choice: ClassChoice, summary: FeatSummary): string[] {
    if (resolveClassUrls) {
      return resolveClassUrls(choice, summary);
    }

    return getChoiceSpellClassUrls(choice, summary.choices, answers.value);
  }

  /** Перезапрашивает пулы всех выборов заклинаний загруженных черт. */
  async function load(): Promise<void> {
    const requests = toValue(summaries).flatMap((summary) =>
      getSpellChoices(summary).flatMap((choice) =>
        choice.spellFilter
          ? [{ summary, choice, filter: choice.spellFilter }]
          : [],
      ),
    );

    const loaded = await Promise.all(
      requests.map(async ({ summary, choice, filter }) => ({
        id: choice.id,
        spells: await fetchChoiceSpells(filter, getClassUrls(choice, summary)),
      })),
    );

    pools.value = Object.fromEntries(
      loaded.map((pool) => [pool.id, pool.spells]),
    );
  }

  const classAnswers = computed(() =>
    getClassAnswers(toValue(summaries), answers.value),
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
    // Чистятся только выборы той черты, чей класс назвали заново: у второй
    // черты в списке ответ остаётся.
    const cleared = { ...answers.value };

    for (const summary of toValue(summaries)) {
      for (const choice of getSpellChoices(summary)) {
        const key = choice.spellFilter?.classesFromChoiceKey;

        const source = key
          ? summary.choices.find(
              (candidate) =>
                candidate.kind === 'spell-list'
                && candidate.id.endsWith(`:${key}`),
            )
          : undefined;

        if (source && changed.has(source.id)) {
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
   * @param summary деталь черты.
   * @returns выбранные заклинания записями листа.
   */
  function collectChosenSpells(summary: FeatSummary): CharacterSpell[] {
    return getSpellChoices(summary).flatMap((choice) => {
      const chosen = new Set(answers.value[choice.id] ?? []);

      return (
        getPool(choice)
          .filter((spell) => chosen.has(spell.name))
          // Заклинание черты подготовлено сразу и места среди подготовленных
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
