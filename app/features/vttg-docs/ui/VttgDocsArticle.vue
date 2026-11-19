<script setup lang="ts">
  import {
    getVttgDocsLinkAction,
    VTTG_DOCS_PRIMARY_MOUSE_BUTTON,
  } from '../model';

  /**
   * Тело страницы документации. HTML собран сервером сайта из Markdown сборки
   * VTTG: сырой HTML исходника выброшен, ссылки переписаны — поэтому `v-html`
   * здесь безопасен.
   *
   * Ссылки внутри HTML — обычные ссылки, роутер о них не знает. Клик по ссылке
   * сайта перехватывается и идёт через `navigateTo` (без перезагрузки), по
   * якорю — прокручивает страницу: хэш сам её не сдвигает.
   */
  const { html } = defineProps<{
    html: string;
  }>();

  const { scrollToAnchor } = useAnchorScroll();

  /**
   * Клик основной кнопкой без клавиш-модификаторов — только его перехватываем,
   * чтобы работало «открыть в новой вкладке».
   *
   * @param event клик мышью
   */
  function isPlainClick(event: MouseEvent): boolean {
    return (
      event.button === VTTG_DOCS_PRIMARY_MOUSE_BUTTON
      && !event.ctrlKey
      && !event.metaKey
      && !event.shiftKey
      && !event.altKey
    );
  }

  /**
   * Перехватывает клик по ссылке внутри статьи: якорь прокручивает страницу,
   * адрес сайта открывается роутером, остальное остаётся браузеру.
   *
   * @param event клик мышью
   */
  function handleClick(event: MouseEvent): void {
    if (!isPlainClick(event) || !(event.target instanceof Element)) {
      return;
    }

    const articleLink = event.target.closest('a');
    const href = articleLink?.getAttribute('href');

    if (!articleLink || !href) {
      return;
    }

    const linkAction = getVttgDocsLinkAction(href, articleLink.target);

    if (linkAction === 'anchor') {
      event.preventDefault();
      history.replaceState(history.state, '', href);
      scrollToAnchor(href);
    } else if (linkAction === 'route') {
      event.preventDefault();
      navigateTo(href);
    }
  }
</script>

<template>
  <!-- eslint-disable vue/no-v-html -- HTML собран и очищен сервером сайта -->
  <article
    class="vttg-docs-article min-w-0"
    @click="handleClick"
    v-html="html"
  />
  <!-- eslint-enable vue/no-v-html -->
</template>

<style scoped>
  .vttg-docs-article {
    font-size: 0.9375rem;
    line-height: 1.75;
    color: var(--ui-text);
  }

  .vttg-docs-article :deep(> :first-child) {
    margin-top: 0;
  }

  .vttg-docs-article :deep(h2),
  .vttg-docs-article :deep(h3),
  .vttg-docs-article :deep(h4),
  .vttg-docs-article :deep(h5) {
    scroll-margin-top: 1rem;
    font-weight: 600;
    line-height: 1.35;
    color: var(--ui-text-highlighted);
  }

  .vttg-docs-article :deep(h2) {
    margin: 2.25rem 0 0.75rem;
    padding-bottom: 0.375rem;
    border-bottom: 1px solid var(--ui-border);
    font-size: 1.375rem;
  }

  .vttg-docs-article :deep(h3) {
    margin: 1.75rem 0 0.5rem;
    font-size: 1.125rem;
  }

  .vttg-docs-article :deep(h4),
  .vttg-docs-article :deep(h5) {
    margin: 1.25rem 0 0.5rem;
    font-size: 1rem;
  }

  .vttg-docs-article :deep(p),
  .vttg-docs-article :deep(ul),
  .vttg-docs-article :deep(ol),
  .vttg-docs-article :deep(blockquote),
  .vttg-docs-article :deep(pre),
  .vttg-docs-article :deep(.vttg-docs-table) {
    margin: 0.75rem 0;
  }

  .vttg-docs-article :deep(ul) {
    padding-left: 1.5rem;
    list-style: disc;
  }

  .vttg-docs-article :deep(ol) {
    padding-left: 1.5rem;
    list-style: decimal;
  }

  .vttg-docs-article :deep(li + li) {
    margin-top: 0.25rem;
  }

  .vttg-docs-article :deep(li > ul),
  .vttg-docs-article :deep(li > ol) {
    margin: 0.25rem 0;
  }

  .vttg-docs-article :deep(a) {
    color: var(--ui-primary);
    text-decoration: underline;
    text-decoration-color: color-mix(
      in oklab,
      var(--ui-primary) 40%,
      transparent
    );
    text-underline-offset: 3px;
  }

  .vttg-docs-article :deep(a:hover) {
    text-decoration-color: var(--ui-primary);
  }

  .vttg-docs-article :deep(strong) {
    font-weight: 600;
    color: var(--ui-text-highlighted);
  }

  .vttg-docs-article :deep(blockquote) {
    padding: 0.25rem 0 0.25rem 1rem;
    border-left: 3px solid var(--ui-border-accented);
    color: var(--ui-text-toned);
  }

  .vttg-docs-article :deep(hr) {
    margin: 2rem 0;
    border-color: var(--ui-border);
  }

  .vttg-docs-article :deep(code) {
    padding: 0.125rem 0.375rem;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);

    font-family: var(--font-mono);
    font-size: 0.85em;
    color: var(--ui-text-highlighted);

    background: var(--ui-bg-elevated);
  }

  .vttg-docs-article :deep(pre) {
    overflow-x: auto;

    padding: 0.75rem 1rem;
    border: 1px solid var(--ui-border);
    border-radius: calc(var(--ui-radius) * 1.5);

    line-height: 1.6;

    background: var(--ui-bg-elevated);
  }

  .vttg-docs-article :deep(pre code) {
    padding: 0;
    border: 0;
    font-size: 0.8125rem;
    background: transparent;
  }

  .vttg-docs-article :deep(.vttg-docs-table) {
    overflow-x: auto;
    border: 1px solid var(--ui-border);
    border-radius: calc(var(--ui-radius) * 1.5);
  }

  .vttg-docs-article :deep(table) {
    border-collapse: collapse;
    width: 100%;
    font-size: 0.875rem;
  }

  .vttg-docs-article :deep(th),
  .vttg-docs-article :deep(td) {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--ui-border);
    text-align: left;
    vertical-align: top;
  }

  .vttg-docs-article :deep(th) {
    font-weight: 600;
    color: var(--ui-text-highlighted);
    background: var(--ui-bg-elevated);
  }

  .vttg-docs-article :deep(tr:last-child td) {
    border-bottom: 0;
  }

  .vttg-docs-article :deep(img) {
    max-width: 100%;
    border-radius: calc(var(--ui-radius) * 1.5);
  }
</style>
