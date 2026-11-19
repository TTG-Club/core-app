<script setup lang="ts">
  import type {
    AbilityScores,
    BonusSource,
    CalculatorAbilitiesBackground,
    CalculatorBackgroundOption,
  } from '../../model';

  import { ABILITY_KEYS, AbilityKey } from '~/shared/types';

  import {
    BACKGROUND_THREE_ONES_COUNT,
    CUSTOM_BACKGROUND_LABELS,
    CUSTOM_BACKGROUND_SOURCE_ID,
    formatAbilityBonusLabel,
    getBackgroundSourceLabel,
    getThreeOnesAbilityOptions,
  } from '../../model';

  const { background, backgroundOptions, loading } = defineProps<{
    background: CalculatorAbilitiesBackground | undefined;
    backgroundOptions: CalculatorBackgroundOption[];
    loading: boolean;
  }>();

  const emit = defineEmits<{
    (e: 'update:sources', value: BonusSource[]): void;
  }>();

  const selectedBackgroundUrl = defineModel<string>('selected-background-url');

  const asiChoice = ref<'three_ones' | 'two_one'>('two_one');
  const plusTwoStat = ref<AbilityKey | undefined>(undefined);
  const plusOneStat = ref<AbilityKey | undefined>(undefined);

  /**
   * Своя предыстория: бонусы распределяются между любыми характеристиками,
   * без выбора записи из списка.
   */
  const isCustomBackground = ref(false);
  const threeOnesStats = ref<AbilityKey[]>([]);

  const hasBonusSource = computed(
    () => isCustomBackground.value || !!background,
  );

  const hasThreeOnesStats = computed(() => threeOnesStats.value.length > 0);

  const availableAbilities = computed<AbilityKey[]>(() => {
    if (isCustomBackground.value) {
      return ABILITY_KEYS;
    }

    if (
      !background?.abilityScores
      || !Array.isArray(background.abilityScores)
    ) {
      return [];
    }

    return background.abilityScores
      .map((name: string) => {
        return Object.values(AbilityKey).find(
          (key) => key === name.toUpperCase(),
        );
      })
      .filter((key: AbilityKey | undefined): key is AbilityKey => !!key);
  });

  const canChooseThreeOnes = computed(
    () => availableAbilities.value.length >= BACKGROUND_THREE_ONES_COUNT,
  );

  const canChooseTwoOne = computed(() => availableAbilities.value.length >= 2);

  watch([() => background, isCustomBackground], () => {
    plusTwoStat.value = undefined;
    plusOneStat.value = undefined;
    threeOnesStats.value = [];

    if (canChooseTwoOne.value) {
      asiChoice.value = 'two_one';
    } else if (canChooseThreeOnes.value) {
      asiChoice.value = 'three_ones';
    }
  });

  /**
   * Переключает свою предысторию. Она заменяет выбранную из списка,
   * а не дополняет её, поэтому выбор из списка сбрасывается.
   *
   * @param isCustom - Включена ли своя предыстория.
   */
  function handleCustomBackgroundToggle(isCustom: boolean) {
    isCustomBackground.value = isCustom;

    if (isCustom) {
      selectedBackgroundUrl.value = undefined;
    }
  }

  /** Характеристики, получающие +1 в варианте «+1 / +1 / +1». */
  const threeOnesAbilities = computed<AbilityKey[]>(() => {
    if (isCustomBackground.value) {
      return threeOnesStats.value.slice(0, BACKGROUND_THREE_ONES_COUNT);
    }

    return availableAbilities.value.slice(0, BACKGROUND_THREE_ONES_COUNT);
  });

  const sourceIdentity = computed(() => {
    if (isCustomBackground.value) {
      return {
        id: CUSTOM_BACKGROUND_SOURCE_ID,
        label: getBackgroundSourceLabel(CUSTOM_BACKGROUND_LABELS.SOURCE_NAME),
      };
    }

    if (background) {
      return {
        id: background.url,
        label: getBackgroundSourceLabel(background.name.rus),
      };
    }

    return undefined;
  });

  const calculatedBonuses = computed<BonusSource[]>(() => {
    if (!sourceIdentity.value) {
      return [];
    }

    const bonuses: Partial<AbilityScores> = {};

    if (asiChoice.value === 'three_ones' && canChooseThreeOnes.value) {
      for (const key of threeOnesAbilities.value) {
        bonuses[key] = (bonuses[key] || 0) + 1;
      }
    } else if (asiChoice.value === 'two_one' && canChooseTwoOne.value) {
      if (plusTwoStat.value) {
        bonuses[plusTwoStat.value] = (bonuses[plusTwoStat.value] || 0) + 2;
      }

      if (plusOneStat.value) {
        bonuses[plusOneStat.value] = (bonuses[plusOneStat.value] || 0) + 1;
      }
    }

    return [
      {
        ...sourceIdentity.value,
        type: 'background',
        scores: bonuses,
      },
    ];
  });

  watch(calculatedBonuses, (newVal) => {
    emit('update:sources', newVal);
  });

  const availableForPlusTwo = computed(() => availableAbilities.value);

  const availableForPlusOne = computed(() => availableAbilities.value);

  watch(plusTwoStat, (val) => {
    if (val && val === plusOneStat.value) {
      plusOneStat.value = undefined;
    }
  });

  watch(plusOneStat, (val) => {
    if (val && val === plusTwoStat.value) {
      plusTwoStat.value = undefined;
    }
  });

  const asiOptions = computed(() => {
    const options = [];

    if (canChooseTwoOne.value) {
      options.push({ label: '+2 / +1', value: 'two_one' });
    }

    if (canChooseThreeOnes.value) {
      options.push({ label: '+1 / +1 / +1', value: 'three_ones' });
    }

    return options;
  });

  const plusTwoOptions = computed(() =>
    availableForPlusTwo.value.map((key) => ({
      label: formatAbilityBonusLabel(key, 2),
      value: key,
    })),
  );

  const plusOneOptions = computed(() =>
    availableForPlusOne.value.map((key) => ({
      label: formatAbilityBonusLabel(key, 1),
      value: key,
    })),
  );

  const threeOnesOptions = computed(() =>
    getThreeOnesAbilityOptions(threeOnesStats.value),
  );

  function getAutomaticBonusDescription(abilities: AbilityKey[]): string {
    return abilities.map((key) => formatAbilityBonusLabel(key, 1)).join(', ');
  }
</script>

<template>
  <div
    class="flex flex-col gap-6 rounded-xl border border-default bg-muted p-4"
  >
    <div class="flex flex-col gap-2">
      <div class="text-sm font-semibold">Предыстория</div>

      <UFieldGroup>
        <USelectMenu
          v-model="selectedBackgroundUrl"
          :items="backgroundOptions"
          :loading="loading"
          :disabled="isCustomBackground"
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
          icon="tabler:x"
          color="neutral"
          variant="subtle"
          @click.left.exact.prevent="selectedBackgroundUrl = undefined"
        />
      </UFieldGroup>

      <USwitch
        :model-value="isCustomBackground"
        :label="CUSTOM_BACKGROUND_LABELS.SWITCH"
        :description="CUSTOM_BACKGROUND_LABELS.SWITCH_DESCRIPTION"
        size="sm"
        @update:model-value="handleCustomBackgroundToggle"
      />
    </div>

    <div class="border-t border-default" />

    <div
      class="flex flex-col gap-4"
      :class="{ 'pointer-events-none opacity-50 grayscale': !hasBonusSource }"
    >
      <div class="text-sm font-semibold">Бонусы предыстории</div>

      <div
        v-if="hasBonusSource"
        class="flex flex-col gap-3"
      >
        <div class="flex flex-col gap-2">
          <span class="text-xs font-medium text-secondary">
            Бонусы характеристик:
          </span>

          <div class="flex gap-4">
            <URadioGroup
              v-if="canChooseTwoOne || canChooseThreeOnes"
              v-model="asiChoice"
              orientation="horizontal"
              :items="asiOptions"
            />
          </div>
        </div>

        <div
          v-if="asiChoice === 'two_one'"
          class="grid grid-cols-2 gap-2"
        >
          <UFieldGroup class="w-full">
            <USelect
              v-model="plusTwoStat"
              :items="plusTwoOptions"
              placeholder="Выберите +2"
              class="w-full"
            />

            <UButton
              v-if="plusTwoStat"
              icon="tabler:x"
              color="neutral"
              variant="subtle"
              @click.left.exact.prevent="plusTwoStat = undefined"
            />
          </UFieldGroup>

          <UFieldGroup class="w-full">
            <USelect
              v-model="plusOneStat"
              :items="plusOneOptions"
              placeholder="Выберите +1"
              class="w-full"
            />

            <UButton
              v-if="plusOneStat"
              icon="tabler:x"
              color="neutral"
              variant="subtle"
              @click.left.exact.prevent="plusOneStat = undefined"
            />
          </UFieldGroup>
        </div>

        <UFieldGroup
          v-else-if="isCustomBackground"
          class="w-full"
        >
          <USelect
            v-model="threeOnesStats"
            :items="threeOnesOptions"
            :placeholder="CUSTOM_BACKGROUND_LABELS.THREE_ONES_PLACEHOLDER"
            multiple
            class="w-full"
          />

          <UButton
            v-if="hasThreeOnesStats"
            icon="tabler:x"
            color="neutral"
            variant="subtle"
            @click.left.exact.prevent="threeOnesStats = []"
          />
        </UFieldGroup>

        <div
          v-else
          class="text-xs text-secondary"
        >
          Автоматически:
          {{ getAutomaticBonusDescription(availableAbilities) }}
        </div>
      </div>

      <div
        v-else
        class="text-sm text-secondary"
      >
        {{ CUSTOM_BACKGROUND_LABELS.EMPTY_HINT }}
      </div>
    </div>
  </div>
</template>
