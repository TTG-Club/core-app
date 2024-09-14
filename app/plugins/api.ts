import { USER_TOKEN_COOKIE } from '~~/shared/utils/const';
import type { $Fetch } from 'nitropack';

declare module '#app' {
  interface NuxtApp {
    $api: $Fetch;
  }
}

export default defineNuxtPlugin(() => {
  const userToken = useCookie<string | null>(USER_TOKEN_COOKIE, {
    default: () => null,
  });

  const instance = $fetch.create({
    baseURL: '/api/v2',
    onRequest({ options }) {
      if (userToken.value) {
        // eslint-disable-next-line no-param-reassign
        const headers = (options.headers ||= {});

        if (Array.isArray(headers)) {
          headers.push(['Authorization', `Bearer ${userToken.value}`]);
        } else if (headers instanceof Headers) {
          headers.set('Authorization', `Bearer ${userToken.value}`);
        } else {
          headers.Authorization = `Bearer ${userToken.value}`;
        }
      }
    },
  });

  return {
    provide: {
      api: instance,
    },
  };
});
