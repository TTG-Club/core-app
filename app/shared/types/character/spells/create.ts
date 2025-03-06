export interface SpellCreate {
  url: string; // урл заклинания
  name: SpellName; // название
  source: SpellSource; // источник
  description: string; // описание маркап
  upper: string | undefined; // "На более высоких уровнях"
  level: number; // уровень заклинания, 0 - заговор
  school: string | undefined; // школа
  range: Array<SpellRange>; // дистанция
  duration: Array<SpellDuration>; // длительность
  castingTime: Array<SpellCastingTime>; // время накладывания
  components: SpellComponents; // компоненты
  affiliations: SpellAffiliation; // привязка заклинания к сущностям
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

export interface SpellRange {
  unit: string | undefined; // единицы измерения
  value: number | undefined; // значение дистанции
  custom: string | undefined; // кастомное значение (666 световых лет)
}

export interface SpellDuration {
  concentration: boolean;
  value: number | undefined; // значение длительности
  unit: string | undefined; // единицы измерения (минута/час)
  custom: string | undefined; // кастомное значение (666 веков)
}

export interface SpellCastingTime {
  value: number | undefined; // значение времени
  unit: string | undefined; // единицы измерения (час/минута/действие)
  custom: string | undefined; // кастомное значение (666 миллисекунд)
}

export interface SpellComponents {
  v: boolean; // вербальный компонент
  s: boolean; // соматический компонент
  m: SpellMaterialComponent | undefined; // материальные компоненты
}

export interface SpellMaterialComponent {
  text: string; // название
  withCost: boolean; // имеет стоимость
  consumable: boolean; // расходуемый да/нет
}

export interface SpellAffiliation {
  classes: Array<string>; // урлы классов
  subclasses: Array<string>; // урлы архетипов классов
  species: Array<string>; // урлы видов
  lineages: Array<string>; // урлы происхождений видов
}
