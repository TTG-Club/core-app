import type { UseFetchOptions } from 'nuxt/app';
import { merge } from 'lodash-es';

export type UseProxyOptions<T> = Omit<UseFetchOptions<T>, '$fetch'>;

export function useProxy<T>(
  url: string | (() => string),
  options?: UseProxyOptions<T>,
) {
  const { $proxy } = useNuxtApp();

  const mergedOptions: UseProxyOptions<T> = merge<
    UseFetchOptions<T>,
    UseProxyOptions<T>
  >(
    {
      $fetch: $proxy,
    },
    options || {},
  );

  return useFetch(url, mergedOptions);
}
