import type { EditorBaseInfoState } from '~ui/editor';

export interface BackgroundCreate extends EditorBaseInfoState {
  description: string; // описание маркап
  abilityScores: Array<string>; // характеристики
  featUrl: string | undefined; // url черты
  skillsProficiencies: Array<string>; // навыки
  toolProficiency: string; // владение инструментами
  equipment: string; // снаряжение
}
