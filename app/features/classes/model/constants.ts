import type { ClassResourceRecovery } from './detail';

export const CLASS_RESOURCE_RECOVERY_OPTIONS: Array<{
  label: string;
  value: ClassResourceRecovery;
}> = [
  { label: 'Не является ресурсом', value: 'NONE' },
  { label: 'Короткий отдых', value: 'SHORT_REST' },
  { label: 'Продолжительный отдых', value: 'LONG_REST' },
];

/**
 * Метки вариантов стартового снаряжения. Выводятся из порядка вариантов —
 * так же, как их выводит API при отдаче класса, поэтому в форме не хранятся.
 */
export const CLASS_EQUIPMENT_OPTION_LABELS = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ';

/** Сколько вариантов снаряжения показывать у класса, где снаряжение ещё не заполнено. */
export const DEFAULT_CLASS_EQUIPMENT_OPTIONS_COUNT = 2;

/** Подписи настройки выбора боевого стиля в редакторе умения класса. */
export const CLASS_FEATURE_FIGHTING_STYLE_LABEL = 'Даёт выбор боевого стиля?';

export const CLASS_FEATURE_FIGHTING_STYLE_DESCRIPTION = 'Да';
