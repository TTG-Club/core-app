declare module 'nuxt/schema' {
  interface RuntimeConfig {
    online: {
      apiToken: string;
      apiUrl: string;
      siteId: string;
    };
  }
}

export {};
