import type { ClassResourceRecovery } from './detail';

export const CLASS_RESOURCE_RECOVERY_OPTIONS: Array<{
  label: string;
  value: ClassResourceRecovery;
}> = [
  { label: 'Не является ресурсом', value: 'NONE' },
  { label: 'Короткий отдых', value: 'SHORT_REST' },
  { label: 'Продолжительный отдых', value: 'LONG_REST' },
];

/** Подписи настройки выбора боевого стиля в редакторе умения класса. */
export const CLASS_FEATURE_FIGHTING_STYLE_LABEL = 'Даёт выбор боевого стиля?';

export const CLASS_FEATURE_FIGHTING_STYLE_DESCRIPTION = 'Да';
