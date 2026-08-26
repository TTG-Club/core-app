<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type {
    AbilityKey,
    CharacterInventoryItem,
    InventoryArmor,
    InventoryCharges,
    InventoryStatRollKind,
    InventoryWeapon,
    WeaponAttack,
  } from '../../model';

  import { MarkupRender } from '~ui/markup';

  import { useCharacterSheet } from '../../composables';
  import {
    ABILITY_LABELS,
    ARMOR_DEXTERITY_HINT_LABELS,
    CUSTOM_INVENTORY_BADGE_HINT,
    getAbilityModifier,
    getHeavyWeaponHint,
    getInventoryEquipIcon,
    getInventoryItemBonusLabels,
    getInventoryItemMenuItems,
    getWeaponAttackBonus,
    getWeaponDamage,
    INVENTORY_ACTIVE_BADGE_HINT,
    INVENTORY_ACTIVE_BADGE_LABEL,
    INVENTORY_ATTUNED_BADGE_HINT,
    INVENTORY_ATTUNED_BADGE_LABEL,
    INVENTORY_ATTUNEMENT_BADGE_HINT,
    INVENTORY_ATTUNEMENT_BADGE_LABEL,
    INVENTORY_BONUS_LABELS,
    INVENTORY_CATEGORY_ICONS,
    INVENTORY_CHARGES_HINT_LABELS,
    INVENTORY_CHARGES_SPEND_LABEL,
    INVENTORY_EQUIP_ACTION_LABELS,
    INVENTORY_HEAVY_BADGE_LABEL,
    INVENTORY_MISSING_BADGE_HINT,
    INVENTORY_MISSING_BADGE_LABEL,
    INVENTORY_QUANTITY_MIN,
    INVENTORY_ROLL_KIND_LABELS,
    INVENTORY_STAT_HINT_LABELS,
    INVENTORY_STAT_LABELS,
    INVENTORY_TWO_HANDED_BADGE_HINT,
    INVENTORY_TWO_HANDED_BADGE_LABEL,
    isActivatableInventoryItem,
    isAttunableInventoryItem,
    isCustomInventoryItem,
    isEquippableInventoryItem,
    isMissingInventoryItem,
    isProficientWeapon,
    isVersatileInventoryItem,
    SHEET_ROLL_HINT_LABEL,
    WEIGHT_UNIT_LABEL,
  } from '../../model';

  /**
   * Действие плитки: нажатие катит бросок оружия или тратит заряд предмета.
   * Плитка с действием становится кнопкой, без него остаётся справочной.
   */
  interface StatAction {
    /** Подпись кнопки для скринридера. */
    ariaLabel: string;

    /** Чем нажатие обернётся — добавляется к тултипу плитки. */
    hint: string;

    run: () => void;
  }

  /** Плитка параметра предмета: короткая подпись, значение и опции показа. */
  interface ItemStat {
    label: string;
    value: string;

    /** Полная расшифровка по наведению (например, правило КД доспеха). */
    tooltip?: string;

    /** Акцентная (тёплая) заливка — для боевого параметра (КД/атака). */
    accent?: boolean;

    /** Действие по нажатию: плитка становится кнопкой. */
    action?: StatAction;
  }

  /** Плитка параметра с разрешёнными классами оформления. */
  interface DecoratedStat {
    label: string;
    value: string;
    tooltip: string;
    action: StatAction | null;
    containerClass: string;
    valueClass: string;
    labelClass: string;
  }

  /** Классы плитки боевого параметра (тёплый акцент). */
  const ACCENT_STAT_CLASSES = {
    container: 'border-primary/40 bg-primary/10',
    value: 'text-primary',
    label: 'text-primary/80',
  };

  /** Классы обычной плитки (стоимость, вес). */
  const PLAIN_STAT_CLASSES = {
    container: 'border-default/50 bg-default/40',
    value: 'text-highlighted',
    label: 'text-dimmed',
  };

  /** Дополнительное оформление плитки-кнопки броска. */
  const ROLL_STAT_CLASS =
    'relative z-10 cursor-pointer hover:border-primary hover:bg-primary/20';

  /**
   * Раскладка плитки параметра: на второй строке узкой карточки плитки делят
   * свободное место поровну (`basis-0`) и заполняют её целиком, на широкой
   * строке остаются по содержимому — там растягивать нечего. `whitespace-nowrap`
   * держит нижнюю границу ширины: без него на узком экране плитка сжималась бы
   * до самого длинного слова и «400 зм» переносилось бы на две строки.
   */
  const STAT_LAYOUT_CLASSES =
    'flex shrink-0 grow basis-0 flex-col items-center rounded border px-2 py-0.5 whitespace-nowrap @xl:grow-0 @xl:basis-auto';

  /**
   * Дополняет плитку классами оформления по признаку акцента и действия (логика
   * вынесена из шаблона).
   *
   * @param stat исходная плитка параметра.
   * @param interactive действия разрешены; false — плитка остаётся справочной
   *   (предмета не осталось, ни катить им, ни тратить его заряды нечего).
   * @returns плитка с разрешёнными классами.
   */
  function decorateStat(stat: ItemStat, interactive: boolean): DecoratedStat {
    const classes = stat.accent ? ACCENT_STAT_CLASSES : PLAIN_STAT_CLASSES;
    const tooltip = stat.tooltip ?? '';
    const action = interactive ? (stat.action ?? null) : null;

    return {
      label: stat.label,
      value: stat.value,
      tooltip: action ? `${tooltip} · ${action.hint}` : tooltip,
      action,
      containerClass: action
        ? `${classes.container} ${ROLL_STAT_CLASS}`
        : classes.container,
      valueClass: classes.value,
      labelClass: classes.label,
    };
  }

  const props = defineProps<{
    inventoryItem: CharacterInventoryItem;
  }>();

  const emit = defineEmits<{
    'preview': [];
    'edit': [];
    'copy': [];
    'remove': [];
    'adjust': [delta: number];
    'toggle-equip': [];
    'toggle-attuned': [];
    'toggle-active': [];
    'spend-charge': [];
    'restore-charges': [];
    'toggle-two-handed': [];
    'roll-attack': [];
    'roll-damage': [];
  }>();

  // Бонус атаки зависит от характеристик/уровня персонажа — читаем общее
  // состояние листа через composable (как модалки). Оттуда же классы кнопок:
  // правка и удаление предмета меняют лист, а количество — игровое действие,
  // его запертый лист разрешает, чужой — нет.
  const { character, editControlClass, gameControlClass } = useCharacterSheet();

  const categoryIcon = computed(
    () => INVENTORY_CATEGORY_ICONS[props.inventoryItem.category],
  );

  // Свой предмет описания в каталоге не имеет — оно хранится прямо в листе,
  // поэтому строка не ведёт в дровер раздела, а разворачивается на месте.
  const isCustom = computed(() => isCustomInventoryItem(props.inventoryItem));

  const isExpanded = ref(false);

  const descriptionNodes = computed(
    () => props.inventoryItem.description ?? [],
  );

  // Универсальное оружие (у справочника для него есть второй бросок урона):
  // хват переключается пунктом меню, отдельной кнопки в строке ему не нашлось бы
  // — трейлинг и так занят количеством.
  const isVersatile = computed(() =>
    isVersatileInventoryItem(props.inventoryItem),
  );

  const isTwoHanded = computed(
    () => isVersatile.value && props.inventoryItem.twoHanded,
  );

  // Владение оружием решает, входит ли в атаку бонус мастерства (правила 2024).
  const hasWeaponProficiency = computed(() =>
    isProficientWeapon(character.value, props.inventoryItem),
  );

  // Разбор атаки нужен и плитке, и значку помехи тяжёлого оружия — считаем его
  // один раз. null — предмет оружием не является.
  const weaponAttack = computed<WeaponAttack | null>(() => {
    const { weapon } = props.inventoryItem;

    return weapon
      ? getWeaponAttackBonus(
          character.value,
          weapon,
          hasWeaponProficiency.value,
        )
      : null;
  });

  // Помеха от свойства «Тяжёлое» стоит значком: на бонус атаки она не влияет, и
  // без него о ней узнавали бы только из тултипа плитки.
  const heavyHint = computed(() => {
    const heavyAbility = weaponAttack.value?.heavyAbility;

    return heavyAbility ? getHeavyWeaponHint(heavyAbility) : '';
  });

  const openLabel = computed(() =>
    isCustom.value
      ? `Развернуть предмет: ${props.inventoryItem.name}`
      : `Открыть предмет: ${props.inventoryItem.name}`,
  );

  // Состояния «развёрнуто» у каталожной строки нет — она открывает дровер.
  const ariaExpanded = computed(() =>
    isCustom.value ? isExpanded.value : undefined,
  );

  // Количество доведено до нуля: запись остаётся в снаряжении (чтобы не искать
  // предмет в каталоге заново), но самого предмета у персонажа нет — надеть его
  // и катить им атаку с уроном нельзя.
  const isMissing = computed(() => isMissingInventoryItem(props.inventoryItem));

  const isEquippable = computed(() =>
    isEquippableInventoryItem(props.inventoryItem),
  );

  const isEquipped = computed(
    () => isEquippable.value && props.inventoryItem.equipped,
  );

  // Настройку предлагает сам предмет: у каталожной записи её называет раздел, у
  // своей — взяться ей неоткуда, пока форма о ней не спрашивает.
  const isAttunable = computed(() =>
    isAttunableInventoryItem(props.inventoryItem),
  );

  const isAttuned = computed(
    () => isAttunable.value && props.inventoryItem.attuned,
  );

  // Настройки ждёт предмет, который её требует, но ещё не получил: его бонусы
  // в лист не идут, и значок об этом предупреждает.
  const isAttunementRequired = computed(
    () => isAttunable.value && !props.inventoryItem.attuned,
  );

  const bonusLabels = computed(() =>
    getInventoryItemBonusLabels(props.inventoryItem),
  );

  // Пока предмет не надет (а требующий настройки — не настроен), его бонусы
  // только записаны: подпись под сводкой говорит, чего им не хватает.
  const bonusHint = computed(() => {
    if (isEquipped.value && !isAttunementRequired.value) {
      return '';
    }

    return isAttunable.value
      ? INVENTORY_BONUS_LABELS.attunementHint
      : INVENTORY_BONUS_LABELS.inactiveHint;
  });

  const isActivatable = computed(() =>
    isActivatableInventoryItem(props.inventoryItem),
  );

  const isActive = computed(
    () => isActivatable.value && props.inventoryItem.active,
  );

  const charges = computed(() => props.inventoryItem.charges);

  // Правка и удаление — под многоточием: строка и без них плотная (иконка,
  // название, плитки, «+/−»), а два разных набора кнопок ломали бы её ритм.
  // Каталожный предмет правится в своём разделе — вместо правки ему предлагается
  // копия в лист, после которой он становится своим.
  const menuItems = computed<Array<DropdownMenuItem>>(() =>
    getInventoryItemMenuItems({
      onToggleGrip: isVersatile.value
        ? () => emit('toggle-two-handed')
        : undefined,
      twoHanded: isTwoHanded.value,
      // Игровые действия магии отбирает отсутствующий предмет: настраиваться,
      // включать и заряжать нечего, пока его у персонажа нет.
      onToggleAttunement:
        isAttunable.value && !isMissing.value
          ? () => emit('toggle-attuned')
          : undefined,
      attuned: isAttuned.value,
      onToggleActive:
        isActivatable.value && !isMissing.value
          ? () => emit('toggle-active')
          : undefined,
      active: isActive.value,
      onRestoreCharges:
        charges.value && !isMissing.value
          ? () => emit('restore-charges')
          : undefined,
      onEdit: isCustom.value ? () => emit('edit') : undefined,
      onCopy: isCustom.value ? undefined : () => emit('copy'),
      onRemove: () => emit('remove'),
    }),
  );

  const equipActionLabel = computed(() =>
    isEquipped.value
      ? INVENTORY_EQUIP_ACTION_LABELS.unequip
      : INVENTORY_EQUIP_ACTION_LABELS.equip,
  );

  // Отсутствующий доспех объясняет тултипом, почему кнопка не нажимается;
  // подпись для скринридера остаётся действием — состояние «недоступна» он
  // читает по самому `disabled`.
  const equipTooltip = computed(() =>
    isMissing.value ? INVENTORY_MISSING_BADGE_HINT : equipActionLabel.value,
  );

  // Иконку кнопки выбирает вид предмета: меч у оружия, щит у доспеха, искры у
  // прочей магии. Надет он или нет, кнопка говорит подсветкой — парная иконка
  // в наборе нашлась не для каждого вида.
  const equipIcon = computed(() =>
    getInventoryEquipIcon(props.inventoryItem, isEquipped.value),
  );

  const equipButtonClass = computed(() => {
    if (isMissing.value) {
      return 'cursor-not-allowed border-default/40 bg-default/20 text-dimmed';
    }

    return isEquipped.value
      ? 'cursor-pointer border-primary/60 bg-primary/15 text-primary'
      : 'cursor-pointer border-default/50 bg-default/40 text-muted hover:border-primary/60';
  });

  // Отсутствующий предмет остаётся читаемым (его правят и пополняют), но
  // пунктирная рамка отличает его от снаряжения, которое у персонажа есть.
  const rowClass = computed(() => {
    if (isMissing.value) {
      return 'border-dashed';
    }

    return isEquipped.value
      ? 'bg-primary/5 ring-1 ring-primary/50 ring-inset'
      : '';
  });

  const nameClass = computed(() =>
    isMissing.value ? 'text-muted' : 'text-highlighted',
  );

  // Ноль в счётчике — тот же сигнал, что и значок «Отсутствует»: значок виден
  // не всегда (узкая карточка переносит его под название), а число — всегда.
  const quantityClass = computed(() =>
    isMissing.value ? 'text-error' : 'text-default',
  );

  /** Плитка класса доспеха: сколько КД даёт предмет (щит — бонусом). */
  function getArmorStat(armor: InventoryArmor): ItemStat {
    if (armor.shield) {
      return {
        label: INVENTORY_STAT_LABELS.armorClass,
        value: `+${armor.baseArmorClass}`,
        tooltip: `Щит: +${armor.baseArmorClass} к классу доспеха`,
        accent: true,
      };
    }

    return {
      label: INVENTORY_STAT_LABELS.armorClass,
      value: String(armor.baseArmorClass),
      tooltip: `Класс доспеха ${armor.baseArmorClass}${ARMOR_DEXTERITY_HINT_LABELS[armor.dexterityMod]}`,
      accent: true,
    };
  }

  /** Слагаемое подсказки: подпись и бонус со знаком («мастерство +3»). */
  function getBonusPart(label: string, bonus: number): string {
    return `${label} ${getFormattedBonus(bonus)}`;
  }

  /** Слагаемое подсказки с модификатором характеристики («Сила +3»). */
  function getAbilityPart(abilityKey: AbilityKey): string {
    return getBonusPart(
      ABILITY_LABELS[abilityKey],
      getAbilityModifier(character.value, abilityKey),
    );
  }

  /** Бросок плитки оружия с подписью кнопки для скринридера. */
  function getStatRoll(kind: InventoryStatRollKind): StatAction {
    return {
      ariaLabel: `${INVENTORY_ROLL_KIND_LABELS[kind]}: ${props.inventoryItem.name}`,
      hint: SHEET_ROLL_HINT_LABEL,
      run: () =>
        kind === 'attack' ? emit('roll-attack') : emit('roll-damage'),
    };
  }

  /**
   * Плитка зарядов: остаток из максимума, нажатие тратит один. На нуле плитка
   * теряет акцент и действие — тратить нечего, восстановление ждёт в меню.
   */
  function getChargesStat(itemCharges: InventoryCharges): ItemStat {
    const isEmpty = itemCharges.current <= 0;

    return {
      label: INVENTORY_STAT_LABELS.charges,
      value: `${itemCharges.current}/${itemCharges.max}`,
      tooltip: isEmpty ? INVENTORY_CHARGES_HINT_LABELS.empty : '',
      accent: !isEmpty,
      action: isEmpty
        ? undefined
        : {
            ariaLabel: `${INVENTORY_CHARGES_SPEND_LABEL}: ${props.inventoryItem.name}`,
            hint: INVENTORY_CHARGES_HINT_LABELS.spend,
            run: () => emit('spend-charge'),
          },
    };
  }

  /**
   * Плитка бонуса атаки оружием: бонус мастерства плюс модификатор стата.
   * Оружию без владения бонус мастерства не полагается — в разборе его нет, а
   * хвост подсказки говорит почему. Тем же хвостом идёт и помеха тяжёлого
   * оружия: в бонусе её не видно, а на бросок она влияет.
   */
  function getWeaponAttackStat(attack: WeaponAttack): ItemStat {
    const tooltipParts = attack.proficiencyBonus
      ? [
          getBonusPart(
            INVENTORY_STAT_HINT_LABELS.proficiency,
            attack.proficiencyBonus,
          ),
        ]
      : [];

    tooltipParts.push(getAbilityPart(attack.ability));

    if (attack.weaponBonus !== 0) {
      tooltipParts.push(
        getBonusPart(INVENTORY_STAT_HINT_LABELS.weapon, attack.weaponBonus),
      );
    }

    const proficiencyHint = hasWeaponProficiency.value
      ? ''
      : ` · ${INVENTORY_STAT_HINT_LABELS.noProficiency}`;

    const heavyDisadvantageHint = attack.heavyAbility
      ? ` · ${INVENTORY_STAT_HINT_LABELS.heavyDisadvantage}`
      : '';

    const formula = `${tooltipParts.join(' + ')}${proficiencyHint}${heavyDisadvantageHint}`;

    return {
      label: INVENTORY_STAT_LABELS.attack,
      value: getFormattedBonus(attack.value),
      tooltip: `${INVENTORY_STAT_HINT_LABELS.attack} = ${formula}`,
      accent: true,
      action: getStatRoll('attack'),
    };
  }

  /**
   * Плитка урона оружием: кости справочника, собственный бонус оружия и
   * модификатор той же характеристики, что и в атаке. null — урона в справочнике
   * нет (например, у предмета, добавленного до появления урона в листе).
   */
  function getWeaponDamageStat(weapon: InventoryWeapon): ItemStat | null {
    const damage = getWeaponDamage(character.value, weapon, isTwoHanded.value);

    if (!damage) {
      return null;
    }

    const tooltipParts = [damage.diceNotation];

    // Дополнительный урон катится той же формулой, поэтому в разборе он стоит
    // рядом с костями оружия — со своим типом, чтобы не путать с основным.
    if (damage.extraNotation) {
      tooltipParts.push(
        [damage.extraNotation, damage.extraTypeLabel].filter(Boolean).join(' '),
      );
    }

    if (damage.weaponBonus !== 0) {
      tooltipParts.push(
        getBonusPart(INVENTORY_STAT_HINT_LABELS.weapon, damage.weaponBonus),
      );
    }

    tooltipParts.push(getAbilityPart(damage.ability));

    const typePart = damage.typeLabel ? ` · ${damage.typeLabel}` : '';

    return {
      label: INVENTORY_STAT_LABELS.damage,
      value: damage.formula,
      tooltip: `${INVENTORY_STAT_LABELS.damage} = ${tooltipParts.join(' + ')}${typePart}`,
      accent: true,
      action: getStatRoll('damage'),
    };
  }

  /** Плитки оружия: бонус атаки и урон — обе бросаются по нажатию. */
  function getWeaponStats(
    weapon: InventoryWeapon,
    attack: WeaponAttack,
  ): ItemStat[] {
    const damageStat = getWeaponDamageStat(weapon);
    const attackStat = getWeaponAttackStat(attack);

    return damageStat ? [attackStat, damageStat] : [attackStat];
  }

  /**
   * Плитки параметров предмета: боевой параметр (КД доспеха или атака и урон
   * оружия) по самим параметрам, заряды, стоимость и вес, если известны. У
   * оружия плитка урона занимает место цены — в бою она нужнее, а ряд не растёт;
   * заряды её вытесняют по той же причине.
   */
  const displayStats = computed<DecoratedStat[]>(() => {
    const stats: ItemStat[] = [];

    const { armor, weapon, cost, weight } = props.inventoryItem;

    const attack = weaponAttack.value;

    const weaponStats =
      armor || !weapon || !attack ? [] : getWeaponStats(weapon, attack);

    if (armor) {
      stats.push(getArmorStat(armor));
    } else {
      stats.push(...weaponStats);
    }

    if (charges.value) {
      stats.push(getChargesStat(charges.value));
    }

    // Цена уступает место урону и зарядам: в бою нужны они, а ряд не растёт.
    const hasCombatStat = weaponStats.length > 1 || Boolean(charges.value);

    if (cost && !hasCombatStat) {
      stats.push({ label: INVENTORY_STAT_LABELS.cost, value: cost });
    }

    if (weight > 0) {
      stats.push({ label: WEIGHT_UNIT_LABEL, value: String(weight) });
    }

    return stats.map((stat) => decorateStat(stat, !isMissing.value));
  });

  const isDecreaseDisabled = computed(
    () => props.inventoryItem.quantity <= INVENTORY_QUANTITY_MIN,
  );

  function handleDecrease() {
    emit('adjust', -1);
  }

  function handleIncrease() {
    emit('adjust', 1);
  }

  /**
   * Нажатие на строку: свой предмет разворачивается прямо на листе (описание
   * хранится в нём), каталожный открывается дровером раздела-источника.
   */
  function handleOpen() {
    if (isCustom.value) {
      isExpanded.value = !isExpanded.value;

      return;
    }

    emit('preview');
  }

  /**
   * Надеть/снять доспех. Отсутствующий предмет кнопка отбивает сама: атрибут
   * `disabled` ей не подходит — отключённая кнопка не получает событий мыши, и
   * тултип с причиной («Предмета не осталось…») не открывался бы.
   */
  function handleEquipToggle() {
    if (isMissing.value) {
      return;
    }

    emit('toggle-equip');
  }
</script>

<template>
  <!-- Свой @container: строка перестраивается по ширине самой карточки, а не
    окна — лист бывает узким и на широком экране (дровер, правая панель) -->
  <div
    class="@container flex flex-col rounded-lg border border-default/50 bg-elevated/20 transition-colors hover:border-primary/60"
    :class="rowClass"
  >
    <!-- Перестроение по брейкпоинту, а не по факту переполнения: до @xl
      (36rem) иконка с названием занимают всю первую строку, а параметры,
      количество и действия уходят на вторую. Иначе раскладка зависела бы от
      длины названия и соседние карточки выглядели бы по-разному -->
    <div class="relative flex flex-wrap items-center gap-x-3 gap-y-2 p-3">
      <div class="flex w-full min-w-0 items-center gap-3 @xl:w-auto @xl:flex-1">
        <UTooltip
          v-if="isEquippable"
          :text="equipTooltip"
        >
          <button
            type="button"
            class="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-lg border transition-colors"
            :class="equipButtonClass"
            :aria-disabled="isMissing"
            :aria-pressed="isEquipped"
            :aria-label="`${equipActionLabel}: ${inventoryItem.name}`"
            @click.left.exact.prevent="handleEquipToggle"
          >
            <UIcon
              :name="equipIcon"
              class="size-5"
            />
          </button>
        </UTooltip>

        <span
          v-else
          class="flex size-10 shrink-0 items-center justify-center rounded-lg border border-default/50 bg-default/40"
        >
          <UIcon
            :name="categoryIcon"
            class="size-5 text-muted"
          />
        </span>

        <button
          type="button"
          class="flex min-w-0 grow cursor-pointer flex-col text-left after:absolute after:inset-0 after:cursor-pointer"
          :aria-label="openLabel"
          :aria-expanded="ariaExpanded"
          @click.left.exact.prevent="handleOpen"
        >
          <!-- Значки переносятся под название на узкой карточке; на широкой
            строке они, как и раньше, стоят рядом, а длинное название
            обрезается -->
          <span
            class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 @xl:flex-nowrap"
          >
            <!-- На узкой карточке название переносится целиком: места под ним
              достаточно, а обрезка вида «Була…» ничего не говорит о предмете -->
            <span
              class="text-sm font-medium wrap-break-word @xl:truncate"
              :class="nameClass"
            >
              {{ inventoryItem.name }}
            </span>

            <UBadge
              v-if="isEquipped"
              color="primary"
              variant="subtle"
              size="sm"
              class="shrink-0"
            >
              Надет
            </UBadge>

            <!-- Настройка и включение стоят рядом с «Надет»: это состояния
              одного предмета, и игрок читает их одной строкой. Пока настройки
              нет, вместо неё стоит предупреждение — бонусы предмета молчат -->
            <UTooltip
              v-if="isAttunementRequired"
              :text="INVENTORY_ATTUNEMENT_BADGE_HINT"
            >
              <UBadge
                size="sm"
                color="warning"
                variant="subtle"
                class="relative z-10 shrink-0"
              >
                {{ INVENTORY_ATTUNEMENT_BADGE_LABEL }}
              </UBadge>
            </UTooltip>

            <UTooltip
              v-if="isAttuned"
              :text="INVENTORY_ATTUNED_BADGE_HINT"
            >
              <UBadge
                size="sm"
                color="primary"
                variant="subtle"
                class="relative z-10 shrink-0"
              >
                {{ INVENTORY_ATTUNED_BADGE_LABEL }}
              </UBadge>
            </UTooltip>

            <UTooltip
              v-if="isActive"
              :text="INVENTORY_ACTIVE_BADGE_HINT"
            >
              <UBadge
                size="sm"
                color="success"
                variant="subtle"
                class="relative z-10 shrink-0"
              >
                {{ INVENTORY_ACTIVE_BADGE_LABEL }}
              </UBadge>
            </UTooltip>

            <!-- Хват стоит там же, где «Надет»: у оружия своего значка нет, а
              без него выросшая кость урона выглядела бы ошибкой листа -->
            <UTooltip
              v-if="isTwoHanded"
              :text="INVENTORY_TWO_HANDED_BADGE_HINT"
            >
              <UBadge
                size="sm"
                color="primary"
                variant="subtle"
                class="relative z-10 shrink-0"
              >
                {{ INVENTORY_TWO_HANDED_BADGE_LABEL }}
              </UBadge>
            </UTooltip>

            <!-- Помеха тяжёлого оружия: в плитке атаки её не видно (на бонус
              она не влияет), а на бросок влияет — значок предупреждает -->
            <UTooltip
              v-if="heavyHint"
              :text="heavyHint"
            >
              <UBadge
                size="sm"
                color="warning"
                variant="subtle"
                class="relative z-10 shrink-0"
              >
                {{ INVENTORY_HEAVY_BADGE_LABEL }}
              </UBadge>
            </UTooltip>

            <!-- Значок отсутствия стоит там же, где «Надет»: у одного предмета
              они взаимоисключающие — обнулённый доспех снимается -->
            <UTooltip
              v-if="isMissing"
              :text="INVENTORY_MISSING_BADGE_HINT"
            >
              <UBadge
                size="sm"
                color="error"
                variant="subtle"
                class="relative z-10 shrink-0"
              >
                {{ INVENTORY_MISSING_BADGE_LABEL }}
              </UBadge>
            </UTooltip>

            <UTooltip
              v-if="isCustom"
              :text="CUSTOM_INVENTORY_BADGE_HINT"
            >
              <UBadge
                size="sm"
                color="neutral"
                variant="subtle"
                class="relative z-10 shrink-0"
              >
                Свой
              </UBadge>
            </UTooltip>
          </span>

          <span
            v-if="inventoryItem.typesLabel"
            class="text-xs wrap-break-word text-dimmed @xl:truncate"
          >
            {{ inventoryItem.typesLabel }}
          </span>
        </button>
      </div>

      <!-- На второй строке группа забирает всё свободное место (плитки внутри
        делят его поровну), на широкой строке — только по содержимому. Плитки
        переносятся внутри группы, поэтому shrink-0 ей нельзя: иначе она
        осталась бы шириной во все плитки в строку и растянула бы карточку -->
      <div
        v-if="displayStats.length"
        class="flex grow flex-wrap items-center gap-1.5 @xl:grow-0"
      >
        <UTooltip
          v-for="stat in displayStats"
          :key="stat.label"
          :text="stat.tooltip"
          :disabled="!stat.tooltip"
        >
          <!-- Плитки с действием — кнопки: атака и урон катят свою формулу,
            заряды тратят один. -->
          <button
            v-if="stat.action"
            type="button"
            class="transition-colors"
            :class="[STAT_LAYOUT_CLASSES, stat.containerClass]"
            :aria-label="stat.action.ariaLabel"
            @click.left.exact.prevent="stat.action.run()"
          >
            <span
              class="text-xs font-bold"
              :class="stat.valueClass"
            >
              {{ stat.value }}
            </span>

            <span
              class="text-[9px] uppercase"
              :class="stat.labelClass"
            >
              {{ stat.label }}
            </span>
          </button>

          <div
            v-else
            :class="[STAT_LAYOUT_CLASSES, stat.containerClass]"
          >
            <span
              class="text-xs font-bold"
              :class="stat.valueClass"
            >
              {{ stat.value }}
            </span>

            <span
              class="text-[9px] uppercase"
              :class="stat.labelClass"
            >
              {{ stat.label }}
            </span>
          </div>
        </UTooltip>
      </div>

      <!-- Количество и действия держатся вместе и прижимаются вправо: на
        широкой строке место им и так остаётся справа, на второй строке узкой
        карточки — отделяет их от плиток параметров. Слой z-10 поднимает их над
        подложкой названия, которая накрывает всю строку -->
      <div class="relative z-10 ml-auto flex shrink-0 items-center gap-1">
        <UButton
          icon="tabler:minus"
          color="neutral"
          variant="ghost"
          size="xs"
          square
          :class="gameControlClass"
          :disabled="isDecreaseDisabled"
          :aria-label="`Уменьшить количество: ${inventoryItem.name}`"
          @click.left.exact.prevent="handleDecrease"
        />

        <span
          class="w-6 text-center text-sm font-medium"
          :class="quantityClass"
        >
          {{ inventoryItem.quantity }}
        </span>

        <UButton
          icon="tabler:plus"
          color="neutral"
          variant="ghost"
          size="xs"
          square
          :class="gameControlClass"
          :aria-label="`Увеличить количество: ${inventoryItem.name}`"
          @click.left.exact.prevent="handleIncrease"
        />

        <!-- Меню действий над предметом: один и тот же трейлинг у своей и
          каталожной строки, а удаление больше не стоит вплотную к «+/−» -->
        <UDropdownMenu
          :items="menuItems"
          :content="{ align: 'end' }"
        >
          <UButton
            icon="tabler:dots-vertical"
            color="neutral"
            variant="ghost"
            size="xs"
            square
            :class="editControlClass"
            :aria-label="`Действия с предметом: ${inventoryItem.name}`"
          />
        </UDropdownMenu>
      </div>
    </div>

    <div
      v-if="isExpanded"
      class="flex flex-col gap-2 border-t border-default/50 px-3 py-2"
    >
      <!-- Сводка магии стоит над описанием: она короткая и отвечает на главный
        вопрос — что предмет даёт листу -->
      <div
        v-if="bonusLabels.length"
        class="flex flex-col gap-1"
      >
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="text-[10px] font-bold text-muted uppercase">
            {{ INVENTORY_BONUS_LABELS.title }}
          </span>

          <UBadge
            v-for="bonusLabel in bonusLabels"
            :key="bonusLabel"
            size="sm"
            color="neutral"
            variant="subtle"
          >
            {{ bonusLabel }}
          </UBadge>
        </div>

        <span
          v-if="bonusHint"
          class="text-xs text-dimmed"
        >
          {{ bonusHint }}
        </span>
      </div>

      <MarkupRender
        v-if="descriptionNodes.length"
        :render-node="descriptionNodes"
        class="text-sm"
      />

      <span
        v-else
        class="text-xs text-dimmed"
      >
        Описание не заполнено
      </span>
    </div>
  </div>
</template>
