import type { NuxtError } from '#app';
import type { Filter } from '~infrastructure/filter/types';

export interface NameResponse {
  rus: string;
  eng: string;
}

export interface SourceGroupResponse {
  rus: string;
  label: string;
}

export interface SourceResponse {
  name: {
    rus: string;
    eng: string;
    label: string;
  };
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

/**
 * Ошибка серверных ручек `/api/**`: в теле приходит текст сообщения, который
 * показываем пользователю. Указывается вторым дженериком `useFetch`, иначе
 * `error.data` выводится как `unknown`.
 */
export type ApiFetchError = NuxtError<{ message?: string }>;
