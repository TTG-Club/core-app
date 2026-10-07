import type { MaybeRefOrGetter, Ref } from 'vue';

import type {
  CharacterSpell,
  SpellCastingKind,
  SpellCatalogMechanics,
  SpellDamage,
} from '../model';

import {
  fetchSpellCatalogMechanics,
  getCustomSpellCastingKinds,
  getSpellDamage,
  isCustomSpell,
  SPELL_CATALOG_MECHANICS_STATE_KEY,
} from '../model';

interface SpellCatalogMechanicsAccess {
  /**
   * Броски урона заклинания: пока справочник не ответил — пустой список,
   * поэтому плитки появляются, когда данные доедут.
   */
  getDamage: (spellUrl: string) => SpellDamage[];

  /**
   * Время накладывания заклинания: у каталожного — из справочника (пусто, пока
   * он не ответил), у своего — по тексту его поля.
   */
  getCastingKinds: (spell: CharacterSpell) => SpellCastingKind[];
}

/**
 * Уже запрошенные заклинания: повторный заход на вкладку и вторая копия листа
 * (страница и дровер) не должны слать те же запросы заново. Живёт вне
 * состояния — это не данные, а защита от дублей в полёте.
 */
const requestedSpellUrls = new Set<string>();

/**
 * Урон и время накладывания каталожных заклинаний из справочника. В документе
 * листа их нет: заклинание — ссылка на раздел, а он правится отдельно от листа,
 * поэтому данные дозагружаются и кэшируются на всё приложение, а не
 * сохраняются.
 *
 * Свои заклинания справочник не запрашивают: у них нет страницы в каталоге,
 * время накладывания у них — текст самой записи.
 *
 * @param spells заклинания, которым нужны данные (книга и врождённые).
 * @param spellAbilityModifier модификатор заклинательной характеристики.
 * @param characterLevel общий уровень персонажа: по нему растёт урон заговоров.
 * @returns доступ к урону и времени накладывания заклинаний.
 */
export function useSpellCatalogMechanics(
  spells: MaybeRefOrGetter<CharacterSpell[]>,
  spellAbilityModifier: MaybeRefOrGetter<number>,
  characterLevel: MaybeRefOrGetter<number>,
): SpellCatalogMechanicsAccess {
  // Формулы кэшируются как есть: модификатор характеристики и уровень персонажа
  // подставляются при разборе, поэтому их смена не требует новых запросов.
  const catalogMechanics: Ref<Record<string, SpellCatalogMechanics>> = useState(
    SPELL_CATALOG_MECHANICS_STATE_KEY,
    () => ({}),
  );

  /** Догружает данные заклинания, если их ещё никто не запрашивал. */
  async function loadCatalogMechanics(spellUrl: string): Promise<void> {
    if (requestedSpellUrls.has(spellUrl)) {
      return;
    }

    requestedSpellUrls.add(spellUrl);

    const mechanics = await fetchSpellCatalogMechanics(spellUrl);

    catalogMechanics.value = {
      ...catalogMechanics.value,
      [spellUrl]: mechanics,
    };
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
          void loadCatalogMechanics(spell.url);
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
    const mechanics = catalogMechanics.value[spellUrl];

    return mechanics
      ? getSpellDamage(
          mechanics.damage,
          toValue(spellAbilityModifier),
          toValue(characterLevel),
        )
      : [];
  }

  /**
   * Время накладывания заклинания.
   *
   * @param spell заклинание вкладки.
   * @returns время накладывания; пусто — неизвестно или ещё не загрузилось.
   */
  function getCastingKinds(spell: CharacterSpell): SpellCastingKind[] {
    if (isCustomSpell(spell)) {
      return getCustomSpellCastingKinds(spell.castingTime);
    }

    return catalogMechanics.value[spell.url]?.castingKinds ?? [];
  }

  return { getDamage, getCastingKinds };
}
