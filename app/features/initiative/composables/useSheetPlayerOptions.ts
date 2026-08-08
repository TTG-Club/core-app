import type { SheetPlayerOption } from '~initiative/model';

import { USER_TOKEN_COOKIE } from '#shared/consts';
import {
  fetchCharacterSheetList,
  fetchSavedCharacterSheets,
} from '~character-sheet/model';
import { buildSheetPlayerOption } from '~initiative/model';

/**
 * Листы персонажей, которых мастер может поставить в бой: свои активные и
 * сохранённые чужие по ссылке. Берём именно списки (а не композаблы раздела
 * листов) — трекеру нужны только готовые варианты выбора, без лимитов,
 * автосохранения и прочей обвязки редактора.
 *
 * Оба запроса идут параллельно и независимо: отказ одного не прячет варианты
 * другого, а вместе с уцелевшими показывается пометка об ошибке. Гостю
 * запрашивать нечего — листы есть только у авторизованного пользователя.
 */
export function useSheetPlayerOptions() {
  const token = useCookie<string | null>(USER_TOKEN_COOKIE);
  const isAuthorized = computed(() => Boolean(token.value));

  const options = ref<Array<SheetPlayerOption>>([]);
  const isLoading = ref(false);
  const hasError = ref(false);

  /** Загружает свои и сохранённые листы и собирает из них варианты выбора. */
  async function load(): Promise<void> {
    if (!isAuthorized.value) {
      return;
    }

    isLoading.value = true;
    hasError.value = false;

    const [ownResult, savedResult] = await Promise.allSettled([
      fetchCharacterSheetList(false),
      fetchSavedCharacterSheets(),
    ]);

    // У удалённых листов сервер не отдаёт документ, у закрытых по ссылке —
    // тоже: без него собрать вариант не из чего.
    const ownOptions =
      ownResult.status === 'fulfilled'
        ? ownResult.value.sheets.flatMap((sheet) =>
            sheet.data && !sheet.deleted
              ? [
                  buildSheetPlayerOption(sheet.data, {
                    sheetId: sheet.id,
                    source: 'own',
                    shareToken: null,
                    savedId: null,
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
                  buildSheetPlayerOption(saved.data, {
                    sheetId: saved.sheetId,
                    source: 'saved',
                    shareToken: saved.shareToken,
                    savedId: saved.id,
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

  // Токен приезжает не к монтированию: сессия восстанавливается уже после него,
  // и загрузка по `onMounted` пришлась бы на момент, когда пользователь ещё
  // «гость» — список так и остался бы пустым. Поэтому ждём саму авторизацию;
  // `immediate` покрывает случай, когда сессия готова заранее. Только на
  // клиенте: на сервере запрашивать нечего, форму видно после гидратации.
  if (import.meta.client) {
    watch(
      isAuthorized,
      (authorized) => {
        if (authorized) {
          void load();
        }
      },
      { immediate: true },
    );
  }

  return { options, isLoading, hasError, isAuthorized, load };
}
