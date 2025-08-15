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
  tags: Array<string>;
}
