/* eslint-disable ts/ban-ts-comment */
// @ts-nocheck
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { describe, expect, it } from 'vitest';

import { SectionLink } from '../sectionLink';

function createTestEditor(content: any) {
  return new Editor({
    content,
    extensions: [StarterKit, SectionLink],
  });
}

describe('sectionLink Extension', () => {
  it('parses JSON with custom sectionLink type and text content', () => {
    const editor = createTestEditor({
      type: 'doc',
      content: [
        {
          type: 'sectionLink',
          attrs: { sectionType: 'spell', url: 'fire-bolt' },
          content: [{ type: 'text', text: 'Огонь' }],
        },
      ],
    });

    const json = editor.getJSON();

    expect(json.content?.[0]?.type).toBe('sectionLink');
    expect(json.content?.[0]?.attrs?.sectionType).toBe('spell');
    expect(json.content?.[0]?.attrs?.url).toBe('fire-bolt');
    expect(json.content?.[0]?.content?.[0].text).toBe('Огонь');
  });

  it('gets default values if not provided', () => {
    const editor = createTestEditor({
      type: 'doc',
      content: [
        {
          type: 'sectionLink',
          content: [{ type: 'text', text: 'Test' }],
        },
      ],
    });

    const json = editor.getJSON();

    expect(json.content?.[0]?.attrs?.sectionType).toBe('spell');
    expect(json.content?.[0]?.attrs?.url).toBe('');
  });
});
