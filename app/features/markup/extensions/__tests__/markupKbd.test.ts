/* eslint-disable ts/ban-ts-comment */
// @ts-nocheck
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { describe, expect, it } from 'vitest';

import { MarkupKbd } from '../markupKbd';

function createTestEditor(content: any) {
  return new Editor({
    content,
    extensions: [StarterKit, MarkupKbd],
  });
}

describe('markupKbd Extension', () => {
  it('parses JSON with markupKbd type and text content', () => {
    const editor = createTestEditor({
      type: 'doc',
      content: [
        {
          type: 'markupKbd',
          attrs: { color: 'success', variant: 'solid', size: 'lg' },
          content: [{ type: 'text', text: 'Ctrl' }],
        },
      ],
    });

    const json = editor.getJSON();

    expect(json.content?.[0]?.type).toBe('markupKbd');
    expect(json.content?.[0]?.attrs?.color).toBe('success');
    expect(json.content?.[0]?.attrs?.variant).toBe('solid');
    expect(json.content?.[0]?.attrs?.size).toBe('lg');
    expect(json.content?.[0]?.content?.[0].text).toBe('Ctrl');
  });

  it('gets default values if not provided', () => {
    const editor = createTestEditor({
      type: 'doc',
      content: [
        {
          type: 'markupKbd',
          content: [{ type: 'text', text: 'Test' }],
        },
      ],
    });

    const json = editor.getJSON();

    expect(json.content?.[0]?.attrs?.color).toBe('neutral');
    expect(json.content?.[0]?.attrs?.variant).toBe('soft');
    expect(json.content?.[0]?.attrs?.size).toBe('md');
  });
});
