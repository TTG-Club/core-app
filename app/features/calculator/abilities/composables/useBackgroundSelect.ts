import { ABILITY_LABELS, isAbilityKey } from '~/shared/types';

import type {
  CalculatorAbilitiesBackground,
  CalculatorBackgroundOption,
} from '../model';

/**
 * Composable для выбора предыстории и расчёта бонусов характеристик.
 *
 * @returns Объект с реактивным состоянием выбора и опциями для селекта.
 */
export function useBackgroundSelect() {
  const selectedUrl = ref<string>();

  const { data: backgrounds, pending } = useFetch<
    CalculatorAbilitiesBackground[]
  >('/api/v2/backgrounds/select', {
    dedupe: 'defer',
    lazy: true,
    default: () => [],
  });

  const backgroundsByUrl = computed(() => {
    const map: Record<string, CalculatorAbilitiesBackground> = {};

    if (backgrounds.value) {
      for (const background of backgrounds.value) {
        map[background.url] = background;
      }
    }

    return map;
  });

  const options = computed<CalculatorBackgroundOption[]>(() => {
    return backgrounds.value?.map(mapBackgroundToOption) || [];
  });

  const current = computed(() => {
    if (!selectedUrl.value) {
      return undefined;
    }

    return backgroundsByUrl.value[selectedUrl.value];
  });

  return {
    selectedUrl,
    pending,
    options,
    current,
  };
}

function mapBackgroundToOption(
  background: CalculatorAbilitiesBackground,
): CalculatorBackgroundOption {
  const abilities =
    background.abilityScores
      ?.filter(isAbilityKey)
      .map((key) => ABILITY_LABELS[key])
      .join(', ') || '';

  const description = [background.name.eng, abilities]
    .filter(Boolean)
    .join(' • ');

  return {
    label: background.name.rus,
    value: background.url,
    description,
    sourceLabel: background.source.name.label,
  };
}
