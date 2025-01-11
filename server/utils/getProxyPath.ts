import type { H3Event } from 'h3';

export const getProxyPath = (event: H3Event) => {
  const {
    api: { url },
  } = useRuntimeConfig();

  return url + event.path;
};
