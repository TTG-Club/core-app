<script setup lang="ts">
  import type { AbilityKey, SavingThrowRow } from '../../model';

  import { useCharacterSheet } from '../../composables';
  import {
    SAVING_THROW_PROFICIENCY_ICONS,
    SHEET_SAVING_THROW_SETTINGS_LABELS,
    SHEET_SAVING_THROWS_PANEL_LABELS,
    SHEET_TITLE_ACTION_CLASS,
    SHEET_TITLE_ACTION_REVEAL_CLASS,
  } from '../../model';
  import SheetPanel from './SheetPanel.vue';

  const props = defineProps<{
    rows: SavingThrowRow[];
  }>();

  const emit = defineEmits<{
    roll: [row: SavingThrowRow];
    settings: [];
    toggle: [abilityKey: AbilityKey];
  }>();

  // Шестерёнка ведёт в настройку спасбросков (правка листа): без прав она
  // прячется, а сами спасброски остаются на месте.
  const { editControlClass } = useCharacterSheet();

  const displayRows = computed(() =>
    props.rows.map((row) => ({
      ...row,
      icon: row.proficient
        ? SAVING_THROW_PROFICIENCY_ICONS.proficient
        : SAVING_THROW_PROFICIENCY_ICONS.none,
      iconClass: row.proficient ? 'text-primary' : 'text-muted',
    })),
  );
</script>

<template>
  <SheetPanel :title="SHEET_SAVING_THROWS_PANEL_LABELS.title">
    <template #title-actions>
      <button
        type="button"
        :class="[
          SHEET_TITLE_ACTION_CLASS,
          SHEET_TITLE_ACTION_REVEAL_CLASS,
          editControlClass,
        ]"
        :aria-label="SHEET_SAVING_THROW_SETTINGS_LABELS.open"
        @click.left.exact.prevent="emit('settings')"
      >
        <UIcon
          name="tabler:settings"
          class="size-3.5"
        />
      </button>
    </template>

    <div class="grid grid-flow-col grid-cols-2 grid-rows-3 gap-2">
      <div
        v-for="row in displayRows"
        :key="row.key"
        class="relative flex items-center gap-2 rounded border border-transparent bg-default/30 px-2 py-1.5 transition-colors hover:border-primary/60 hover:bg-accented/40"
      >
        <button
          type="button"
          class="z-10 flex cursor-pointer items-center"
          :aria-label="`${SHEET_SAVING_THROW_SETTINGS_LABELS.proficiency}: ${row.label}`"
          @click.left.exact.prevent="emit('toggle', row.key)"
        >
          <UIcon
            :name="row.icon"
            class="size-3 shrink-0 transition-colors hover:text-primary"
            :class="row.iconClass"
          />
        </button>

        <button
          type="button"
          class="flex min-w-0 grow cursor-pointer items-center after:absolute after:inset-0 after:cursor-pointer"
          :aria-label="`${SHEET_SAVING_THROWS_PANEL_LABELS.roll}: ${row.label}`"
          @click.left.exact.prevent="emit('roll', row)"
        >
          <span class="text-xs text-toned">{{ row.label }}</span>

          <!-- Значение со своими бонусами не сходится с характеристикой строки:
            пунктир зовёт навести и прочитать разбор. `z-10` поднимает значение
            над растяжкой кнопки броска — иначе наведение до него не дойдёт -->
          <UTooltip
            v-if="row.bonusHint"
            :text="row.bonusHint"
            :content="{ side: 'top' }"
          >
            <span
              class="z-10 ml-auto rounded border border-default/50 bg-default/60 px-1.5 text-sm font-bold text-highlighted underline decoration-dotted underline-offset-2"
            >
              {{ row.formattedValue }}
            </span>
          </UTooltip>

          <span
            v-else
            class="ml-auto rounded border border-default/50 bg-default/60 px-1.5 text-sm font-bold text-highlighted"
          >
            {{ row.formattedValue }}
          </span>
        </button>
      </div>
    </div>
  </SheetPanel>
</template>
