import { MAX_STRING_LENGTH, MAX_DEPTH, LEADING_CHARACTER } from '../consts';
import { SimpleText, Marker } from '../types';
import {
  isEmptyMarker,
  isRichMarker,
  isTextMarker,
  isFeatureMarker,
} from '../utils';

import type {
  MarkerNode,
  TextNode,
  EmptyNode,
  DrawerNode,
  MarkerAttributes,
  SimpleTextNode,
  ParamValue,
  RichNode,
  MarkerName,
  RichMarker,
  EmptyMarker,
  TextMarker,
  FeatureMarker,
} from '../types';

// Разрешенные алиасы для маркеров
const MARKERS: { [key: string]: MarkerName } = {
  bold: Marker.Bold,
  b: Marker.Bold,
  italic: Marker.Italic,
  i: Marker.Italic,
  underline: Marker.Underline,
  u: Marker.Underline,
  strikethrough: Marker.Strikethrough,
  s: Marker.Strikethrough,
  link: Marker.Link,
  spell: Marker.Spell,
  feat: Marker.Feat,
  glossary: Marker.Glossary,
  br: Marker.Break,
  break: Marker.Break,
  sup: Marker.Superscript,
  sub: Marker.Subscript,
  highlight: Marker.Highlight,
};

export function parse(text: string): MarkerNode[] {
  if (text.length > MAX_STRING_LENGTH) {
    throw new Error('[Markup] String is too long');
  }

  const depth = 0;

  return recursiveParse(text, depth);
}

function recursiveParse(text: string, depth: number): MarkerNode[] {
  if (depth > MAX_DEPTH) {
    throw new Error('[Markup] Maximum nesting depth exceeded');
  }

  const tagSplit = splitByMarkers(text);
  const len = tagSplit.length;
  const result: Array<MarkerNode> = [];

  for (let i = 0; i < len; ++i) {
    const str = tagSplit[i];

    if (!str) {
      continue;
    }

    if (str.startsWith(`{${LEADING_CHARACTER}`)) {
      const [marker, rawText] = splitFirstSpace(str.slice(1, -1));

      result.push(convertMarker(marker, rawText, depth));
    } else {
      result.push(convertText(str));
    }
  }

  return result;
}

function convertMarker(
  marker: MarkerName,
  textWithParams: string,
  depth: number,
): MarkerNode {
  if (isTextMarker(marker)) {
    return convertTextMarker(marker, textWithParams, depth);
  }

  if (isRichMarker(marker)) {
    return convertRichMarker(marker, textWithParams, depth);
  }

  if (isFeatureMarker(marker)) {
    return convertFeatureMarker(marker, textWithParams, depth);
  }

  if (isEmptyMarker(marker)) {
    return convertEmptyMarker(marker);
  }

  throw new Error(`[Markup] Unknown marker: ${marker}`);
}

function convertText(text: string | undefined): SimpleTextNode {
  if (!text) {
    throw new Error(`[Markup] Text marker must have text`);
  }

  return {
    type: SimpleText.Text,
    text,
  };
}

function convertTextMarker(
  marker: TextMarker,
  textWithParams: string,
  depth: number,
): TextNode {
  const { text, params } = splitByPipeBase(textWithParams);

  if (!text) {
    throw new Error(
      `[Markup] ${marker.charAt(0).toUpperCase() + marker.slice(1)} marker must have text`,
    );
  }

  return {
    type: marker,
    attrs: splitAttrs(params),
    content: recursiveParse(text, depth),
  };
}

function convertRichMarker(
  marker: RichMarker,
  textWithParams: string,
  depth: number,
): RichNode {
  const { text, params } = splitByPipeBase(textWithParams);

  if (!text) {
    throw new Error(
      `[Markup] ${marker.charAt(0).toUpperCase() + marker.slice(1)} marker must have text`,
    );
  }

  return {
    type: marker,
    attrs: splitAttrs(params),
    content: recursiveParse(text, depth),
  };
}

function convertFeatureMarker(
  marker: FeatureMarker,
  textWithParams: string,
  depth: number,
): DrawerNode {
  const { text, params } = splitByPipeBase(textWithParams);

  if (!text) {
    throw new Error(
      `[Markup] ${marker.charAt(0).toUpperCase() + marker.slice(1)} marker must have text`,
    );
  }

  return {
    type: marker,
    attrs: splitAttrs(params),
    content: recursiveParse(text, depth),
  };
}

function convertEmptyMarker(marker: EmptyMarker): EmptyNode {
  return {
    type: marker,
  };
}

function splitByMarkers(string: string): string[] {
  let tagDepth = 0;
  let char;

  let char2;

  const out = [];

  let curStr = '';
  let isLastOpen = false;

  const len = string.length;

  for (let i = 0; i < len; ++i) {
    char = string[i];
    char2 = string[i + 1];

    switch (char) {
      case '{':
        isLastOpen = true;

        if (char2 === LEADING_CHARACTER) {
          if (tagDepth++ > 0) {
            curStr += '{';
          } else {
            out.push(curStr.replace(/<LEAD_CHAR>/g, LEADING_CHARACTER));
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
          out.push(curStr.replace(/<LEAD_CHAR>/g, LEADING_CHARACTER));
          curStr = '';
        }

        break;

      case LEADING_CHARACTER: {
        if (!isLastOpen) {
          curStr += '<LEAD_CHAR>';
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
    out.push(curStr.replace(/<LEAD_CHAR>/g, LEADING_CHARACTER));
  }

  return out;
}

function splitByPipeBase(string: string): { text?: string; params: string[] } {
  let tagDepth = 0;
  let curStr = '';

  const len = string.length;

  const params: string[] = [];

  let text: string | undefined;

  for (let i = 0; i < len; ++i) {
    const char = string[i];
    const char2 = string[i + 1];

    switch (char) {
      case '{':
        if (char2 === LEADING_CHARACTER) tagDepth++;
        curStr += '{';

        break;

      case '}':
        if (tagDepth) tagDepth--;
        curStr += '}';

        break;

      case '|': {
        if (tagDepth) {
          curStr += '|';
        } else {
          if (!text) {
            text = curStr;
          } else {
            params.push(curStr);
          }

          curStr = '';
        }

        break;
      }

      default: {
        curStr += char;

        break;
      }
    }
  }

  if (curStr) {
    if (!text) {
      text = curStr;
    } else {
      params.push(curStr);
    }
  }

  return { text: text?.trim(), params: params.map((param) => param.trim()) };
}

function splitFirstSpace(string: string): [MarkerName, string] {
  const index = string.indexOf(' ');
  const rawMarker = index < 0 ? string : string.substring(0, index);
  const marker = MARKERS[rawMarker.replace(/^@/, '')];

  if (!marker) {
    throw new Error(`[Markup] Unknown marker: ${rawMarker}`);
  }

  return [marker, index < 0 ? '' : string.substring(index + 1)];
}

function splitAttrs(params: string[]): MarkerAttributes {
  const attrs: MarkerAttributes = {};

  for (const param of params) {
    const index = param.indexOf(':');

    if (index < 0) {
      throw new Error(`[Markup] Attribute must have value: ${param}`);
    }

    const name = param.substring(0, index);

    if (!name) {
      throw new Error(`[Markup] Attribute name is required: ${param}`);
    }

    const value = param.substring(index + 1);

    if (!value) {
      throw new Error(`[Markup] Attribute value is required: ${name}`);
    }

    attrs[name] = parseAttrValue(value);
  }

  return attrs;
}

function parseAttrValue(attrValue: string): ParamValue {
  try {
    return JSON.parse(attrValue);
  } catch (err) {
    return attrValue;
  }
}
