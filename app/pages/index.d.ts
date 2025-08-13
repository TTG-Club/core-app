declare module '#app' {
  interface PageMeta {
    auth?: {
      roles?: Array<string>;
    };
    alert?: {
      icon?: string;
      title?: string;
      description: string;
      color?:
        | 'error'
        | 'info'
        | 'primary'
        | 'secondary'
        | 'success'
        | 'warning'
        | 'neutral';
    };
  }
}

// It is always important to ensure you import/export something when augmenting a type
export {};
