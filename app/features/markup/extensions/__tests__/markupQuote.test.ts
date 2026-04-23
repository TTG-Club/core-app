/* eslint-disable ts/ban-ts-comment */
// @ts-nocheck
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { describe, expect, it } from 'vitest';

import { MarkupQuote } from '../markupQuote';

function createTestEditor(content: any) {
  return new Editor({
    content,
    extensions: [StarterKit, MarkupQuote],
  });
}

describe('markupQuote Extension', () => {
  it('parses JSON with markupQuote type and block content', () => {
    const editor = createTestEditor({
      type: 'doc',
      content: [
        {
          type: 'markupQuote',
          attrs: { color: 'success', variant: 'solid' },
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Успех' }],
            },
          ],
        },
      ],
    });

    const json = editor.getJSON();

    expect(json.content?.[0]?.type).toBe('markupQuote');
    expect(json.content?.[0]?.attrs?.color).toBe('success');
    expect(json.content?.[0]?.attrs?.variant).toBe('solid');
    expect(json.content?.[0]?.content?.[0].type).toBe('paragraph');
  });

  it('gets default values if not provided', () => {
    const editor = createTestEditor({
      type: 'doc',
      content: [
        {
          type: 'markupQuote',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Test' }],
            },
          ],
        },
      ],
    });

    const json = editor.getJSON();

    expect(json.content?.[0]?.attrs?.color).toBe('warning');
    expect(json.content?.[0]?.attrs?.variant).toBe('soft');
  });
});
