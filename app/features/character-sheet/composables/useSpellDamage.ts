import type { MaybeRefOrGetter, Ref } from 'vue';

import type {
  CharacterSpell,
  SpellDamage,
  SpellDamageFormulas,
} from '../model';

import {
  fetchSpellDamageFormulas,
  getSpellDamage,
  isCustomSpell,
  SPELL_DAMAGE_STATE_KEY,
} from '../model';

interface SpellDamageCatalog {
  /**
   * Броски урона заклинания: пока справочник не ответил — пустой список,
   * поэтому плитки появляются, когда данные доедут.
   */
  getDamage: (spellUrl: string) => SpellDamage[];
}

/**
 * Уже запрошенные заклинания: повторный заход на вкладку и вторая копия листа
 * (страница и дровер) не должны слать те же запросы заново. Живёт вне
 * состояния — это не данные, а защита от дублей в полёте.
 */
const requestedSpellUrls = new Set<string>();

/**
 * Урон каталожных заклинаний из справочника. В документе листа урона нет:
 * заклинание — ссылка на раздел, а формулы там правятся отдельно от листа,
 * поэтому они дозагружаются и кэшируются на всё приложение, а не сохраняются.
 *
 * Свои заклинания пропускаются: у них нет страницы в каталоге.
 *
 * @param spells заклинания, которым нужен урон (книга и врождённые).
 * @param spellAbilityModifier модификатор заклинательной характеристики.
 * @param characterLevel общий уровень персонажа: по нему растёт урон заговоров.
 * @returns доступ к разобранным броскам урона по URL заклинания.
 */
export function useSpellDamage(
  spells: MaybeRefOrGetter<CharacterSpell[]>,
  spellAbilityModifier: MaybeRefOrGetter<number>,
  characterLevel: MaybeRefOrGetter<number>,
): SpellDamageCatalog {
  // Формулы кэшируются как есть: модификатор характеристики и уровень персонажа
  // подставляются при разборе, поэтому их смена не требует новых запросов.
  const damageFormulas: Ref<Record<string, SpellDamageFormulas>> = useState(
    SPELL_DAMAGE_STATE_KEY,
    () => ({}),
  );

  /** Догружает формулы урона заклинания, если их ещё никто не запрашивал. */
  async function loadDamageFormulas(spellUrl: string): Promise<void> {
    if (requestedSpellUrls.has(spellUrl)) {
      return;
    }

    requestedSpellUrls.add(spellUrl);

    const formulas = await fetchSpellDamageFormulas(spellUrl);

    damageFormulas.value = { ...damageFormulas.value, [spellUrl]: formulas };
  }

  watch(
    () => toValue(spells),
    (currentSpells) => {
      // Справочник нужен только рядом с пользователем: на сервере вкладка
      // заклинаний всё равно не отрисована, а запросы удвоились бы.
      if (import.meta.server) {
        return;
      }

      for (const spell of currentSpells) {
        if (!isCustomSpell(spell)) {
          void loadDamageFormulas(spell.url);
        }
      }
    },
    { immediate: true },
  );

  /**
   * Броски урона заклинания по его URL.
   *
   * @param spellUrl URL заклинания в каталоге.
   * @returns броски урона; пусто — урона нет либо справочник ещё не ответил.
   */
  function getDamage(spellUrl: string): SpellDamage[] {
    const damage = damageFormulas.value[spellUrl];

    return damage
      ? getSpellDamage(
          damage,
          toValue(spellAbilityModifier),
          toValue(characterLevel),
        )
      : [];
  }

  return { getDamage };
}
