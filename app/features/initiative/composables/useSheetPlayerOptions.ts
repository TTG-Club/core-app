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
 *
 * Варианты лежат в общем `useState`-кэше: блок добавления скрыт `v-if`, и без
 * кэша каждое его раскрытие било бы по обоим спискам заново. Неудачная загрузка
 * не запоминается — следующее открытие попробует снова, а кнопка «Обновить»
 * перечитывает списки в любом случае. Кэш сбрасывается вместе с авторизацией:
 * листы принадлежат пользователю, и следующему они не показываются.
 */
export function useSheetPlayerOptions() {
  const token = useCookie<string | null>(USER_TOKEN_COOKIE);
  const isAuthorized = computed(() => Boolean(token.value));

  const options = useState<Array<SheetPlayerOption>>(
    'initiative-sheet-player-options',
    () => [],
  );

  const isLoading = useState(
    'initiative-sheet-player-options-loading',
    () => false,
  );

  const hasError = useState(
    'initiative-sheet-player-options-error',
    () => false,
  );

  const isLoaded = useState(
    'initiative-sheet-player-options-loaded',
    () => false,
  );

  /** Загружает свои и сохранённые листы и собирает из них варианты выбора. */
  async function load(): Promise<void> {
    if (!isAuthorized.value || isLoading.value) {
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

    // Неполный список загруженным не считаем — иначе отвалившийся запрос
    // «залипал» бы в кэше до перезагрузки страницы.
    isLoaded.value = !hasError.value;
    isLoading.value = false;
  }

  /** Загружает списки, только если их ещё нет в кэше. */
  function loadOnce(): void {
    if (isLoaded.value) {
      return;
    }

    void load();
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
        if (!authorized) {
          options.value = [];
          isLoaded.value = false;
          hasError.value = false;

          return;
        }

        loadOnce();
      },
      { immediate: true },
    );
  }

  return { options, isLoading, hasError, isAuthorized, load };
}
