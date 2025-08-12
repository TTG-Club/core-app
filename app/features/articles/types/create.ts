import type { EditorBaseInfoState } from '~ui/editor';

export interface ArticlesCreate extends EditorBaseInfoState {
  description: string;
  categories: string;
  tagsArticles: string[];
}
