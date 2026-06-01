import type {
  AnchorScrollConfiguration,
  AnchorScrollOptions,
} from '~/shared/types';

import { merge, toMerged } from 'es-toolkit';

function isHTMLElement(value: unknown): value is HTMLElement {
  return value instanceof HTMLElement;
}

/**
 * Проверяет, может ли элемент прокручиваться по вертикали.
 */
function isScrollable(element: HTMLElement): boolean {
  const { overflowY } = window.getComputedStyle(element);

  const canScrollY =
    overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay';

  return canScrollY && element.scrollHeight > element.clientHeight;
}

/**
 * Находит ближайшего прокручиваемого предка элемента.
 * В дровере и в режиме «во всю ширину» якорь лежит внутри своего
 * контейнера со скроллом, а не документа. Если такого предка нет
 * (стандартный просмотр) — возвращает корень документа.
 */
function getScrollParent(element: HTMLElement): HTMLElement {
  let current = element.parentElement;

  while (current && current !== document.body) {
    if (isScrollable(current)) {
      return current;
    }

    current = current.parentElement;
  }

  return document.documentElement;
}

export function useAnchorScroll(config?: AnchorScrollConfiguration) {
  const resultConfig: AnchorScrollConfiguration = merge(
    {
      toAnchor: {
        behavior: 'smooth',
        offsetTop: -16,
      },
      toTop: {
        behavior: 'instant',
        offsetTop: 0,
      },
    },
    config ?? {},
  );

  const scrollToAnchor = (
    target: MaybeRefOrGetter<HTMLElement | string>,
    options?: AnchorScrollOptions,
  ): boolean => {
    const maybeElement = toValue(target);

    let anchorElement: HTMLElement | null;

    if (isHTMLElement(maybeElement)) {
      anchorElement = maybeElement;
    } else {
      anchorElement = document.getElementById(maybeElement.replace(/^#/, ''));
    }

    if (!anchorElement) {
      return false;
    }

    const { top, left } = anchorElement.getBoundingClientRect();
    const defaultOptions = toValue(resultConfig.toAnchor);
    const mergedOptions = toMerged(defaultOptions ?? {}, options ?? {});

    // Скроллим именно тот контейнер, в котором лежит якорь: документ
    // в стандартном просмотре или панель/дровер в остальных режимах.
    const scrollContainer = getScrollParent(anchorElement);
    const isDocumentScroll = scrollContainer === document.documentElement;

    const containerRect = isDocumentScroll
      ? { top: 0, left: 0 }
      : scrollContainer.getBoundingClientRect();

    const scrollByOptions: ScrollToOptions = {
      behavior: mergedOptions.behavior,
      ...(mergedOptions.offsetLeft !== undefined && {
        left: left - containerRect.left + mergedOptions.offsetLeft,
      }),
      ...(mergedOptions.offsetTop !== undefined && {
        top: top - containerRect.top + mergedOptions.offsetTop,
      }),
    };

    if (isDocumentScroll) {
      document.documentElement.scrollBy(scrollByOptions);
      document.body.scrollBy(scrollByOptions);
    } else {
      scrollContainer.scrollBy(scrollByOptions);
    }

    return true;
  };

  const scrollToTop = (options?: AnchorScrollOptions) => {
    const defaultOptions = toValue(resultConfig.toTop);
    const mergedOptions = toMerged(defaultOptions ?? {}, options ?? {});

    const scrollToOptions: ScrollToOptions = {
      behavior: mergedOptions.behavior,
      left: mergedOptions.offsetLeft,
      top: mergedOptions.offsetTop,
    };

    document.documentElement.scrollTo(scrollToOptions);
    document.body.scrollTo(scrollToOptions);
  };

  return {
    scrollToAnchor,
    scrollToTop,
  };
}
