export interface BookDetail {
  name: {
    rus: string;
    eng: string;
    alt?: string;
    short: string;
  };
  description?: string;
  year: number;
  type: string;
  image?: string;
  author: Array<string>;
  translation: Array<string>;
  tags: Array<string>;
}
