import type { EditorBaseInfoState } from '~ui/editor';

export interface SourceCreate extends EditorBaseInfoState {
  acronym: string; // начальные буквы из английского названия
  type: string; // тип источника
  publisher: {
    name: string; // название издательства
    published: string; // дата публикации
  }; // издатель
  translation: {
    authors: string; // переводчики
    translationDate: string; // дата перевода
  };
  description: string; // описание маркап
  image: string; // обложка
}
