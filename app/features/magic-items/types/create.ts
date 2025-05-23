export interface MagicItemCreate {
  url: string; // url магического предмета
  name: MagicItemName; // название
  source: MagicItemSource; // источник
  description: string; // описание маркап
  attunement: MagicItemAttunement;
  charges: number; // заряды
  curse: boolean; // проклятие
  consumable: boolean; // расходуемый
  image: string | undefined;
  tags: Array<string>; // теги
  rarity: MagicItemRarity;
  category: MagicItemCategory;
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

export interface MagicItemAttunement {
  requires: boolean; // требуется ли настройка
  description: string | null; // особенности настройки
}

export interface MagicItemCategory {
  type: string | undefined; // категория
  clarification: string | undefined; // описание категории
}

export interface MagicItemRarity {
  type: string | undefined; // редкость
  varies: string | undefined; // текст для магических предметов с варьируемой редкостью
}
