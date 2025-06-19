import { omit } from 'lodash-es';

export function useCopy() {
  const $toast = useToast();
  const clipboard = useClipboard();

  function copy(
    text: string,
    successText = 'Текст успешно скопирован',
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!clipboard.isSupported.value) {
        $toast.add({
          title: 'Ошибка при копировании',
          description: 'Ваш браузер не поддерживает копирование',
          color: 'error',
        });

        reject();

        return;
      }

      clipboard
        .copy(text)
        .then(() => {
          $toast.add({
            title: 'Копирование',
            description: successText,
            color: 'neutral',
          });

          resolve(text);
        })
        .catch(() => {
          $toast.add({
            title: 'Ошибка при копировании',
            color: 'error',
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
