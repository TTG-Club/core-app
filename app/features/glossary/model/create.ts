import type { JSONContent } from '@tiptap/core';

import type { EditorBaseInfoState } from '~ui/editor';

export interface GlossaryCreate extends EditorBaseInfoState {
  description: JSONContent; // описание маркап
  tagCategory: string; // теги как категории
}
