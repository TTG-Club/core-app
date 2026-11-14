import type { ScreenAddOutcome, ScreenWindowRequest } from '../model';

import { USER_TOKEN_COOKIE } from '#shared/consts';

import {
  appendScreenWindow,
  DM_SCREEN_ICON,
  DM_SCREEN_ICONS,
  DM_SCREEN_ROUTE,
  DM_SCREEN_TEXT,
  DM_SCREEN_WINDOW_LIMIT,
  fetchScreen,
  getScreenEntryTitle,
  getScreenErrorMessage,
  normalizeScreenEntryPath,
  resolveScreenEntry,
  saveScreen,
} from '../model';
import { useDmScreen } from './useDmScreen';

/**
 * Название записи с сервера: карточка, с которой запись кладут на ширму,
 * знает его не всегда. Без ответа названием остаётся адрес записи.
 * @param path - адрес записи на сайте
 */
async function fetchEntryTitle(path: string): Promise<string> {
  const entry = resolveScreenEntry(path);

  if (!entry) {
    return path;
  }

  try {
    const detail: unknown = await $fetch(
      `${entry.section.apiPath}/${entry.url}`,
      { retry: 0 },
    );

    return getScreenEntryTitle(detail) ?? entry.url;
  } catch {
    return entry.url;
  }
}

/**
 * «В ширму» с любой страницы сайта: запись встаёт окном на ширме, а
 * уведомление предлагает перейти к ней. У гостя ширма в браузере, у
 * вошедшего — в аккаунте: открытая сейчас ширма меняется на месте, иначе
 * запись дописывается к ширме на сервере.
 *
 * Побочные действия: запросы к серверу (название записи, ширма аккаунта) и
 * уведомление об исходе.
 */
export function useDmScreenAdd() {
  const { add, board, isAccount } = useDmScreen();
  const toast = useToast();
  const token = useCookie<string | null>(USER_TOKEN_COOKIE);

  const isPending = ref(false);

  /**
   * Сообщает, что запись на ширме, со ссылкой на ширму.
   * @param title - название записи
   * @param outcome - чем кончилась просьба
   */
  function notify(title: string, outcome: ScreenAddOutcome): void {
    if (outcome === 'rejected') {
      toast.add({
        title: DM_SCREEN_TEXT.limitReached,
        color: 'warning',
        icon: DM_SCREEN_ICONS.error,
      });

      return;
    }

    toast.add({
      title:
        outcome === 'added'
          ? DM_SCREEN_TEXT.added
          : DM_SCREEN_TEXT.alreadyAdded,
      description: title,
      icon: DM_SCREEN_ICON,
      actions: [
        {
          label: DM_SCREEN_TEXT.openScreen,
          to: DM_SCREEN_ROUTE,
          color: 'neutral',
          variant: 'outline',
        },
      ],
    });
  }

  /**
   * Дописывает запись к ширме аккаунта, которая сейчас не открыта.
   * @param request - запись и её название
   * @returns чем кончилась просьба
   */
  async function addToAccount(
    request: ScreenWindowRequest,
  ): Promise<ScreenAddOutcome> {
    const screen = await fetchScreen();

    const appended = appendScreenWindow(
      screen.windows,
      request,
      board.value,
      crypto.randomUUID(),
    );

    if (appended.isAdded && appended.windows.length > DM_SCREEN_WINDOW_LIMIT) {
      return 'rejected';
    }

    await saveScreen(appended.windows);

    return appended.isAdded ? 'added' : 'existing';
  }

  /**
   * Кладёт запись на ширму и сообщает об этом. Адреса, которые ширма
   * показать не умеет, пропускаются.
   * @param url - адрес записи, абсолютный или относительный путь
   * @param knownTitle - название записи, если карточка его знает
   */
  async function addToScreen(url: string, knownTitle?: string): Promise<void> {
    const path = normalizeScreenEntryPath(url);

    if (!path || isPending.value) {
      return;
    }

    isPending.value = true;

    try {
      const title = knownTitle || (await fetchEntryTitle(path));
      const request = { path, title };

      // Открытая ширма аккаунта меняется на месте и сама сообщает о пределе
      // окон; закрытая дописывается на сервере
      if (token.value && !isAccount.value) {
        notify(title, await addToAccount(request));

        return;
      }

      const outcome = add(request);

      if (outcome !== 'rejected') {
        notify(title, outcome);
      }
    } catch (error) {
      toast.add({
        title: DM_SCREEN_TEXT.addFailed,
        description: getScreenErrorMessage(error),
        color: 'error',
        icon: DM_SCREEN_ICONS.error,
      });
    } finally {
      isPending.value = false;
    }
  }

  return { addToScreen, isPending: readonly(isPending) };
}
