import type { JSONContent } from '@tiptap/core';

export function getTextFromJSON(
  content: JSONContent | JSONContent[] | undefined,
): string {
  if (!content) {
    return '';
  }

  const nodes = Array.isArray(content) ? content : [content];

  let text = '';

  for (const node of nodes) {
    if (node.type === 'text') {
      text += node.text || '';
    }

    // Some inline nodes like diceRoll might have representation in attrs
    if (node.type === 'diceRoll' && node.attrs?.notation) {
      text += node.attrs.notation;
    }

    if (node.content) {
      text += getTextFromJSON(node.content);
    }
  }

  return text;
}
