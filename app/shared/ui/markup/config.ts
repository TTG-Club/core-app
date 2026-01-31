import {
  MarkupBadge,
  MarkupHeading,
  MarkupKbd,
  MarkupLink,
  MarkupList,
  MarkupQuote,
  MarkupRoller,
  MarkupSectionLink,
  MarkupSeparator,
  MarkupTable,
} from './ui';

import type { Component } from 'vue';

interface MarkerConfig {
  type: string;
  tag?: string;
  component?: Component;
  aliases?: string[];
  isEmpty?: boolean;
  isBlock?: boolean; // Новый флаг
}

// TODO: блочные только через json, инлайн только через строку. Каждый строчный оборачивать в <p>. Подумать что-то такое?
export const MARKER_CONFIGS: MarkerConfig[] = [
  // HTML-теги (inline)
  { type: 'bold', tag: 'b', aliases: ['b'] },
  { type: 'italic', tag: 'i', aliases: ['i'] },
  { type: 'underline', tag: 'u', aliases: ['u'] },
  { type: 'strikethrough', tag: 's', aliases: ['s'] },
  { type: 'superscript', tag: 'sup', aliases: ['sup'] },
  { type: 'subscript', tag: 'sub', aliases: ['sub'] },
  { type: 'highlight', tag: 'mark', aliases: ['mark'] },
  { type: 'break', tag: 'br', isBlock: true, aliases: ['br'], isEmpty: true },

  // Vue-компоненты (inline)
  { type: 'link', component: MarkupLink, aliases: ['a', 'link'] },
  { type: 'kbd', component: MarkupKbd, aliases: ['kbd'] },
  { type: 'badge', component: MarkupBadge, aliases: ['badge'] },
  { type: 'roll', component: MarkupRoller, aliases: ['dice'] },

  // Блочные элементы
  { type: 'heading', component: MarkupHeading, aliases: ['h'], isBlock: true },
  {
    type: 'quote',
    component: MarkupQuote,
    aliases: ['blockquote', 'quote', 'q'],
    isBlock: true,
  },
  { type: 'separator', component: MarkupSeparator, isBlock: true },
  { type: 'list', component: MarkupList, isBlock: true },
  { type: 'table', component: MarkupTable, isBlock: true },

  // Sections
  { type: 'class', component: MarkupSectionLink },
  { type: 'spell', component: MarkupSectionLink },
  { type: 'feat', component: MarkupSectionLink },
  { type: 'background', component: MarkupSectionLink },
  { type: 'magicItem', component: MarkupSectionLink, aliases: ['magic-item'] },
  { type: 'creature', component: MarkupSectionLink, aliases: ['bestiary'] },
  { type: 'item', component: MarkupSectionLink },
  { type: 'glossary', component: MarkupSectionLink },
];

// Генерация типа из значений конфига
export type MarkerType = (typeof MARKER_CONFIGS)[number]['type'];

export const MARKER_MAP = new Map(
  MARKER_CONFIGS.map((config) => [config.type, config]),
);

export const MARKER_ALIASES = new Map(
  MARKER_CONFIGS.flatMap((config) =>
    [config.type, ...(config.aliases || [])].map((alias) => [
      alias,
      config.type,
    ]),
  ),
);
