<script setup lang="ts">
  import type {
    CharacterSpell,
    SpellcastingBreakdown,
    SpellSlotRow,
  } from '../../model';

  import { SpellDrawer } from '~spells/drawer';
  import { MarkupRender } from '~ui/markup';

  import { useCharacterSheet } from '../../composables';
  import {
    getCustomSpellStatRows,
    getFormattedBonus,
    getSpellGroups,
    getSpellsAddMenuItems,
    getSpellSlotCircles,
    getSpellSlotSummary,
    isCustomSpell,
    SHEET_TAB_EMPTY_LABELS,
    SPELL_SLOTS_LABEL,
  } from '../../model';

  const props = defineProps<{
    spells: CharacterSpell[];
    spellcasting: SpellcastingBreakdown;

    /** Ячейки заклинаний по кругам; пусто — класс ячеек не даёт. */
    spellSlots: SpellSlotRow[];
  }>();

  const emit = defineEmits<{
    'add-spell': [];
    'add-custom-spell': [];
    'edit-spell': [spellUrl: string];
    'edit-spellcasting': [];
    'remove-spell': [spellUrl: string];
    'toggle-spell-slot': [level: number, index: number];
  }>();

  // Пополнение книги, правка и удаление заклинаний меняют лист: без прав кнопки
  // прячутся, а ряды заклинаний и шапка вкладки остаются на прежних местах.
  const { editControlClass } = useCharacterSheet();

  const addMenuItems = getSpellsAddMenuItems({
    onAddSpell: () => emit('add-spell'),
    onAddCustomSpell: () => emit('add-custom-spell'),
  });

  const formattedAttackBonus = computed(() =>
    getFormattedBonus(props.spellcasting.attackBonus),
  );

  const overlay = useOverlay();

  // Дровер описания заклинания; без destroyOnClose — повторный open()
  // после закрытия иначе падает («Overlay not found»).
  const spellPreviewDrawer = overlay.create(SpellDrawer, {
    props: {
      url: '',
      onClose: () => spellPreviewDrawer.close(),
    },
  });

  function handlePreview(url: string) {
    spellPreviewDrawer.open({ url });
  }

  /** Развёрнутые свои заклинания: описание у них хранится прямо в листе. */
  const expandedUrls = ref(new Set<string>());

  function toggleExpanded(spellUrl: string) {
    if (expandedUrls.value.has(spellUrl)) {
      expandedUrls.value.delete(spellUrl);

      return;
    }

    expandedUrls.value.add(spellUrl);
  }

  const slotRowByLevel = computed(
    () => new Map(props.spellSlots.map((row) => [row.level, row])),
  );

  const displayGroups = computed(() =>
    getSpellGroups(
      props.spells,
      props.spellSlots.map((row) => row.level),
    ).map((group) => {
      const slotRow = slotRowByLevel.value.get(group.level);

      return {
        ...group,
        // Кружки ячеек живут в разделителе круга: у заговоров ячеек нет, у
        // класса-незаклинателя их нет ни у одного круга.
        circles: slotRow
          ? getSpellSlotCircles(slotRow).map((circle) => ({
              ...circle,
              level: slotRow.level,
              circleClass: circle.used
                ? 'border-warning bg-warning'
                : 'border-default hover:border-warning',
            }))
          : [],
        slotsLabel: slotRow ? getSpellSlotSummary(slotRow) : '',
        spells: group.spells.map((spell) => {
          const isCustom = isCustomSpell(spell);
          const isExpanded = isCustom && expandedUrls.value.has(spell.url);

          return {
            ...spell,
            isCustom,
            isExpanded,
            // У каталожных заклинаний этих полей нет — список выйдет пустым.
            statRows: getCustomSpellStatRows(spell),
            descriptionNodes: spell.description ?? [],
            // Раскрывается только своё заклинание — у каталожного строка ведёт в
            // дровер раздела, состояния «развёрнуто» у неё нет.
            ariaExpanded: isCustom ? isExpanded : undefined,
            chevronClass: isExpanded ? 'rotate-180' : '',
            openLabel: isCustom
              ? `Развернуть заклинание: ${spell.name}`
              : `Открыть заклинание: ${spell.name}`,
          };
        }),
      };
    }),
  );

  type DisplaySpell = (typeof displayGroups.value)[number]['spells'][number];

  type DisplayCircle = (typeof displayGroups.value)[number]['circles'][number];

  /** Нажатие на кружок ячейки: трата до него включительно либо возврат. */
  function handleSlotToggle(circle: DisplayCircle) {
    emit('toggle-spell-slot', circle.level, circle.index);
  }

  /**
   * Клик по строке: своё заклинание разворачивается прямо на листе (описание
   * хранится в нём), каталожное открывается дровером раздела.
   */
  function handleSpellOpen(spell: DisplaySpell) {
    if (spell.isCustom) {
      toggleExpanded(spell.url);

      return;
    }

    handlePreview(spell.url);
  }
</script>

<template>
  <div class="flex flex-col gap-3 pt-2">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <button
        type="button"
        class="flex h-7 cursor-pointer items-center gap-3 rounded-lg border border-default/50 bg-elevated/20 px-3 transition-colors hover:border-warning/60"
        aria-label="Настроить заклинательство"
        @click.left.exact.prevent="emit('edit-spellcasting')"
      >
        <span class="flex items-center gap-1.5">
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            Сл. спасброска
          </span>

          <span class="text-sm font-bold text-highlighted">
            {{ spellcasting.saveDc }}
          </span>
        </span>

        <span class="h-5 w-px bg-default/60" />

        <span class="flex items-center gap-1.5">
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            Атака заклинанием
          </span>

          <span class="text-sm font-bold text-highlighted">
            {{ formattedAttackBonus }}
          </span>
        </span>
      </button>

      <UDropdownMenu
        :items="addMenuItems"
        :content="{ align: 'end' }"
      >
        <UButton
          icon="tabler:plus"
          label="Добавить"
          trailing-icon="tabler:chevron-down"
          color="neutral"
          variant="ghost"
          size="sm"
          :class="editControlClass"
        />
      </UDropdownMenu>
    </div>

    <template v-if="displayGroups.length">
      <div
        v-for="group in displayGroups"
        :key="group.level"
        class="flex flex-col gap-2"
      >
        <div class="flex items-center gap-2">
          <span
            class="shrink-0 text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ group.label }}
          </span>

          <div class="h-px grow bg-default/50" />

          <!-- Ячейки стоят у правого края разделителя, круг — у левого. Кружки:
            закрашенные потрачены, пустые остались. Нажатие тратит ячейки по
            кружок включительно, повторное — возвращает их -->
          <UTooltip
            v-if="group.circles.length"
            :text="group.slotsLabel"
          >
            <div class="flex shrink-0 items-center gap-1.5">
              <span
                class="text-[10px] font-bold tracking-wider text-muted uppercase"
              >
                {{ SPELL_SLOTS_LABEL }}
              </span>

              <span class="flex items-center gap-1">
                <button
                  v-for="circle in group.circles"
                  :key="circle.index"
                  type="button"
                  class="relative size-3.5 cursor-pointer rounded-full border transition-colors after:absolute after:-inset-1"
                  :class="circle.circleClass"
                  :aria-label="circle.label"
                  :aria-pressed="circle.used"
                  @click.left.exact.prevent="handleSlotToggle(circle)"
                />
              </span>
            </div>
          </UTooltip>
        </div>

        <div
          v-for="spell in group.spells"
          :key="spell.url"
          class="group/spell flex flex-col rounded-lg border border-default/50 bg-elevated/20 transition-colors hover:border-warning/60"
        >
          <div class="relative flex items-center gap-3 p-3">
            <button
              type="button"
              class="flex min-w-0 grow cursor-pointer items-center gap-3 text-left after:absolute after:inset-0 after:cursor-pointer"
              :aria-label="spell.openLabel"
              :aria-expanded="spell.ariaExpanded"
              @click.left.exact.prevent="handleSpellOpen(spell)"
            >
              <span
                class="flex size-10 shrink-0 items-center justify-center rounded-lg border border-default/50 bg-default/40"
              >
                <UIcon
                  name="tabler:wand"
                  class="size-5 text-muted"
                />
              </span>

              <span class="flex min-w-0 grow flex-col">
                <span class="truncate text-sm font-medium text-highlighted">
                  {{ spell.name }}
                </span>

                <span
                  v-if="spell.school"
                  class="truncate text-xs text-dimmed"
                >
                  {{ spell.school }}
                </span>
              </span>
            </button>

            <UTooltip
              v-if="spell.isCustom"
              text="Заклинание добавлено вручную"
            >
              <UBadge
                size="sm"
                color="neutral"
                variant="subtle"
                class="relative z-10 shrink-0"
              >
                Своё
              </UBadge>
            </UTooltip>

            <UTooltip
              v-if="spell.concentration"
              text="Концентрация"
            >
              <UBadge
                size="sm"
                color="warning"
                variant="subtle"
                class="relative z-10 shrink-0"
              >
                К
              </UBadge>
            </UTooltip>

            <UTooltip
              v-if="spell.ritual"
              text="Ритуал"
            >
              <UBadge
                size="sm"
                color="info"
                variant="subtle"
                class="relative z-10 shrink-0"
              >
                Р
              </UBadge>
            </UTooltip>

            <UButton
              v-if="spell.isCustom"
              icon="tabler:pencil"
              color="neutral"
              variant="ghost"
              size="xs"
              square
              class="relative z-10 shrink-0 opacity-0 transition-opacity group-hover/spell:opacity-100 focus-visible:opacity-100"
              :class="editControlClass"
              :aria-label="`Редактировать заклинание: ${spell.name}`"
              @click.left.exact.prevent="emit('edit-spell', spell.url)"
            />

            <UButton
              icon="tabler:trash"
              color="error"
              variant="ghost"
              size="xs"
              square
              class="relative z-10 shrink-0 opacity-0 transition-opacity group-hover/spell:opacity-100 focus-visible:opacity-100"
              :class="editControlClass"
              :aria-label="`Убрать заклинание: ${spell.name}`"
              @click.left.exact.prevent="emit('remove-spell', spell.url)"
            />

            <UIcon
              v-if="spell.isCustom"
              name="tabler:chevron-down"
              class="size-4 shrink-0 text-muted transition-transform"
              :class="spell.chevronClass"
            />
          </div>

          <div
            v-if="spell.isExpanded"
            class="flex flex-col gap-2 border-t border-default/50 px-3 py-2"
          >
            <div
              v-if="spell.statRows.length"
              class="flex flex-wrap gap-x-4 gap-y-1"
            >
              <span
                v-for="statRow in spell.statRows"
                :key="statRow.key"
                class="flex items-baseline gap-1 text-xs"
              >
                <span class="text-muted">{{ statRow.label }}:</span>

                <span class="text-toned">{{ statRow.value }}</span>
              </span>
            </div>

            <MarkupRender
              v-if="spell.descriptionNodes.length"
              :render-node="spell.descriptionNodes"
              class="text-sm"
            />

            <span
              v-else-if="!spell.statRows.length"
              class="text-xs text-dimmed"
            >
              Описание не заполнено
            </span>
          </div>
        </div>
      </div>
    </template>

    <!-- Ряды ячеек показываются и без заклинаний (ими повышают круг уже
      известных), поэтому подсказка о пустой книге зависит от самих заклинаний -->
    <div
      v-if="!spells.length"
      class="flex h-64 items-center justify-center rounded-lg border border-dashed border-default text-sm text-dimmed"
    >
      {{ SHEET_TAB_EMPTY_LABELS.spells }}
    </div>
  </div>
</template>
