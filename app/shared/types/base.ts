import type { Filter } from '~filter/types';

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

export interface SearchBody {
  filter?: Filter;
}

export type Level =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20;
