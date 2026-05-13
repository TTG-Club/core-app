export interface EditorBaseInfoState {
  url: string;
  name: {
    rus: string;
    eng: string;
    alt: Array<string>;
  };
  source: {
    url: string | undefined;
    page: number | undefined;
  };
  srdVersion: string | undefined;
  tags: Array<string>;
}
