import type { EditorBaseInfoState } from '~ui/editor';

export interface SourceCreate extends EditorBaseInfoState {
  acronym: string; // начальные буквы из английского названия
  type: string; // тип источника
  publisher: {
    name: string | undefined; // название издательства
    date: string | undefined; // дата публикации
  }; // издатель
  translation: {
    authors: Array<string> | undefined; // переводчики
    date: string | undefined; // дата перевода
  };
  description: string; // описание маркап
  image: string; // обложка
}
