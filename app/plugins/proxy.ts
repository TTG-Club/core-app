import type { $Fetch } from 'nitropack';

declare module '#app' {
  interface NuxtApp {
    $proxy: $Fetch;
  }
}

export default defineNuxtPlugin(() => {
  const instance = $fetch.create({
    baseURL: `/proxy/api/v1`,
  });

  return {
    provide: {
      proxy: instance,
    },
  };
});
