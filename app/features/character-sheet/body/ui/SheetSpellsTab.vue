<script setup lang="ts">
  import type {
    CharacterSpell,
    DamageRollSource,
    PreparedSpellKind,
    SpellcastingBreakdown,
    SpellDamageRoll,
    SpellSlotKind,
    SpellSlotRow,
    SpellTabFilter,
  } from '../../model';

  import { SpellDrawer } from '~spells/drawer';
  import { MarkupRender } from '~ui/markup';

  import { useCharacterSheet, useSpellDamage } from '../../composables';
  import {
    ABILITY_LABELS,
    CANTRIP_SPELL_LEVEL,
    CUSTOM_SPELL_BADGE_HINT,
    getFilterChipClass,
    getInnateSpellMenuItems,
    getPreparedSpellsHint,
    getPreparedSpellsValue,
    getSpellGroupLabel,
    getSpellGroups,
    getSpellListLevels,
    getSpellMenuItems,
    getSpellPreparedKind,
    getSpellsAddMenuItems,
    getSpellSlotCircles,
    getSpellSlotSummary,
    getSpellStatRows,
    INNATE_SPELL_GROUP_LABEL,
    INNATE_SPELL_GROUP_LEVEL,
    isCustomSpell,
    matchesSpellFilter,
    PACT_SPELL_SLOTS_ROW_LABEL,
    PREPARED_KIND_LABELS,
    PREPARED_KINDS,
    PREPARED_SPELL_TOGGLE_LABELS,
    SHEET_FILTER_LABELS,
    SHEET_HEADER_STAT_CLASS,
    SHEET_ROLL_HINT_LABEL,
    SHEET_SPELL_ABILITY_LABELS,
    SHEET_STATIC_STAT_CLASS,
    SHEET_TAB_EMPTY_LABELS,
    SPELL_DAMAGE_ROLL_HINT_LABEL,
    SPELL_DAMAGE_ROLL_LABEL,
    SPELL_DAMAGE_STAT_LABEL,
    SPELL_FILTER_LABELS,
    SPELL_NAME_SORT_LOCALE,
    SPELL_SLOTS_LABEL,
    SPELLCASTING_STAT_LABELS,
    SPELLCASTING_TILE_LABELS,
  } from '../../model';

  /** Состояние квадрата со значком заклинания в строке. */
  interface PreparedIconState {
    /** Заклинание подготовлено: квадрат горит тёплым. */
    isPrepared: boolean;

    /** Классы оформления квадрата. */
    iconClass: string;

    /** Подсказка по наведению. */
    tooltip: string;

    /** Подпись кнопки для скринридера. */
    ariaLabel: string;
  }

  /**
   * Плитка урона заклинания повторяет боевую плитку строки снаряжения: тёплый
   * акцент и нажатие, катящее формулу.
   */
  const DAMAGE_STAT_CLASS =
    'relative z-10 flex shrink-0 cursor-pointer flex-col items-center rounded border border-primary/40 bg-primary/10 px-2 py-0.5 whitespace-nowrap transition-colors hover:border-primary hover:bg-primary/20';

  /** Разделитель частей подсказки плитки урона (формула, тип, условие). */
  const DAMAGE_TOOLTIP_SEPARATOR = ' · ';

  /** Квадрат со значком заклинания в начале строки. */
  const SPELL_ICON_CLASS =
    'flex size-10 shrink-0 items-center justify-center rounded-lg border transition-colors';

  /** Значок-кнопка подготовки: нажатием заклинание помечается подготовленным. */
  const SPELL_ICON_BUTTON_CLASS = 'relative z-10 cursor-pointer';

  /**
   * Подготовленное заклинание: тёплым горит только квадрат со значком — сама
   * строка остаётся такой же, как у остальных заклинаний.
   */
  const PREPARED_ICON_CLASS = 'border-primary/60 bg-primary/15 text-primary';

  /** Неподготовленное заклинание: квадрат тёплый только под курсором. */
  const UNPREPARED_ICON_CLASS =
    'border-default/50 bg-default/40 text-muted hover:border-primary/60';

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
    'edit-spellcasting': [classUrl: string];
    'edit-spell-ability': [spellUrl: string];
    'edit-prepared-spells': [kind: PreparedSpellKind];
    'remove-spell': [spellUrl: string];
    'copy-innate-spell': [spellUrl: string];
    'remove-innate-spell': [spellUrl: string];
    'roll-spell-damage': [roll: SpellDamageRoll];
    'toggle-spell-prepared': [spellUrl: string];
    'toggle-innate-spell-prepared': [spellUrl: string];
    'toggle-spell-slot': [level: number, index: number, kind: SpellSlotKind];
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

  /**
   * Цвет кружка ячейки: ячейки договора колдуна отличаются от обычных — они
   * возвращаются коротким отдыхом, и путать их нельзя.
   *
   * @param used ячейка потрачена.
   * @param kind вид ячеек.
   * @returns классы кружка.
   */
  function getSlotCircleClass(used: boolean, kind: SpellSlotKind): string {
    if (kind === 'pact') {
      return used
        ? 'border-secondary bg-secondary'
        : 'border-secondary/50 hover:border-secondary';
    }

    return used
      ? 'border-primary bg-primary'
      : 'border-default hover:border-primary';
  }

  /**
   * Заклинательство по классам: у мультикласса характеристика своя у каждого,
   * поэтому Сл спасброска и бонус атаки идут отдельными плитками. Подпись
   * класса появляется только у мультикласса — одному классу она ни к чему.
   */
  const spellcastingStats = computed(() =>
    props.spellcasting.rows.map((row) => ({
      classUrl: row.classUrl,
      className: props.spellcasting.rows.length > 1 ? row.className : '',
      saveDc: row.saveDc,
      attackBonus: getFormattedBonus(row.attackBonus),
      // Характеристику черты на листе не меняют: её назвали при взятии черты
      editable: row.editable,
      ariaLabel: row.editable
        ? SPELLCASTING_TILE_LABELS.edit
        : `${SPELLCASTING_TILE_LABELS.fixed}: ${row.className}`,
      tileClass: row.editable
        ? SHEET_HEADER_STAT_CLASS
        : SHEET_STATIC_STAT_CLASS,
    })),
  );

  /**
   * Настройка заклинательства строки: у черты характеристика своя и меняется
   * только пересдачей черты, поэтому её плитка ничего не открывает.
   *
   * @param stat плитка заклинательства.
   */
  function handleSpellcastingEdit(stat: {
    classUrl: string;
    editable: boolean;
  }) {
    if (stat.editable) {
      emit('edit-spellcasting', stat.classUrl);
    }
  }

  /**
   * Плитки подготовки в шапке вкладки: заклинания книги и заговоры считаются
   * порознь — у каждого своя колонка таблицы класса и свой предел, поэтому и
   * плитки идут отдельные.
   */
  const preparedStats = computed(() =>
    PREPARED_KINDS.map((kind) => {
      const prepared =
        kind === 'cantrips'
          ? props.spellcasting.preparedCantrips
          : props.spellcasting.prepared;

      return {
        kind,
        labels: PREPARED_KIND_LABELS[kind],
        value: getPreparedSpellsValue(prepared),
        hint: getPreparedSpellsHint(prepared, kind),
        // Отмеченных больше, чем можно держать: так бывает после снижения
        // уровня или смены своего числа — значение об этом предупреждает
        // цветом.
        valueClass:
          prepared.value !== null && prepared.count > prepared.value
            ? 'text-error'
            : 'text-highlighted',
      };
    }),
  );

  /**
   * Предел выбран целиком: пометить ещё одну запись этого вида уже нельзя.
   *
   * @param kind вид подготовки: заклинания книги либо заговоры.
   * @returns true — предел достигнут.
   */
  function isPreparedLimitReached(kind: PreparedSpellKind): boolean {
    const { value, count } =
      kind === 'cantrips'
        ? props.spellcasting.preparedCantrips
        : props.spellcasting.prepared;

    return value !== null && count >= value;
  }

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

  // На круг бывает два ряда: обычные ячейки и ячейки договора колдуна — у
  // мультикласса они существуют порознь и возвращаются разным отдыхом.
  const slotRowsByLevel = computed(() => {
    const rowsByLevel = new Map<number, SpellSlotRow[]>();

    for (const row of props.spellSlots) {
      rowsByLevel.set(row.level, [...(rowsByLevel.get(row.level) ?? []), row]);
    }

    return rowsByLevel;
  });

  /** Отмечен чип «Подготовленные». */
  const isPreparedOnlyPicked = ref(false);

  /** Отмеченные чипами круги; пусто — круги списка не сужаются. */
  const pickedLevels = ref(new Set<number>());

  /** Круги, которые вкладка уже показывает: по ним и отбирают. */
  const availableLevels = computed(() =>
    getSpellListLevels(
      [...props.spells, ...props.innateSpells],
      props.spellSlots.map((row) => row.level),
    ),
  );

  /**
   * Пометка подготовки есть и у книги персонажа, и у врождённых заклинаний:
   * пока список пуст, помечать нечего — чипа отбора нет.
   */
  const isPreparedFilterAvailable = computed(
    () => props.spells.length > 0 || props.innateSpells.length > 0,
  );

  /** Кругов больше одного — есть между чем выбирать. */
  const hasLevelChips = computed(() => availableLevels.value.length > 1);

  /**
   * Действующий отбор: круги считаются от доступных, поэтому выбор, которого в
   * списке уже нет (заклинание убрали, круг пропал вместе с ячейками), сам
   * собой перестаёт сужать список.
   */
  const spellFilter = computed<SpellTabFilter>(() => ({
    preparedOnly: isPreparedOnlyPicked.value && isPreparedFilterAvailable.value,
    levels: availableLevels.value.filter((level) =>
      pickedLevels.value.has(level),
    ),
  }));

  /** Список сужен: отбор есть что сбросить. */
  const hasActiveFilter = computed(
    () => spellFilter.value.preparedOnly || spellFilter.value.levels.length > 0,
  );

  /**
   * Ряд отбора: нужен, только когда в списке есть что отбирать — помечаемые
   * заклинания либо больше одного круга.
   */
  const hasFilterControls = computed(
    () =>
      Boolean(props.spells.length || props.innateSpells.length)
      && (isPreparedFilterAvailable.value || hasLevelChips.value),
  );

  const preparedChipClass = computed(() =>
    getFilterChipClass(spellFilter.value.preparedOnly),
  );

  /**
   * Чипы кругов, которые есть в списке: сам чип — номер круга, у заговоров
   * вместо номера сокращение. Полную подпись («Заговоры», «3 круг»)
   * показывает подсказка по наведению.
   */
  const levelChips = computed(() =>
    availableLevels.value.map((level) => ({
      level,
      label:
        level === CANTRIP_SPELL_LEVEL
          ? SPELL_FILTER_LABELS.cantrip
          : String(level),
      tooltip: getSpellGroupLabel(level),
      isPicked: spellFilter.value.levels.includes(level),
      chipClass: getFilterChipClass(spellFilter.value.levels.includes(level)),
    })),
  );

  /** Нажатие на чип подготовленных: тем же чипом отбор и снимается. */
  function handlePreparedFilterToggle() {
    isPreparedOnlyPicked.value = !isPreparedOnlyPicked.value;
  }

  /**
   * Нажатие на чип круга: круги набираются по одному, повторное нажатие снимает
   * круг с отбора.
   */
  function handleLevelPick(level: number) {
    if (pickedLevels.value.has(level)) {
      pickedLevels.value.delete(level);

      return;
    }

    pickedLevels.value.add(level);
  }

  /** Нажатие на «Сбросить»: список возвращается целиком. */
  function handleFilterReset() {
    isPreparedOnlyPicked.value = false;
    pickedLevels.value.clear();
  }

  /**
   * Круги ячеек в списке: разделитель круга без заклинаний нужен ради кружков —
   * ячейки тратят и на повышение круга уже известного заклинания. Под отбором
   * подготовленных пустые разделители только мешают списку отмеченных.
   */
  const groupSlotLevels = computed(() => {
    if (spellFilter.value.preparedOnly) {
      return [];
    }

    const slotLevels = props.spellSlots.map((row) => row.level);

    return spellFilter.value.levels.length
      ? slotLevels.filter((level) => spellFilter.value.levels.includes(level))
      : slotLevels;
  });

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
        // Всё, что нужно окну настройки: кости и число вхождений модификатора
        // приходят из справочника, характеристика — из листа. Круг едет здесь
        // же: бросок урона считается накладыванием и занимает ячейку.
        roll: {
          title: `${SPELL_DAMAGE_STAT_LABEL}: ${spell.name}`,
          damage: {
            diceNotation: damage.diceNotation,
            // Своего плоского бонуса у заклинания нет: всё, что есть в записи
            // справочника, уже сидит в её нотации.
            flatBonus: 0,
            // Заклинание черты считается от её характеристики, а не от
            // характеристики класса: у «Посвящённого в магию» она своя
            ability: spell.spellcastingAbility ?? props.spellcasting.ability,
            abilityModifierCount: damage.abilityModifierCount,
            typeLabel: damage.typeLabel,
          } satisfies DamageRollSource,
          level: spell.level,
        } satisfies SpellDamageRoll,
        label: SPELL_DAMAGE_STAT_LABEL,
        tooltip: `${SPELL_DAMAGE_STAT_LABEL} = ${tooltipParts.join(DAMAGE_TOOLTIP_SEPARATOR)}`,
        ariaLabel: `${SPELL_DAMAGE_ROLL_LABEL}: ${spell.name}`,
      };
    });
  }

  /**
   * Бейдж своей заклинательной характеристики строки.
   *
   * Показывается, только когда характеристика задана: у остальных заклинаний
   * она общая с классом, и бейдж стоял бы у каждой строки, ничего не сообщая.
   *
   * @param spell заклинание вкладки.
   * @returns подпись и подсказка бейджа; null — характеристика от класса.
   */
  function getSpellAbilityBadge(spell: CharacterSpell) {
    if (!spell.spellcastingAbility) {
      return null;
    }

    const label = ABILITY_LABELS[spell.spellcastingAbility];

    return {
      label,
      hint: `${SHEET_SPELL_ABILITY_LABELS.menu}: ${label}. ${SHEET_SPELL_ABILITY_LABELS.badgeHint}`,
    };
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
    const isPrepared = Boolean(spell.prepared);

    const label = isPrepared
      ? PREPARED_SPELL_TOGGLE_LABELS.unprepare
      : PREPARED_SPELL_TOGGLE_LABELS.prepare;

    const iconClass = isPrepared ? PREPARED_ICON_CLASS : UNPREPARED_ICON_CLASS;

    // Врождённое заклинание приходит подготовленным и в предел не входит:
    // значок только снимает и возвращает пометку, а подсказка напоминает, что
    // места среди подготовленных такое заклинание не занимает.
    if (innate) {
      return {
        isPrepared,
        iconClass,
        tooltip: `${label}. ${PREPARED_SPELL_TOGGLE_LABELS.innate}`,
        ariaLabel: `${label}: ${spell.name}`,
      };
    }

    return {
      isPrepared,
      iconClass,
      // Предел выбран целиком — значок остаётся нажимаемым: подсказка и
      // предупреждение объясняют отказ понятнее, чем погашенная кнопка.
      // Заговоры смотрят на свой предел, заклинания книги — на свой.
      tooltip:
        !isPrepared && isPreparedLimitReached(getSpellPreparedKind(spell))
          ? `${label}. ${PREPARED_SPELL_TOGGLE_LABELS.limit}`
          : label,
      ariaLabel: `${label}: ${spell.name}`,
    };
  }

  const displayGroups = computed(() => {
    const regularGroups = getSpellGroups(
      props.spells.filter((spell) =>
        matchesSpellFilter(spell, spellFilter.value),
      ),
      groupSlotLevels.value,
    ).map((group) => ({ ...group, innate: false }));

    const innateSpells = props.innateSpells.filter((spell) =>
      matchesSpellFilter(spell, spellFilter.value),
    );

    const groups = innateSpells.length
      ? [
          {
            level: INNATE_SPELL_GROUP_LEVEL,
            label: INNATE_SPELL_GROUP_LABEL,
            spells: [...innateSpells].sort(
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
      const slotRows = group.innate
        ? []
        : (slotRowsByLevel.value.get(group.level) ?? []);

      return {
        ...group,
        // Кружки ячеек живут в разделителе круга: у заговоров ячеек нет, у
        // класса-незаклинателя их нет ни у одного круга. Ячейки договора идут
        // отдельной группой со своей подписью и цветом.
        slotGroups: slotRows.map((slotRow) => ({
          kind: slotRow.kind,
          label:
            slotRow.kind === 'pact'
              ? PACT_SPELL_SLOTS_ROW_LABEL
              : SPELL_SLOTS_LABEL,
          summary: getSpellSlotSummary(slotRow),
          circles: getSpellSlotCircles(slotRow).map((circle) => ({
            ...circle,
            level: slotRow.level,
            kind: slotRow.kind,
            circleClass: getSlotCircleClass(circle.used, slotRow.kind),
          })),
        })),
        spells: group.spells.map((spell) => {
          const isCustom = isCustomSpell(spell);
          const isExpanded = isCustom && expandedUrls.value.has(spell.url);

          return {
            ...spell,
            isCustom,
            isExpanded,
            isInnate: group.innate,
            // Подготовку переключает значок строки — как надевание доспеха в
            // снаряжении. У врождённых заклинаний пометка стоит сразу и в
            // предел подготовленных не входит, снять её значок тоже даёт.
            preparedIcon: getPreparedIconState(spell, group.innate),
            // Действия строки — те же, что и у предмета снаряжения: своё
            // заклинание правится формой листа, каталожное сначала копируется в
            // лист, а убирается из книги и то, и другое. Врождённое правится
            // так же — через копию, только уезжает она в книгу заклинаний.
            menuItems: group.innate
              ? getInnateSpellMenuItems({
                  onCopy: () => emit('copy-innate-spell', spell.url),
                  onRemove: () => emit('remove-innate-spell', spell.url),
                  // Характеристика правится и у врождённого заклинания: копия в
                  // книгу ради одной характеристики оторвала бы запись от вида
                  onSpellcastingAbility: () =>
                    emit('edit-spell-ability', spell.url),
                })
              : getSpellMenuItems({
                  onEdit: isCustom
                    ? () => emit('edit-spell', spell.url)
                    : undefined,
                  onCopy: isCustom
                    ? undefined
                    : () => emit('copy-spell', spell.url),
                  onRemove: () => emit('remove-spell', spell.url),
                  onSpellcastingAbility: () =>
                    emit('edit-spell-ability', spell.url),
                }),
            // Своя характеристика — бейдж строки: заклинание считается не так,
            // как остальная книга, и по строке это должно быть видно сразу.
            abilityBadge: getSpellAbilityBadge(spell),
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

  /**
   * Подпись пустого места вкладки: пустая книга либо отбор, под который ничего
   * не подошло; '' — списку есть что показать.
   */
  const emptyLabel = computed(() => {
    if (!props.spells.length && !props.innateSpells.length) {
      return SHEET_TAB_EMPTY_LABELS.spells;
    }

    return displayGroups.value.length ? '' : SHEET_FILTER_LABELS.empty;
  });

  type DisplaySpell = (typeof displayGroups.value)[number]['spells'][number];

  type DisplayCircle =
    (typeof displayGroups.value)[number]['slotGroups'][number]['circles'][number];

  type DisplayDamageStat = DisplaySpell['damageStats'][number];

  /** Нажатие на плитку урона: разбор броска уходит в модалку настройки. */
  function handleDamageRoll(damageStat: DisplayDamageStat) {
    emit('roll-spell-damage', damageStat.roll);
  }

  /** Нажатие на кружок ячейки: трата до него включительно либо возврат. */
  function handleSlotToggle(circle: DisplayCircle) {
    emit('toggle-spell-slot', circle.level, circle.index, circle.kind);
  }

  /**
   * Нажатие на значок заклинания: пометка подготовленным либо снятие пометки.
   * Врождённое заклинание живёт в виде, а не в книге персонажа, поэтому у его
   * пометки своё событие.
   */
  function handlePreparedToggle(spell: DisplaySpell) {
    if (spell.isInnate) {
      emit('toggle-innate-spell-prepared', spell.url);

      return;
    }

    emit('toggle-spell-prepared', spell.url);
  }

  /** Нажатие на плитку подготовки: настройка числа своего вида подготовки. */
  function handlePreparedEdit(kind: PreparedSpellKind) {
    emit('edit-prepared-spells', kind);
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
      окна — лист бывает узким и на широком экране (дровер, правая панель).
      Плитки и «Добавить» лежат в ряду поштучно, без вложенной группы: у
      мультикласса плитки переносятся, и кнопка встаёт в конец второй строки, а
      не занимает собой третью -->
    <div class="@container flex flex-wrap items-center gap-2">
      <!-- У мультикласса заклинательство считается по каждому классу
        отдельно: своя характеристика — свои Сл и бонус атаки -->
      <button
        v-for="stat in spellcastingStats"
        :key="stat.classUrl"
        type="button"
        :class="stat.tileClass"
        :aria-label="stat.ariaLabel"
        @click.left.exact.prevent="handleSpellcastingEdit(stat)"
      >
        <span
          v-if="stat.className"
          class="max-w-24 truncate text-[10px] font-bold tracking-wider text-muted uppercase"
        >
          {{ stat.className }}
        </span>

        <!-- Подписи чисел в плитке короткие, чтобы ряд помещался на узком
          листе; полное название показывает подсказка по наведению -->
        <UTooltip :text="SPELLCASTING_STAT_LABELS.saveDc.full">
          <span class="flex items-center gap-1.5">
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              {{ SPELLCASTING_STAT_LABELS.saveDc.short }}
            </span>

            <span class="text-xs font-bold text-highlighted">
              {{ stat.saveDc }}
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

            <span class="text-xs font-bold text-highlighted">
              {{ stat.attackBonus }}
            </span>
          </span>
        </UTooltip>
      </button>

      <!-- Сколько можно подготовить: число берётся из таблицы класса, нажатие
        открывает настройку своего числа или бонуса к нему. Заговоры считаются
        отдельной плиткой — колонка таблицы класса у них своя -->
      <UTooltip
        v-for="preparedStat in preparedStats"
        :key="preparedStat.kind"
        :text="preparedStat.hint"
      >
        <button
          type="button"
          :class="SHEET_HEADER_STAT_CLASS"
          :aria-label="preparedStat.labels.ariaLabel"
          @click.left.exact.prevent="handlePreparedEdit(preparedStat.kind)"
        >
          <span class="flex items-center gap-1.5">
            <!-- На узком ряду подпись занимает больше места, чем само число,
              поэтому уступает значку: название остаётся в подсказке -->
            <UIcon
              :name="preparedStat.labels.icon"
              class="size-4 shrink-0 text-muted @lg:hidden"
            />

            <span
              class="hidden text-[10px] font-bold tracking-wider text-muted uppercase @lg:inline"
            >
              {{ preparedStat.labels.stat }}
            </span>

            <span
              class="text-xs font-bold"
              :class="preparedStat.valueClass"
            >
              {{ preparedStat.value }}
            </span>
          </span>
        </button>
      </UTooltip>

      <UDropdownMenu
        :items="addMenuItems"
        :content="{ align: 'end' }"
      >
        <!-- Кнопка держится правого края своей строки: на широком листе она
          стоит напротив плиток, на узком — в конце строки с переносом -->
        <UButton
          icon="tabler:plus"
          label="Добавить"
          color="neutral"
          variant="ghost"
          size="sm"
          class="ml-auto"
          :class="editControlClass"
        />
      </UDropdownMenu>
    </div>

    <!-- Отбор списка: подготовка и круги. Чипы идут от самого списка — круга
      без заклинаний и ячеек среди них не бывает, а помечать подготовку бывает и
      нечего. Лежат они в ряду поштучно, без вложенных групп: иначе круги
      переносятся на новую строку все разом, даже когда место ещё есть -->
    <div
      v-if="hasFilterControls"
      class="flex flex-wrap items-center gap-x-1.5 gap-y-2"
    >
      <UTooltip
        v-if="isPreparedFilterAvailable"
        :text="SPELL_FILTER_LABELS.preparedHint"
      >
        <button
          type="button"
          class="mr-1.5 flex items-center gap-1"
          :class="preparedChipClass"
          :aria-pressed="spellFilter.preparedOnly"
          @click.left.exact.prevent="handlePreparedFilterToggle"
        >
          <UIcon
            name="tabler:wand"
            class="size-3.5"
          />

          {{ SPELL_FILTER_LABELS.prepared }}
        </button>
      </UTooltip>

      <!-- Круги — числами, как в каталоге заклинаний: подписью целиком
        («Заговоры», «3 круг») ряд бы не поместился на узком листе, поэтому
        она уходит в подсказку. Круги набираются по одному, повторное нажатие
        снимает круг с отбора -->
      <template v-if="hasLevelChips">
        <UTooltip
          v-for="levelChip in levelChips"
          :key="levelChip.level"
          :text="levelChip.tooltip"
        >
          <button
            type="button"
            class="min-w-7 text-center"
            :class="levelChip.chipClass"
            :aria-pressed="levelChip.isPicked"
            :aria-label="levelChip.tooltip"
            @click.left.exact.prevent="handleLevelPick(levelChip.level)"
          >
            {{ levelChip.label }}
          </button>
        </UTooltip>
      </template>

      <!-- Сброс стоит у правого края ряда и появляется только при отборе:
        пустой кнопке в ряду делать нечего -->
      <UTooltip
        v-if="hasActiveFilter"
        :text="SHEET_FILTER_LABELS.resetHint"
      >
        <UButton
          icon="tabler:filter-off"
          :label="SHEET_FILTER_LABELS.reset"
          color="neutral"
          variant="ghost"
          size="xs"
          class="ml-auto"
          @click.left.exact.prevent="handleFilterReset"
        />
      </UTooltip>
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
            v-for="slotGroup in group.slotGroups"
            :key="slotGroup.kind"
            :text="slotGroup.summary"
          >
            <div class="flex shrink-0 items-center gap-1.5">
              <span
                class="text-[10px] font-bold tracking-wider text-muted uppercase"
              >
                {{ slotGroup.label }}
              </span>

              <span class="flex items-center gap-1">
                <button
                  v-for="circle in slotGroup.circles"
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
          class="flex flex-col rounded-lg border border-default/50 bg-elevated/20 transition-colors hover:border-primary/60"
        >
          <div class="relative flex items-center gap-3 p-3">
            <!-- Значок заклинания — переключатель подготовки: нажатие метит
              заклинание подготовленным, повторное — снимает пометку. Горит при
              этом только сам квадрат, строка остаётся обычной -->
            <UTooltip :text="spell.preparedIcon.tooltip">
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

            <button
              type="button"
              class="flex min-w-0 grow cursor-pointer items-center gap-3 text-left after:absolute after:inset-0 after:cursor-pointer"
              :aria-label="spell.openLabel"
              :aria-expanded="spell.ariaExpanded"
              @click.left.exact.prevent="handleSpellOpen(spell)"
            >
              <span class="flex min-w-0 grow flex-col">
                <span class="flex min-w-0 items-center gap-2">
                  <span class="truncate text-sm font-medium text-highlighted">
                    {{ spell.name }}
                  </span>

                  <!-- Своя характеристика стоит у названия: она относится к
                    самому заклинанию, а не к его броску, как плитка урона -->
                  <UTooltip
                    v-if="spell.abilityBadge"
                    :text="spell.abilityBadge.hint"
                  >
                    <UBadge
                      size="sm"
                      color="secondary"
                      variant="subtle"
                      icon="tabler:wand"
                      class="shrink-0"
                    >
                      {{ spell.abilityBadge.label }}
                    </UBadge>
                  </UTooltip>
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
                  <span class="text-xs font-bold text-primary">
                    {{ damageStat.formula }}
                  </span>

                  <span class="text-[9px] text-primary/80 uppercase">
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
                color="primary"
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
      известных), поэтому пустое место объявляет о себе подписью: пустая книга
      либо отбор, под который ничего не подошло -->
    <div
      v-if="emptyLabel"
      class="flex h-64 items-center justify-center rounded-lg border border-dashed border-default text-sm text-dimmed"
    >
      {{ emptyLabel }}
    </div>
  </div>
</template>
