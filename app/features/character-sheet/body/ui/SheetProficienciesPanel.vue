<script setup lang="ts">
  import type {
    CharacterProficiencies,
    ProficiencyGroupKey,
  } from '../../model';

  import {
    ARMOR_PROFICIENCY_GROUPS,
    collapseProficiencies,
    LANGUAGE_PROFICIENCY_GROUPS,
    SHEET_EMPTY_LABELS,
    TOOL_PROFICIENCY_GROUPS,
    WEAPON_MASTERY_ICON,
    WEAPON_PROFICIENCY_GROUPS,
  } from '../../model';
  import SheetPanel from './SheetPanel.vue';

  interface ProficiencyChip {
    name: string;

    /** Показывать ли на чипе значок мастерства оружием. */
    hasMastery: boolean;
  }

  interface ProficiencyGroupView {
    key: ProficiencyGroupKey;
    title: string;
    items: ProficiencyChip[];

    /** Есть ли у группы модалка настроек (шестерёнка на плашке). */
    hasSettings: boolean;
  }

  const props = defineProps<{
    proficiencies: CharacterProficiencies;
  }>();

  const emit = defineEmits<{
    edit: [group: ProficiencyGroupKey];
  }>();

  const weaponChips = computed((): ProficiencyChip[] => {
    const collapsed = collapseProficiencies(
      props.proficiencies.weapons,
      WEAPON_PROFICIENCY_GROUPS,
    );

    const masteries = new Set(props.proficiencies.weaponMasteries);

    const shownNames = new Set(collapsed);

    return [
      ...collapsed.map((name) => ({ name, hasMastery: masteries.has(name) })),
      // Мастерство оружия, скрытого чипом «вся группа»: отдельного чипа
      // владения нет, поэтому добавляем чип ради значка мастерства.
      ...props.proficiencies.weaponMasteries
        .filter((name) => !shownNames.has(name))
        .map((name) => ({ name, hasMastery: true })),
    ];
  });

  const groups = computed((): ProficiencyGroupView[] => [
    {
      key: 'armor',
      title: 'Снаряжение',
      items: collapseProficiencies(
        props.proficiencies.armor,
        ARMOR_PROFICIENCY_GROUPS,
      ).map((name) => ({ name, hasMastery: false })),
      hasSettings: true,
    },
    {
      key: 'weapons',
      title: 'Оружие',
      items: weaponChips.value,
      hasSettings: true,
    },
    {
      key: 'tools',
      title: 'Инструменты',
      items: collapseProficiencies(
        props.proficiencies.tools,
        TOOL_PROFICIENCY_GROUPS,
      ).map((name) => ({ name, hasMastery: false })),
      hasSettings: true,
    },
    {
      key: 'languages',
      title: 'Языки',
      items: collapseProficiencies(
        props.proficiencies.languages,
        LANGUAGE_PROFICIENCY_GROUPS,
      ).map((name) => ({ name, hasMastery: false })),
      hasSettings: true,
    },
  ]);
</script>

<template>
  <SheetPanel>
    <!-- pt-2 добирает верхний отступ панели (pt-1) до бокового px-3 -->
    <div class="flex flex-col gap-4 pt-2">
      <div
        v-for="group in groups"
        :key="group.key"
        class="flex flex-col gap-2"
      >
        <h4
          class="rounded-md bg-elevated text-[11px] font-bold tracking-wider text-highlighted uppercase"
        >
          <button
            v-if="group.hasSettings"
            type="button"
            class="group/header flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-1.5 text-left transition-colors hover:bg-accented/50"
            :aria-label="`Настроить: ${group.title}`"
            @click.left.exact.prevent="emit('edit', group.key)"
          >
            <span class="leading-none">{{ group.title }}</span>

            <UIcon
              name="tabler:settings"
              class="size-3.5 shrink-0 text-muted opacity-0 transition-opacity group-hover/header:text-warning group-hover/header:opacity-100 group-focus-visible/header:opacity-100"
            />
          </button>

          <span
            v-else
            class="flex items-center px-3 py-1.5 leading-none"
          >
            {{ group.title }}
          </span>
        </h4>

        <div
          v-if="group.items.length"
          class="flex flex-wrap gap-1.5"
        >
          <span
            v-for="chip in group.items"
            :key="chip.name"
            class="flex items-center gap-1 rounded border border-default bg-default/40 px-2.5 py-1 text-[11px] text-toned"
          >
            {{ chip.name }}

            <UTooltip
              v-if="chip.hasMastery"
              text="Мастерство"
            >
              <UIcon
                :name="WEAPON_MASTERY_ICON"
                class="size-3 text-success"
              />
            </UTooltip>
          </span>
        </div>

        <span
          v-else
          class="text-xs text-dimmed italic"
        >
          {{ SHEET_EMPTY_LABELS.proficiencies }}
        </span>
      </div>
    </div>
  </SheetPanel>
</template>
