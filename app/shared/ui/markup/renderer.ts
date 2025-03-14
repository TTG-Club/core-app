import type { VNode } from 'vue';
import { h } from 'vue';
import { toNumber } from 'lodash-es';

const LEADING_CHARACTER = '@';
const MAX_DEPTH = 7;

export class MarkupRenderer {
  public render(entries: string | Array<string>): VNode {
    if (!entries) return h('div', 'Произошла какая-то ошибка...');

    if (Array.isArray(entries)) {
      return h(
        'div',
        entries.map((entry) => this.recursiveRender(entry.trim())),
      );
    }

    return h('div', this.recursiveRender(entries.trim()));
  }

  private recursiveRender(
    entry: string,
    depth: number = 0,
  ): Array<VNode | string> {
    if (depth > MAX_DEPTH) return [entry];

    const parts = this.splitByMarkers(entry);
    const result: Array<VNode | string> = [];

    let lastText = '';

    for (const part of parts) {
      if (part.startsWith(`{${LEADING_CHARACTER}`) && part.endsWith('}')) {
        if (lastText) {
          result.push(lastText);
          lastText = '';
        }

        const inner = part.slice(1, -1);
        const [marker, textWithParams] = this.splitFirstSpace(inner);
        const [text, ...params] = this.splitByPipeBase(textWithParams);

        result.push(this.renderVNode(marker, text || '', params, depth));
      } else {
        lastText += part;
      }
    }

    if (lastText) result.push(lastText);

    if (depth === 0 && !parts.some((part) => part.includes('{@heading'))) {
      return [h('p', result)];
    }

    return result;
  }

  private renderVNode(
    marker: string,
    text: string,
    params: Array<string>,
    depth: number,
  ): VNode | string {
    if (depth > MAX_DEPTH) return h('span', text);

    switch (marker) {
      case '@b':
      case '@bold':
        return this.renderBold(text, depth);
      case '@i':
      case '@italic':
        return this.renderItalic(text, depth);
      case '@s':
      case '@strike':
      case '@strikethrough':
        return this.renderStrike(text, depth);
      case '@u':
      case '@underline':
        return this.renderUnderline(text, depth);
      case '@link':
        return this.renderLink(text, depth);
      case '@heading':
        return this.renderHeading(text, params);
      default:
        return h('span', text);
    }
  }

  private renderHeading = (text: string, params: Array<string>): VNode => {
    const [level] = params;

    const validLevel =
      level && /^[1-4]$/.test(level.trim()) ? level.trim() : '2';

    return h(`h${toNumber(validLevel) + 2}`, text);
  };

  private renderBold(text: string, depth: number) {
    return h('b', this.recursiveRender(text || '', depth + 1));
  }

  private renderItalic(text: string, depth: number) {
    return h('i', this.recursiveRender(text || '', depth + 1));
  }

  private renderStrike(text: string, depth: number) {
    return h('s', this.recursiveRender(text || '', depth + 1));
  }

  private renderUnderline(text: string, depth: number) {
    return h('u', this.recursiveRender(text || '', depth + 1));
  }

  private renderLink(text: string, depth: number) {
    const [label, url] = this.splitByPipeBase(text);

    return h(
      'a',
      { href: url || '#', target: '_blank', rel: 'noopener noreferrer' },
      this.recursiveRender(label || '', depth + 1),
    );
  }

  private splitFirstSpace = (string: string): [string, string] => {
    const firstIndex = string.indexOf(' ');

    return firstIndex !== -1
      ? [string.substring(0, firstIndex), string.substring(firstIndex + 1)]
      : [string, ''];
  };

  private splitByMarkers = (string: string): string[] => {
    let tagDepth = 0;
    let char;
    let char2;

    const out: string[] = [];

    let curStr = '';
    let isLastOpen = false;

    const len = string.length;

    for (let i = 0; i < len; ++i) {
      char = string[i];
      char2 = string[i + 1] || '';

      switch (char) {
        case '{':
          isLastOpen = true;

          if (char2 === LEADING_CHARACTER) {
            if (tagDepth++ > 0) {
              curStr += '{';
            } else {
              out.push(curStr.replace(/<VE_LEAD>/g, LEADING_CHARACTER));
              curStr = `{${LEADING_CHARACTER}`;
              ++i;
            }
          } else {
            curStr += '{';
          }

          break;

        case '}':
          isLastOpen = false;
          curStr += '}';

          if (tagDepth !== 0 && --tagDepth === 0) {
            out.push(curStr.replace(/<VE_LEAD>/g, LEADING_CHARACTER));
            curStr = '';
          }

          break;

        case LEADING_CHARACTER: {
          if (!isLastOpen) {
            curStr += '<VE_LEAD>';
          } else {
            curStr += LEADING_CHARACTER;
          }

          break;
        }

        default:
          isLastOpen = false;
          curStr += char;

          break;
      }
    }

    if (curStr) {
      out.push(curStr.replace(/<VE_LEAD>/g, LEADING_CHARACTER));
    }

    return out;
  };

  private splitByPipeBase = (string: string): string[] => {
    let tagDepth = 0;

    const out: string[] = [];

    let curStr = '';

    for (let i = 0; i < string.length; ++i) {
      const char = string[i];
      const char2 = string[i + 1] || '';

      switch (char) {
        case '{':
          if (char2 === LEADING_CHARACTER) tagDepth++;
          curStr += '{';

          break;

        case '}':
          if (tagDepth) tagDepth--;
          curStr += '}';

          break;

        case '|':
          if (tagDepth) {
            curStr += '|';
          } else {
            out.push(curStr.trim());
            curStr = '';
          }

          break;

        default:
          curStr += char;

          break;
      }
    }

    if (curStr) out.push(curStr.trim());

    return out;
  };
}

export const markupService = new MarkupRenderer();
