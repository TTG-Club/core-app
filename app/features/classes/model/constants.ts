import type { ClassResourceRecovery } from './detail';

export const CLASS_RESOURCE_RECOVERY_OPTIONS: Array<{
  label: string;
  value: ClassResourceRecovery;
}> = [
  { label: 'Не является ресурсом', value: 'NONE' },
  { label: 'Короткий отдых', value: 'SHORT_REST' },
  { label: 'Продолжительный отдых', value: 'LONG_REST' },
];
