<script setup lang="ts">
  import type { FeatProficiencyGrant } from '../../model';

  import {
    SelectArmorCategory,
    SelectItem,
    SelectWeaponCategory,
  } from '~ui/select';

  import { toEntityRefs, toEntityRefUrls, toUrlList } from '../../model';

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

  const toolUrls = computed<string | Array<string>>({
    get: () => toEntityRefUrls(model.value.tools),
    set: (value) => {
      model.value = { ...model.value, tools: toEntityRefs(toUrlList(value)) };
    },
  });
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
      class="md:col-span-full"
      label="Инструменты"
    >
      <SelectItem
        v-model="toolUrls"
        multiple
      />
    </UFormField>
  </div>
</template>
