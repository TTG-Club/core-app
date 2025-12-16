import type { ClassDetailResponse } from '~classes/types';
import type { Level } from '~/shared/types';

export interface MulticlassClassData {
  url: string;
  subclassUrl?: string;
  level: Level;
  detail: ClassDetailResponse;
}

export interface MulticlassData {
  classes: MulticlassClassData[];
}
