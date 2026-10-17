<script setup lang="ts">
  import type { FacilitySetupDraft } from '../../model';

  import { useFacilityCatalog } from '../../composables';
  import {
    FACILITY_SETUP_LABELS,
    fitSpecialToLevel,
    getAvailableSpecialFacilities,
    getBasicFacilities,
    STARTING_BASIC_SPACE_LABELS,
    STARTING_BASIC_SPACES,
  } from '../../model';
  import SpecialFacilityPicker from './SpecialFacilityPicker.vue';

  /**
   * Выбор стартовых сооружений персонажа: два базовых (тесное и вместительное)
   * и специализированные по уровню. Общий для создания бастиона и панели
   * персонажа; правила повторяют проверку сервера.
   */
  const draft = defineModel<FacilitySetupDraft>({ required: true });

  const { characterLevel, limit, idPrefix } = defineProps<{
    characterLevel: number;
    /** Лимит специализированных сооружений персонажа. */
    limit: number;
    /** Префикс id полей: на странице может быть несколько форм. */
    idPrefix: string;
  }>();

  const { catalog, status: catalogStatus } = useFacilityCatalog();

  const basicItems = computed(() =>
    getBasicFacilities(catalog.value).map((facility) => ({
      label: facility.name.rus,
      value: facility.url,
    })),
  );

  const specialFacilities = computed(() =>
    getAvailableSpecialFacilities(catalog.value, characterLevel),
  );

  const isCatalogLoading = computed(
    () => catalogStatus.value === 'pending' || catalogStatus.value === 'idle',
  );

  // Уровень понизили после выбора: лишнее и недоступное убирается, иначе
  // сервер отверг бы запрос. Пока справочник не загружен, сверять не с чем.
  watch([() => characterLevel, () => limit], () => {
    if (catalogStatus.value !== 'success') {
      return;
    }

    const fitted = fitSpecialToLevel(
      draft.value,
      specialFacilities.value,
      limit,
    );

    if (fitted.length !== draft.value.special.length) {
      draft.value = { ...draft.value, special: fitted };
    }
  });
</script>

<template>
  <div
    v-if="isCatalogLoading"
    class="flex flex-col gap-3"
  >
    <USkeleton
      v-for="index in 4"
      :key="index"
      class="h-16"
    />
  </div>

  <p
    v-else-if="catalogStatus === 'error'"
    class="text-sm text-error"
  >
    {{ FACILITY_SETUP_LABELS.catalogError }}
  </p>

  <div
    v-else
    class="flex flex-col gap-8"
  >
    <section class="flex flex-col gap-3">
      <div class="flex flex-col gap-1">
        <h3 class="text-base font-semibold text-highlighted">
          {{ FACILITY_SETUP_LABELS.basicTitle }}
        </h3>

        <p class="text-sm text-muted">
          {{ FACILITY_SETUP_LABELS.basicHint }}
        </p>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <UFormField
          v-for="space in STARTING_BASIC_SPACES"
          :key="space"
          :label="STARTING_BASIC_SPACE_LABELS[space]"
          required
        >
          <USelect
            :id="`${idPrefix}-${space}`"
            v-model="draft.basic[space]"
            :items="basicItems"
            value-key="value"
            :placeholder="FACILITY_SETUP_LABELS.basicPlaceholder"
            class="w-full"
          />
        </UFormField>
      </div>
    </section>

    <section class="flex flex-col gap-3">
      <h3 class="text-base font-semibold text-highlighted">
        {{ FACILITY_SETUP_LABELS.specialTitle }}
      </h3>

      <p
        v-if="!limit"
        class="text-sm text-muted"
      >
        {{ FACILITY_SETUP_LABELS.specialNone }}
      </p>

      <SpecialFacilityPicker
        v-else
        v-model="draft"
        :facilities="specialFacilities"
        :limit
      />
    </section>
  </div>
</template>
