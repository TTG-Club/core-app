import type { NameResponse, SourceResponse } from '~/shared/types';
import type { RenderNode } from '~ui/markup';

export interface SourceDetailResponse {
  url: string;
  name: NameResponse;
  source: SourceResponse;
  officiality?: string; // степень официальности
  category?: string; // категория: основные правила, сеттинг, приключения
  publisher?: {
    name: string;
    date: string;
  };
  translation?: {
    authors: string;
    date: string;
  };
  description?: RenderNode;
  image?: string;
  updatedAt: string;
  tags?: string;
  tagCategory?: string;
}
