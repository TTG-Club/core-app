import type { NameResponse, SourceResponse } from '~/shared/types';
import type { ActiveEffect } from '~active-effects/model';
import type { FeatEditorRows, FeatMechanics } from '~feats/model';
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
  features?: Array<{
    url: string;
    name: NameResponse;
    description: Array<string>;
  }>;
  username: string;
  updatedAt: string;
}

export interface SpeciesProperties {
  size: string;
  type: string;
  speed: string;

  /** Дальность тёмного зрения в футах; не задано — вид его не имеет. */
  darkVision?: number;
}

/**
 * Умение вида в форме мастерской.
 *
 * Механика и эффекты живут у умения, а не только у записи: игроку важно, какое
 * именно умение дало владение или бонус, и лист персонажа подписывает выдачу
 * названием умения.
 */
export interface SpeciesFeatureCreate {
  name: {
    rus: string;
    eng: string;
  };
  description: string;

  /** Уровень персонажа, с которого умение действует; не задан — с первого. */
  level: number | undefined;

  /**
   * Дары умения моделью черты — той же, что лежит в core-api
   * (`SpeciesFeature.mechanics`): набор даров у черты и вида один, и вторая
   * копия тех же полей разошлась бы с первой.
   */
  mechanics: FeatMechanics | undefined;

  /** Активные эффекты умения в вокабуляре VTTG. */
  activeEffects: Array<ActiveEffect>;

  /**
   * Строки редактора даров умения. Форма правит их, а не блоки механики; перед
   * отправкой из них пересобирается `mechanics`, а само поле обнуляется.
   */
  editorRows: FeatEditorRows | undefined;
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

    /**
     * Дальность тёмного зрения в футах.
     *
     * Своим полем, а не чувством в механике умения: тёмное зрение есть у
     * половины видов справочника, лист показывает его в шапке рядом со
     * скоростью, а выгрузка компендиума ждёт его наградой вида. Чувства, что
     * вид даёт умением, живут в дарах этого умения.
     */
    darkVision: number | undefined;
  };
  features: Array<SpeciesFeatureCreate>;
  innateSpells: Array<{
    spell: string;
    requiredLevel: number;
  }>;

  /**
   * Дары самой записи: то, что даёт выбор вида или происхождения целиком.
   *
   * Нужны прежде всего происхождениям: умений у них нет — правило целиком лежит
   * в описании, — и приписать сопротивление инфернального тифлинга было бы
   * некуда.
   */
  mechanics: FeatMechanics | undefined;

  /** Активные эффекты самой записи в вокабуляре VTTG. */
  activeEffects: Array<ActiveEffect>;

  /** Строки редактора даров записи; в теле запроса им места нет. */
  editorRows: FeatEditorRows | undefined;
}

export interface SpeciesCreateSpeed {
  base: number;
  fly: number | undefined;
  climb: number | undefined;
  swim: number | undefined;
  hover: boolean;
}
