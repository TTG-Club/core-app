<script setup lang="ts">
  import type { AbilityKey, SkillRow, SkillRowGroup } from '../../model';

  import { useCharacterSheet } from '../../composables';
  import {
    SHEET_REVEAL_CONTROL_CLASS,
    SHEET_SKILL_SETTINGS_LABELS,
    SKILL_GROUP_LABEL_CLASS,
    SKILL_PROFICIENCY_ICONS,
    SKILL_PROFICIENCY_LABELS,
  } from '../../model';
  import SheetPanel from './SheetPanel.vue';

  /**
   * Подсветка навыков наведённой характеристики: мягкая заливка и внутренняя
   * обводка, как у выделенной карточки листа. Обводка целиком лежит в этом
   * классе и ничего не дублирует в базовом: держать в базовом прозрачный
   * `ring-transparent` нельзя — в собранном CSS он идёт после цветной обводки
   * и при равной специфичности всегда её перебивает. Раскладку обводка не
   * двигает (это тень), поэтому появляться она может и без перехода.
   */
  const HIGHLIGHTED_ROW_CLASS =
    'bg-primary/10 ring-1 ring-primary/50 ring-inset';

  const props = defineProps<{
    /**
     * Группы навыков. Без группировки список приходит одной группой без
     * подписи — разметка строк у обоих режимов одна.
     */
    groups: SkillRowGroup[];

    /**
     * Характеристика под курсором: её навыки подсвечиваются в списке. `null` —
     * подсвечивать нечего.
     */
    highlightedAbility?: AbilityKey | null;
  }>();

  const emit = defineEmits<{
    cycle: [skillName: string];
    roll: [row: SkillRow];
    settings: [];
  }>();

  // Шестерёнка ведёт в настройку навыков (правка листа): без прав она прячется,
  // а сам список навыков остаётся прежним.
  const { editControlClass } = useCharacterSheet();

  const displayGroups = computed(() => {
    const highlightedAbility = props.highlightedAbility ?? null;

    return props.groups.map((group) => ({
      key: group.key,
      title: group.title,

      // С группировкой характеристику называет разделитель, поэтому в строках
      // она не повторяется — иначе под «Ловкостью» каждая строка твердила бы
      // «ЛОВ».
      withAbilityLabel: group.ability === null,

      titleClass: `${SKILL_GROUP_LABEL_CLASS} ${
        group.ability !== null && group.ability === highlightedAbility
          ? 'text-primary'
          : 'text-muted'
      }`,

      rows: group.rows.map((row) => {
        // Характеристика строки, а не правило навыка: в настройках её можно
        // подменить, и подсвечивается то, от чего навык считается на самом деле.
        const isMainAbility = row.ability === highlightedAbility;

        // Свой бонус от другой характеристики тоже связывает её с навыком:
        // строка подсвечивается, но подпись остаётся приглушённой — навык
        // всё-таки не её.
        const isHighlighted =
          isMainAbility
          || (highlightedAbility !== null
            && row.bonusAbilities.includes(highlightedAbility));

        return {
          ...row,
          icon: SKILL_PROFICIENCY_ICONS[row.proficiency],
          iconClass: row.proficiency === 'none' ? 'text-muted' : 'text-primary',
          proficiencyLabel: SKILL_PROFICIENCY_LABELS[row.proficiency],
          rowClass: isHighlighted ? HIGHLIGHTED_ROW_CLASS : undefined,
          abilityLabelClass: isMainAbility ? 'text-primary' : 'text-muted',
        };
      }),
    }));
  });
</script>

<template>
  <SheetPanel
    title="Навыки"
    class="group"
  >
    <template #title-actions>
      <button
        type="button"
        class="cursor-pointer rounded-full bg-default p-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        :class="[SHEET_REVEAL_CONTROL_CLASS, editControlClass]"
        :aria-label="SHEET_SKILL_SETTINGS_LABELS.open"
        @click.left.exact.prevent="emit('settings')"
      >
        <UIcon
          name="tabler:settings"
          class="size-3.5 text-muted transition-colors hover:text-primary"
        />
      </button>
    </template>

    <div class="flex flex-col gap-0.5">
      <template
        v-for="group in displayGroups"
        :key="group.key"
      >
        <!-- Разделитель группы: подпись слева, линия до края строки. Без
          группировки группа одна и подписи у неё нет -->
        <USeparator
          v-if="group.title"
          :label="group.title"
          position="start"
          class="px-2 pt-2 first:pt-0"
          :ui="{ label: group.titleClass }"
        />

        <div
          v-for="row in group.rows"
          :key="row.name"
          class="relative flex items-center gap-3 rounded px-2 py-1.5 transition-colors hover:bg-accented/40"
          :class="row.rowClass"
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
                class="size-3.5 shrink-0 transition-colors hover:text-primary"
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
              v-if="group.withAbilityLabel"
              class="w-8 shrink-0 text-left text-[10px] font-medium uppercase transition-colors"
              :class="row.abilityLabelClass"
            >
              {{ row.abilityLabel }}
            </span>

            <span class="min-w-0 grow truncate text-left text-sm text-toned">
              {{ row.name }}
            </span>

            <!-- Значение со своими бонусами не сходится с характеристикой
              строки: пунктир зовёт навести и прочитать разбор. `z-10` поднимает
              подпись над растяжкой кнопки броска — иначе наведение до неё не
              дойдёт -->
            <UTooltip
              v-if="row.bonusHint"
              :text="row.bonusHint"
              :content="{ side: 'top' }"
            >
              <span
                class="z-10 shrink-0 text-sm font-bold text-highlighted underline decoration-dotted underline-offset-2"
              >
                {{ row.formattedModifier }}
              </span>
            </UTooltip>

            <span
              v-else
              class="shrink-0 text-sm font-bold text-highlighted"
            >
              {{ row.formattedModifier }}
            </span>

            <span class="w-6 shrink-0 text-right text-xs text-dimmed">
              {{ row.passiveValue }}
            </span>
          </button>
        </div>
      </template>
    </div>
  </SheetPanel>
</template>
