<script setup lang="ts">
  import type { SkillRow } from '../../model';

  import {
    SKILL_PROFICIENCY_ICONS,
    SKILL_PROFICIENCY_LABELS,
  } from '../../model';
  import SheetPanel from './SheetPanel.vue';

  const props = defineProps<{
    rows: SkillRow[];
  }>();

  const emit = defineEmits<{
    cycle: [skillName: string];
    roll: [row: SkillRow];
  }>();

  const displayRows = computed(() =>
    props.rows.map((row) => ({
      ...row,
      icon: SKILL_PROFICIENCY_ICONS[row.proficiency],
      iconClass: row.proficiency === 'none' ? 'text-muted' : 'text-warning',
      proficiencyLabel: SKILL_PROFICIENCY_LABELS[row.proficiency],
    })),
  );
</script>

<template>
  <SheetPanel title="Навыки">
    <div class="flex flex-col gap-0.5">
      <div
        v-for="row in displayRows"
        :key="row.name"
        class="relative flex items-center gap-3 rounded px-2 py-1.5 transition-colors hover:bg-accented/40"
      >
        <UTooltip
          :text="row.proficiencyLabel"
          :content="{ side: 'top' }"
        >
          <button
            type="button"
            class="z-10 flex cursor-pointer items-center"
            :aria-label="`Владение навыком: ${row.name}`"
            @click.left.exact.prevent="emit('cycle', row.name)"
          >
            <UIcon
              :name="row.icon"
              class="size-3.5 shrink-0 transition-colors hover:text-warning"
              :class="row.iconClass"
            />
          </button>
        </UTooltip>

        <button
          type="button"
          class="flex min-w-0 grow cursor-pointer items-center gap-3 after:absolute after:inset-0 after:cursor-pointer"
          :aria-label="`Проверка: ${row.name}`"
          @click.left.exact.prevent="emit('roll', row)"
        >
          <span
            class="w-8 shrink-0 text-left text-[10px] font-medium text-muted uppercase"
          >
            {{ row.abilityLabel }}
          </span>

          <span class="min-w-0 grow truncate text-left text-sm text-toned">
            {{ row.name }}
          </span>

          <span class="shrink-0 text-sm font-bold text-highlighted">
            {{ row.formattedModifier }}
          </span>

          <span class="w-6 shrink-0 text-right text-xs text-dimmed">
            {{ row.passiveValue }}
          </span>
        </button>
      </div>
    </div>
  </SheetPanel>
</template>
