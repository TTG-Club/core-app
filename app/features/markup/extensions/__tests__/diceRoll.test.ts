import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { describe, expect, it } from 'vitest';

import { DiceRoll } from '../diceRoll';

function createTestEditor(content: any) {
  return new Editor({
    content,
    extensions: [StarterKit, DiceRoll],
  });
}

describe('diceRoll Extension', () => {
  it('parses JSON with custom diceRoll type', () => {
    const editor = createTestEditor({
      type: 'doc',
      content: [
        {
          type: 'diceRoll',
          attrs: { notation: '2d6' },
        },
      ],
    });

    const json = editor.getJSON();

    expect(json.content?.[0]?.type).toBe('diceRoll');
    expect(json.content?.[0]?.attrs?.notation).toBe('2d6');
  });

  it('gets default empty string for notation if not provided', () => {
    const editor = createTestEditor({
      type: 'doc',
      content: [
        {
          type: 'diceRoll',
        },
      ],
    });

    const json = editor.getJSON();

    expect(json.content?.[0]?.attrs?.notation).toBe('');
  });
});
