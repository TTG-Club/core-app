import type { EditorBaseInfoState } from '~ui/editor';

export interface GlossaryCreate extends EditorBaseInfoState {
  description: string; // описание маркап
  tagCategory: string; // теги как категории
}
