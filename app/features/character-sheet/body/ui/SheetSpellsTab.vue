<script setup lang="ts">
  import type {
    CharacterSpell,
    SpellcastingBreakdown,
    SpellSlotRow,
  } from '../../model';

  import { SpellDrawer } from '~spells/drawer';
  import { MarkupRender } from '~ui/markup';

  import { useCharacterSheet, useSpellDamage } from '../../composables';
  import {
    CANTRIP_SPELL_LEVEL,
    CUSTOM_SPELL_BADGE_HINT,
    getFormattedBonus,
    getInnateSpellMenuItems,
    getPreparedSpellsCountHint,
    getPreparedSpellsValue,
    getSpellGroups,
    getSpellMenuItems,
    getSpellsAddMenuItems,
    getSpellSlotCircles,
    getSpellSlotSummary,
    getSpellStatRows,
    INNATE_SPELL_GROUP_LABEL,
    INNATE_SPELL_GROUP_LEVEL,
    isCustomSpell,
    isPreparableSpell,
    PREPARED_SPELL_TOGGLE_LABELS,
    PREPARED_SPELLS_HINTS,
    PREPARED_SPELLS_LABEL,
    SHEET_ROLL_HINT_LABEL,
    SHEET_TAB_EMPTY_LABELS,
    SPELL_DAMAGE_ROLL_HINT_LABEL,
    SPELL_DAMAGE_ROLL_LABEL,
    SPELL_DAMAGE_STAT_LABEL,
    SPELL_NAME_SORT_LOCALE,
    SPELL_SLOTS_LABEL,
    SPELLCASTING_STAT_LABELS,
  } from '../../model';

  /** Состояние квадрата со значком заклинания в строке. */
  interface PreparedIconState {
    /** Значок переключает подготовку (кнопка), а не просто стоит в строке. */
    canPrepare: boolean;

    /** Заклинание подготовлено: квадрат горит тёплым. */
    isPrepared: boolean;

    /** Классы оформления квадрата. */
    iconClass: string;

    /** Подсказка по наведению. */
    tooltip: string;

    /** Подпись кнопки для скринридера; '' — значок не нажимается. */
    ariaLabel: string;
  }

  /**
   * Плитка урона заклинания повторяет боевую плитку строки снаряжения: тёплый
   * акцент и нажатие, катящее формулу.
   */
  const DAMAGE_STAT_CLASS =
    'relative z-10 flex shrink-0 cursor-pointer flex-col items-center rounded border border-warning/40 bg-warning/10 px-2 py-0.5 whitespace-nowrap transition-colors hover:border-warning hover:bg-warning/20';

  /** Разделитель частей подсказки плитки урона (формула, тип, условие). */
  const DAMAGE_TOOLTIP_SEPARATOR = ' · ';

  /** Плитка-кнопка шапки вкладки: открывает настройку своих значений. */
  const HEADER_STAT_CLASS =
    'flex h-7 cursor-pointer items-center gap-3 rounded-lg border border-default/50 bg-elevated/20 px-3 transition-colors hover:border-warning/60';

  /** Квадрат со значком заклинания в начале строки. */
  const SPELL_ICON_CLASS =
    'flex size-10 shrink-0 items-center justify-center rounded-lg border transition-colors';

  /** Значок-кнопка подготовки: нажатием заклинание помечается подготовленным. */
  const SPELL_ICON_BUTTON_CLASS = 'relative z-10 cursor-pointer';

  /**
   * Подготовленное заклинание: тёплым горит только квадрат со значком — сама
   * строка остаётся такой же, как у остальных заклинаний.
   */
  const PREPARED_ICON_CLASS = 'border-warning/60 bg-warning/15 text-warning';

  /** Неподготовленное заклинание: квадрат тёплый только под курсором. */
  const UNPREPARED_ICON_CLASS =
    'border-default/50 bg-default/40 text-muted hover:border-warning/60';

  /** Заклинание, которому подготовка не нужна (заговор, врождённое). */
  const PLAIN_ICON_CLASS = 'border-default/50 bg-default/40 text-muted';

  const props = defineProps<{
    spells: CharacterSpell[];
    innateSpells: CharacterSpell[];
    spellcasting: SpellcastingBreakdown;

    /** Ячейки заклинаний по кругам; пусто — класс ячеек не даёт. */
    spellSlots: SpellSlotRow[];
  }>();

  const emit = defineEmits<{
    'add-spell': [];
    'add-custom-spell': [];
    'edit-spell': [spellUrl: string];
    'copy-spell': [spellUrl: string];
    'edit-spellcasting': [];
    'edit-prepared-spells': [];
    'remove-spell': [spellUrl: string];
    'copy-innate-spell': [spellUrl: string];
    'remove-innate-spell': [spellUrl: string];
    'roll-spell-damage': [formula: string, spellLevel: number];
    'toggle-spell-prepared': [spellUrl: string];
    'toggle-spell-slot': [level: number, index: number];
  }>();

  // Пополнение книги, правка и удаление заклинаний меняют лист: без прав кнопки
  // прячутся, а ряды заклинаний и шапка вкладки остаются на прежних местах.
  const { editControlClass } = useCharacterSheet();

  // Урон заклинаний живёт в справочнике, а не в листе: подгружаем его для всей
  // вкладки — и для книги, и для врождённых заклинаний вида.
  const { getDamage } = useSpellDamage(
    () => [...props.spells, ...props.innateSpells],
    () => props.spellcasting.abilityModifier,
  );

  const addMenuItems = getSpellsAddMenuItems({
    onAddSpell: () => emit('add-spell'),
    onAddCustomSpell: () => emit('add-custom-spell'),
  });

  const formattedAttackBonus = computed(() =>
    getFormattedBonus(props.spellcasting.attackBonus),
  );

  const preparedSpells = computed(() => props.spellcasting.prepared);

  const preparedSpellsValue = computed(() =>
    getPreparedSpellsValue(preparedSpells.value),
  );

  /**
   * Отмеченных больше, чем можно держать: так бывает после снижения уровня или
   * смены своего числа — значение блока об этом предупреждает цветом.
   */
  const preparedSpellsValueClass = computed(() =>
    preparedSpells.value.value !== null
    && preparedSpells.value.count > preparedSpells.value.value
      ? 'text-error'
      : 'text-highlighted',
  );

  /** Предел выбран целиком: пометить ещё одно заклинание уже нельзя. */
  const isPreparedLimitReached = computed(
    () =>
      preparedSpells.value.value !== null
      && preparedSpells.value.count >= preparedSpells.value.value,
  );

  /**
   * Подсказка блока подготовленных: сколько заклинаний отмечено и откуда взялось
   * число — из таблицы класса (с бонусом, если он задан) либо указано вручную.
   */
  const preparedSpellsHint = computed(() => {
    const { value, classValue, custom, bonus } = preparedSpells.value;

    const countHint = getPreparedSpellsCountHint(preparedSpells.value);

    if (custom) {
      return `${countHint}. ${PREPARED_SPELLS_HINTS.custom}`;
    }

    if (classValue === null) {
      return `${countHint}. ${PREPARED_SPELLS_HINTS.unknown}`;
    }

    if (bonus === 0) {
      return `${countHint}. ${PREPARED_SPELLS_HINTS.auto}: ${classValue}`;
    }

    return `${countHint}. ${PREPARED_SPELLS_HINTS.auto}: ${classValue} ${getFormattedBonus(bonus)} = ${value}`;
  });

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

  /**
   * Плитки урона заклинания: у одного заклинания их бывает несколько —
   * справочник описывает броски по состоянию цели отдельными формулами.
   *
   * @param spell заклинание вкладки.
   * @returns плитки урона с подписями; пусто — урона в справочнике нет.
   */
  function getSpellDamageStats(spell: CharacterSpell) {
    return getDamage(spell.url).map((damage, damageIndex) => {
      const tooltipParts = [damage.formula];

      if (damage.typeLabel) {
        tooltipParts.push(damage.typeLabel);
      }

      if (damage.conditionLabel) {
        tooltipParts.push(damage.conditionLabel);
      }

      tooltipParts.push(
        spell.level > CANTRIP_SPELL_LEVEL
          ? SPELL_DAMAGE_ROLL_HINT_LABEL
          : SHEET_ROLL_HINT_LABEL,
      );

      return {
        key: `${spell.url}:${damageIndex}`,
        formula: damage.formula,
        // Круг заклинания едет вместе с формулой: бросок урона считается
        // накладыванием и занимает ячейку этого круга.
        level: spell.level,
        label: SPELL_DAMAGE_STAT_LABEL,
        tooltip: `${SPELL_DAMAGE_STAT_LABEL} = ${tooltipParts.join(DAMAGE_TOOLTIP_SEPARATOR)}`,
        ariaLabel: `${SPELL_DAMAGE_ROLL_LABEL}: ${spell.name}`,
      };
    });
  }

  /**
   * Состояние квадрата со значком заклинания: подготовку переключает только он,
   * поэтому здесь же его подсказка, подпись для скринридера и цвет.
   *
   * @param spell заклинание строки.
   * @param innate заклинание из группы врождённых.
   * @returns состояние значка для шаблона строки.
   */
  function getPreparedIconState(
    spell: CharacterSpell,
    innate: boolean,
  ): PreparedIconState {
    // Заговоры и врождённые заклинания доступны всегда: подготовка их не
    // касается, значок у них обычный и ничего не переключает.
    if (innate || !isPreparableSpell(spell)) {
      return {
        canPrepare: false,
        isPrepared: false,
        iconClass: PLAIN_ICON_CLASS,
        tooltip: innate
          ? PREPARED_SPELL_TOGGLE_LABELS.innate
          : PREPARED_SPELL_TOGGLE_LABELS.cantrip,
        ariaLabel: '',
      };
    }

    const isPrepared = Boolean(spell.prepared);

    const label = isPrepared
      ? PREPARED_SPELL_TOGGLE_LABELS.unprepare
      : PREPARED_SPELL_TOGGLE_LABELS.prepare;

    return {
      canPrepare: true,
      isPrepared,
      iconClass: isPrepared ? PREPARED_ICON_CLASS : UNPREPARED_ICON_CLASS,
      // Предел выбран целиком — значок остаётся нажимаемым: подсказка и
      // предупреждение объясняют отказ понятнее, чем погашенная кнопка.
      tooltip:
        !isPrepared && isPreparedLimitReached.value
          ? `${label}. ${PREPARED_SPELL_TOGGLE_LABELS.limit}`
          : label,
      ariaLabel: `${label}: ${spell.name}`,
    };
  }

  const displayGroups = computed(() => {
    const regularGroups = getSpellGroups(
      props.spells,
      props.spellSlots.map((row) => row.level),
    ).map((group) => ({ ...group, innate: false }));

    const groups = props.innateSpells.length
      ? [
          {
            level: INNATE_SPELL_GROUP_LEVEL,
            label: INNATE_SPELL_GROUP_LABEL,
            spells: [...props.innateSpells].sort(
              (firstSpell, secondSpell) =>
                firstSpell.level - secondSpell.level
                || firstSpell.name.localeCompare(
                  secondSpell.name,
                  SPELL_NAME_SORT_LOCALE,
                ),
            ),
            innate: true,
          },
          ...regularGroups,
        ]
      : regularGroups;

    return groups.map((group) => {
      const slotRow = group.innate
        ? undefined
        : slotRowByLevel.value.get(group.level);

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
            // Подготовку переключает значок строки — как надевание доспеха в
            // снаряжении. Врождённые заклинания и заговоры значком не
            // переключаются.
            preparedIcon: getPreparedIconState(spell, group.innate),
            // Действия строки — те же, что и у предмета снаряжения: своё
            // заклинание правится формой листа, каталожное сначала копируется в
            // лист, а убирается из книги и то, и другое. Врождённое правится
            // так же — через копию, только уезжает она в книгу заклинаний.
            menuItems: group.innate
              ? getInnateSpellMenuItems({
                  onCopy: () => emit('copy-innate-spell', spell.url),
                  onRemove: () => emit('remove-innate-spell', spell.url),
                })
              : getSpellMenuItems({
                  onEdit: isCustom
                    ? () => emit('edit-spell', spell.url)
                    : undefined,
                  onCopy: isCustom
                    ? undefined
                    : () => emit('copy-spell', spell.url),
                  onRemove: () => emit('remove-spell', spell.url),
                }),
            // Урон каталожного заклинания приходит из справочника; у своего его
            // нет — форма листа урон не заполняет.
            damageStats: getSpellDamageStats(spell),
            // У каталожных заклинаний этих полей нет — список выйдет пустым.
            statRows: getSpellStatRows(spell),
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
    });
  });

  type DisplaySpell = (typeof displayGroups.value)[number]['spells'][number];

  type DisplayCircle = (typeof displayGroups.value)[number]['circles'][number];

  type DisplayDamageStat = DisplaySpell['damageStats'][number];

  /** Нажатие на плитку урона: формула справочника уходит в дайс-роллер. */
  function handleDamageRoll(damageStat: DisplayDamageStat) {
    emit('roll-spell-damage', damageStat.formula, damageStat.level);
  }

  /** Нажатие на кружок ячейки: трата до него включительно либо возврат. */
  function handleSlotToggle(circle: DisplayCircle) {
    emit('toggle-spell-slot', circle.level, circle.index);
  }

  /** Нажатие на значок заклинания: пометка подготовленным либо снятие пометки. */
  function handlePreparedToggle(spell: DisplaySpell) {
    emit('toggle-spell-prepared', spell.url);
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
    <!-- Свой @container: подписи шапки сокращаются по ширине самого ряда, а не
      окна — лист бывает узким и на широком экране (дровер, правая панель) -->
    <div class="@container flex flex-wrap items-center justify-between gap-2">
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          :class="HEADER_STAT_CLASS"
          aria-label="Настроить заклинательство"
          @click.left.exact.prevent="emit('edit-spellcasting')"
        >
          <!-- Подписи чисел в плитке короткие, чтобы ряд помещался на узком
            листе; полное название показывает подсказка по наведению -->
          <UTooltip :text="SPELLCASTING_STAT_LABELS.saveDc.full">
            <span class="flex items-center gap-1.5">
              <span
                class="text-[10px] font-bold tracking-wider text-muted uppercase"
              >
                {{ SPELLCASTING_STAT_LABELS.saveDc.short }}
              </span>

              <span class="text-sm font-bold text-highlighted">
                {{ spellcasting.saveDc }}
              </span>
            </span>
          </UTooltip>

          <span class="h-5 w-px bg-default/60" />

          <UTooltip :text="SPELLCASTING_STAT_LABELS.attack.full">
            <span class="flex items-center gap-1.5">
              <span
                class="text-[10px] font-bold tracking-wider text-muted uppercase"
              >
                {{ SPELLCASTING_STAT_LABELS.attack.short }}
              </span>

              <span class="text-sm font-bold text-highlighted">
                {{ formattedAttackBonus }}
              </span>
            </span>
          </UTooltip>
        </button>

        <!-- Сколько заклинаний можно подготовить: число берётся из таблицы
          класса, нажатие открывает настройку своего числа или бонуса к нему -->
        <UTooltip :text="preparedSpellsHint">
          <button
            type="button"
            :class="HEADER_STAT_CLASS"
            aria-label="Настроить подготовленные заклинания"
            @click.left.exact.prevent="emit('edit-prepared-spells')"
          >
            <span class="flex items-center gap-1.5">
              <!-- На узком ряду подпись занимает больше места, чем само число,
                поэтому уступает значку: название остаётся в подсказке -->
              <UIcon
                name="tabler:checklist"
                class="size-4 shrink-0 text-muted @lg:hidden"
              />

              <span
                class="hidden text-[10px] font-bold tracking-wider text-muted uppercase @lg:inline"
              >
                {{ PREPARED_SPELLS_LABEL }}
              </span>

              <span
                class="text-sm font-bold"
                :class="preparedSpellsValueClass"
              >
                {{ preparedSpellsValue }}
              </span>
            </span>
          </button>
        </UTooltip>
      </div>

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
          class="flex flex-col rounded-lg border border-default/50 bg-elevated/20 transition-colors hover:border-warning/60"
        >
          <div class="relative flex items-center gap-3 p-3">
            <!-- Значок заклинания — переключатель подготовки: нажатие метит
              заклинание подготовленным, повторное — снимает пометку. Горит при
              этом только сам квадрат, строка остаётся обычной -->
            <UTooltip
              v-if="spell.preparedIcon.canPrepare"
              :text="spell.preparedIcon.tooltip"
            >
              <button
                type="button"
                :class="[
                  SPELL_ICON_CLASS,
                  SPELL_ICON_BUTTON_CLASS,
                  spell.preparedIcon.iconClass,
                ]"
                :aria-pressed="spell.preparedIcon.isPrepared"
                :aria-label="spell.preparedIcon.ariaLabel"
                @click.left.exact.prevent="handlePreparedToggle(spell)"
              >
                <UIcon
                  name="tabler:wand"
                  class="size-5"
                />
              </button>
            </UTooltip>

            <UTooltip
              v-else
              :text="spell.preparedIcon.tooltip"
            >
              <span :class="[SPELL_ICON_CLASS, spell.preparedIcon.iconClass]">
                <UIcon
                  name="tabler:wand"
                  class="size-5"
                />
              </span>
            </UTooltip>

            <button
              type="button"
              class="flex min-w-0 grow cursor-pointer items-center gap-3 text-left after:absolute after:inset-0 after:cursor-pointer"
              :aria-label="spell.openLabel"
              :aria-expanded="spell.ariaExpanded"
              @click.left.exact.prevent="handleSpellOpen(spell)"
            >
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

            <!-- Плитки урона — те же, что и у оружия в снаряжении: нажатие
              катит формулу справочника. Взаимоисключающие броски (по состоянию
              цели) стоят отдельными плитками, их различает подсказка -->
            <div
              v-if="spell.damageStats.length"
              class="relative z-10 flex shrink-0 items-center gap-1.5"
            >
              <UTooltip
                v-for="damageStat in spell.damageStats"
                :key="damageStat.key"
                :text="damageStat.tooltip"
              >
                <button
                  type="button"
                  :class="DAMAGE_STAT_CLASS"
                  :aria-label="damageStat.ariaLabel"
                  @click.left.exact.prevent="handleDamageRoll(damageStat)"
                >
                  <span class="text-xs font-bold text-warning">
                    {{ damageStat.formula }}
                  </span>

                  <span class="text-[9px] text-warning/80 uppercase">
                    {{ damageStat.label }}
                  </span>
                </button>
              </UTooltip>
            </div>

            <UTooltip
              v-if="spell.isCustom"
              :text="CUSTOM_SPELL_BADGE_HINT"
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

            <!-- Меню действий над заклинанием: тот же трейлинг, что и у строки
              снаряжения — правка своего, копия каталожного в лист и удаление.
              У врождённого в меню только удаление -->
            <UDropdownMenu
              :items="spell.menuItems"
              :content="{ align: 'end' }"
            >
              <UButton
                icon="tabler:dots-vertical"
                color="neutral"
                variant="ghost"
                size="xs"
                square
                class="relative z-10 shrink-0"
                :class="editControlClass"
                :aria-label="`Действия с заклинанием: ${spell.name}`"
              />
            </UDropdownMenu>

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
      v-if="!spells.length && !innateSpells.length"
      class="flex h-64 items-center justify-center rounded-lg border border-dashed border-default text-sm text-dimmed"
    >
      {{ SHEET_TAB_EMPTY_LABELS.spells }}
    </div>
  </div>
</template>
