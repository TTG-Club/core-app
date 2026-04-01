import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { describe, expect, it } from 'vitest';

import { MarkupTable } from '../markupTable';

function createTestEditor(content: any) {
  return new Editor({
    content,
    extensions: [StarterKit, MarkupTable],
  });
}

describe('markupTable Extension', () => {
  it('parses JSON with markupTable type and attrs', () => {
    const editor = createTestEditor({
      type: 'doc',
      content: [
        {
          type: 'markupTable',
          attrs: {
            caption: [{ type: 'text', text: 'Случайные встречи' }],
            colLabels: [[{ type: 'text', text: 'd10' }]],
            colStyles: ['w-20'],
            rows: [[[{ type: 'text', text: '1' }]]],
          },
        },
      ],
    });

    const json = editor.getJSON();
    const tableNode = json.content?.[0];

    expect(tableNode?.type).toBe('markupTable');
    expect(tableNode?.attrs?.caption[0].text).toBe('Случайные встречи');
    expect(tableNode?.attrs?.colLabels[0][0].text).toBe('d10');
    expect(tableNode?.attrs?.colStyles[0]).toBe('w-20');
    expect(tableNode?.attrs?.rows[0][0][0].text).toBe('1');
  });

  it('handles empty structure', () => {
    const editor = createTestEditor({
      type: 'doc',
      content: [
        {
          type: 'markupTable',
        },
      ],
    });

    const json = editor.getJSON();
    const tableNode = json.content?.[0];

    expect(tableNode?.attrs?.caption).toEqual([]);
    expect(tableNode?.attrs?.colLabels).toEqual([]);
    expect(tableNode?.attrs?.colStyles).toEqual([]);
    expect(tableNode?.attrs?.rows).toEqual([]);
  });
});
