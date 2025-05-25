import type { NameResponse, SourceResponse } from '~/shared/types';
import type { EditorBaseInfoState } from '~ui/editor';

export interface SpeciesLinkResponse {
  url: string;
  name: Pick<NameResponse, 'rus' | 'eng'>;
  source: SourceResponse;
  image: string;
  updatedAt: string;
  hasLineages?: boolean;
}

export interface SpeciesDetailResponse {
  url: string;
  parent?: {
    url: string;
    name: Pick<NameResponse, 'rus' | 'eng'>;
  };
  hasLineages?: boolean;
  name: Pick<NameResponse, 'rus' | 'eng'>;
  source: SourceResponse;
  properties: {
    size: string;
    type: string;
    speed: string;
  };
  description: Array<string>;
  image: string;
  gallery?: Array<string>;
  features?: Array<{
    url: string;
    name: Pick<NameResponse, 'rus' | 'eng'>;
    description: Array<string>;
  }>;
  username: string;
  updatedAt: string;
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
  };
  features: Array<{
    name: {
      rus: string;
      eng: string;
    };
    description: string;
  }>;
}

export interface SpeciesCreateSpeed {
  base: number;
  fly: number | undefined;
  climb: number | undefined;
  swim: number | undefined;
  hover: boolean;
}
