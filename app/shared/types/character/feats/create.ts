export interface FeatCreate {
  url: string; // урл черты
  name: FeatName; // название
  source: FeatSource; // источник
  description: string; // описание маркап
  category: string; // категория (общая, боевые стили, эпическая)
  prerequisite: string; // требования для получения черты
  repeatability: boolean; // повторяемость
  tags: Array<string>; // теги
}

export interface FeatName {
  rus: string; // русское название
  eng: string; // английское название
  alt: Array<string>; // альтернативные названия
}

export interface FeatSource {
  url: string | undefined; // урл книги
  page: number | undefined; // номер страницы, если указана книга
}
