declare module '#app' {
  interface PageMeta {
    auth?: {
      roles?: Array<string>;
    };
  }
}

// It is always important to ensure you import/export something when augmenting a type
export {};
