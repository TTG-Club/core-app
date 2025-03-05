export interface NameResponse {
  rus: string;
  eng: string;
  label: string;
}

export type SourceGroupResponse = Pick<NameResponse, 'rus' | 'label'>;

export interface SourceResponse {
  name: NameResponse;
  group: SourceGroupResponse;
  page: number;
}

export interface TimestampResponse {
  createdAt: string;
  updatedAt: string;
}
