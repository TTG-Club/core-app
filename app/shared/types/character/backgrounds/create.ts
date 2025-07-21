import type { EditorBaseInfoState } from '~ui/editor';
import type { AbilityKey } from '~/shared/types';

export interface BackgroundCreate extends EditorBaseInfoState {
  description: string; // описание маркап
  abilityScores: Array<AbilityKey>; // характеристики
  featUrl: string | undefined; // url черты
  skillsProficiencies: Array<string>; // навыки
  toolProficiency: string; // владение инструментами
  equipment: string; // снаряжение
}
