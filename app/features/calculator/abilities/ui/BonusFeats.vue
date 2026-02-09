<script setup lang="ts">
  import {
    ABILITY_KEYS,
    ABILITY_LABELS,
    ABILITY_SHORT_LABELS,
  } from '~/shared/types';

  import type { AbilityKey } from '~/shared/types/abilities';

  import type {
    AbilityScores,
    BonusSource,
    CalculatorAbilitiesClass,
    CalculatorAbilitiesFeat,
  } from '../model/types';

  const props = defineProps<{
    level: number;
  }>();

  const emit = defineEmits<{
    (e: 'update:sources', value: BonusSource[]): void;
  }>();

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
  const selectedEpicFeatUrl = ref<string>();
  // Store user choices for feats that offer ability selection
  const featAbilityChoices = ref<Record<string, AbilityKey>>({});

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

  const generalFeatsOptions = computed(() => {
    const options =
      allFeats.value
        ?.filter((f) => f.category === 'GENERAL' || f.category === 'DRAGONMARK')
        .map(mapFeats) || [];

    // Mark unselected options as disabled if max slots reached
    if (selectedFeatUrls.value.length >= generalSlots.value) {
      return options.map((opt) => ({
        ...opt,
        disabled: !selectedFeatUrls.value.includes(opt.value),
      }));
    }

    return options;
  });

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
        .map((key) => ABILITY_SHORT_LABELS[key])
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

  function isAbilityKey(key: string): key is AbilityKey {
    return ABILITY_KEYS.some((k) => String(k) === key);
  }

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

      <USelectMenu
        v-model="selectedClassUrl"
        :items="classOptions"
        :loading="classesPending"
        placeholder="Выберите класс"
        label-key="label"
        value-key="value"
        searchable
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

      <div class="text-xs text-secondary">
        Класс определяет уровни получения черт.
      </div>
    </div>

    <!-- General Feats -->
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <div class="text-sm font-semibold">Черты</div>

        <div
          class="text-xs"
          :class="[
            selectedFeatUrls.length > generalSlots
              ? 'text-error'
              : 'text-secondary',
          ]"
        >
          Выбрано: {{ selectedFeatUrls.length }} / {{ generalSlots }}
        </div>
      </div>

      <USelectMenu
        v-model="selectedFeatUrls"
        :items="generalFeatsOptions"
        :max="generalSlots"
        :disabled="generalSlots === 0 && !selectedFeatUrls.length"
        :loading="featsPending"
        multiple
        searchable
        placeholder="Выберите черты"
        class="w-full"
        label-key="label"
        value-key="value"
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
    </div>

    <!-- Epic Boon -->
    <div
      v-if="hasEpicBoon"
      class="flex flex-col gap-2"
    >
      <div class="text-sm font-semibold">Эпический дар (Ур. 19+)</div>

      <USelectMenu
        v-model="selectedEpicFeatUrl"
        :items="epicFeatsOptions"
        :loading="featsPending"
        placeholder="Выберите эпический дар"
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
          <USelectMenu
            v-model="featAbilityChoices[source.id]"
            :items="getAbilityOptions(source.id)"
            size="xs"
            placeholder="Выберите характеристику"
            class="w-full"
            :class="!featAbilityChoices[source.id] ? 'ring-error' : undefined"
            label-key="label"
            value-key="value"
          />
        </div>
      </div>
    </div>
  </div>
</template>
