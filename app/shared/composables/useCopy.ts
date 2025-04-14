import { omit } from 'lodash-es';

import { useToast } from '~ui/toast';

export function useCopy() {
  const $toast = useToast();
  const clipboard = useClipboard();

  function copy(
    text: string,
    successText = 'Текст успешно скопирован',
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!clipboard.isSupported.value) {
        $toast.error({
          title: 'Ошибка при копировании',
          description: 'Ваш браузер не поддерживает копирование',
        });

        reject();

        return;
      }

      clipboard
        .copy(text)
        .then(() => {
          $toast.success({
            title: 'Копирование',
            description: successText,
          });

          resolve(text);
        })
        .catch(() => {
          $toast.error({
            title: 'Ошибка при копировании',
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
