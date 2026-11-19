import type { Token, Tokens } from 'marked';

import type { VttgDocsChannel } from '#shared/consts';
import type { VttgDocsHeading } from '#shared/types';

import { escape } from 'es-toolkit';
import GithubSlugger from 'github-slugger';
import { Marked } from 'marked';

import { getVttgDocsPagePath } from '#shared/utils';

import {
  VTTG_DOCS_ANCHOR_PREFIX,
  VTTG_DOCS_EXTERNAL_IMAGE_PATTERN,
  VTTG_DOCS_EXTERNAL_LINK_ATTRIBUTES,
  VTTG_DOCS_EXTERNAL_LINK_PATTERN,
  VTTG_DOCS_PAGE_FILE_PATH_PATTERN,
  VTTG_DOCS_RELATIVE_LINK_BASE,
  VTTG_DOCS_RELATIVE_LINK_ORIGIN,
  VTTG_DOCS_TABLE_CLASS,
  VTTG_DOCS_TOC_DEPTHS,
} from '../model';

/** Тело страницы и её заголовки для оглавления. */
export interface RenderedVttgDocsPage {
  html: string;
  headings: VttgDocsHeading[];
}

/** Куда ведёт ссылка после разбора. */
interface VttgDocsLinkTarget {
  href: string;
  /** Внешний адрес — открывается в новой вкладке. */
  isExternal: boolean;
}

/**
 * Текст заголовка без разметки — из него GitHub и сборка VTTG строят якорь,
 * поэтому `` ### `vue` `` даёт `vue`, а не `` `vue` ``.
 *
 * @param inlineTokens строчные токены заголовка
 */
function getPlainText(inlineTokens: Token[]): string {
  return inlineTokens
    .map((inlineToken) => {
      switch (inlineToken.type) {
        case 'text':
        case 'codespan':
        case 'escape':
        case 'image':
          return inlineToken.text;
        case 'strong':
        case 'em':
        case 'del':
        case 'link':
          return getPlainText(inlineToken.tokens ?? []);
        default:
          return '';
      }
    })
    .join('');
}

/**
 * Куда ведёт ссылка из Markdown. `undefined` — ссылку надо убрать и оставить
 * текст: она ведёт в закрытый репозиторий или куда-то, чего на сайте нет.
 *
 * @param href адрес из исходника
 * @param channel канал страницы — ссылки между страницами в нём и остаются
 * @param currentFile файл текущей страницы (`группа/страница.md`) — от него
 *   разбираются относительные пути
 */
function resolveLink(
  href: string,
  channel: VttgDocsChannel,
  currentFile: string,
): VttgDocsLinkTarget | undefined {
  if (VTTG_DOCS_EXTERNAL_LINK_PATTERN.test(href)) {
    return { href, isExternal: true };
  }

  if (href.startsWith(VTTG_DOCS_ANCHOR_PREFIX)) {
    return { href, isExternal: false };
  }

  // Относительный путь разбирается от файла текущей страницы — так же, как его
  // открывает GitHub в самом репозитории VTTG.
  // `URL` кодирует хэш (`#%D0%BF…`), а `id` заголовков — обычный текст:
  // хэш возвращается в исходный вид, чтобы якорь на другой странице совпал.
  // Битый адрес или битая кодировка хэша — ссылка остаётся текстом.
  let resolvedUrl: URL;
  let decodedHash: string;

  try {
    resolvedUrl = new URL(
      href,
      `${VTTG_DOCS_RELATIVE_LINK_BASE}${currentFile}`,
    );

    decodedHash = decodeURIComponent(resolvedUrl.hash);
  } catch {
    return undefined;
  }

  const [, groupSlug, pageSlug] =
    resolvedUrl.pathname.match(VTTG_DOCS_PAGE_FILE_PATH_PATTERN) ?? [];

  if (
    resolvedUrl.origin !== VTTG_DOCS_RELATIVE_LINK_ORIGIN
    || !groupSlug
    || !pageSlug
  ) {
    return undefined;
  }

  return {
    href: `${getVttgDocsPagePath(channel, { groupSlug, pageSlug })}${decodedHash}`,
    isExternal: false,
  };
}

/**
 * Атрибут `title`, если он задан в исходнике.
 *
 * @param title подсказка ссылки или картинки
 */
function getTitleAttribute(title: string | null | undefined): string {
  return title ? ` title="${escape(title)}"` : '';
}

/**
 * Собирает HTML страницы документации из Markdown, выложенного сборкой VTTG.
 *
 * - Сырой HTML исходника выбрасывается целиком (включая комментарии): в
 *   выкладке он не нужен, а показывать его через `v-html` небезопасно.
 * - Заголовки получают `id` по правилам GitHub (`github-slugger`) — так же
 *   считает якоря сборка VTTG, и ссылки `#…` попадают.
 * - Относительные ссылки на другие страницы (`../modules/live-reload.md#…`)
 *   становятся адресами сайта, внешние открываются в новой вкладке, остальные
 *   (в закрытый репозиторий) превращаются в текст.
 * - Таблицы оборачиваются в блок с горизонтальной прокруткой.
 *
 * @param markdown тело страницы
 * @param channel канал, из которого страница
 * @param currentFile файл страницы в папке версии (`группа/страница.md`)
 * @returns HTML и заголовки второго–третьего уровня для оглавления
 */
export function renderVttgDocsMarkdown(
  markdown: string,
  channel: VttgDocsChannel,
  currentFile: string,
): RenderedVttgDocsPage {
  const slugger = new GithubSlugger();
  const headings: VttgDocsHeading[] = [];

  const markedInstance = new Marked({
    gfm: true,
    renderer: {
      html(): string {
        return '';
      },

      heading({ tokens, depth }: Tokens.Heading): string {
        const headingText = getPlainText(tokens);
        const id = slugger.slug(headingText);

        if (VTTG_DOCS_TOC_DEPTHS.includes(depth)) {
          headings.push({ id, text: headingText, depth });
        }

        return `<h${depth} id="${escape(id)}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
      },

      link({ href, title, tokens }: Tokens.Link): string {
        const linkContent = this.parser.parseInline(tokens);
        const linkTarget = resolveLink(href, channel, currentFile);

        if (!linkTarget) {
          return linkContent;
        }

        const externalAttributes = linkTarget.isExternal
          ? VTTG_DOCS_EXTERNAL_LINK_ATTRIBUTES
          : '';

        return `<a href="${escape(linkTarget.href)}"${getTitleAttribute(title)}${externalAttributes}>${linkContent}</a>`;
      },

      image({ href, title, text }: Tokens.Image): string {
        if (!VTTG_DOCS_EXTERNAL_IMAGE_PATTERN.test(href)) {
          return escape(text);
        }

        return `<img src="${escape(href)}" alt="${escape(text)}"${getTitleAttribute(title)} loading="lazy">`;
      },

      table(tableToken: Tokens.Table): string {
        const headerCells = tableToken.header
          .map((tableCell) => this.tablecell(tableCell))
          .join('');

        const bodyRows = tableToken.rows
          .map(
            (tableRow) =>
              `<tr>${tableRow.map((tableCell) => this.tablecell(tableCell)).join('')}</tr>`,
          )
          .join('');

        return `<div class="${VTTG_DOCS_TABLE_CLASS}"><table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></div>\n`;
      },
    },
  });

  const html = markedInstance.parse(markdown, { async: false });

  return { html, headings };
}
