import { omit } from 'lodash-es';

export function useCopy() {
  const { notification } = App.useApp();
  const clipboard = useClipboard();

  function copy(
    text: string,
    successText = 'Текст успешно скопирован',
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!clipboard.isSupported.value) {
        notification.error({
          message: 'Ошибка при копировании',
          description: 'Ваш браузер не поддерживает копирование',
        });

        reject();

        return;
      }

      clipboard
        .copy(text)
        .then(() => {
          notification.success({
            message: 'Копирование',
            description: successText,
          });

          resolve(text);
        })
        .catch(() => {
          notification.error({
            message: 'Ошибка при копировании',
            description: () =>
              h('span', [
                'Произошла какая-то ошибка... попробуйте еще раз или обратитесь за помощью на нашем ',
                h(
                  'a',
                  {
                    target: '_blank',
                    href: 'https://discord.gg/JqFKMKRtxv',
                    rel: 'noopener',
                  },
                  'Discord-канале',
                ),
              ]),
          });

          reject();
        });
    });
  }

  return {
    copy,
    ...omit(clipboard, 'copy'),
  };
}
