import type { JSONContent } from '@tiptap/core';

import type { RatingValue } from '~ui/rating';

export interface RoadmapItem {
  url: string;
  name: string;
  preview: string;
  description: JSONContent;
  rating: RatingValue;
}

export interface RoadmapRequest {
  name: string;
  preview: string;
  description: JSONContent | undefined;
  visible: boolean;
}
