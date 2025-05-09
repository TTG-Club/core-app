export interface BackgroundCreate {
  url: string; // url предыстории
  name: BackgroundName; // название
  source: BackgroundSource; // источник
  description: string; // описание маркап
  abilityScores: Array<string>; // характеристики
  featUrl: string | undefined; // url черты
  skillsProficiencies: Array<string>; // навыки
  toolProficiency: string; // владение инструментами
  equipment: string; // снаряжение
  tags: Array<string>; // теги
}

export interface BackgroundName {
  rus: string; // русское название
  eng: string; // английское название
  alt: Array<string>; // альтернативные названия
}

export interface BackgroundSource {
  url: string | undefined; // урл книги
  page: number | undefined; // номер страницы, если указана книга
}
