<script setup lang="ts">
  import type { FeatEntityRef, FeatProficiencyGrant } from '../../model';

  import {
    SelectArmorCategory,
    SelectItem,
    SelectLanguage,
    SelectSkills,
    SelectWeaponCategory,
  } from '~ui/select';

  import { toEntityRefUrls, toUrlList } from '../../model';

  const model = defineModel<FeatProficiencyGrant>({ required: true });

  const weaponCategories = computed<string | Array<string>>({
    get: () => model.value.weaponCategories,
    set: (value) => {
      model.value = { ...model.value, weaponCategories: toUrlList(value) };
    },
  });

  const armorCategories = computed<string | Array<string>>({
    get: () => model.value.armorCategories,
    set: (value) => {
      model.value = { ...model.value, armorCategories: toUrlList(value) };
    },
  });

  const skills = computed<string | Array<string>>({
    get: () => model.value.skills,
    set: (value) => {
      model.value = { ...model.value, skills: toUrlList(value) };
    },
  });

  const languages = computed<string | Array<string>>({
    get: () => model.value.languages,
    set: (value) => {
      model.value = { ...model.value, languages: toUrlList(value) };
    },
  });

  const toolUrls = computed<Array<string>>(() =>
    toEntityRefUrls(model.value.tools),
  );

  /**
   * Инструменты пишутся ссылкой со снимком названия, поэтому селект связан не
   * `v-model`, а парой «значение + `select`»: url'а мало — лист персонажа
   * заводит владение по названию, а core-api имя ссылки не подставляет.
   *
   * Известное название держится за url: подпись селект берёт из показанной
   * выдачи, а она сменяется поиском — у выбранного раньше инструмента её может
   * не оказаться, и пустым именем затирать записанное нельзя.
   *
   * @param tools выбранные предметы ссылками со снимком названия.
   */
  function handleTools(tools: Array<FeatEntityRef>): void {
    const known = new Map(
      model.value.tools.map((tool) => [tool.url, tool.name]),
    );

    model.value = {
      ...model.value,
      tools: tools.map((tool) => ({
        url: tool.url,
        name: tool.name || known.get(tool.url),
      })),
    };
  }
</script>

<template>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
    <p class="text-sm text-dimmed md:col-span-full">
      Только то, что черта выдаёт без выбора. Если игрок выбирает — навык,
      инструмент, вид оружия — заводите выбор, а не выдачу.
    </p>

    <UFormField
      class="md:col-span-12"
      label="Оружие"
      help="Воинское оружие — это обе категории: рукопашное и дальнобойное"
    >
      <SelectWeaponCategory
        v-model="weaponCategories"
        multiple
      />
    </UFormField>

    <UFormField
      class="md:col-span-12"
      label="Доспехи"
    >
      <SelectArmorCategory
        v-model="armorCategories"
        multiple
      />
    </UFormField>

    <UFormField
      class="md:col-span-12"
      label="Навыки"
      help="Владение выдаётся сразу; компетенцию и половину владения выдача не трогает"
    >
      <SelectSkills
        v-model="skills"
        multiple
      />
    </UFormField>

    <UFormField
      class="md:col-span-12"
      label="Языки"
    >
      <SelectLanguage
        v-model="languages"
        multiple
      />
    </UFormField>

    <UFormField
      class="md:col-span-12"
      label="Инструменты"
    >
      <SelectItem
        :model-value="toolUrls"
        multiple
        @select="handleTools"
      />
    </UFormField>
  </div>
</template>
