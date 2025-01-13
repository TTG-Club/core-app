import type { SelectOption } from '#shared/types/dictionaries';
import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';

export const sizes = <R extends NitroFetchRequest>(
  config?: Omit<NitroFetchOptions<R>, 'method'>,
) =>
  $fetch<Array<SelectOption>>('/api/v2/dictionaries/sizes', {
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
