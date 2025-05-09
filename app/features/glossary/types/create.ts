export interface GlossaryCreate {
  url: string; // урл черты
  name: GlossaryName; // название
  source: GlossarySource; // источник
  description: string; // описание маркап
  tags: Array<string>; // теги
  tagCategory: string; // теги как категории
}

export interface GlossaryName {
  rus: string; // русское название
  eng: string; // английское название
  alt: Array<string>; // альтернативные названия
}

export interface GlossarySource {
  url: string | undefined; // урл книги
  page: number | undefined; // номер страницы, если указана книга
}
