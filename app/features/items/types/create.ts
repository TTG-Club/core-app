import type { EditorBaseInfoState } from '~ui/editor';

export interface ItemCreate extends EditorBaseInfoState {
  category: string; // категория
  types: Array<string>; // типы
  description: string; // описание маркап
  cost: number | undefined; // стоимость
  coin: string | undefined; // номинал монеты в стоимости
  weight: string | undefined; // вес
  image: string | undefined;
}
