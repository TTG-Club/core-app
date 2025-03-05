import type { NameResponse, SourceResponse } from '~/shared/types';

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
  description: string;
  image: string;
  gallery?: Array<string>;
  features: Array<{
    url: string;
    name: Pick<NameResponse, 'rus' | 'eng'>;
    description: string;
  }>;
  username: string;
  updatedAt: string;
}

export interface SpeciesCreate {
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
    speed: {
      base: number;
      fly: number | undefined;
      climb: number | undefined;
      swim: number | undefined;
      hover: boolean;
    };
  };
  features: Array<{
    name: {
      rus: string;
      eng: string;
    };
    description: string;
  }>;
  tags: Array<string>;
}
