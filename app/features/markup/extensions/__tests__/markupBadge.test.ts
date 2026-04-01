/* eslint-disable ts/ban-ts-comment */
// @ts-nocheck
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { describe, expect, it } from 'vitest';

import { MarkupBadge } from '../markupBadge';

function createTestEditor(content: any) {
  return new Editor({
    content,
    extensions: [StarterKit, MarkupBadge],
  });
}

describe('markupBadge Extension', () => {
  it('parses JSON with markupBadge type and text content', () => {
    const editor = createTestEditor({
      type: 'doc',
      content: [
        {
          type: 'markupBadge',
          attrs: { color: 'success', variant: 'solid', size: 'lg' },
          content: [{ type: 'text', text: 'Успех' }],
        },
      ],
    });

    const json = editor.getJSON();

    expect(json.content?.[0]?.type).toBe('markupBadge');
    expect(json.content?.[0]?.attrs?.color).toBe('success');
    expect(json.content?.[0]?.attrs?.variant).toBe('solid');
    expect(json.content?.[0]?.attrs?.size).toBe('lg');
    expect(json.content?.[0]?.content?.[0].text).toBe('Успех');
  });

  it('gets default values if not provided', () => {
    const editor = createTestEditor({
      type: 'doc',
      content: [
        {
          type: 'markupBadge',
          content: [{ type: 'text', text: 'Test' }],
        },
      ],
    });

    const json = editor.getJSON();

    expect(json.content?.[0]?.attrs?.color).toBe('warning');
    expect(json.content?.[0]?.attrs?.variant).toBe('soft');
    expect(json.content?.[0]?.attrs?.size).toBe('sm');
  });
});
