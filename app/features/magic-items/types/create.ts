import type { EditorBaseInfoState } from '~ui/editor';

export interface MagicItemCreate extends EditorBaseInfoState {
  description: string; // описание маркап
  attunement: MagicItemAttunement;
  charges: number; // заряды
  curse: boolean; // проклятие
  consumable: boolean; // расходуемый
  image: string | undefined;
  rarity: MagicItemRarity;
  category: MagicItemCategory;
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
