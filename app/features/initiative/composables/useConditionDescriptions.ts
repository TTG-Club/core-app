import type { ConditionDescriptionStatus } from '~initiative/model';
import type { RenderNode } from '~ui/markup';

import { fetchConditionDescription } from '~initiative/model';

/**
 * Описания состояний из глоссария — по требованию и с общим кэшем (useState):
 * статья грузится, только когда описание впервые показали, и одна на всех
 * участников и все открытия окна. Повторный запрос — лишь после сбоя.
 */
export function useConditionDescriptions() {
  const descriptions = useState<Record<string, Array<RenderNode>>>(
    'initiative-condition-descriptions',
    () => ({}),
  );

  const statuses = useState<Record<string, ConditionDescriptionStatus>>(
    'initiative-condition-description-statuses',
    () => ({}),
  );

  /**
   * Загружает описание состояния, если оно ещё не загружено и не грузится.
   * @param glossaryUrl Адрес статьи глоссария.
   */
  async function load(glossaryUrl: string): Promise<void> {
    const status = statuses.value[glossaryUrl];

    if (status === 'pending' || status === 'success') {
      return;
    }

    statuses.value = { ...statuses.value, [glossaryUrl]: 'pending' };

    try {
      const description = await fetchConditionDescription(glossaryUrl);

      descriptions.value = {
        ...descriptions.value,
        [glossaryUrl]: description,
      };

      statuses.value = { ...statuses.value, [glossaryUrl]: 'success' };
    } catch {
      statuses.value = { ...statuses.value, [glossaryUrl]: 'error' };
    }
  }

  // Наружу — только чтение: кэш пополняет одна `load`, иначе статусы и
  // описания разойдутся.
  return {
    descriptions: computed(() => descriptions.value),
    statuses: computed(() => statuses.value),
    load,
  };
}
