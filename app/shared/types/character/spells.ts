import type { Comparison } from '~/shared/enums/comparison';

export interface SpellCreate {
  url: string; // урл заклинания
  name: SpellName; // название
  source: SpellSource; // источник
  description: string; // описание маркап
  upper: string | undefined; // "На более высоких уровнях"
  level: number; // уровень заклинания, 0 - заговор
  school: string | undefined; // школа
  distance: SpellDistance; // дистанция
  duration: SpellDuration; // длительность
  time: Array<SpellCastingTime>; // время накладывания
  ritual: boolean; // ритуал да/нет
  concentration: boolean; // концентрация да/нет
  components: SpellComponents; // компоненты
  affiliation: SpellAffiliation; // привязка заклинания к сущностям
  tags: Array<string>; // теги
}

export interface SpellName {
  rus: string; // русское название
  eng: string; // английское название
  alt: Array<string>; // альтернативные названия
}

export interface SpellSource {
  url: string | undefined; // урл книги
  page: number | undefined; // номер страницы, если указана книга
}

export interface SpellDistance {
  type: string | undefined; // тип дистанции
  value: number | undefined; // значение дистанции
  custom: string | undefined; // кастомное значение (666 световых лет)
}

export interface SpellDuration {
  value: number | undefined; // значение длительности
  type: string | undefined; // тип длительности (минута/час)
  custom: string | undefined; // кастомное значение (666 веков)
}

export interface SpellCastingTime {
  value: number | undefined; // значение времени
  type: string | undefined; // тип времени (час/минута/действие)
  custom: string | undefined; // кастомное значение (666 миллисекунд)
}

export interface SpellComponents {
  v: boolean; // вербальный компонент
  s: boolean; // соматический компонент
  m: Array<SpellMaterialComponent>; // материальные компоненты
}

export interface SpellMaterialComponent {
  name: string; // название
  price: number | undefined; // цена
  comparison: Comparison | undefined; // сравнение
  consumable: boolean; // расходуемый да/нет
}

export interface SpellAffiliation {
  classes: Array<string>; // урлы классов
  archetypes: Array<string>; // урлы архетипов классов
  species: Array<string>; // урлы видов
  origins: Array<string>; // урлы происхождений видов
}
