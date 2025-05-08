export interface MagicItemCreate {
  url: string; // url магического предмета
  name: MagicItemName; // название
  source: MagicItemSource; // источник
  description: string; // описание маркап
  category: string; // категория
  typeClarification: string; // уточнение категории (например все мечи)
  rarity: string; // редкость
  varies: string | undefined; // текст для магических предметов с варьируемой редкостью
  attunement: Attunement;
  charges: number; // заряды
  curse: boolean; // проклятие
  image: string | undefined;
  tags: Array<string>; // теги
}

export interface MagicItemName {
  rus: string; // русское название
  eng: string; // английское название
  alt: Array<string>; // альтернативные названия
}

export interface MagicItemSource {
  url: string | undefined; // урл книги
  page: number | undefined; // номер страницы, если указана книга
}

export interface Attunement {
  requires: boolean; // требуется ли настройка
  description: string | null; // особенности настройки
}
