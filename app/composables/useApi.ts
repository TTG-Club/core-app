import type { UseFetchOptions } from '#app';
import { merge } from 'lodash-es';

export type UseApiOptions<T> = Omit<UseFetchOptions<T>, '$fetch'>;

export function useApi<T>(
  url: string | (() => string),
  options?: UseApiOptions<T>,
) {
  const { $api } = useNuxtApp();

  const mergedOptions: UseApiOptions<T> = merge<
    UseFetchOptions<T>,
    UseApiOptions<T>
  >(
    {
      $fetch: $api,
    },
    options || {},
  );

  return useFetch(url, mergedOptions);
}
