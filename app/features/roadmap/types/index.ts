import type { RenderNode } from '~ui/markup';
import type { RatingValue } from '~ui/rating';

export interface RoadmapItem {
  url: string;
  name: string;
  preview: string;
  description: RenderNode;
  rating: RatingValue;
}

export interface RoadmapRequest {
  name: string;
  preview: string;
  description: string | undefined;
  visible: boolean;
}
