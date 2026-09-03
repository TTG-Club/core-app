import type { SpellCatalogItem } from '~character-sheet/model';

import { parseSpellCatalog, SPELLS_SEARCH_PATH } from '~character-sheet/model';

import { CHAT_SPELL_SEARCH_DEBOUNCE, CHAT_SPELL_SEARCH_LIMIT } from '../model';

/**
 * Подсказки справочника заклинаний для события `SPELL_CAST`.
 *
 * Свой справочник не заводится: запрос уходит в тот же
 * `GET /api/v2/spells/search`, что и каталог заклинаний сайта, а ответ
 * разбирает готовая схема `parseSpellCatalog` из домена листа персонажа.
 * Отсюда же берётся `url` заклинания — он уезжает в событие как `spellId`,
 * поэтому карточка в чате открывает существующий дровер справочника.
 */
export function useSpellPicker() {
  const searchTerm = ref('');
  const spells = ref<Array<SpellCatalogItem>>([]);
  const isSearching = ref(false);

  // Каждое нажатие клавиши в поиск не отправляем: подсказки нужны по паузе.
  const debouncedTerm = refDebounced(searchTerm, CHAT_SPELL_SEARCH_DEBOUNCE);

  // Ответы приходят не в том порядке, в котором ушли запросы; по номеру
  // поколения поздний ответ на старый запрос отбрасывается.
  let requestGeneration = 0;

  /**
   * Загружает подсказки под текущий запрос.
   * @param term Строка поиска.
   */
  async function loadSpells(term: string): Promise<void> {
    const generation = ++requestGeneration;
    const trimmed = term.trim();

    if (!trimmed) {
      spells.value = [];
      isSearching.value = false;

      return;
    }

    isSearching.value = true;

    try {
      const response = await $fetch<unknown>(SPELLS_SEARCH_PATH, {
        method: 'GET',
        query: { page: 0, size: CHAT_SPELL_SEARCH_LIMIT, search: trimmed },
        retry: 0,
      });

      if (generation !== requestGeneration) {
        return;
      }

      spells.value = parseSpellCatalog(response);
    } catch (error) {
      if (generation !== requestGeneration) {
        return;
      }

      consola.warn('[find-game] Поиск заклинаний не удался:', error);
      spells.value = [];
    } finally {
      if (generation === requestGeneration) {
        isSearching.value = false;
      }
    }
  }

  watch(debouncedTerm, loadSpells);

  return {
    isSearching: readonly(isSearching),
    searchTerm,
    spells: readonly(spells) as Readonly<Ref<ReadonlyArray<SpellCatalogItem>>>,
  };
}
