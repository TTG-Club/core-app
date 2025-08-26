import { MAX_STRING_LENGTH, MAX_DEPTH, LEADING_CHARACTER } from '../consts';
import { SimpleText, Marker } from '../types';
import {
  isEmptyMarker,
  isRichMarker,
  isTextMarker,
  isFeatureMarker,
} from '../utils';

import type {
  RenderNode,
  TextNode,
  EmptyNode,
  SectionLinkNode,
  MarkerAttributes,
  SimpleTextNode,
  ParamValue,
  RichNode,
  MarkerName,
  RichMarker,
  EmptyMarker,
  TextMarker,
  SectionMarker,
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
  background: Marker.Background,
  magicItem: Marker.MagicItem,
  bestiary: Marker.Creature,
  glossary: Marker.Glossary,
  br: Marker.Break,
  break: Marker.Break,
  sup: Marker.Superscript,
  sub: Marker.Subscript,
  highlight: Marker.Highlight,
};

export function parse(text: string): RenderNode[] {
  if (text.length > MAX_STRING_LENGTH) {
    throw new Error('[Markup] String is too long');
  }

  const depth = 0;

  return recursiveParse(text, depth);
}

function recursiveParse(text: string, depth: number): RenderNode[] {
  if (depth > MAX_DEPTH) {
    throw new Error('[Markup] Maximum nesting depth exceeded');
  }

  const tagSplit = splitByMarkers(text);
  const len = tagSplit.length;
  const result: Array<RenderNode> = [];

  for (let i = 0; i < len; ++i) {
    const str = tagSplit[i];

    if (!str) {
      continue;
    }

    if (str.startsWith(`{${LEADING_CHARACTER}`)) {
      try {
        const [marker, rawText] = splitFirstSpace(str.slice(1, -1));

        result.push(convertMarker(marker, rawText, depth));
      } catch (err) {
        consola.error(err, `Содержащая строка: ${str}`);
      }
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
): RenderNode {
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
  marker: SectionMarker,
  textWithParams: string,
  depth: number,
): SectionLinkNode {
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

function splitByMarkers(source: string): string[] {
  let acc = '';
  let level = 0;

  const result: string[] = [];

  for (let i = 0; i < source.length; i++) {
    // Открытие маркера
    if (source[i] === '{' && source[i + 1] === LEADING_CHARACTER) {
      if (level++ === 0 && acc) {
        result.push(acc);
        acc = '';
      }

      acc += '{' + LEADING_CHARACTER;
      i++;

      continue;
    }

    // Закрытие маркера
    if (source[i] === '}') {
      acc += '}';

      if (level && --level === 0) {
        result.push(acc);
        acc = '';
      }

      continue;
    }

    acc += source[i];
  }

  if (acc) result.push(acc);

  return result;
}

function splitByPipeBase(input: string): { text?: string; params: string[] } {
  let acc = '';
  let level = 0;

  const params: string[] = [];

  let text: string | undefined;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const isMarkerOpen = char === '{' && input[i + 1] === LEADING_CHARACTER;

    if (isMarkerOpen) {
      level++;
      acc += '{' + LEADING_CHARACTER;
      i++;

      continue;
    }

    if (char === '}') {
      acc += '}';

      if (level) {
        --level;
      }

      continue;
    }

    // Основная логика: разделитель pipe, если не во вложенностях
    if (char === '|' && level === 0) {
      if (text === undefined) {
        text = acc.trim();
      } else {
        params.push(acc.trim());
      }

      acc = '';
    } else {
      acc += char;
    }
  }

  if (acc) {
    if (text === undefined) {
      text = acc.trim();
    } else {
      params.push(acc.trim());
    }
  }

  return { text, params };
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
