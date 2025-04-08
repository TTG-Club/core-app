import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import type { SelectOption, SelectOptionWithMeasurable } from '~/shared/types';

function useDictionaries() {
  const sizes = <R extends NitroFetchRequest>(
    config?: Omit<NitroFetchOptions<R>, 'method'>,
  ) =>
    $fetch<Array<SelectOption>>('/api/v2/dictionaries/sizes', {
      ...config,
      method: 'get',
    });

  const magicSchools = <R extends NitroFetchRequest>(
    config?: Omit<NitroFetchOptions<R>, 'method'>,
  ) =>
    $fetch<Array<SelectOption>>('/api/v2/dictionaries/magic-schools', {
      ...config,
      method: 'get',
    });

  const creatureTypes = <R extends NitroFetchRequest>(
    config?: Omit<NitroFetchOptions<R>, 'method'>,
  ) =>
    $fetch<Array<SelectOption>>('/api/v2/dictionaries/creature/types', {
      ...config,
      method: 'get',
    });

  const rangeTypes = <R extends NitroFetchRequest>(
    config?: Omit<NitroFetchOptions<R>, 'method'>,
  ) =>
    $fetch<Array<SelectOptionWithMeasurable>>(
      '/api/v2/dictionaries/distance/types',
      {
        ...config,
        method: 'get',
      },
    );

  const timeUnits = <R extends NitroFetchRequest>(
    config?: Omit<NitroFetchOptions<R>, 'method'>,
  ) =>
    $fetch<Array<SelectOptionWithMeasurable>>(
      '/api/v2/dictionaries/time-units',
      {
        ...config,
        method: 'get',
      },
    );

  const durationUnits = <R extends NitroFetchRequest>(
    config?: Omit<NitroFetchOptions<R>, 'method'>,
  ) =>
    $fetch<Array<SelectOptionWithMeasurable>>(
      '/api/v2/dictionaries/duration-units',
      {
        ...config,
        method: 'get',
      },
    );

  const comparisonOperators = <R extends NitroFetchRequest>(
    config?: Omit<NitroFetchOptions<R>, 'method'>,
  ) =>
    $fetch<Array<SelectOption>>('/api/v2/dictionaries/comparison-operators', {
      ...config,
      method: 'get',
    });

  const featCategories = <R extends NitroFetchRequest>(
    config?: Omit<NitroFetchOptions<R>, 'method'>,
  ) =>
    $fetch<Array<SelectOption>>('/api/v2/dictionaries/feat/types', {
      ...config,
      method: 'get',
    });

  return {
    sizes,
    magicSchools,
    creatureTypes,
    rangeTypes,
    timeUnits,
    durationUnits,
    comparisonOperators,
    featCategories,
  };
}

export const Dictionaries = useDictionaries();
