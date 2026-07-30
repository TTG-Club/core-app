import type { AbilityKey } from '~/shared/types';
import type { EditorBaseInfoState, EquipmentOptionCreate } from '~ui/editor';

export interface BackgroundCreate extends EditorBaseInfoState {
  description: string; // описание маркап
  abilityScores: Array<AbilityKey>; // характеристики
  featUrl: string | undefined; // url черты
  featSuffix: string | undefined; // суффикс черты
  skillsProficiencies: Array<string>; // навыки
  toolProficiency: string; // владение инструментами
  equipment: string; // снаряжение
  startingEquipment: Array<EquipmentOptionCreate>; // снаряжение вариантами выбора
}
