import { h } from 'vue';
import type { MaybeRefOrGetter } from 'vue';

const MESSAGES = {
  COPY_SUCCESS_TITLE: 'Скопировано',
  COPY_ERROR_TITLE: 'Ошибка при копировании',
  COPY_NOT_SUPPORTED: 'Ваш браузер не поддерживает копирование',
  SHARE_ERROR_TITLE: 'Невозможно поделиться',
  SHARE_NOT_SUPPORTED: 'Ваш браузер не поддерживает эту функцию',
  SHARE_DEFAULT_TITLE: 'Поделиться',
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

export function useCopyAndShare() {
  const $toast = useToast();

  const { copy: copyToClipboard, isSupported: isClipboardSupported } =
    useClipboard();

  const { share: openShare, isSupported: isShareSupported } = useShare();
  const { isMobile } = useDevice();

  async function copy(value: MaybeRefOrGetter<string>) {
    if (!isClipboardSupported.value) {
      $toast.add({
        title: MESSAGES.COPY_ERROR_TITLE,
        description: MESSAGES.COPY_NOT_SUPPORTED,
        color: 'error',
      });

      throw new Error(MESSAGES.COPY_NOT_SUPPORTED);
    }

    const _value = toValue(value);

    if (!_value) {
      throw new Error('String to copy must not be empty.');
    }

    try {
      await copyToClipboard(_value);

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

  async function share(url: MaybeRefOrGetter<string>) {
    if (!isShareAvailable()) {
      await copy(url);

      return;
    }

    if (!isShareSupported.value) {
      $toast.add({
        title: MESSAGES.SHARE_ERROR_TITLE,
        description: MESSAGES.SHARE_NOT_SUPPORTED,
        color: 'error',
      });

      throw new Error(MESSAGES.SHARE_NOT_SUPPORTED);
    }

    const _url = toValue(url);

    if (!_url) {
      throw new Error('URL for sharing must not be empty.');
    }

    await openShare({
      url: _url,
    });
  }

  function isShareAvailable() {
    return isMobile && isShareSupported.value;
  }

  return {
    copy,
    share,
  };
}
