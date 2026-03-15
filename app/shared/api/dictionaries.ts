import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';

import type {
  AbilitySelectOption,
  ArmorCategorySelectOption,
  CasterSelectOption,
  ChallengeRatingSelectOption,
  DiceSelectOption,
  SelectOption,
  SelectOptionWithMeasurable,
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
  HABITATS = '/api/v2/dictionaries/habitats',
  TREASURES = '/api/v2/dictionaries/treasures',
  ITEM_TYPES = '/api/v2/dictionaries/item/types',
  COINS = '/api/v2/dictionaries/coins',
  DICES = '/api/v2/dictionaries/dices',
  CASTER_TYPES = '/api/v2/dictionaries/caster-types',
  ARMOR_CATEGORIES = '/api/v2/dictionaries/armor/categories',
  WEAPON_CATEGORIES = '/api/v2/dictionaries/weapon/categories',
  SOURCE_TYPES = '/api/v2/dictionaries/source/types',
}

class Dictionaries {
  sizes = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<SelectOption>> => {
    return $fetch(DictionaryEndpoints.SIZES, {
      ...config,
      method: 'get',
    });
  };

  magicSchools = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<SelectOption>> => {
    return $fetch(DictionaryEndpoints.MAGIC_SCHOOLS, {
      ...config,
      method: 'get',
    });
  };

  creatureTypes = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<SelectOption>> => {
    return $fetch(DictionaryEndpoints.CREATURE_TYPES, {
      ...config,
      method: 'get',
    });
  };

  damageTypes = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<SelectOption>> => {
    return $fetch(DictionaryEndpoints.DAMAGE_TYPES, {
      ...config,
      method: 'get',
    });
  };

  healTypes = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<SelectOption>> => {
    return $fetch(DictionaryEndpoints.HEAL_TYPES, {
      ...config,
      method: 'get',
    });
  };

  rangeTypes = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<SelectOptionWithMeasurable>> => {
    return $fetch(DictionaryEndpoints.RANGE_TYPES, {
      ...config,
      method: 'get',
    });
  };

  timeUnits = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<SelectOptionWithMeasurable>> => {
    return $fetch(DictionaryEndpoints.TIME_UNITS, {
      ...config,
      method: 'get',
    });
  };

  durationUnits = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<SelectOptionWithMeasurable>> => {
    return $fetch(DictionaryEndpoints.DURATION_UNITS, {
      ...config,
      method: 'get',
    });
  };

  comparisonOperators = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<SelectOption>> => {
    return $fetch(DictionaryEndpoints.COMPARISON_OPERATORS, {
      ...config,
      method: 'get',
    });
  };

  featCategories = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<SelectOption>> => {
    return $fetch(DictionaryEndpoints.FEAT_CATEGORIES, {
      ...config,
      method: 'get',
    });
  };

  abilities = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<AbilitySelectOption>> => {
    return $fetch(DictionaryEndpoints.ABILITIES, {
      ...config,
      method: 'get',
    });
  };

  skills = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<SkillSelectOption>> => {
    return $fetch(DictionaryEndpoints.SKILLS, {
      ...config,
      method: 'get',
    });
  };

  magicItemCategory = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<SelectOption>> => {
    return $fetch(DictionaryEndpoints.MAGIC_ITEM_CATEGORY, {
      ...config,
      method: 'get',
    });
  };

  rarity = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<SelectOption>> => {
    return $fetch(DictionaryEndpoints.RARITY, {
      ...config,
      method: 'get',
    });
  };

  alignments = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<SelectOption>> => {
    return $fetch(DictionaryEndpoints.ALIGNMENTS, {
      ...config,
      method: 'get',
    });
  };

  conditions = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<SelectOption>> => {
    return $fetch(DictionaryEndpoints.CONDITIONS, {
      ...config,
      method: 'get',
    });
  };

  challengeRating = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<ChallengeRatingSelectOption>> => {
    return $fetch<Array<ChallengeRatingSelectOption>>(
      DictionaryEndpoints.CHALLENGE_RATING,
      {
        ...config,
        method: 'get',
      },
    );
  };

  languages = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<SelectOption>> => {
    return $fetch(DictionaryEndpoints.LANGUAGES, {
      ...config,
      method: 'get',
    });
  };

  habitats = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<SelectOption>> => {
    return $fetch(DictionaryEndpoints.HABITATS, {
      ...config,
      method: 'get',
    });
  };

  treasures = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<SelectOption>> => {
    return $fetch(DictionaryEndpoints.TREASURES, {
      ...config,
      method: 'get',
    });
  };

  itemTypes = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<SelectOption>> => {
    return $fetch(DictionaryEndpoints.ITEM_TYPES, {
      ...config,
      method: 'get',
    });
  };

  coins = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<SelectOption>> => {
    return $fetch(DictionaryEndpoints.COINS, {
      ...config,
      method: 'get',
    });
  };

  dices = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<DiceSelectOption>> => {
    return $fetch(DictionaryEndpoints.DICES, {
      ...config,
      method: 'get',
    });
  };

  casterTypes = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<CasterSelectOption>> => {
    return $fetch(DictionaryEndpoints.CASTER_TYPES, {
      ...config,
      method: 'get',
    });
  };

  armorCategories = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<ArmorCategorySelectOption>> => {
    return $fetch(DictionaryEndpoints.ARMOR_CATEGORIES, {
      ...config,
      method: 'get',
    });
  };

  weaponCategories = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<SelectOption>> => {
    return $fetch(DictionaryEndpoints.WEAPON_CATEGORIES, {
      ...config,
      method: 'get',
    });
  };

  sourceTypes = <R extends NitroFetchRequest>(
    config: Omit<NitroFetchOptions<R>, 'method'> = {},
  ): Promise<Array<SelectOption>> => {
    return $fetch(DictionaryEndpoints.SOURCE_TYPES, {
      ...config,
      method: 'get',
    });
  };
}

export const DictionaryService = new Dictionaries();
