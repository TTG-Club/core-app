import type { VttgDocsHeading } from '#shared/types';

import type { VttgDocsHeadingPosition } from '../model';

import {
  findVttgDocsActiveHeadingId,
  VTTG_DOCS_ACTIVE_HEADING_OFFSET,
  VTTG_DOCS_ACTIVE_HEADING_THROTTLE,
  VTTG_DOCS_PAGE_BOTTOM_TOLERANCE,
} from '../model';

/**
 * Положения заголовков статьи на экране. Заголовок, которого нет в разметке,
 * пропускается.
 *
 * @param headings заголовки страницы
 */
function readHeadingPositions(
  headings: VttgDocsHeading[],
): VttgDocsHeadingPosition[] {
  return headings.flatMap((heading) => {
    const headingElement = document.getElementById(heading.id);

    return headingElement
      ? [{ id: heading.id, top: headingElement.getBoundingClientRect().top }]
      : [];
  });
}

/** Страница прокручена до самого низа. */
function isPageScrolledToBottom(): boolean {
  const { scrollHeight } = document.documentElement;

  return (
    window.innerHeight + window.scrollY
    >= scrollHeight - VTTG_DOCS_PAGE_BOTTOM_TOLERANCE
  );
}

/**
 * Заголовок статьи, который сейчас читают, — для подсветки в оглавлении
 * страницы. Пересчитывается при прокрутке окна и при смене страницы (после
 * отрисовки новой статьи).
 *
 * @param headings заголовки текущей страницы
 * @returns id текущего заголовка только для чтения
 */
export function useVttgDocsActiveHeading(
  headings: MaybeRefOrGetter<VttgDocsHeading[]>,
) {
  const activeHeadingId = ref<string>();

  /** Пересчитывает текущий заголовок по положению заголовков на экране. */
  function updateActiveHeading(): void {
    activeHeadingId.value = findVttgDocsActiveHeadingId(
      readHeadingPositions(toValue(headings)),
      VTTG_DOCS_ACTIVE_HEADING_OFFSET,
      isPageScrolledToBottom(),
    );
  }

  // Третий аргумент — последнее событие прокрутки не теряется, иначе
  // подсветка застревала бы на заголовке, с которого начали прокрутку.
  const updateActiveHeadingThrottled = useThrottleFn(
    updateActiveHeading,
    VTTG_DOCS_ACTIVE_HEADING_THROTTLE,
    true,
  );

  useEventListener('scroll', updateActiveHeadingThrottled, { passive: true });

  watch(() => toValue(headings), updateActiveHeading, { flush: 'post' });

  onMounted(updateActiveHeading);

  return { activeHeadingId: readonly(activeHeadingId) };
}
