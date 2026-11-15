import type { EditorBaseInfoState } from '~ui/editor';

export interface SourceCreate extends EditorBaseInfoState {
  acronym: string; // начальные буквы из английского названия
  officiality: string; // степень официальности: OFFICIAL, TEST, THIRD_PARTY, HOMEBREW
  category: string; // категория: CORE, SETTING, ADVENTURE
  publisher: {
    name: string | undefined; // название издательства
    date: string | undefined; // дата публикации
  }; // издатель
  translation: {
    authors: string | undefined; // переводчики
    date: string | undefined; // дата перевода
  };
  description: string; // описание маркап
  image: string; // обложка
}
