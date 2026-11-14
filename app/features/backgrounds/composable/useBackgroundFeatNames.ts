import type { ComputedRef } from 'vue';

import type { BackgroundDetailResponse } from '../model';

import { loadRefNames } from '~feats/composable';

/** Префикс ключа `useAsyncData`: к нему дописываются догружаемые адреса. */
const BACKGROUND_FEAT_NAMES_KEY_PREFIX = 'backgrounds:feat-names';

interface BackgroundFeatNamesState {
  /** Названия черт по адресу; пусто, пока они не загружены. */
  featNames: ComputedRef<Record<string, string>>;

  /**
   * Черты без снимка названия ещё грузятся: показывать список рано — адреса
   * сменились бы названиями на глазах. После ошибки ждать нечего, и
   * оставшиеся ссылки показываются адресом.
   */
  isPending: ComputedRef<boolean>;
}

/**
 * Адреса черт на выбор, сохранённых без снимка названия.
 *
 * @param background деталь предыстории.
 * @returns адреса черт, названия которых надо догрузить.
 */
function getUnnamedFeatUrls(
  background: BackgroundDetailResponse,
): Array<string> {
  return (background.featChoices ?? [])
    .filter((reference) => !reference.name?.trim() && !!reference.url)
    .map((reference) => reference.url);
}

/**
 * Названия черт на выбор у предыстории. Ссылки, выбранные в мастерской до
 * снимков названий, хранят только адрес, и без догрузки блок «Черта»
 * перечислял бы `gathered-whispers-rhw или …`. Названия берутся с карточек
 * самих черт — их на выбор немного, а список черт целиком тяжелее.
 *
 * @param background деталь предыстории.
 * @returns названия черт и признак их загрузки.
 */
export function useBackgroundFeatNames(
  background: MaybeRefOrGetter<BackgroundDetailResponse>,
): BackgroundFeatNamesState {
  const urls = computed<Array<string>>(() =>
    getUnnamedFeatUrls(toValue(background)),
  );

  // Ключ собирается из самих адресов: у соседних предысторий черты разные, а
  // общий ключ отдал бы им первый загруженный набор названий
  const { data: names, status } = useAsyncData(
    computed(
      () => `${BACKGROUND_FEAT_NAMES_KEY_PREFIX}:${urls.value.join(',')}`,
    ),
    () =>
      urls.value.length
        ? loadRefNames(urls.value.map((url) => ({ section: 'feats', url })))
        : Promise.resolve([]),
    { default: () => [] },
  );

  return {
    featNames: computed<Record<string, string>>(() =>
      Object.fromEntries(
        (names.value ?? []).map(({ url, name }) => [url, name]),
      ),
    ),
    isPending: computed(
      () =>
        urls.value.length > 0
        && (status.value === 'idle' || status.value === 'pending'),
    ),
  };
}
