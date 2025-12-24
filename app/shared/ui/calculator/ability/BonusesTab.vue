<script setup lang="ts">
  import { computed, ref, watch, onMounted } from 'vue';

  import SelectFeatBonuses from './SelectFeatBonuses.vue';
  import SelectBackgroundBonuses from './SelectBackgroundBonuses.vue';
  import BackgroundBonuses from './BackgroundBonuses.vue';

  import { AbilityKey } from '~/shared/types';
  import type { BaseAbilityScores } from '~/shared/types';

  type BaseAbilityScoresLike =
    | Partial<Record<AbilityKey, unknown>>
    | null
    | undefined;

  const bonus = defineModel<BaseAbilityScores>('bonus', {
    required: true,
  });

  const level = defineModel<number>('level');

  const backgroundUrl = ref<string | undefined>(undefined);

  // Загружаем сохраненную предысторию из localStorage
  onMounted(() => {
    try {
      const saved = localStorage.getItem('selectedBackground');

      if (saved) {
        backgroundUrl.value = saved;
      }
    } catch (error) {
      // Игнорируем ошибки localStorage
    }
  });

  // Сохраняем выбранную предысторию в localStorage
  watch(backgroundUrl, (newUrl) => {
    try {
      if (newUrl) {
        localStorage.setItem('selectedBackground', newUrl);
      } else {
        localStorage.removeItem('selectedBackground');
      }
    } catch (error) {
      // Игнорируем ошибки localStorage
    }
  });

  // Уровни, на которых даются черты
  const featLevels = [1, 4, 8, 12, 16, 19];

  const emptyScores = (): BaseAbilityScores => {
    return {
      [AbilityKey.STRENGTH]: 0,
      [AbilityKey.DEXTERITY]: 0,
      [AbilityKey.CONSTITUTION]: 0,
      [AbilityKey.INTELLIGENCE]: 0,
      [AbilityKey.WISDOM]: 0,
      [AbilityKey.CHARISMA]: 0,
    };
  };

  const featSlots = computed<number>(() => {
    const currentLevel = level.value!;

    if (currentLevel >= 19) {
      return 5;
    }

    if (currentLevel >= 16) {
      return 4;
    }

    if (currentLevel >= 12) {
      return 3;
    }

    if (currentLevel >= 8) {
      return 2;
    }

    if (currentLevel >= 4) {
      return 1;
    }

    return 0;
  });

  // Инициализация уровня
  onMounted(() => {
    if (!level.value || !featLevels.includes(level.value)) {
      level.value = featLevels[0];
    }
  });

  const levelIndex = computed<number>(() => {
    const currentLevel = level.value!;

    return featLevels.indexOf(currentLevel);
  });

  const handleLevelChange = (index: number | undefined): void => {
    if (index === undefined || index < 0) {
      level.value = featLevels[0];

      return;
    }

    if (index >= featLevels.length) {
      level.value = featLevels[featLevels.length - 1];

      return;
    }

    level.value = featLevels[index];
  };

  const normalizeNumber = (value: unknown, fallback: number): number => {
    if (typeof value !== 'number') {
      return fallback;
    }

    return Number.isFinite(value) ? value : fallback;
  };

  const normalizeBaseScores = (
    value: BaseAbilityScoresLike,
  ): BaseAbilityScores => {
    const safeValue: Partial<Record<AbilityKey, unknown>> = value ?? {};

    return {
      [AbilityKey.STRENGTH]: normalizeNumber(safeValue[AbilityKey.STRENGTH], 0),
      [AbilityKey.DEXTERITY]: normalizeNumber(
        safeValue[AbilityKey.DEXTERITY],
        0,
      ),
      [AbilityKey.CONSTITUTION]: normalizeNumber(
        safeValue[AbilityKey.CONSTITUTION],
        0,
      ),
      [AbilityKey.INTELLIGENCE]: normalizeNumber(
        safeValue[AbilityKey.INTELLIGENCE],
        0,
      ),
      [AbilityKey.WISDOM]: normalizeNumber(safeValue[AbilityKey.WISDOM], 0),
      [AbilityKey.CHARISMA]: normalizeNumber(safeValue[AbilityKey.CHARISMA], 0),
    };
  };

  const sameBaseScores = (
    a: BaseAbilityScores,
    b: BaseAbilityScores,
  ): boolean => {
    return (
      a[AbilityKey.STRENGTH] === b[AbilityKey.STRENGTH] &&
      a[AbilityKey.DEXTERITY] === b[AbilityKey.DEXTERITY] &&
      a[AbilityKey.CONSTITUTION] === b[AbilityKey.CONSTITUTION] &&
      a[AbilityKey.INTELLIGENCE] === b[AbilityKey.INTELLIGENCE] &&
      a[AbilityKey.WISDOM] === b[AbilityKey.WISDOM] &&
      a[AbilityKey.CHARISMA] === b[AbilityKey.CHARISMA]
    );
  };

  const backgroundBonus = ref<BaseAbilityScores>(emptyScores());
  const featBonus = ref<BaseAbilityScores>(emptyScores());

  // Очистка бонусов черт при изменении уровня
  watch(
    level,
    (newLevel, oldLevel) => {
      if (newLevel !== oldLevel) {
        // Очищаем бонусы черт при изменении уровня
        featBonus.value = emptyScores();
      }
    },
    { immediate: true },
  );

  const totalBonus = computed<BaseAbilityScores>(() => {
    const normalizedBackgroundBonus = normalizeBaseScores(
      backgroundBonus.value,
    );

    const normalizedFeatBonus = normalizeBaseScores(featBonus.value);

    return {
      [AbilityKey.STRENGTH]:
        normalizedBackgroundBonus[AbilityKey.STRENGTH] +
        normalizedFeatBonus[AbilityKey.STRENGTH],
      [AbilityKey.DEXTERITY]:
        normalizedBackgroundBonus[AbilityKey.DEXTERITY] +
        normalizedFeatBonus[AbilityKey.DEXTERITY],
      [AbilityKey.CONSTITUTION]:
        normalizedBackgroundBonus[AbilityKey.CONSTITUTION] +
        normalizedFeatBonus[AbilityKey.CONSTITUTION],
      [AbilityKey.INTELLIGENCE]:
        normalizedBackgroundBonus[AbilityKey.INTELLIGENCE] +
        normalizedFeatBonus[AbilityKey.INTELLIGENCE],
      [AbilityKey.WISDOM]:
        normalizedBackgroundBonus[AbilityKey.WISDOM] +
        normalizedFeatBonus[AbilityKey.WISDOM],
      [AbilityKey.CHARISMA]:
        normalizedBackgroundBonus[AbilityKey.CHARISMA] +
        normalizedFeatBonus[AbilityKey.CHARISMA],
    };
  });

  watch(
    totalBonus,
    (next) => {
      const normalizedNext = normalizeBaseScores(next);
      const normalizedCurrent = normalizeBaseScores(bonus.value);

      if (sameBaseScores(normalizedCurrent, normalizedNext)) {
        return;
      }

      bonus.value = normalizedNext;
    },
    { immediate: true },
  );
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-start gap-3">
      <div class="w-1/3">
        <SelectBackgroundBonuses v-model:background-url="backgroundUrl" />
      </div>

      <div class="w-2/3">
        <div
          class="mb-5 flex items-center justify-between gap-3 text-sm font-semibold"
        >
          <span>Уровень: {{ level || featLevels[0] }}</span>

          <span class="text-xs text-muted">
            Доступно слотов: {{ featSlots }}
          </span>
        </div>

        <USlider
          :model-value="levelIndex"
          :min="0"
          :max="featLevels.length - 1"
          :step="1"
          class="mb-1"
          @update:model-value="handleLevelChange"
        />
      </div>
    </div>

    <div class="w-full">
      <BackgroundBonuses
        v-model:bonus="backgroundBonus"
        v-model:background-url="backgroundUrl"
      />
    </div>

    <div
      v-if="featSlots > 0"
      class="rounded-xl border border-default bg-muted p-4"
    >
      <SelectFeatBonuses
        v-model:bonus="featBonus"
        v-model:level="level"
      />
    </div>
  </div>
</template>
