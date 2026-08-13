<script setup lang="ts">
  import type { Character, CharacterCustomBonus } from '../../model';

  import {
    CUSTOM_BONUS_FLAT_SOURCE,
    CUSTOM_BONUS_FORMAT_OPTIONS,
    CUSTOM_BONUS_MAX,
    CUSTOM_BONUS_MIN,
    CUSTOM_BONUS_SOURCE_OPTIONS,
    getCustomBonusesValue,
    getFormattedBonus,
    SHEET_REVEAL_CONTROL_CLASS,
    SHEET_SETTINGS_LABELS,
  } from '../../model';
  import SheetCustomBonusRows from './SheetCustomBonusRows.vue';

  // Раздел устроен одинаково у бонуса мастерства и у инициативы: разница — в
  // вариантах основы, её значении и подписях.
  const {
    character,
    title,
    baseItems,
    sourceItems = CUSTOM_BONUS_SOURCE_OPTIONS,
    baseValue,
    penaltyLabel = '',
    penaltyValue = 0,
    totalLabel,
    hint,
  } = defineProps<{
    character: Character;

    /** Заголовок раздела («Бонус мастерства»). */
    title: string;

    /** Варианты основы: свои у мастерства и у инициативы. */
    baseItems: Array<{ label: string; value: string }>;

    /**
     * Доступные источники бонуса; по умолчанию — все. Раздел бонуса мастерства
     * сужает список: сам себе слагаемым бонус мастерства не бывает.
     */
    sourceItems?: typeof CUSTOM_BONUS_SOURCE_OPTIONS;

    /** Значение основы с учётом выбранного источника. */
    baseValue: number;

    /** Подпись постоянного штрафа («Истощение»); пустая — штрафа нет. */
    penaltyLabel?: string;

    /**
     * Штраф, который лист снимает с итога поверх настроек (истощение). Ноль —
     * плитка штрафа не показывается.
     */
    penaltyValue?: number;

    /** Полная подпись итога — она же подсказка плитки «Итог». */
    totalLabel: string;

    /** Пояснение, где итог участвует в подсчётах листа. */
    hint: string;
  }>();

  const rows = defineModel<CharacterCustomBonus[]>({ required: true });

  const baseSource = defineModel<string>('baseSource', { required: true });

  const baseCustomValue = defineModel<number>('baseCustomValue', {
    required: true,
  });

  const isBaseCustom = computed(
    () => baseSource.value === CUSTOM_BONUS_FLAT_SOURCE,
  );

  // Подпись плитки — название выбранного источника: отдельная подпись «Основа»
  // не нужна, плитка и так стоит первой в разборе.
  const baseLabel = computed(
    () =>
      baseItems.find((option) => option.value === baseSource.value)?.label
      ?? '',
  );

  // Разделов в модалке два, поэтому подпись кнопки называет ещё и раздел:
  // «Настроить основу» без него читалось бы одинаково у обоих.
  const baseEditLabel = computed(
    () => `${SHEET_SETTINGS_LABELS.baseEditTitle}: ${title}`,
  );

  const formattedBaseValue = computed(() => getFormattedBonus(baseValue));

  // Итоги считаются от черновика: числа в плитках меняются сразу, ещё до
  // «Применить».
  const customValue = computed(() =>
    getCustomBonusesValue(character, rows.value),
  );

  const formattedCustomValue = computed(() =>
    getFormattedBonus(customValue.value),
  );

  // Штраф листа стоит отдельной плиткой: без него итог настроек разошёлся бы с
  // числом на самом листе, а сложить основу с бонусами игрок должен уметь
  // глазами.
  const hasPenalty = computed(() => penaltyValue !== 0);

  const formattedPenaltyValue = computed(() =>
    getFormattedBonus(-penaltyValue),
  );

  const tilesClass = computed(() =>
    hasPenalty.value ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3',
  );

  const formattedTotalValue = computed(() =>
    getFormattedBonus(baseValue + customValue.value - penaltyValue),
  );

  function handleBaseSource(source: unknown) {
    const selectedOption = baseItems.find((option) => option.value === source);

    if (!selectedOption) {
      return;
    }

    baseSource.value = selectedOption.value;
  }
</script>

<template>
  <div class="flex flex-col gap-3">
    <h3 class="text-sm font-semibold text-highlighted">
      {{ title }}
    </h3>

    <!-- Плитки разбора: основа, сумма своих бонусов и итог. Основа правится в
      своей же плитке — карандаш открывает настройку, поэтому отдельной строки,
      повторяющей плитку, в разделе нет -->
    <div
      class="grid gap-2"
      :class="tilesClass"
    >
      <UPopover :ui="{ content: 'w-64 p-3' }">
        <button
          type="button"
          class="group relative flex w-full cursor-pointer flex-col items-center gap-1 rounded-lg border border-default/50 bg-elevated/20 p-2 transition-colors hover:border-primary/40 sm:p-3"
          :aria-label="baseEditLabel"
        >
          <span
            class="text-center text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ baseLabel }}
          </span>

          <span class="text-2xl leading-none font-bold text-toned tabular-nums">
            {{ formattedBaseValue }}
          </span>

          <!-- Карандаш снизу: сверху он наезжал бы на длинную подпись
            источника вроде «Телосложение» -->
          <UIcon
            name="tabler:pencil"
            class="absolute right-1.5 bottom-1.5 size-3 text-muted opacity-0 transition-opacity group-hover:opacity-100"
            :class="SHEET_REVEAL_CONTROL_CLASS"
          />
        </button>

        <template #content>
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between gap-3">
              <span class="text-sm text-toned">
                {{ SHEET_SETTINGS_LABELS.baseSourceTitle }}
              </span>

              <USelect
                :model-value="baseSource"
                :items="baseItems"
                size="sm"
                class="w-36"
                @update:model-value="handleBaseSource"
              />
            </div>

            <div
              v-if="isBaseCustom"
              class="flex items-center justify-between gap-3"
            >
              <span class="text-sm text-toned">
                {{ SHEET_SETTINGS_LABELS.baseValueTitle }}
              </span>

              <UInputNumber
                v-model="baseCustomValue"
                :min="CUSTOM_BONUS_MIN"
                :max="CUSTOM_BONUS_MAX"
                :format-options="CUSTOM_BONUS_FORMAT_OPTIONS"
                size="sm"
                class="w-36"
              />
            </div>
          </div>
        </template>
      </UPopover>

      <div
        class="flex flex-col items-center gap-1 rounded-lg border border-default/50 bg-elevated/20 p-2 sm:p-3"
      >
        <span
          class="text-center text-[10px] font-bold tracking-wider text-muted uppercase"
        >
          {{ SHEET_SETTINGS_LABELS.customBonusesTitle }}
        </span>

        <span class="text-2xl leading-none font-bold text-toned tabular-nums">
          {{ formattedCustomValue }}
        </span>
      </div>

      <div
        v-if="hasPenalty"
        class="flex flex-col items-center gap-1 rounded-lg border border-default/50 bg-elevated/20 p-2 sm:p-3"
      >
        <span
          class="text-center text-[10px] font-bold tracking-wider text-muted uppercase"
        >
          {{ penaltyLabel }}
        </span>

        <span class="text-2xl leading-none font-bold text-warning tabular-nums">
          {{ formattedPenaltyValue }}
        </span>
      </div>

      <UTooltip :text="totalLabel">
        <div
          class="flex h-full w-full flex-col items-center gap-1 rounded-lg border border-primary/40 bg-primary/10 p-2 sm:p-3"
        >
          <span
            class="text-center text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ SHEET_SETTINGS_LABELS.totalTitle }}
          </span>

          <span
            class="text-2xl leading-none font-bold text-primary tabular-nums"
            :aria-label="totalLabel"
          >
            {{ formattedTotalValue }}
          </span>
        </div>
      </UTooltip>
    </div>

    <SheetCustomBonusRows
      v-model="rows"
      :character="character"
      :source-items="sourceItems"
    />

    <p class="text-xs text-dimmed">
      {{ hint }}
    </p>
  </div>
</template>
