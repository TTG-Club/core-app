import type { NameResponse, SourceResponse } from '~/shared/types';

export interface SpecieLinkResponse {
  url: string;
  name: Pick<NameResponse, 'rus' | 'eng'>;
  source: SourceResponse;
  image: string;
  updatedAt: string;
}

export interface SpecieDetailResponse {
  url: string;
  parent?: {
    url: string;
    name: Pick<NameResponse, 'rus' | 'eng'>;
  };
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

export interface SpecieCreate {
  url: string;
  name: {
    rus: string;
    eng: string;
    alt: Array<string>;
  };
  description: string;
  image: string | undefined;
  linkImage: string | undefined;
  gallery: Array<string> | undefined;
  parent: string | undefined;
  source: {
    url: string | undefined;
    page: number | undefined;
  };
  properties: {
    sizes: Array<string> | undefined;
    type: string | undefined;
    darkVision: number;
    speed: {
      base: number;
      fly: number;
      climb: number;
      swim: number;
      hover: boolean;
    };
  };
  features: Array<{
    name: string;
    description: string;
    source: {
      url: string | undefined;
      page: number | undefined;
    };
  }>;
  tags: Array<string>;
}
