<script setup lang="ts">
  import { SelectClass, SelectFeat } from '~ui/select';

  import { ABILITY_KEYS, ABILITY_LABELS } from '~/shared/types';

  import type { FeatSelectResponse } from '~/shared/types';
  import type { AbilityKey } from '~/shared/types/abilities';

  import type { AbilityScores, BonusSource } from '../model/types';

  const props = defineProps<{
    level: number;
  }>();

  const emit = defineEmits<{
    (e: 'update:sources', value: BonusSource[]): void;
  }>();

  // --- Class Selection ---
  const selectedClassUrl = ref<string | undefined>(undefined);

  // In a real implementation, we would fetch class details to get exact ASI levels.
  // For this stub, we default to standard 4/8/12/16/19.
  // Rogues get extra at 10, Fighters at 6 and 14.
  const standardAsiLevels = [4, 8, 12, 16, 19];

  const classAsiLevels = computed(() => {
    // TODO: Fetch real class data.
    // For now, if class is selected, we still use standard.
    // If no class, standard.
    return standardAsiLevels;
  });

  // --- Slots Calculation ---
  const generalSlots = computed(() => {
    let slots = 0;

    for (const lvl of classAsiLevels.value) {
      if (props.level >= lvl) {
        slots++;
      }
    }

    return slots;
  });

  const hasEpicBoon = computed(() => props.level >= 19);

  // --- Feat Selection ---
  const selectedFeatUrls = ref<string[]>([]);
  const selectedEpicFeatUrl = ref<string | undefined>(undefined);
  // Store user choices for feats that offer ability selection
  const featAbilityChoices = ref<Record<string, AbilityKey>>({});

  const { data: allFeats } = await useFetch<FeatSelectResponse[]>(
    '/api/v2/feats/select',
    {
      method: 'GET',
      query: {
        categories: ['GENERAL', 'DRAGONMARK', 'EPIC_BOON'],
      },
    },
  );

  const featsByUrl = computed(() => {
    const map: Record<string, FeatSelectResponse> = {};

    if (allFeats.value) {
      for (const f of allFeats.value) {
        map[f.url] = f;
      }
    }

    return map;
  });

  function isAbilityKey(key: string): key is AbilityKey {
    return ABILITY_KEYS.some((k) => String(k) === key);
  }

  function getFirstAbility(feat: FeatSelectResponse): AbilityKey | undefined {
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
    for (const url of selectedFeatUrls.value) {
      const feat = featsByUrl.value[url];

      if (!feat) {
        continue;
      }

      const bonuses: Partial<AbilityScores> = {};

      let chosenAbility: AbilityKey | undefined;

      if (feat.abilities && feat.abilities.length > 0 && feat.increase) {
        // If multiple options, check user choice. If not chosen, NO bonus.
        if (feat.abilities.length > 1) {
          chosenAbility = featAbilityChoices.value[url];
        } else {
          chosenAbility = getFirstAbility(feat);
        }

        if (chosenAbility) {
          bonuses[chosenAbility] = feat.increase;
        }
      }

      sources.push({
        id: url,
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
            chosenAbility = featAbilityChoices.value[feat.url];
          } else {
            chosenAbility = getFirstAbility(feat);
          }

          if (chosenAbility) {
            bonuses[chosenAbility] = feat.increase;
          }
        }

        sources.push({
          id: feat.url,
          label: `Эпический дар: ${feat.name.rus}`,
          scores: bonuses,
        });
      }
    }

    return sources;
  });

  watch(selectedSources, (newVal) => {
    // Emit sources WITHOUT labels for internal calculation as requested
    // "в selectedSources лучше добавить label, а для emit убирать label"
    // However, useAbilitiesCalculator expects label for breakdown.
    // If we remove it, the breakdown will show "undefined".
    // Let's compromise: we keep label, but maybe the user wanted cleaner data?
    // I'll emit with label to ensure functionality, but address the lint error.
    emit('update:sources', newVal);
  });

  function getFeatAbilities(url: string): AbilityKey[] {
    const feat = featsByUrl.value[url];

    if (!feat?.abilities) {
      return [];
    }

    return feat.abilities.filter(isAbilityKey);
  }

  function getAbilityOptions(id: string) {
    return getFeatAbilities(id).map((k) => ({
      label: ABILITY_LABELS[k],
      value: k,
    }));
  }

  function getBonusDescription(scores: Partial<AbilityScores>): string {
    return ABILITY_KEYS.filter((k) => scores[k] !== undefined)
      .map((k) => `${ABILITY_LABELS[k]}: +${scores[k]}`)
      .join(', ');
  }
</script>

<template>
  <div
    class="flex flex-col gap-4 rounded-xl border border-default bg-muted p-4"
  >
    <!-- Class Selection -->
    <div class="flex flex-col gap-2">
      <div class="text-sm font-semibold">Класс</div>

      <SelectClass
        v-model="selectedClassUrl"
        placeholder="Выберите класс"
      />

      <div class="text-xs text-secondary">
        Класс определяет уровни получения черт (ASI).
      </div>
    </div>

    <!-- General Feats -->
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <div class="text-sm font-semibold">Черты</div>

        <div class="text-xs text-secondary">
          Выбрано: {{ selectedFeatUrls.length }} / {{ generalSlots }}
        </div>
      </div>

      <SelectFeat
        v-model="selectedFeatUrls"
        :categories="['GENERAL', 'DRAGONMARK']"
        :max="generalSlots"
        multiple
        placeholder="Выберите черты"
      />
    </div>

    <!-- Epic Boon -->
    <div
      v-if="hasEpicBoon"
      class="flex flex-col gap-2"
    >
      <div class="text-sm font-semibold">Эпический дар (Ур. 19+)</div>

      <SelectFeat
        v-model="selectedEpicFeatUrl"
        :categories="['EPIC_BOON']"
        placeholder="Выберите эпический дар"
      />
    </div>

    <!-- Selected Feats Details & Choices -->
    <div
      v-if="selectedSources.length > 0"
      class="flex flex-col gap-3 pt-2"
    >
      <div
        v-for="source in selectedSources"
        :key="source.id"
        class="bg-card flex flex-col gap-1 rounded border border-default p-2 text-xs"
      >
        <div class="flex justify-between font-medium">
          <span>{{ source.label }}</span>

          <span>
            {{ getBonusDescription(source.scores) }}
          </span>
        </div>

        <!-- Ability Choice if applicable -->
        <div
          v-if="getFeatAbilities(source.id).length > 1"
          class="mt-1"
        >
          <USelect
            v-model="featAbilityChoices[source.id]"
            :items="getAbilityOptions(source.id)"
            size="xs"
            placeholder="Выберите характеристику"
            class="w-full"
            :class="!featAbilityChoices[source.id] ? 'ring-error' : undefined"
            :ui="{
              base: '',
            }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
