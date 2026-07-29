<script setup lang="ts">
  import type { CustomFeatureDraft } from '../../model';

  import { MarkupEditor } from '~ui/markup-editor';

  import { useCharacterSheet } from '../../composables';
  import {
    buildCustomSpeciesFeatures,
    buildCustomSpeciesUrl,
    buildDefaultSpeedRows,
    buildSpeedValuesFromRows,
    buildVisionRows,
    buildVisionValuesFromRows,
    CUSTOM_SPECIES_DEFAULT_SIZE,
    CUSTOM_SPECIES_DEFAULT_SPEED,
    CUSTOM_SPECIES_DEFAULT_VISION,
    CUSTOM_SPECIES_FEATURE_NAME_MAX_LENGTH,
    CUSTOM_SPECIES_LABELS,
    CUSTOM_SPECIES_NAME_MAX_LENGTH,
    SIZE_LABEL_WORDS,
    SPEED_MODAL_ORDER,
    SPEED_TYPE_LABELS,
    SPEED_VALUE_MAX,
    SPEED_VALUE_MIN,
    VISION_DISTANCE_MAX,
    VISION_DISTANCE_MIN,
    VISION_LABELS,
    VISION_ORDER,
  } from '../../model';
  import SheetDistanceRows from './SheetDistanceRows.vue';

  const emit = defineEmits<{
    /** `true` — свой вид применён к листу. */
    close: [isCreated?: boolean];
  }>();

  const { character, setSpecies } = useCharacterSheet();

  const draftName = ref('');

  const draftSize = ref(CUSTOM_SPECIES_DEFAULT_SIZE);

  // Заведена только ходьба: остальные типы передвижения вид выдаёт редко, и
  // игрок добавляет их строками по мере надобности.
  const speedRows = ref(buildDefaultSpeedRows());

  const draftHover = ref(false);

  // Зрение подставляется текущее: его могли задать до выбора вида отдельной
  // модалкой, и форма не должна молча обнулять уже введённые дистанции.
  const visionRows = ref(buildVisionRows(character.value.vision));

  const draftFeatures = ref<CustomFeatureDraft[]>([]);

  const speedOptions = SPEED_MODAL_ORDER.map((key) => ({
    label: SPEED_TYPE_LABELS[key],
    value: key,
  }));

  const visionOptions = VISION_ORDER.map((key) => ({
    label: VISION_LABELS[key],
    value: key,
  }));

  /** Парение имеет смысл только вместе со скоростью полёта. */
  const isHoverVisible = computed(() =>
    speedRows.value.some((row) => row.key === 'fly'),
  );

  const isApplyDisabled = computed(() => !draftName.value.trim());

  function handleAddFeature() {
    draftFeatures.value = [
      ...draftFeatures.value,
      { id: crypto.randomUUID(), name: '', description: '' },
    ];
  }

  function handleRemoveFeature(featureId: string) {
    draftFeatures.value = draftFeatures.value.filter(
      (feature) => feature.id !== featureId,
    );
  }

  function handleApply() {
    const name = draftName.value.trim();

    if (!name) {
      return;
    }

    setSpecies({
      species: {
        url: buildCustomSpeciesUrl(),
        name,
        // Подвидов и врождённых заклинаний своя форма не заводит: их место —
        // особенности и вкладка заклинаний листа.
        lineageUrl: null,
        lineageName: null,
        innateSpells: [],
      },
      size: draftSize.value,
      speed: {
        values: buildSpeedValuesFromRows(speedRows.value),
        hover: isHoverVisible.value && draftHover.value,
        unit: 'feet',
      },
      vision: { ...buildVisionValuesFromRows(visionRows.value), unit: 'feet' },
      features: buildCustomSpeciesFeatures(draftFeatures.value, name),
      // Владения свой вид не выдаёт: навыки и языки остаются за классом и
      // предысторией.
      skills: { proficient: [], expertise: [] },
      proficiencies: { languages: [] },
    });

    emit('close', true);
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal
    :title="CUSTOM_SPECIES_LABELS.title"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ CUSTOM_SPECIES_LABELS.nameTitle }}
          </span>

          <UInput
            v-model="draftName"
            :maxlength="CUSTOM_SPECIES_NAME_MAX_LENGTH"
            :placeholder="CUSTOM_SPECIES_LABELS.namePlaceholder"
          />
        </div>

        <div class="flex flex-col gap-1">
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ CUSTOM_SPECIES_LABELS.sizeTitle }}
          </span>

          <USelect
            v-model="draftSize"
            :items="SIZE_LABEL_WORDS"
            class="sm:w-64"
          />
        </div>

        <div class="flex flex-col gap-2">
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ CUSTOM_SPECIES_LABELS.speedTitle }}
          </span>

          <SheetDistanceRows
            v-model="speedRows"
            :options="speedOptions"
            :min="SPEED_VALUE_MIN"
            :max="SPEED_VALUE_MAX"
            :default-value="CUSTOM_SPECIES_DEFAULT_SPEED"
            :add-label="CUSTOM_SPECIES_LABELS.speedAdd"
            :remove-label="CUSTOM_SPECIES_LABELS.speedRemove"
            :empty-label="CUSTOM_SPECIES_LABELS.speedEmpty"
            :type-placeholder="CUSTOM_SPECIES_LABELS.distanceTypePlaceholder"
          />

          <UCheckbox
            v-if="isHoverVisible"
            v-model="draftHover"
            :label="CUSTOM_SPECIES_LABELS.hoverLabel"
            size="xs"
          />
        </div>

        <div class="flex flex-col gap-2">
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ CUSTOM_SPECIES_LABELS.visionTitle }}
          </span>

          <SheetDistanceRows
            v-model="visionRows"
            :options="visionOptions"
            :min="VISION_DISTANCE_MIN"
            :max="VISION_DISTANCE_MAX"
            :default-value="CUSTOM_SPECIES_DEFAULT_VISION"
            :add-label="CUSTOM_SPECIES_LABELS.visionAdd"
            :remove-label="CUSTOM_SPECIES_LABELS.visionRemove"
            :empty-label="CUSTOM_SPECIES_LABELS.visionEmpty"
            :type-placeholder="CUSTOM_SPECIES_LABELS.distanceTypePlaceholder"
          />
        </div>

        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between gap-2">
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              {{ CUSTOM_SPECIES_LABELS.featuresTitle }}
            </span>

            <UButton
              :label="CUSTOM_SPECIES_LABELS.featureAdd"
              icon="tabler:plus"
              color="neutral"
              variant="subtle"
              size="xs"
              @click.left.exact.prevent="handleAddFeature"
            />
          </div>

          <div
            v-for="feature in draftFeatures"
            :key="feature.id"
            class="flex flex-col gap-2 rounded-lg border border-default/50 bg-elevated/20 p-3"
          >
            <div class="flex items-center gap-2">
              <UInput
                v-model="feature.name"
                :maxlength="CUSTOM_SPECIES_FEATURE_NAME_MAX_LENGTH"
                :placeholder="CUSTOM_SPECIES_LABELS.featureNamePlaceholder"
                class="min-w-0 grow"
              />

              <UTooltip :text="CUSTOM_SPECIES_LABELS.featureRemove">
                <UButton
                  icon="tabler:trash"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  square
                  class="shrink-0"
                  :aria-label="CUSTOM_SPECIES_LABELS.featureRemove"
                  @click.left.exact.prevent="handleRemoveFeature(feature.id)"
                />
              </UTooltip>
            </div>

            <MarkupEditor
              v-model="feature.description"
              :placeholder="CUSTOM_SPECIES_LABELS.featureDescriptionPlaceholder"
            />
          </div>

          <span
            v-if="!draftFeatures.length"
            class="text-sm text-dimmed italic"
          >
            {{ CUSTOM_SPECIES_LABELS.featuresEmpty }}
          </span>
        </div>

        <span class="text-xs text-muted">
          {{ CUSTOM_SPECIES_LABELS.hint }}
        </span>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          label="Отмена"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleCancel"
        />

        <UButton
          :label="CUSTOM_SPECIES_LABELS.apply"
          color="primary"
          :disabled="isApplyDisabled"
          @click.left.exact.prevent="handleApply"
        />
      </div>
    </template>
  </UModal>
</template>
