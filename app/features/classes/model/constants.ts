import type { ClassResourceRecovery } from './detail';

/**
 * Минимальное значение ключевой характеристики, необходимое для взятия уровня
 * в классе при мультиклассировании (правило D&D 2024).
 */
export const MULTICLASS_ABILITY_REQUIREMENT = 13;

/**
 * Пояснение к требованиям мультиклассирования в статблоке класса.
 */
export const MULTICLASS_REQUIREMENT_HINT = `Чтобы взять уровень в этом классе вдобавок к уже имеющемуся, нужно значение ${MULTICLASS_ABILITY_REQUIREMENT} в его ключевых характеристиках`;

export const CLASS_RESOURCE_RECOVERY_OPTIONS: Array<{
  label: string;
  value: ClassResourceRecovery;
}> = [
  { label: 'Не является ресурсом', value: 'NONE' },
  { label: 'Короткий отдых', value: 'SHORT_REST' },
  { label: 'Продолжительный отдых', value: 'LONG_REST' },
];
