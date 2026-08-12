<script setup lang="ts">
  import type { FeatPrerequisiteDetails } from '../../model';

  import {
    SelectArmorCategory,
    SelectBackground,
    SelectClass,
    SelectFeat,
    SelectSpecies,
  } from '~ui/select';

  import {
    CLASS_FEATURE_REQUIREMENT_OPTIONS,
    createAbilityRequirement,
    toEntityRefs,
    toEntityRefUrls,
    toUrlList,
  } from '../../model';
  import FeatAbilityRequirements from './FeatAbilityRequirements.vue';

  const model = defineModel<FeatPrerequisiteDetails>({ required: true });

  const featUrls = computed<string | Array<string>>({
    get: () => toEntityRefUrls(model.value.feats),
    set: (value) => {
      model.value = { ...model.value, feats: toEntityRefs(toUrlList(value)) };
    },
  });

  const classUrls = computed<string | Array<string>>({
    get: () => toEntityRefUrls(model.value.classes),
    set: (value) => {
      model.value = { ...model.value, classes: toEntityRefs(toUrlList(value)) };
    },
  });

  const speciesUrls = computed<string | Array<string>>({
    get: () => toEntityRefUrls(model.value.species),
    set: (value) => {
      model.value = { ...model.value, species: toEntityRefs(toUrlList(value)) };
    },
  });

  /** Предыстория выбирается одна: селект предысторий не умеет множественный выбор. */
  const backgroundUrl = computed<string | undefined>({
    get: () => model.value.backgrounds[0]?.url,
    set: (value) => {
      model.value = {
        ...model.value,
        backgrounds: value ? toEntityRefs([value]) : [],
      };
    },
  });

  function addAbilityRequirement() {
    model.value = {
      ...model.value,
      abilities: [...model.value.abilities, createAbilityRequirement()],
    };
  }
</script>

<template>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
    <UFormField
      class="md:col-span-6"
      label="Минимальный уровень"
    >
      <UInputNumber
        v-model="model.minCharacterLevel"
        :max="20"
        :min="1"
      />
    </UFormField>

    <UFormField
      class="md:col-span-12"
      label="Классовое умение (достаточно любого)"
    >
      <USelectMenu
        v-model="model.classFeatures"
        :items="CLASS_FEATURE_REQUIREMENT_OPTIONS"
        multiple
        placeholder="Использование заклинаний"
        value-key="value"
      />
    </UFormField>

    <UFormField
      class="md:col-span-6"
      label="Сеттинг кампании"
    >
      <UInput
        v-model="model.campaign"
        placeholder="Эберрон"
      />
    </UFormField>

    <UFormField
      class="md:col-span-12"
      label="Требуются черты"
    >
      <SelectFeat
        v-model="featUrls"
        multiple
      />
    </UFormField>

    <UFormField
      class="md:col-span-12"
      label="Требуется класс"
    >
      <SelectClass
        v-model="classUrls"
        multiple
      />
    </UFormField>

    <UFormField
      class="md:col-span-12"
      label="Требуется вид"
    >
      <SelectSpecies
        v-model="speciesUrls"
        multiple
      />
    </UFormField>

    <UFormField
      class="md:col-span-12"
      label="Требуется предыстория"
    >
      <SelectBackground v-model="backgroundUrl" />
    </UFormField>

    <UFormField
      class="md:col-span-12"
      label="Владение доспехами"
    >
      <SelectArmorCategory
        v-model="model.armorProficiency"
        multiple
      />
    </UFormField>

    <UFormField
      class="md:col-span-6"
      label="Любая метка дракона"
    >
      <UCheckbox
        v-model="model.anyDragonmark"
        label="Нужна любая черта метки дракона"
      />
    </UFormField>

    <UFormField
      class="md:col-span-full"
      label="Условие, которое лист не проверяет"
    >
      <UInput
        v-model="model.custom"
        placeholder="превращение в лича"
      />
    </UFormField>

    <div class="md:col-span-full">
      <div class="mb-2 flex items-center justify-between gap-4">
        <span class="text-sm text-dimmed">
          Требования к характеристикам: достаточно любой из выбранных.
        </span>

        <UButton
          icon="tabler:plus"
          size="xs"
          variant="ghost"
          @click.left.exact.prevent="addAbilityRequirement"
        >
          Добавить
        </UButton>
      </div>

      <FeatAbilityRequirements v-model="model.abilities" />
    </div>
  </div>
</template>
