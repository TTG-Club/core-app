<script setup lang="ts">
  import { ABILITY_LABELS, isAbilityKey } from '~/shared/types';

  import BonusBackgrounds from './BonusBackgrounds.vue';

  import type { AbilityKey } from '~/shared/types/abilities';

  import type {
    AbilityScores,
    BonusSource,
    CalculatorAbilitiesBackground,
    CalculatorAbilitiesClass,
    CalculatorAbilitiesFeat,
  } from '../model/types';

  const level = defineModel<number>({ required: true });

  const emit = defineEmits<{
    (e: 'update:feat-sources', value: BonusSource[]): void;
    (e: 'update:background-sources', value: BonusSource[]): void;
  }>();

  // --- Background Selection ---
  const selectedBackgroundUrl = ref<string>();

  const { data: allBackgrounds, pending: backgroundsPending } = await useFetch<
    CalculatorAbilitiesBackground[]
  >('/api/v2/backgrounds/select', {
    dedupe: 'defer',
    lazy: true,
    default: () => [],
  });

  const backgroundsByUrl = computed(() => {
    const map: Record<string, CalculatorAbilitiesBackground> = {};

    if (allBackgrounds.value) {
      for (const b of allBackgrounds.value) {
        map[b.url] = b;
      }
    }

    return map;
  });

  const backgroundOptions = computed(() => {
    return (
      allBackgrounds.value?.map((backgroundLink) => {
        const abilities =
          backgroundLink.abilityScores
            ?.filter(isAbilityKey)
            .map((key) => ABILITY_LABELS[key])
            .join(', ') || '';

        const description = [backgroundLink.name.eng, abilities]
          .filter(Boolean)
          .join(' • ');

        return {
          label: backgroundLink.name.rus,
          value: backgroundLink.url,
          description,
          sourceLabel: backgroundLink.source.name.label,
        };
      }) || []
    );
  });

  const currentBackground = computed(() => {
    if (!selectedBackgroundUrl.value) {
      return undefined;
    }

    return backgroundsByUrl.value[selectedBackgroundUrl.value];
  });

  // --- Class Selection ---
  const standardAsiLevels = [4, 8, 12, 16];
  const selectedClassUrl = ref<string>();

  const { data: allClasses, pending: classesPending } = await useFetch<
    CalculatorAbilitiesClass[]
  >('/api/v2/classes/ability-improvement', {
    dedupe: 'defer',
    lazy: true,
    default: () => [],
  });

  const classAsiLevels = computed(() => {
    if (selectedClassUrl.value && allClasses.value) {
      const cls = allClasses.value.find(
        (c) => c.url === selectedClassUrl.value,
      );

      if (cls) {
        return cls.levels.filter((lvl) => lvl !== 19);
      }
    }

    return standardAsiLevels;
  });

  const allAsiLevels = computed(() => {
    if (!allClasses.value || !selectedClassUrl.value) {
      return standardAsiLevels;
    }

    // We only show levels relevant to the selected class + standard levels
    // But per requirements: "only base slots always, specific slots added when class selected"
    // Actually, "display only base slots always" means start with 4,8,12,16
    // "add specific slots when class selected" means merge class levels.

    const levels = new Set<number>(standardAsiLevels);

    if (classAsiLevels.value) {
      classAsiLevels.value.forEach((lvl) => levels.add(lvl));
    }

    return Array.from(levels).sort((a, b) => a - b);
  });

  // --- Slots Calculation ---
  // Only used for internal logic if needed, but we now iterate over classAsiLevels directly for display
  const hasEpicBoon = computed(() => level.value >= 19);

  // --- Display Helpers ---
  // If a class has e.g. 5 slots max (fighter), we want to show 20 slots?
  // The user requirement said: "if a class has an upgrade every level, draw 20 slots".
  // But standard classes have specific levels.
  // Interpretation: We should just show ALL levels defined in `classAsiLevels`.
  // If the user meant "maximum possible slots across ANY class", that would be different.
  // Given "maximum levels that exist in classes", and "if in some class it increases every level",
  // it implies we should trust `classAsiLevels` to be correct for the selected class.
  // However, `classAsiLevels` currently filters out 19.
  // Let's ensure we just use `classAsiLevels` which comes from the API/Standard list.
  // The user example "if in some class it increases every level, draw 20 slots" suggests dynamic sizing based on the class.
  // So iterating `classAsiLevels` is correct.

  // --- Feat Selection ---
  // Key: Level (4, 8, etc.), Value: Feat URL
  const selectedFeats = ref<Map<number, string | undefined>>(new Map());
  const selectedEpicFeatUrl = ref<string>();

  // Key: Level (for normal feats) or 'epic' (for epic boon), Value: AbilityKey
  // Using level as key ensures uniqueness for repeatable feats taken at different levels
  const featAbilityChoices = ref<Map<string | number, AbilityKey>>(new Map());

  const { data: allFeats, pending: featsPending } = await useFetch<
    CalculatorAbilitiesFeat[]
  >('/api/v2/feats/select', {
    query: {
      categories: ['GENERAL', 'DRAGONMARK', 'EPIC_BOON'],
    },
    dedupe: 'defer',
    lazy: true,
    default: () => [],
  });

  const featsByUrl = computed(() => {
    const map: Record<string, CalculatorAbilitiesFeat> = {};

    if (allFeats.value) {
      for (const f of allFeats.value) {
        map[f.url] = f;
      }
    }

    return map;
  });

  const baseFeatOptions = computed(() => {
    return (
      allFeats.value
        ?.filter((f) => f.category === 'GENERAL' || f.category === 'DRAGONMARK')
        .map(mapFeats) || []
    );
  });

  function getOptionsForLevel(featLevel: number) {
    // Get URLs selected in other slots
    const otherSelections = new Set<string>();

    for (const [lvl, url] of selectedFeats.value.entries()) {
      if (lvl !== featLevel && url) {
        otherSelections.add(url);
      }
    }

    return baseFeatOptions.value.filter((opt) => {
      // Always show if repeatable
      if (opt.repeatability) {
        return true;
      }

      // Show if not selected elsewhere
      return !otherSelections.has(opt.value);
    });
  }

  const epicFeatsOptions = computed(() => {
    return (
      allFeats.value?.filter((f) => f.category === 'EPIC_BOON').map(mapFeats) ||
      []
    );
  });

  function mapFeats(feat: CalculatorAbilitiesFeat) {
    const sourceLabel = feat.source.name.label;

    const abilities =
      feat.abilities
        ?.filter(isAbilityKey)
        .map((key) => ABILITY_LABELS[key])
        .join(', ') || '';

    const description = [feat.name.eng, abilities].filter(Boolean).join(' • ');

    return {
      label: feat.name.rus,
      value: feat.url,
      description,
      source: sourceLabel,
      prerequisite: feat.prerequisite,
      repeatability: feat.repeatability,
    };
  }

  const classOptions = computed(() => {
    return (
      allClasses.value?.map((classLink) => ({
        label: classLink.name.rus,
        value: classLink.url,
        description: `${classLink.name.eng} • Уровни: ${classLink.levels.join(', ')}`,
        source: classLink.source.name.label,
      })) || []
    );
  });

  function getFirstAbility(
    feat: CalculatorAbilitiesFeat,
  ): AbilityKey | undefined {
    if (!feat.abilities || feat.abilities.length === 0) {
      return undefined;
    }

    const first = feat.abilities[0];

    if (!first) {
      return undefined;
    }

    return isAbilityKey(first) ? first : undefined;
  }

  // --- Computed Sources ---
  const selectedSources = computed<BonusSource[]>(() => {
    const sources: BonusSource[] = [];

    // General Feats
    for (const [featLevel, url] of selectedFeats.value.entries()) {
      if (!url) {
        continue;
      }

      const feat = featsByUrl.value[url];

      if (!feat) {
        continue;
      }

      const bonuses: Partial<AbilityScores> = {};

      let chosenAbility: AbilityKey | undefined;

      if (feat.abilities && feat.abilities.length > 0 && feat.increase) {
        // If multiple options, check user choice. If not chosen, NO bonus.
        if (feat.abilities.length > 1) {
          chosenAbility = featAbilityChoices.value.get(featLevel);
        } else {
          chosenAbility = getFirstAbility(feat);
        }

        if (chosenAbility) {
          bonuses[chosenAbility] = feat.increase;
        }
      }

      sources.push({
        id: `${url}-${featLevel}`, // Unique ID for repeatable feats
        label: `Черта: ${feat.name.rus}`,
        scores: bonuses,
      });
    }

    // Epic Feat
    if (selectedEpicFeatUrl.value && hasEpicBoon.value) {
      const feat = featsByUrl.value[selectedEpicFeatUrl.value];

      if (feat) {
        const bonuses: Partial<AbilityScores> = {};

        let chosenAbility: AbilityKey | undefined;

        if (feat.abilities && feat.abilities.length > 0 && feat.increase) {
          if (feat.abilities.length > 1) {
            chosenAbility = featAbilityChoices.value.get('epic');
          } else {
            chosenAbility = getFirstAbility(feat);
          }

          if (chosenAbility) {
            bonuses[chosenAbility] = feat.increase;
          }
        }

        sources.push({
          id: `${feat.url}-epic`,
          label: `Эпический дар: ${feat.name.rus}`,
          scores: bonuses,
        });
      }
    }

    return sources;
  });

  watch(selectedSources, (newVal) => {
    emit('update:feat-sources', newVal);
  });

  function getFeatAbilities(url: string | undefined): AbilityKey[] {
    if (!url) {
      return [];
    }

    const feat = featsByUrl.value[url];

    if (!feat?.abilities) {
      return [];
    }

    return feat.abilities.filter(isAbilityKey);
  }

  function getAbilityOptions(url: string | undefined) {
    if (!url) {
      return [];
    }

    return getFeatAbilities(url).map((k) => ({
      label: ABILITY_LABELS[k],
      value: k,
    }));
  }

  function updateSelectedFeat(featLevel: number, value: string | undefined) {
    if (value) {
      selectedFeats.value.set(featLevel, value);
    } else {
      selectedFeats.value.delete(featLevel);
    }

    // Reset ability choice for this level when feat changes
    featAbilityChoices.value.delete(featLevel);
    featAbilityChoices.value = new Map(featAbilityChoices.value);

    // Trigger reactivity manually since Map mutation doesn't trigger it automatically in Vue 3 deep watch sometimes or if structure changes
    selectedFeats.value = new Map(selectedFeats.value);
  }

  function updateFeatAbilityChoice(
    key: string | number,
    value: AbilityKey | undefined,
  ) {
    if (value) {
      featAbilityChoices.value.set(key, value);
    } else {
      featAbilityChoices.value.delete(key);
    }

    featAbilityChoices.value = new Map(featAbilityChoices.value);
  }

  function getFeatAbilityChoice(key: string | number) {
    return featAbilityChoices.value.get(key);
  }

  function isFeatHasMultipleAbilities(url: string | undefined) {
    if (!url) {
      return false;
    }

    const abilities = getFeatAbilities(url);

    return abilities.length > 1;
  }
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Top Controls: Two Blocks -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Block 1: Class & Level -->
      <div
        class="flex flex-col gap-6 rounded-xl border border-default bg-muted p-4"
      >
        <!-- Class -->
        <div class="flex flex-col gap-2">
          <div class="text-sm font-semibold">Класс</div>

          <UFieldGroup>
            <USelectMenu
              v-model="selectedClassUrl"
              :items="classOptions"
              :loading="classesPending"
              placeholder="Выберите класс"
              label-key="label"
              value-key="value"
              searchable
              class="w-full"
            >
              <template #item-trailing="{ item }">
                <UBadge
                  variant="subtle"
                  color="neutral"
                >
                  {{ item.source }}
                </UBadge>
              </template>
            </USelectMenu>

            <UButton
              v-if="selectedClassUrl"
              icon="i-fluent-dismiss-24-regular"
              color="neutral"
              variant="subtle"
              @click="selectedClassUrl = undefined"
            />
          </UFieldGroup>
        </div>

        <!-- Level -->
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold">Уровень персонажа</span>

            <span class="text-sm font-bold text-primary">{{ level }}</span>
          </div>

          <USlider
            v-model="level"
            :min="1"
            :max="20"
          />
        </div>

        <!-- Epic Boon (Moved here) -->
        <div
          class="flex flex-col gap-2 transition-opacity"
          :class="{ 'opacity-50 grayscale': !hasEpicBoon }"
        >
          <div class="text-sm font-semibold">Эпический дар</div>

          <div class="flex flex-col gap-2">
            <UFieldGroup>
              <USelectMenu
                v-model="selectedEpicFeatUrl"
                :items="epicFeatsOptions"
                :loading="featsPending"
                placeholder="Выберите эпический дар"
                searchable
                class="w-full"
                label-key="label"
                value-key="value"
                :disabled="!hasEpicBoon"
              >
                <template #item-trailing="{ item }">
                  <UBadge
                    variant="subtle"
                    color="neutral"
                  >
                    {{ item.source }}
                  </UBadge>
                </template>

                <template #item-description="{ item }">
                  <div class="grid w-full">
                    <div
                      class="w-full truncate"
                      :title="item.description"
                    >
                      {{ item.description }}
                    </div>

                    <div
                      v-if="item.prerequisite"
                      class="w-full truncate text-dimmed"
                      :title="item.prerequisite"
                    >
                      {{ item.prerequisite }}
                    </div>
                  </div>
                </template>
              </USelectMenu>

              <UButton
                v-if="selectedEpicFeatUrl && hasEpicBoon"
                icon="i-fluent-dismiss-24-regular"
                color="neutral"
                variant="subtle"
                @click="selectedEpicFeatUrl = undefined"
              />
            </UFieldGroup>

            <!-- Epic Ability Choice -->
            <div v-if="selectedEpicFeatUrl">
              <UFieldGroup
                v-if="isFeatHasMultipleAbilities(selectedEpicFeatUrl)"
                class="w-full"
              >
                <USelect
                  :model-value="getFeatAbilityChoice('epic')"
                  :items="getAbilityOptions(selectedEpicFeatUrl)"
                  placeholder="Выберите характеристику"
                  class="w-full"
                  :class="{
                    'ring-error': hasEpicBoon && !getFeatAbilityChoice('epic'),
                  }"
                  :disabled="!hasEpicBoon"
                  @update:model-value="
                    (v) => updateFeatAbilityChoice('epic', v as AbilityKey)
                  "
                />

                <UButton
                  v-if="getFeatAbilityChoice('epic') && hasEpicBoon"
                  icon="i-fluent-dismiss-24-regular"
                  color="neutral"
                  variant="subtle"
                  @click="updateFeatAbilityChoice('epic', undefined)"
                />
              </UFieldGroup>

              <!-- Single Ability Display -->
              <template v-else>
                <span
                  v-if="getAbilityOptions(selectedEpicFeatUrl)[0]?.label"
                  class="text-xs text-secondary"
                >
                  Бонус: {{ getAbilityOptions(selectedEpicFeatUrl)[0]?.label }}
                </span>

                <span
                  v-else
                  class="text-xs text-secondary"
                  >Нет бонуса</span
                >
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Block 2: Background & Settings -->
      <div
        class="flex flex-col gap-6 rounded-xl border border-default bg-muted p-4"
      >
        <!-- Background Select -->
        <div class="flex flex-col gap-2">
          <div class="text-sm font-semibold">Предыстория</div>

          <UFieldGroup>
            <USelectMenu
              v-model="selectedBackgroundUrl"
              :items="backgroundOptions"
              :loading="backgroundsPending"
              placeholder="Выберите предысторию"
              searchable
              class="w-full"
              label-key="label"
              value-key="value"
            >
              <template #item-trailing="{ item }">
                <UBadge
                  variant="subtle"
                  color="neutral"
                >
                  {{ item.sourceLabel }}
                </UBadge>
              </template>
            </USelectMenu>

            <UButton
              v-if="selectedBackgroundUrl"
              icon="i-fluent-dismiss-24-regular"
              color="neutral"
              variant="subtle"
              @click="selectedBackgroundUrl = undefined"
            />
          </UFieldGroup>
        </div>

        <!-- Background ASI Settings -->
        <BonusBackgrounds
          :background="currentBackground"
          @update:sources="emit('update:background-sources', $event)"
        />
      </div>
    </div>

    <!-- Main Grid Container (Bordered) -->
    <div class="rounded-xl border border-default bg-muted p-4">
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Row 2+: General Feats Grid -->
        <template
          v-for="featLevel in allAsiLevels"
          :key="featLevel"
        >
          <div
            class="bg-card flex h-full flex-col gap-2 rounded-lg border border-default p-4"
            :class="{
              'opacity-50 grayscale':
                !classAsiLevels.includes(featLevel) ||
                (level < featLevel && !selectedFeats.get(featLevel)),
            }"
          >
            <div class="text-xs font-medium text-secondary">
              Уровень {{ featLevel }}
            </div>

            <UFieldGroup>
              <USelectMenu
                :model-value="selectedFeats.get(featLevel)"
                :items="getOptionsForLevel(featLevel)"
                :loading="featsPending"
                searchable
                :placeholder="
                  classAsiLevels.includes(featLevel)
                    ? 'Выберите черту'
                    : 'Недоступно'
                "
                class="w-full"
                label-key="label"
                value-key="value"
                :disabled="
                  !classAsiLevels.includes(featLevel) ||
                  (level < featLevel && !selectedFeats.get(featLevel))
                "
                @update:model-value="(v) => updateSelectedFeat(featLevel, v)"
              >
                <template #item-label="{ item }">
                  <span class="flex items-center gap-1">
                    <span class="truncate">
                      {{ item.label }}
                    </span>

                    <UIcon
                      v-if="item.repeatability"
                      name="i-fluent-arrow-repeat-all-24-regular"
                      class="text-muted"
                      size="16"
                      title="Повторяемая черта"
                    />
                  </span>
                </template>

                <template #item-trailing="{ item }">
                  <UBadge
                    variant="subtle"
                    color="neutral"
                  >
                    {{ item.source }}
                  </UBadge>
                </template>

                <template #item-description="{ item }">
                  <div class="grid w-full">
                    <div
                      class="w-full truncate"
                      :title="item.description"
                    >
                      {{ item.description }}
                    </div>

                    <div
                      v-if="item.prerequisite"
                      class="w-full truncate"
                      :title="item.prerequisite"
                    >
                      {{ item.prerequisite }}
                    </div>
                  </div>
                </template>
              </USelectMenu>

              <UButton
                v-if="
                  selectedFeats.get(featLevel) &&
                  !(level < featLevel && !selectedFeats.get(featLevel)) &&
                  classAsiLevels.includes(featLevel)
                "
                icon="i-fluent-dismiss-24-regular"
                color="neutral"
                variant="subtle"
                @click="updateSelectedFeat(featLevel, undefined)"
              />
            </UFieldGroup>

            <!-- Ability Choice Inline -->
            <template v-if="selectedFeats.get(featLevel)">
              <UFieldGroup
                v-if="isFeatHasMultipleAbilities(selectedFeats.get(featLevel))"
                class="w-full"
              >
                <USelect
                  :model-value="getFeatAbilityChoice(featLevel)"
                  :items="getAbilityOptions(selectedFeats.get(featLevel))"
                  placeholder="Выберите характеристику"
                  class="w-full"
                  :class="{
                    'ring-error':
                      selectedFeats.get(featLevel) &&
                      !getFeatAbilityChoice(featLevel) &&
                      level >= featLevel,
                  }"
                  option-attribute="label"
                  value-attribute="value"
                  :disabled="
                    !classAsiLevels.includes(featLevel) ||
                    level < featLevel ||
                    !selectedFeats.get(featLevel)
                  "
                  @update:model-value="
                    (v) => updateFeatAbilityChoice(featLevel, v as AbilityKey)
                  "
                />

                <UButton
                  v-if="
                    getFeatAbilityChoice(featLevel) &&
                    !(level < featLevel && !selectedFeats.get(featLevel)) &&
                    classAsiLevels.includes(featLevel)
                  "
                  icon="i-fluent-dismiss-24-regular"
                  color="neutral"
                  variant="subtle"
                  @click="updateFeatAbilityChoice(featLevel, undefined)"
                />
              </UFieldGroup>

              <!-- Single Ability Display -->
              <div
                v-else
                class="mt-auto text-xs text-secondary"
              >
                <span
                  v-if="
                    getAbilityOptions(selectedFeats.get(featLevel))[0]?.label
                  "
                >
                  Бонус:
                  {{
                    getAbilityOptions(selectedFeats.get(featLevel))[0]?.label
                  }}
                </span>

                <span v-else>Нет бонуса</span>
              </div>
            </template>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
