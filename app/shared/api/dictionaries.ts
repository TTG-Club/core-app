import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import type {
  AbilitySelectOption,
  SelectOption,
  SelectOptionWithMeasurable,
  ChallengeRatingSelectOption,
  SkillSelectOption,
} from '~/shared/types';

// Эндпоинты API
enum DictionaryEndpoints {
  SIZES = '/api/v2/dictionaries/sizes',
  MAGIC_SCHOOLS = '/api/v2/dictionaries/magic-schools',
  CREATURE_TYPES = '/api/v2/dictionaries/creature/types',
  DAMAGE_TYPES = '/api/v2/dictionaries/damage/types',
  HEAL_TYPES = '/api/v2/dictionaries/heal/types',
  RANGE_TYPES = '/api/v2/dictionaries/distance/types',
  TIME_UNITS = '/api/v2/dictionaries/time-units',
  DURATION_UNITS = '/api/v2/dictionaries/duration-units',
  COMPARISON_OPERATORS = '/api/v2/dictionaries/comparison-operators',
  FEAT_CATEGORIES = '/api/v2/dictionaries/feat/types',
  ABILITIES = '/api/v2/dictionaries/abilities',
  SKILLS = '/api/v2/dictionaries/skills',
  MAGIC_ITEM_CATEGORY = '/api/v2/dictionaries/magic-items/category',
  RARITY = '/api/v2/dictionaries/rarity',
  ALIGNMENTS = '/api/v2/dictionaries/alignments',
  CONDITIONS = '/api/v2/dictionaries/conditions',
  CHALLENGE_RATING = '/api/v2/dictionaries/cr',
  LANGUAGES = '/api/v2/dictionaries/languages',
}

class Dictionaries {
  public sizes = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<SelectOption>> => {
    return $fetch(DictionaryEndpoints.SIZES, {
      ...config,
      method: 'get',
    });
  };

  public magicSchools = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<SelectOption>> => {
    return $fetch(DictionaryEndpoints.MAGIC_SCHOOLS, {
      ...config,
      method: 'get',
    });
  };

  public creatureTypes = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<SelectOption>> => {
    return $fetch(DictionaryEndpoints.CREATURE_TYPES, {
      ...config,
      method: 'get',
    });
  };

  public damageTypes = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<SelectOption>> => {
    return $fetch(DictionaryEndpoints.DAMAGE_TYPES, {
      ...config,
      method: 'get',
    });
  };

  public healTypes = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<SelectOption>> => {
    return $fetch(DictionaryEndpoints.HEAL_TYPES, {
      ...config,
      method: 'get',
    });
  };

  public rangeTypes = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<SelectOptionWithMeasurable>> => {
    return $fetch(DictionaryEndpoints.RANGE_TYPES, {
      ...config,
      method: 'get',
    });
  };

  public timeUnits = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<SelectOptionWithMeasurable>> => {
    return $fetch(DictionaryEndpoints.TIME_UNITS, {
      ...config,
      method: 'get',
    });
  };

  public durationUnits = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<SelectOptionWithMeasurable>> => {
    return $fetch(DictionaryEndpoints.DURATION_UNITS, {
      ...config,
      method: 'get',
    });
  };

  public comparisonOperators = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<SelectOption>> => {
    return $fetch(DictionaryEndpoints.COMPARISON_OPERATORS, {
      ...config,
      method: 'get',
    });
  };

  public featCategories = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<SelectOption>> => {
    return $fetch(DictionaryEndpoints.FEAT_CATEGORIES, {
      ...config,
      method: 'get',
    });
  };

  public abilities = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<AbilitySelectOption>> => {
    return $fetch(DictionaryEndpoints.ABILITIES, {
      ...config,
      method: 'get',
    });
  };

  public skills = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<SkillSelectOption>> => {
    return $fetch(DictionaryEndpoints.SKILLS, {
      ...config,
      method: 'get',
    });
  };

  public magicItemCategory = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<SelectOption>> => {
    return $fetch(DictionaryEndpoints.MAGIC_ITEM_CATEGORY, {
      ...config,
      method: 'get',
    });
  };

  public rarity = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<SelectOption>> => {
    return $fetch(DictionaryEndpoints.RARITY, {
      ...config,
      method: 'get',
    });
  };

  public alignments = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<SelectOption>> => {
    return $fetch(DictionaryEndpoints.ALIGNMENTS, {
      ...config,
      method: 'get',
    });
  };

  public conditions = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<SelectOption>> => {
    return $fetch(DictionaryEndpoints.CONDITIONS, {
      ...config,
      method: 'get',
    });
  };

  public challengeRating = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<ChallengeRatingSelectOption>> => {
    return $fetch(DictionaryEndpoints.CHALLENGE_RATING, {
      ...config,
      method: 'get',
    });
  };

  public languages = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<SelectOption>> => {
    return $fetch(DictionaryEndpoints.LANGUAGES, {
      ...config,
      method: 'get',
    });
  };
}

export const DictionaryService = new Dictionaries();
