import type { EditorBaseInfoState } from '~ui/editor';

export type ItemCategory = 'WEAPON' | 'ARMOR' | 'ITEM';

export type DexterityMod = 'PLUS' | 'PLUS_MAX_2' | 'NONE';

export interface Roll {
  diceCount: number | undefined; // количество костей
  dice: string | undefined; // тип кости
  bonus: number | undefined; // бонус
}

export interface Damage {
  roll: Roll;
  type: string | undefined; // тип урона
}

export interface Range {
  normal: number | undefined; // нормальная дистанция
  max: number | undefined; // максимальная дистанция
}

export interface WeaponCreate {
  category: string | undefined; // категория оружия
  damage: Damage; // урон
  properties: Array<string>; // свойства
  mastery: string | undefined; // приём
  range: Range; // дистанция
  versatile: Roll; // универсальный урон
  ammo: string | undefined; // тип боеприпаса
  additional: string | undefined; // дополнительно
}

export interface ArmorCreate {
  category: string | undefined; // категория доспеха
  armorClass: number | undefined; // КД
  mod: DexterityMod | undefined; // модификатор Ловкости
  strength: string | undefined; // требование Силы
  stealth: boolean | undefined; // помеха Скрытности
}

export interface ItemCreate extends EditorBaseInfoState {
  category: ItemCategory; // категория
  types: Array<string>; // типы
  description: string; // описание маркап
  cost: number | undefined; // стоимость
  coin: string | undefined; // номинал монеты в стоимости
  weight: string | undefined; // вес
  image: string | undefined;
  weapon: WeaponCreate; // данные оружия
  armor: ArmorCreate; // данные доспеха
}
