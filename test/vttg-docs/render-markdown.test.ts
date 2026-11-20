import { describe, expect, it } from 'vitest';

import { renderVttgDocsMarkdown } from '#server/domain/vttg-docs/utils';

const CURRENT_FILE = 'systems/overview.md';

/**
 * Собирает страницу релизного канала из файла `systems/overview.md`.
 *
 * @param markdown тело страницы
 */
function renderReleasePage(markdown: string) {
  return renderVttgDocsMarkdown(markdown, 'release', CURRENT_FILE);
}

describe('ссылки страницы документации VTTG', () => {
  it('относительная ссылка на страницу другой группы становится адресом сайта', () => {
    const { html } = renderReleasePage(
      '[живое обновление](../modules/live-reload.md#подписка)',
    );

    expect(html).toContain('href="/vttg/docs/modules/live-reload#подписка"');
  });

  it('ссылка на страницу той же группы разбирается от текущего файла', () => {
    const { html } = renderReleasePage('[быстрый старт](quick-start.md)');

    expect(html).toContain('href="/vttg/docs/systems/quick-start"');
  });

  it('в dev-канале ссылки между страницами сохраняют канал', () => {
    const { html } = renderVttgDocsMarkdown(
      '[быстрый старт](quick-start.md)',
      'dev',
      CURRENT_FILE,
    );

    expect(html).toContain('href="/vttg/docs/systems/quick-start?channel=dev"');
  });

  it('ссылка в код закрытого репозитория остаётся текстом', () => {
    const { html } = renderReleasePage(
      '[исходник](../../packages/server/index.ts)',
    );

    expect(html).not.toContain('<a');
    expect(html).toContain('исходник');
  });

  it('внешняя ссылка открывается в новой вкладке', () => {
    const { html } = renderReleasePage('[Nuxt](https://nuxt.com)');

    expect(html).toContain(
      '<a href="https://nuxt.com" target="_blank" rel="noopener noreferrer">',
    );
  });

  it('ссылка на заголовок той же страницы не меняется', () => {
    const { html } = renderReleasePage('[ниже](#пример)');

    expect(html).toContain('href="#пример"');
  });
});

describe('заголовки и безопасность страницы документации VTTG', () => {
  it('якоря строятся как в GitHub, оглавление берёт второй и третий уровень', () => {
    const { html, headings } = renderReleasePage(
      '## Контракт `VttSystem`\n\n### Пример\n\n#### Детали\n\n## Пример',
    );

    expect(headings).toEqual([
      { id: 'контракт-vttsystem', text: 'Контракт VttSystem', depth: 2 },
      { id: 'пример', text: 'Пример', depth: 3 },
      { id: 'пример-1', text: 'Пример', depth: 2 },
    ]);

    expect(html).toContain('<h4 id="детали">');
  });

  it('сырой HTML исходника выбрасывается', () => {
    const { html } = renderReleasePage(
      'Текст\n\n<script>alert(1)</script>\n\n<!-- заметка -->',
    );

    expect(html).not.toContain('<script');
    expect(html).not.toContain('заметка');
  });

  it('таблица оборачивается в блок с прокруткой', () => {
    const { html } = renderReleasePage(
      '| Поле | Тип |\n| --- | --- |\n| id | string |',
    );

    expect(html).toMatch(/^<div class="vttg-docs-table"><table>/);
  });
});

describe('блоки-предупреждения GitHub в документации VTTG', () => {
  it('метка становится заголовком блока, текст остаётся', () => {
    const { html } = renderReleasePage(
      '> [!NOTE]\n> **Жирно** и текст\n>\n> Второй абзац',
    );

    expect(html).toContain(
      '<div class="vttg-docs-alert vttg-docs-alert--note"><p class="vttg-docs-alert-title">Примечание</p><p><strong>Жирно</strong> и текст</p>',
    );

    expect(html).toContain('<p>Второй абзац</p>');
    expect(html).not.toContain('[!NOTE]');
    expect(html).not.toContain('<blockquote');
  });

  it('у каждого вида свой заголовок', () => {
    expect(renderReleasePage('> [!IMPORTANT]\n> Текст').html).toContain(
      '>Важно</p>',
    );

    expect(renderReleasePage('> [!WARNING]\n> Текст').html).toContain(
      'vttg-docs-alert--warning',
    );
  });

  it('метка отдельным абзацем — пустой абзац не появляется', () => {
    const { html } = renderReleasePage(
      '> [!TIP]\n>\n> Совет отдельным абзацем',
    );

    expect(html).toContain(
      '<p class="vttg-docs-alert-title">Совет</p><p>Совет отдельным абзацем</p>',
    );
  });

  it('обычная цитата и неизвестная метка остаются цитатой', () => {
    expect(renderReleasePage('> Просто цитата').html).toContain('<blockquote>');

    expect(renderReleasePage('> [!UNKNOWN]\n> Текст').html).toContain(
      '<blockquote>',
    );
  });
});
