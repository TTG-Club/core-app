/** Границы уровня персонажа: общие для всех полей редактора вида. */
export const SPECIES_CHARACTER_LEVEL = {
  minimum: 1,
  maximum: 20,
  default: 1,
};

export const SPECIES_INNATE_SPELL_EDITOR = {
  title: 'Врождённые заклинания',
  description:
    'Эти заговоры и заклинания всегда доступны персонажу. Уровень определяет, когда заклинание появится в листе.',
  spellLabel: 'Заклинание',
  characterLevelLabel: 'Уровень персонажа',
  addLabel: 'Добавить заклинание',
};

/** Блок механики: то, что лист персонажа применяет сам. */
export const SPECIES_MECHANICS_EDITOR = {
  title: 'Влияние на лист персонажа',
  resistanceLabel: 'Сопротивление урону',
  immunityLabel: 'Иммунитет к урону',
  vulnerabilityLabel: 'Уязвимость к урону',
  skillsLabel: 'Владение навыками',
  skillsHelp: 'Навыки, которые выдаются без выбора',
  skillChoiceCountLabel: 'Навыков на выбор',
  skillChoiceCountHelp: '0 — выбора нет',
  skillChoiceOptionsLabel: 'Из каких навыков выбирать',
  skillChoiceOptionsHelp: 'Пусто — выбор из всех навыков',
  /**
   * Больше двух навыков подряд не выбирает ни один вид справочника
   * («Инстинкты Изменяющегося» — два), запас взят с двукратным зазором.
   */
  skillChoiceMaximum: 4,
  /** Стабильный ключ выбора и подпись к нему: их читает лист персонажа. */
  skillChoiceKey: 'skill',
  skillChoiceLabel: 'Выберите навык',
};

/** Поля умения вида. */
export const SPECIES_FEATURE_EDITOR = {
  title: 'Умения',
  levelLabel: 'Уровень',
  levelHelp: 'С какого уровня работает; пусто — с первого',
  levelPlaceholder: 'Уровень',
  addFirstLabel: 'Добавить первое умение',
};

/** Свойства вида, которые лист читает числом. */
export const SPECIES_PROPERTIES_EDITOR = {
  darkVisionLabel: 'Тёмное зрение',
  darkVisionHelp: 'Дальность в футах; оставь пустым, если вид его не даёт',
  darkVisionPlaceholder: 'Введи дальность тёмного зрения',
  distanceMinimum: 0,
};
