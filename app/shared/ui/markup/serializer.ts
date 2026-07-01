import type { MarkerAttributes, MarkerNode } from './types';

import { MARKER_MAP } from './config';
import { isMarkerNode, isSimpleTextNode } from './utils';

/**
 * Сериализует атрибуты маркера в хвост `| key:value | key:value`.
 *
 * Значения выводятся «как есть» (`String(value)`), чтобы при обратном разборе
 * `parseAttrValue` (JSON.parse c фолбэком в строку) вернул тот же тип:
 * число → число, `true`/`false` → boolean, произвольная строка → строка.
 *
 * @param attrs - Атрибуты маркера
 * @returns Строка вида ` | k:v` либо пустая строка
 */
function serializeAttrs(attrs: MarkerAttributes | undefined): string {
  if (!attrs) {
    return '';
  }

  const parts: string[] = [];

  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined) {
      continue;
    }

    parts.push(`${key}:${String(value)}`);
  }

  return parts.length > 0 ? ` | ${parts.join(' | ')}` : '';
}

/**
 * Сериализует узел-маркер обратно в синтаксис `{@type ...}`.
 *
 * Используется канонический `type` — парсер принимает его как алиас, поэтому
 * результат гарантированно разбирается обратно.
 */
function serializeMarker(node: MarkerNode): string {
  const config = MARKER_MAP.get(node.type);

  // Пустой маркер (break) — без текста и атрибутов.
  if (config?.isEmpty) {
    return `{@${node.type}}`;
  }

  const content = node.content ? serializeNodes(node.content) : '';
  const attrs = serializeAttrs(node.attrs);

  return `{@${node.type} ${content}${attrs}}`;
}

/**
 * Сериализует массив узлов, конкатенируя результат.
 */
function serializeNodes(nodes: unknown[]): string {
  return nodes.map((node) => serializeMarkup(node)).join('');
}

/**
 * Преобразует узел разметки (`RenderNode`) обратно в строку формата
 * «Markdown + маркеры {@...}». Обратный к `parse()`.
 *
 * Принимает `unknown`, чтобы безопасно обрабатывать данные с бэкенда (строка,
 * разобранный AST-объект/массив или мусор) — неизвестные значения дают пустую
 * строку, а не падение.
 *
 * @param node - Узел или дерево узлов разметки
 * @returns Исходная строка разметки
 */
export function serializeMarkup(node: unknown): string {
  if (typeof node === 'string') {
    return node;
  }

  if (Array.isArray(node)) {
    return serializeNodes(node);
  }

  if (isSimpleTextNode(node)) {
    return node.text;
  }

  if (isMarkerNode(node)) {
    return serializeMarker(node);
  }

  return '';
}

/**
 * Приводит «сырое» значение описания с бэкенда к строке-исходнику для правки.
 *
 * Обрабатывает три формы хранения: обычную строку «Markdown + {@...}»,
 * разобранный AST (объект/массив) и строку, в которую AST был сериализован как
 * JSON (например `["{@i ...}"]`) — такую строку разворачиваем и сериализуем.
 *
 * @param value - Значение поля описания (string | RenderNode | JSON-строка)
 * @returns Строка-исходник разметки
 */
export function toMarkupSource(value: unknown): string {
  if (typeof value !== 'string') {
    return serializeMarkup(value);
  }

  const trimmed = value.trim();

  // Похоже на JSON-обёртку над AST/строкой — пробуем развернуть.
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed: unknown = JSON.parse(trimmed);

      return serializeMarkup(parsed);
    } catch {
      // Не JSON — это обычный Markdown/маркеры, оставляем как есть.
    }
  }

  return value;
}
