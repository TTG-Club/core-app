import type { NameResponse, SourceResponse } from '~/shared/types';
import type { FeatEditorRows } from '~feats/model';
import type { EditorBaseInfoState } from '~ui/editor';

import type { SpeciesMechanics } from './mechanics';

export interface SpeciesLinkResponse {
  url: string;
  name: NameResponse;
  source: SourceResponse;
  image: string;
  updatedAt: string;
  hasLineages?: boolean;
}

export interface SpeciesDetailResponse {
  url: string;
  parent?: {
    url: string;
    name: NameResponse;
  };
  species?: {
    url: string;
    name: NameResponse;
  };
  hasLineages?: boolean;
  name: NameResponse;
  source: SourceResponse;
  properties: SpeciesProperties;
  description: Array<string>;
  image: string;
  gallery?: Array<string>;
  features?: Array<SpeciesFeatureResponse>;

  /**
   * Механика самой записи: то, что даёт выбор вида или происхождения целиком.
   * Нет поля — запись лист не двигает либо двигает только своими умениями.
   */
  mechanics?: SpeciesMechanics | null;
  username: string;
  updatedAt: string;
}

/** Умение вида в детальном ответе. */
export interface SpeciesFeatureResponse {
  url: string;
  name: NameResponse;
  description: Array<string>;

  /** Уровень персонажа, с которого умение действует; нет поля — с первого. */
  level?: number | null;

  /** Механика влияния на лист; нет поля — умение только текстовое. */
  mechanics?: SpeciesMechanics | null;
}

export interface SpeciesProperties {
  size: string;
  type: string;
  speed: string;

  /** Дальность тёмного зрения в футах; нет поля — вид его не даёт. */
  darkVision?: number | null;
}

export interface SpeciesCreate extends EditorBaseInfoState {
  description: string;
  image: string | undefined;
  linkImage: string | undefined;
  gallery: Array<string>;
  parent: string | undefined;
  properties: {
    sizes: Array<{
      type: string | undefined;
      from: number | undefined;
      to: number | undefined;
    }>;
    type: string | undefined;
    speed: SpeciesCreateSpeed;
    darkVision: number | undefined;
  };
  features: Array<SpeciesCreateFeature>;

  /**
   * Механика самой записи: то, что даёт выбор вида или происхождения целиком.
   * `undefined` — запись лист не двигает либо двигает только своими умениями.
   */
  mechanics: SpeciesMechanics | undefined;

  /**
   * Строки редактора механики записи. Форма правит их, а не механику напрямую —
   * как в редакторе черт; механику из них пересобирает
   * `transformSpeciesBeforeSubmit`, и в тело запроса строки не уходят.
   */
  editorRows?: FeatEditorRows;
  innateSpells: Array<{
    spell: string;
    requiredLevel: number;
  }>;
}

/** Умение вида в форме редактора. */
export interface SpeciesCreateFeature {
  name: {
    rus: string;
    eng: string;
  };
  description: string;

  /** Уровень персонажа, с которого умение действует; `undefined` — с первого. */
  level: number | undefined;

  /** Механика влияния на лист; `undefined` — умение только текстовое. */
  mechanics: SpeciesMechanics | undefined;

  /** Строки редактора механики умения; в тело запроса не уходят. */
  editorRows?: FeatEditorRows;
}

export interface SpeciesCreateSpeed {
  base: number;
  fly: number | undefined;
  climb: number | undefined;
  swim: number | undefined;
  hover: boolean;
}
