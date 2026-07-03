import { Extension } from '@tiptap/core';

/**
 * Клавиатурные привязки редактора разметки.
 *
 * Shift+Enter — мягкий перенос строки внутри абзаца. Вставляем его как РОДНОЙ
 * маркер {@br} (инлайн-чип, рендерится в <br>), а НЕ как Markdown-hardBreak,
 * который сериализуется в «  \n» (одиночный перенос строки) — на нём падает
 * бэкенд-десериализатор описания (он разбивает только по пустой строке \n\n).
 * {@br} же безопасно проходит round-trip через систему {@...}.
 */
export const TtgKeymap = Extension.create({
  name: 'ttgKeymap',

  addKeyboardShortcuts() {
    return {
      'Shift-Enter': () =>
        this.editor.commands.insertContent({
          type: 'ttgMarker',
          attrs: { raw: '{@br}' },
        }),
    };
  },
});
