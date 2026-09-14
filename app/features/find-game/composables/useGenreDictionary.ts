import type { MaybeRefOrGetter } from 'vue';

import { uniqBy } from 'es-toolkit';

import { fetchGenres, GAME_GENRE_SUGGESTIONS, getGenreKey } from '../model';

/** Пауза перед запросом: подсказки не гонятся за каждой буквой. */
const SEARCH_DEBOUNCE_MS = 250;

/**
 * Подходит ли базовый жанр под набранное. Сравнение по началу названия — тем
 * же способом, каким ищет сервис, иначе базовые подсказки вели бы себя не так,
 * как пришедшие из справочника.
 * @param genre Базовый жанр.
 * @param query Что набрали в поле.
 */
function matchesQuery(genre: string, query: string): boolean {
  return getGenreKey(genre).startsWith(getGenreKey(query));
}

/**
 * Базовые жанры, подходящие под набранное.
 * @param query Что набрали в поле.
 */
function getBaseGenres(query: string): Array<string> {
  return GAME_GENRE_SUGGESTIONS.filter((genre) => matchesQuery(genre, query));
}

/**
 * Справочник жанров для поля жанров.
 *
 * Справочник общий и пополняется самими мастерами: вписанный вручную жанр
 * сервис заводит при сохранении игры и с этого момента предлагает остальным.
 * Смысл подсказок не в полноте, а в одинаковом написании — иначе один и тот
 * же жанр расходится на «Хоррор», «хоррор» и «ужасы».
 *
 * @param term Что набрали в поле; пусто — предлагается начало справочника.
 */
export function useGenreDictionary(term: MaybeRefOrGetter<string>) {
  const query = computed(() => toValue(term).trim());
  const debounced = refDebounced(query, SEARCH_DEBOUNCE_MS);

  const { data: genres, status } = useAsyncData(
    () => `find-game-genres-${debounced.value}`,
    () => fetchGenres(debounced.value),
    { watch: [debounced], server: false, deep: false, default: () => [] },
  );

  const isLoading = computed(
    () => status.value !== 'success' && status.value !== 'error',
  );

  /**
   * Названия для выбора: сначала справочник сервиса, следом базовые жанры,
   * которых в нём ещё нет. На пустом справочнике поле остаётся с вариантами,
   * а на заполненном наверх попадает то, что мастера действительно ставят.
   */
  const genreNames = computed(() =>
    uniqBy([...genres.value, ...getBaseGenres(debounced.value)], getGenreKey),
  );

  return { genreNames, isLoading };
}
