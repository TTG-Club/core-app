import { LEADING_CHARACTER, MAX_DEPTH, MAX_STRING_LENGTH } from './consts';
import { MARKER_ALIASES, MARKER_MAP } from './config';
import type {
  RenderNode,
  MarkerNode,
  MarkerAttributes,
  SimpleTextNode,
} from './types';
import { logError } from './utils';

export function parse(text: string): RenderNode[] {
  if (text.length > MAX_STRING_LENGTH) {
    logError('Parser', 'String is too long', { text });

    return [];
  }

  try {
    const depth = 0;

    return recursiveParse(text, depth);
  } catch (err) {
    logError('Parser', 'Unexpected error', { text, err });

    return [];
  }
}

function recursiveParse(text: string, depth: number): RenderNode[] {
  if (depth > MAX_DEPTH) {
    logError('Parser', 'Maximum nesting depth exceeded', { text });

    return [];
  }

  let tagSplit: string[];

  try {
    tagSplit = splitByMarkers(text);
  } catch (err) {
    logError('Parser', 'Splitting error', { text, err });

    return [];
  }

  const len = tagSplit.length;
  const result: RenderNode[] = [];

  for (let i = 0; i < len; ++i) {
    const str = tagSplit[i];

    if (!str) {
      continue;
    }

    try {
      if (str.startsWith(`{${LEADING_CHARACTER}`)) {
        const markerStr = str.slice(1, -1);
        const marker = convertMarker(markerStr, depth);

        result.push(marker);
      } else {
        result.push(convertText(str));
      }
    } catch (err) {
      logError('Parser', 'Converting error', { str, err });
    }
  }

  return result;
}

function convertMarker(string: string, depth: number): MarkerNode {
  const { text: rawMarker, rest } = splitFirstSpace(string);

  const marker = MARKER_ALIASES.get(rawMarker.replace(/^@/, ''));

  if (!marker) {
    throw new Error(`Unknown marker: ${rawMarker}`);
  }

  const config = MARKER_MAP.get(marker);

  if (!config) {
    throw new Error(`Unknown marker type: ${marker}`);
  }

  // Empty маркер (break)
  if (config.isEmpty) {
    return { type: marker };
  }

  const { text, params } = splitByPipeBase(rest);

  if (!text) {
    throw new Error(
      `${marker.charAt(0).toUpperCase() + marker.slice(1)} marker must have text`,
    );
  }

  return {
    type: marker,
    attrs: splitAttrs(params),
    content: recursiveParse(text, depth + 1),
  };
}

function convertText(text: string | undefined): SimpleTextNode {
  if (!text) {
    throw new Error(`Text marker must have text`);
  }

  return {
    type: 'text',
    text,
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

function splitFirstSpace(string: string): { text: string; rest: string } {
  const index = string.indexOf(' ');

  if (index < 0) {
    return { text: string, rest: '' };
  }

  return {
    text: string.substring(0, index),
    rest: string.substring(index + 1),
  };
}

function splitAttrs(params: string[]): MarkerAttributes | undefined {
  if (!params.length) return undefined;

  const attrs: MarkerAttributes = {};

  for (const param of params) {
    const index = param.includes(':') ? param.indexOf(':') : param.indexOf('=');

    if (index < 0) {
      throw new Error(`Attribute must have value: ${param}`);
    }

    const name = param.substring(0, index);

    if (!name) {
      throw new Error(`Attribute name is required: ${param}`);
    }

    const value = param.substring(index + 1);

    if (!value) {
      throw new Error(`Attribute value is required: ${name}`);
    }

    attrs[name] = parseAttrValue(value);
  }

  return Object.keys(attrs).length > 0 ? attrs : undefined;
}

function parseAttrValue(attrValue: string): string | number | boolean | null {
  try {
    return JSON.parse(attrValue);
  } catch (err) {
    return attrValue;
  }
}
