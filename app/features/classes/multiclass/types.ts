import type { ClassDetailResponse } from '~classes/types';
import type { Level } from '~/shared/types';

export interface MulticlassData {
  class1: {
    url: string;
    subclassUrl?: string;
    level: Level;
    detail: ClassDetailResponse;
  };
  class2: {
    url: string;
    subclassUrl?: string;
    level: Level;
    detail: ClassDetailResponse;
  };
}
