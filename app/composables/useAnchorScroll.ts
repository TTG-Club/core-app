import { merge, toMerged } from 'es-toolkit';

import type {
  AnchorScrollConfiguration,
  AnchorScrollOptions,
} from '~/shared/types';

function isHTMLElement(value: unknown): value is HTMLElement {
  return value instanceof HTMLElement;
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

    const scrollByOptions: ScrollToOptions = {
      behavior: mergedOptions.behavior,
      ...(mergedOptions.offsetLeft !== undefined && {
        left: left + mergedOptions.offsetLeft,
      }),
      ...(mergedOptions.offsetTop !== undefined && {
        top: top + mergedOptions.offsetTop,
      }),
    };

    document.documentElement.scrollBy(scrollByOptions);
    document.body.scrollBy(scrollByOptions);

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
