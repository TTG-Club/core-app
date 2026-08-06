<script setup lang="ts">
  import type { Character, CharacterCustomBonus } from '../../model';

  import {
    getCustomBonusesValue,
    getFormattedBonus,
    SHEET_SETTINGS_LABELS,
  } from '../../model';
  import SheetCustomBonusRows from './SheetCustomBonusRows.vue';

  // Раздел своего бонуса устроен одинаково у бонуса мастерства и у инициативы:
  // разница только в подписи слагаемого по правилам и в его значении.
  const { character, title, baseLabel, baseValue, totalLabel, hint } =
    defineProps<{
      character: Character;

      /** Заголовок раздела («Бонус мастерства»). */
      title: string;

      /** Подпись слагаемого по правилам («По уровню», «Ловкость»). */
      baseLabel: string;

      /** Значение слагаемого по правилам. */
      baseValue: number;

      /** Полная подпись итога — она же подсказка плитки «Итог». */
      totalLabel: string;

      /** Пояснение, где раздел участвует в подсчётах листа. */
      hint: string;
    }>();

  const rows = defineModel<CharacterCustomBonus[]>({ required: true });

  const formattedBaseValue = computed(() => getFormattedBonus(baseValue));

  // Итог считается от строк черновика: плитки меняются сразу, ещё до
  // «Применить».
  const customValue = computed(() =>
    getCustomBonusesValue(character, rows.value),
  );

  const formattedCustomValue = computed(() =>
    getFormattedBonus(customValue.value),
  );

  const formattedTotalValue = computed(() =>
    getFormattedBonus(baseValue + customValue.value),
  );
</script>

<template>
  <div class="flex flex-col gap-3">
    <h3 class="text-sm font-semibold text-highlighted">
      {{ title }}
    </h3>

    <!-- Плитки разбора: слагаемое по правилам, сумма своих бонусов и итог.
      Полная подпись итога длиннее плитки, поэтому она ушла в подсказку -->
    <div class="grid grid-cols-3 gap-2">
      <div
        class="flex flex-col items-center gap-1 rounded-lg border border-default/50 bg-elevated/20 p-2 sm:p-3"
      >
        <span
          class="text-center text-[10px] font-bold tracking-wider text-muted uppercase"
        >
          {{ baseLabel }}
        </span>

        <span class="text-2xl leading-none font-bold text-toned tabular-nums">
          {{ formattedBaseValue }}
        </span>
      </div>

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

      <UTooltip :text="totalLabel">
        <div
          class="flex w-full flex-col items-center gap-1 rounded-lg border border-primary/40 bg-primary/10 p-2 sm:p-3"
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
    />

    <p class="text-xs text-dimmed">
      {{ hint }}
    </p>
  </div>
</template>
