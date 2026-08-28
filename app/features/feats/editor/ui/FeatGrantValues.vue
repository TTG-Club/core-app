<script setup lang="ts">
  import type { AbilityKey } from '~/shared/types';

  import type {
    FeatChoiceOption,
    FeatEntityRef,
    FeatGrantRowKind,
  } from '../../model';

  import { isAbilityKey } from '~/shared/types';
  import {
    SelectAbilities,
    SelectArmorCategory,
    SelectDamageType,
    SelectFeat,
    SelectItem,
    SelectLanguage,
    SelectSkills,
    SelectWeaponCategory,
    SelectWeaponMastery,
    TOOL_ITEM_TYPES,
    WEAPON_ITEM_TYPES,
  } from '~ui/select';

  import { FEAT_GRANT_VALUE_PLACEHOLDERS, toUrlList } from '../../model';

  /**
   * Значения строки дара: что выдаётся либо из чего выбирают.
   *
   * Справочник у каждого вида дара свой, поэтому и селект свой: навыки, языки и
   * оружейные приёмы приходят словарями, инструменты и оружие — каталогом
   * предметов, черты — каталогом черт. «Оружие с приёмом» выбирается видом
   * оружия: приём называется по оружию, которым владеешь. Один общий список из
   * них не собрать, зато у строки с одним видом набор целиком принадлежит этому
   * виду — селект правит его без разбора.
   */
  const { kind, featCategories = [] } = defineProps<{
    /** Вид дара строки. */
    kind: FeatGrantRowKind;

    /**
     * Категории черт, которыми ограничен каталог у вида «Черта»; пусто — все
     * категории. Так автор боевого стиля не листает общие черты.
     */
    featCategories?: Array<string>;
  }>();

  const model = defineModel<Array<FeatChoiceOption>>({ required: true });

  /**
   * Категории каталога, которыми сужен набор предметов: оружие для оружия и
   * оружия с приёмом, инструменты для инструментов. Без этого поле про оружие с
   * приёмом предлагало бы весь каталог — вплоть до амулетов и барабанов.
   */
  const itemTypes = computed<Array<string>>(() => {
    if (kind === 'TOOL') {
      return TOOL_ITEM_TYPES;
    }

    return WEAPON_ITEM_TYPES;
  });

  /** Подпись поля: она же объясняет, что именно выбирают. */
  const itemPlaceholder = computed(() =>
    kind === 'TOOL'
      ? FEAT_GRANT_VALUE_PLACEHOLDERS.tools
      : FEAT_GRANT_VALUE_PLACEHOLDERS.weapons,
  );

  /** Отмеченные значения строки. */
  const values = computed<Array<string>>(() =>
    model.value.map((option) => option.value),
  );

  /** Отмеченные характеристики: чужие значения до селекта доходить не должны. */
  const abilityValues = computed<Array<AbilityKey>>(() =>
    values.value.filter(isAbilityKey),
  );

  /**
   * Записывает значения словаря: подпись справочник даёт сам, в механике
   * достаточно кода.
   *
   * @param next выбранные значения.
   */
  function setValues(next: string | Array<string> | undefined) {
    model.value = toUrlList(next).map((value) => ({ value }));
  }

  /**
   * Записывает выбранные характеристики.
   *
   * @param next выбранные характеристики.
   */
  function setAbilities(next: AbilityKey | Array<AbilityKey> | undefined) {
    setValues(next);
  }

  /**
   * Записывает записи каталога ссылкой со снимком названия: лист заводит
   * владение по названию, а core-api имя ссылки не подставляет.
   *
   * Известное название держится за url: подпись селект берёт из показанной
   * выдачи, а она сменяется поиском — у выбранного раньше предмета её может не
   * оказаться, и пустым именем затирать записанное нельзя.
   *
   * @param refs выбранные записи каталога.
   */
  function setRefs(refs: Array<FeatEntityRef>) {
    const known = new Map(
      model.value.map((option) => [option.value, option.name]),
    );

    model.value = refs.map((reference) => ({
      value: reference.url,
      name: reference.name || known.get(reference.url),
    }));
  }

  /**
   * Записывает выбранные черты. Снимок названия селект черт не отдаёт, а
   * потребителям он и не нужен: лист и выгрузка берут название из каталога по
   * url — записанное здесь имя разошлось бы с ним при переименовании черты.
   *
   * @param next url выбранных черт.
   */
  function setFeats(next: string | Array<string> | undefined) {
    const known = new Map(
      model.value.map((option) => [option.value, option.name]),
    );

    model.value = toUrlList(next).map((url) => ({
      value: url,
      name: known.get(url),
    }));
  }
</script>

<template>
  <div class="w-full">
    <SelectSkills
      v-if="kind === 'SKILL'"
      :model-value="values"
      multiple
      @update:model-value="setValues"
    />

    <SelectAbilities
      v-else-if="kind === 'SAVING_THROW' || kind === 'ABILITY'"
      :model-value="abilityValues"
      multiple
      @update:model-value="setAbilities"
    />

    <SelectLanguage
      v-else-if="kind === 'LANGUAGE'"
      :model-value="values"
      multiple
      @update:model-value="setValues"
    />

    <SelectArmorCategory
      v-else-if="kind === 'ARMOR'"
      :model-value="values"
      multiple
      @update:model-value="setValues"
    />

    <SelectWeaponCategory
      v-else-if="kind === 'WEAPON_CATEGORY'"
      :model-value="values"
      multiple
      @update:model-value="setValues"
    />

    <SelectDamageType
      v-else-if="kind === 'DAMAGE_TYPE'"
      :model-value="values"
      multiple
      @update:model-value="setValues"
    />

    <SelectFeat
      v-else-if="kind === 'FEAT'"
      :model-value="values"
      :categories="featCategories"
      multiple
      @update:model-value="setFeats"
    />

    <!-- Сам приём, без оружия: «Тактический мастер» подменяет приём своего
      оружия на другой, и выбирают там приём, а не оружие -->
    <SelectWeaponMastery
      v-else-if="kind === 'MASTERY_PROPERTY'"
      :model-value="values"
      :placeholder="FEAT_GRANT_VALUE_PLACEHOLDERS.masteryProperties"
      multiple
      @update:model-value="setValues"
    />

    <!-- «Оружие с приёмом» выбирается ОРУЖИЕМ: приём — свойство самого оружия
      («Подсечка» у длинного меча), и персонаж получает тот, что у выбранного
      оружия есть. Поэтому набор сужен до оружия, а у инструментов — до
      инструментов -->
    <SelectItem
      v-else-if="
        kind === 'TOOL' || kind === 'WEAPON' || kind === 'WEAPON_MASTERY'
      "
      :model-value="values"
      :item-types="itemTypes"
      :placeholder="itemPlaceholder"
      multiple
      @select="setRefs"
    />
  </div>
</template>
