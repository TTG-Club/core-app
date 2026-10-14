import type { NameResponse, SourceResponse } from '~/shared/types';
import type { EditorBaseInfoState } from '~ui/editor';

/** Код приказа бастиона — публичный контракт бэкенда (`BastionOrder`). */
export type BastionOrderCode =
  | 'CRAFT'
  | 'EMPOWER'
  | 'HARVEST'
  | 'MAINTAIN'
  | 'RECRUIT'
  | 'RESEARCH'
  | 'TRADE';

/** Код пространства сооружения (`FacilitySpace`). */
export type FacilitySpaceCode = 'CRAMPED' | 'ROOMY' | 'VAST';

/** Код вида сооружения (`FacilityCategory`). */
export type FacilityCategoryCode = 'BASIC' | 'SPECIAL';

/** Значение справочника бастиона: код и русская подпись. */
export interface BastionLabel<TValue extends string = string> {
  value: TValue;
  name: string;
}

export interface FacilitySpaceResponse extends BastionLabel<FacilitySpaceCode> {
  squares: number;
}

/** Вариант исполнения приказа в сооружении. */
export interface FacilityOrderOption {
  order: BastionOrderCode | null;
  name: string | null;
  description: string | null;
  days: number | null;
  cost: number | null;
  costNote: string | null;
  minLevel: number | null;
}

/** Расширение сооружения. */
export interface FacilityEnlargement {
  space: FacilitySpaceCode | null;
  cost: number | null;
  days: number | null;
  additionalHirelings: number | null;
  description: string | null;
}

/** Постоянное свойство сооружения. */
export interface FacilityFeature {
  name: string | null;
  description: string | null;
}

export interface FacilityChoiceOption {
  name: string | null;
  description: string | null;
}

/** Выбор игрока для своего сооружения: тип сада, мастер и т.п. */
export interface FacilityChoice {
  name: string | null;
  description: string | null;
  count: number | null;
  enlargedCount: number | null;
  options: Array<FacilityChoiceOption>;
}

export interface BastionFacilityLinkResponse {
  url: string;
  name: NameResponse;
  source: SourceResponse;
  category?: BastionLabel<FacilityCategoryCode>;
  level?: number;
  prerequisite?: BastionLabel;
  space?: FacilitySpaceResponse;
  orders?: Array<BastionLabel<BastionOrderCode>>;
}

export interface BastionFacilityDetailResponse {
  url: string;
  name: NameResponse;
  source: SourceResponse;
  description: Array<string>;
  updatedAt: string;
  category?: BastionLabel<FacilityCategoryCode>;
  level?: number;
  prerequisite?: BastionLabel;
  space?: FacilitySpaceResponse;
  hirelings?: number;
  repeatable?: boolean;
  orders?: Array<BastionLabel<BastionOrderCode>>;
  orderOptions?: Array<FacilityOrderOption>;
  enlargement?: FacilityEnlargement;
  features?: Array<FacilityFeature>;
  choices?: Array<FacilityChoice>;
}

/*
 * Типы формы. Бэкенд отдаёт пустые поля как `null`, а текстовые поля и селекты
 * Nuxt UI принимают только `undefined`, поэтому у формы свои типы: строки и
 * коды — необязательные, числа — `number | null`, как у `UInputNumber`.
 * `null` из загруженной записи снимает `normalizeLoadedBastion`.
 */

export interface FacilityOrderOptionForm {
  order?: BastionOrderCode;
  name?: string;
  description?: string;
  days: number | null;
  cost: number | null;
  costNote?: string;
  minLevel: number | null;
}

export interface FacilityEnlargementForm {
  space?: FacilitySpaceCode;
  cost: number | null;
  days: number | null;
  additionalHirelings: number | null;
  description?: string;
}

export interface FacilityFeatureForm {
  name?: string;
  description?: string;
}

export interface FacilityChoiceOptionForm {
  name?: string;
  description?: string;
}

export interface FacilityChoiceForm {
  name?: string;
  description?: string;
  count: number | null;
  enlargedCount: number | null;
  options: Array<FacilityChoiceOptionForm>;
}

/** Состояние формы сооружения — то же, что отдаёт `GET /bastions/{url}/raw`. */
export interface BastionFacilityCreate extends EditorBaseInfoState {
  description: string;
  category: FacilityCategoryCode | undefined;
  level: number | undefined;
  prerequisite: string | undefined;
  space: FacilitySpaceCode | undefined;
  hirelings: number | null;
  repeatable: boolean;
  orders: Array<BastionOrderCode>;
  orderOptions: Array<FacilityOrderOptionForm>;
  /** `null` — сооружение не расширяется. */
  enlargement: FacilityEnlargementForm | null;
  features: Array<FacilityFeatureForm>;
  choices: Array<FacilityChoiceForm>;
}
