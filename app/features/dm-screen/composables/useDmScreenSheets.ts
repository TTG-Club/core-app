import type { ScreenSheetOption } from '../model';

import { USER_TOKEN_COOKIE } from '#shared/consts';
import {
  fetchCharacterSheetList,
  fetchSavedCharacterSheets,
} from '~character-sheet/model';

import { buildScreenSheetOption } from '../model';

/**
 * Листы персонажей, которые мастер может поставить на ширму: свои активные
 * и чужие, к которым ему дали доступ. Доступ к чужому листу — это ссылка
 * владельца, сохранённая у мастера: по ней лист открыт на просмотр, а с
 * разрешением владельца и на правку; оба случая лежат в одном списке
 * сохранённых.
 *
 * Оба списка запрашиваются параллельно и независимо: отказ одного не прячет
 * листы другого. Гостю запрашивать нечего — листы есть только у вошедшего.
 *
 * Побочные действия: запросы к серверу при каждом вызове `load`.
 */
export function useDmScreenSheets() {
  const token = useCookie<string | null>(USER_TOKEN_COOKIE);

  const isAuthorized = computed(() => Boolean(token.value));

  const options = shallowRef<Array<ScreenSheetOption>>([]);

  const isLoading = ref(false);

  /** Один из списков не загрузился: показанные листы — не все. */
  const hasError = ref(false);

  /** Загружает свои и доступные чужие листы. */
  async function load(): Promise<void> {
    if (!isAuthorized.value || isLoading.value) {
      return;
    }

    isLoading.value = true;

    const [ownResult, savedResult] = await Promise.allSettled([
      fetchCharacterSheetList(false),
      fetchSavedCharacterSheets(),
    ]);

    // Без документа карточку собрать не из чего: его нет у удалённых листов
    // и у чужих, к которым доступ закрыли
    const ownOptions =
      ownResult.status === 'fulfilled'
        ? ownResult.value.sheets.flatMap((sheet) =>
            sheet.data && !sheet.deleted
              ? [
                  buildScreenSheetOption(sheet.data, {
                    source: 'own',
                    key: sheet.id,
                  }),
                ]
              : [],
          )
        : [];

    const savedOptions =
      savedResult.status === 'fulfilled'
        ? savedResult.value.sheets.flatMap((saved) =>
            saved.data && saved.available
              ? [
                  buildScreenSheetOption(saved.data, {
                    source: 'shared',
                    key: saved.shareToken,
                  }),
                ]
              : [],
          )
        : [];

    options.value = [...ownOptions, ...savedOptions];

    hasError.value =
      ownResult.status === 'rejected' || savedResult.status === 'rejected';

    isLoading.value = false;
  }

  return {
    options: shallowReadonly(options),
    isLoading: readonly(isLoading),
    hasError: readonly(hasError),
    isAuthorized,
    load,
  };
}
