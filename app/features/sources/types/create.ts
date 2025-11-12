import type { EditorBaseInfoState } from '~ui/editor';

export interface SourceCreate extends EditorBaseInfoState {
  acronym: string; // начальные буквы из английского названия
  type: string; // тип источника
  authors: string; // авторы
  published: string; // дата публикации
  description: string; // описание маркап
  image: string; // обложка
}
