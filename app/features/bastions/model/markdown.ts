import type { MarkdownStat } from '~ui/markup';

import type { BastionFacilityDetailResponse } from './types';

import { buildMarkdownEntity } from '~ui/markup';

import { BASTION_BODY_LABELS } from './constants';
import {
  getFacilitySubtitle,
  getOrderOptionTerms,
  getSpaceText,
} from './utils';

/**
 * Собирает сооружение бастиона в Markdown формата Homebrewery.
 *
 * @param facility - Сооружение с бэкенда
 * @returns Markdown-текст сооружения
 */
export function getBastionFacilityMarkdown(
  facility: BastionFacilityDetailResponse,
): string {
  const stats: Array<MarkdownStat> = [
    [
      BASTION_BODY_LABELS.prerequisite,
      facility.prerequisite?.name ?? BASTION_BODY_LABELS.noPrerequisite,
    ],
    [BASTION_BODY_LABELS.space, getSpaceText(facility)],
    [BASTION_BODY_LABELS.hirelings, facility.hirelings?.toString()],
    [
      BASTION_BODY_LABELS.orders,
      facility.orders?.map((order) => order.name).join(', '),
    ],
  ];

  const options = (facility.orderOptions ?? []).map((option) => {
    const terms = getOrderOptionTerms(option);
    const title = [option.name, terms ? `(${terms})` : ''].filter(Boolean);

    return `***${title.join(' ')}.*** ${option.description ?? ''}`.trim();
  });

  return buildMarkdownEntity({
    name: facility.name.rus,
    nameEng: facility.name.eng,
    subtitle: getFacilitySubtitle(facility),
    stats,
    source: facility.source,
    description: facility.description,
    extra: options,
  });
}
