import type { SelectOption } from '~/shared/types';
import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';

export const sizes = <R extends NitroFetchRequest>(
  config?: Omit<NitroFetchOptions<R>, 'method'>,
) =>
  $fetch<Array<SelectOption>>('/api/v2/dictionaries/sizes', {
    ...config,
    method: 'get',
  });

export const schools = <R extends NitroFetchRequest>(
  config?: Omit<NitroFetchOptions<R>, 'method'>,
) =>
  $fetch<Array<SelectOption>>('/api/v2/dictionaries/schools', {
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

export const distanceTypes = <R extends NitroFetchRequest>(
  config?: Omit<NitroFetchOptions<R>, 'method'>,
) =>
  $fetch<Array<SelectOption>>('/api/v2/dictionaries/distance/types', {
    ...config,
    method: 'get',
  });

export const durationTypes = <R extends NitroFetchRequest>(
  config?: Omit<NitroFetchOptions<R>, 'method'>,
) =>
  $fetch<Array<SelectOption>>('/api/v2/dictionaries/duration/types', {
    ...config,
    method: 'get',
  });

export const timeTypes = <R extends NitroFetchRequest>(
  config?: Omit<NitroFetchOptions<R>, 'method'>,
) =>
  $fetch<Array<SelectOption>>('/api/v2/dictionaries/time/types', {
    ...config,
    method: 'get',
  });
