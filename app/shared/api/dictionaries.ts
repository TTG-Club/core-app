import type { SelectOption, SelectOptionWithMeasurable } from '~/shared/types';
import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';

export const sizes = <R extends NitroFetchRequest>(
  config?: Omit<NitroFetchOptions<R>, 'method'>,
) =>
  $fetch<Array<SelectOption>>('/api/v2/dictionaries/sizes', {
    ...config,
    method: 'get',
  });

export const magicSchools = <R extends NitroFetchRequest>(
  config?: Omit<NitroFetchOptions<R>, 'method'>,
) =>
  $fetch<Array<SelectOption>>('/api/v2/dictionaries/magic-schools', {
    ...config,
    method: 'get',
  });

export const creatureTypes = <R extends NitroFetchRequest>(
  config?: Omit<NitroFetchOptions<R>, 'method'>,
) =>
  $fetch<Array<SelectOption>>('/api/v2/dictionaries/creature/types', {
    ...config,
    method: 'get',
  });

export const rangeTypes = <R extends NitroFetchRequest>(
  config?: Omit<NitroFetchOptions<R>, 'method'>,
) =>
  $fetch<Array<SelectOptionWithMeasurable>>(
    '/api/v2/dictionaries/distance/types',
    {
      ...config,
      method: 'get',
    },
  );

export const timeUnits = <R extends NitroFetchRequest>(
  config?: Omit<NitroFetchOptions<R>, 'method'>,
) =>
  $fetch<Array<SelectOptionWithMeasurable>>('/api/v2/dictionaries/time-units', {
    ...config,
    method: 'get',
  });

export const durationUnits = <R extends NitroFetchRequest>(
  config?: Omit<NitroFetchOptions<R>, 'method'>,
) =>
  $fetch<Array<SelectOptionWithMeasurable>>(
    '/api/v2/dictionaries/duration-units',
    {
      ...config,
      method: 'get',
    },
  );

export const comparisonOperators = <R extends NitroFetchRequest>(
  config?: Omit<NitroFetchOptions<R>, 'method'>,
) =>
  $fetch<Array<SelectOption>>('/api/v2/dictionaries/comparison-operators', {
    ...config,
    method: 'get',
  });
