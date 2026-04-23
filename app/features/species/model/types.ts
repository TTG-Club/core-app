import type { JSONContent } from '@tiptap/core';

import type { NameResponse, SourceResponse } from '~/shared/types';
import type { EditorBaseInfoState } from '~ui/editor';

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
  hasLineages?: boolean;
  name: NameResponse;
  source: SourceResponse;
  properties: SpeciesProperties;
  description: JSONContent;
  image: string;
  gallery?: Array<string>;
  features?: Array<{
    url: string;
    name: NameResponse;
    description: JSONContent;
  }>;
  username: string;
  updatedAt: string;
}

export interface SpeciesProperties {
  size: string;
  type: string;
  speed: string;
}

export interface SpeciesCreate extends EditorBaseInfoState {
  description: JSONContent;
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
    description: JSONContent;
  }>;
}

export interface SpeciesCreateSpeed {
  base: number;
  fly: number | undefined;
  climb: number | undefined;
  swim: number | undefined;
  hover: boolean;
}
