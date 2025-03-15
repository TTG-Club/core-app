// Наивысшая допустимая глубина вложенности.
const MAX_DEPTH = 7;
// Максимальный размер строки.
const MAX_STRING_LENGTH = 65536;
// Первый символ маркера
const LEADING_CHARACTER = '@';

// Разрешенные маркеры и их алиасы.
export const enum MarkerType {
  Bold = 'bold',
  Italic = 'italic',
  Underline = 'underline',
  Strikethrough = 'strikethrough',
  Link = 'link',
  Br = 'br',
}

// Разрешенные алиасы для маркеров
const MARKERS = new Map<string, MarkerType>([
  ['bold', MarkerType.Bold],
  ['b', MarkerType.Bold],
  ['italic', MarkerType.Italic],
  ['i', MarkerType.Italic],
  ['underline', MarkerType.Underline],
  ['u', MarkerType.Underline],
  ['strikethrough', MarkerType.Strikethrough],
  ['s', MarkerType.Strikethrough],
  ['link', MarkerType.Link],
  ['br', MarkerType.Br],
]);

// Типы данных для параметров атрибутов.
export type ParamValue = string | number | boolean | null;

// Тип для параметров маркера.
export type MarkerAttributes = Record<string, ParamValue>;

export interface TextMarkerNode {
  type: 'text';
  text: string;
}

export interface EmptyMarkerNode {
  type: MarkerType;
}

export interface CustomizedMarkerNode extends EmptyMarkerNode {
  attrs?: MarkerAttributes;
  content: Array<MarkerNode>;
}

// Типы узлов TipTap.
export type MarkerNode =
  | TextMarkerNode
  | EmptyMarkerNode
  | CustomizedMarkerNode;

export function parseString(text: string): MarkerNode[] {
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
      const [marker, text] = splitFirstSpace(str.slice(1, -1));

      result.push(convertMarker(marker, text, depth));
    } else {
      result.push(convertText(str));
    }
  }

  return result;
}

function convertMarker(
  marker: MarkerType,
  textWithParams: string,
  depth: number,
): MarkerNode {
  switch (marker) {
    case MarkerType.Bold:
    case MarkerType.Italic:
    case MarkerType.Underline:
    case MarkerType.Strikethrough:
    case MarkerType.Link:
      return convertMarkerSimple(marker, textWithParams, depth);
    case MarkerType.Br:
      return convertBr();
    default:
      throw new Error(`[Markup] Unknown marker: ${marker}`);
  }
}

function convertText(text: string | undefined): TextMarkerNode {
  if (!text) {
    throw new Error(`[Markup] Text marker must have text`);
  }

  return {
    type: 'text',
    text,
  };
}

function convertMarkerSimple(
  marker: MarkerType,
  textWithParams: string,
  depth: number,
): CustomizedMarkerNode {
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

function convertBr(): EmptyMarkerNode {
  return {
    type: MarkerType.Br,
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

function splitFirstSpace(string: string): [MarkerType, string] {
  const index = string.indexOf(' ');
  const rawMarker = index < 0 ? string : string.substring(0, index);
  const marker = MARKERS.get(rawMarker.replace(/^@/, ''));

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
