import { h } from 'vue';
import type { MaybeRefOrGetter } from 'vue';

const MESSAGES = {
  COPY_SUCCESS_TITLE: 'Скопировано',
  COPY_ERROR_TITLE: 'Ошибка при копировании',
  COPY_NOT_SUPPORTED: 'Ваш браузер не поддерживает копирование',
  SHARE_ERROR_TITLE: 'Невозможно поделиться',
  SHARE_NOT_SUPPORTED: 'Ваш браузер не поддерживает эту функцию',
  SHARE_DEFAULT_TITLE: 'Поделиться',
  COPY_NO_TEXT: 'Нечего копировать',
  SHARE_NO_TEXT: 'Нечем поделиться',
} as const;

const DISCORD_URL = 'https://discord.gg/JqFKMKRtxv';

function createDiscordErrorDescription() {
  return () =>
    h('span', [
      'Произошла какая-то ошибка... попробуйте еще раз или обратитесь за помощью на нашем ',
      h(
        'a',
        {
          target: '_blank',
          href: DISCORD_URL,
          rel: 'noopener',
        },
        'Discord-канале',
      ),
    ]);
}

export function useCopy() {
  const $toast = useToast();

  const { copy: copyToClipboard, isSupported: isClipboardSupported } =
    useClipboard();

  const { share: openShare, isSupported: isShareSupported } = useShare();
  const { isMobile } = useDevice();

  async function copy(text: MaybeRefOrGetter<string>) {
    if (!isClipboardSupported.value) {
      $toast.add({
        title: MESSAGES.COPY_ERROR_TITLE,
        description: MESSAGES.COPY_NOT_SUPPORTED,
        color: 'error',
      });

      throw new Error(MESSAGES.COPY_NOT_SUPPORTED);
    }

    const _text = toValue(text);

    if (!_text) {
      throw new Error(MESSAGES.COPY_NO_TEXT);
    }

    try {
      await copyToClipboard(_text);

      $toast.add({
        title: MESSAGES.COPY_SUCCESS_TITLE,
        color: 'neutral',
      });
    } catch (error) {
      $toast.add({
        title: MESSAGES.COPY_ERROR_TITLE,
        color: 'error',
        description: createDiscordErrorDescription(),
      });

      throw error;
    }
  }

  async function share(text: MaybeRefOrGetter<string>) {
    if (!isShareSupported.value) {
      $toast.add({
        title: MESSAGES.SHARE_ERROR_TITLE,
        description: MESSAGES.SHARE_NOT_SUPPORTED,
        color: 'error',
      });

      throw new Error(MESSAGES.SHARE_NOT_SUPPORTED);
    }

    const _text = toValue(text);

    if (!_text) {
      throw new Error(MESSAGES.SHARE_NO_TEXT);
    }

    try {
      await openShare({
        // title: MESSAGES.SHARE_DEFAULT_TITLE,
        text: _text,
      });
    } catch (error) {
      $toast.add({
        title: MESSAGES.SHARE_ERROR_TITLE,
        color: 'error',
        description: createDiscordErrorDescription(),
      });

      throw error;
    }
  }

  function shareOrCopy(text: MaybeRefOrGetter<string>) {
    if (isShareAvailable()) {
      return share(text);
    }

    return copy(text);
  }

  function isShareAvailable() {
    return isMobile && isShareSupported.value;
  }

  return {
    isShareAvailable,
    isClipboardSupported,

    copy,
    share,
    shareOrCopy,
  };
}
