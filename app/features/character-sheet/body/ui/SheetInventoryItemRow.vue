<script setup lang="ts">
  import type {
    AbilityKey,
    CharacterInventoryItem,
    InventoryArmor,
    InventoryStatRollKind,
    InventoryWeapon,
  } from '../../model';

  import { MarkupRender } from '~ui/markup';

  import { useCharacterSheet } from '../../composables';
  import {
    ABILITY_LABELS,
    ARMOR_DEXTERITY_HINT_LABELS,
    getFormattedBonus,
    getProficiencyBonus,
    getWeaponAttackBonus,
    getWeaponDamage,
    INVENTORY_CATEGORY_ICONS,
    INVENTORY_QUANTITY_MIN,
    INVENTORY_ROLL_HINT_LABEL,
    INVENTORY_ROLL_KIND_LABELS,
    INVENTORY_STAT_LABELS,
    isCustomInventoryItem,
    WEIGHT_UNIT_LABEL,
  } from '../../model';

  /** Бросок с плитки: вид броска и подпись кнопки для скринридера. */
  interface StatRoll {
    kind: InventoryStatRollKind;
    ariaLabel: string;
  }

  /** Плитка параметра предмета: короткая подпись, значение и опции показа. */
  interface ItemStat {
    label: string;
    value: string;

    /** Полная расшифровка по наведению (например, правило КД доспеха). */
    tooltip?: string;

    /** Акцентная (тёплая) заливка — для боевого параметра (КД/атака). */
    accent?: boolean;

    /** Бросок по нажатию: плитка становится кнопкой (атака и урон оружия). */
    roll?: StatRoll;
  }

  /** Плитка параметра с разрешёнными классами оформления. */
  interface DecoratedStat {
    label: string;
    value: string;
    tooltip: string;
    roll: StatRoll | null;
    containerClass: string;
    valueClass: string;
    labelClass: string;
  }

  /** Классы плитки боевого параметра (тёплый акцент). */
  const ACCENT_STAT_CLASSES = {
    container: 'border-warning/40 bg-warning/10',
    value: 'text-warning',
    label: 'text-warning/80',
  };

  /** Классы обычной плитки (стоимость, вес). */
  const PLAIN_STAT_CLASSES = {
    container: 'border-default/50 bg-default/40',
    value: 'text-highlighted',
    label: 'text-dimmed',
  };

  /** Дополнительное оформление плитки-кнопки броска. */
  const ROLL_STAT_CLASS =
    'relative z-10 cursor-pointer hover:border-warning hover:bg-warning/20';

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
   * Кнопки правки и удаления. На узкой карточке (до `@xl`) видны всегда — там
   * их нечем вызвать, а прозрачная кнопка удаления рядом с «+/−» ловит
   * случайные нажатия. На широкой строке прячем их только там, где есть
   * наведение: `pointer-fine` оставляет кнопки видимыми на сенсорном планшете.
   */
  const ROW_ACTION_CLASSES =
    'shrink-0 transition-opacity @xl:pointer-fine:opacity-0 @xl:group-hover/item:opacity-100 @xl:focus-visible:opacity-100';

  /**
   * Дополняет плитку классами оформления по признаку акцента и броска (логика
   * вынесена из шаблона).
   *
   * @param stat исходная плитка параметра.
   * @returns плитка с разрешёнными классами.
   */
  function decorateStat(stat: ItemStat): DecoratedStat {
    const classes = stat.accent ? ACCENT_STAT_CLASSES : PLAIN_STAT_CLASSES;
    const tooltip = stat.tooltip ?? '';

    return {
      label: stat.label,
      value: stat.value,
      tooltip: stat.roll
        ? `${tooltip} · ${INVENTORY_ROLL_HINT_LABEL}`
        : tooltip,
      roll: stat.roll ?? null,
      containerClass: stat.roll
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
    'remove': [];
    'adjust': [delta: number];
    'toggle-equip': [];
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

  const chevronClass = computed(() => (isExpanded.value ? 'rotate-180' : ''));

  const openLabel = computed(() =>
    isCustom.value
      ? `Развернуть предмет: ${props.inventoryItem.name}`
      : `Открыть предмет: ${props.inventoryItem.name}`,
  );

  // Состояния «развёрнуто» у каталожной строки нет — она открывает дровер.
  const ariaExpanded = computed(() =>
    isCustom.value ? isExpanded.value : undefined,
  );

  // Экипировать можно только доспехи (оружие — нет). Иконку доспеха с данными
  // о КД можно нажать, чтобы надеть/снять.
  const isEquippable = computed(
    () =>
      props.inventoryItem.category === 'ARMOR'
      && props.inventoryItem.armor !== null,
  );

  const isEquipped = computed(
    () => isEquippable.value && props.inventoryItem.equipped,
  );

  const equipTooltip = computed(() => (isEquipped.value ? 'Снять' : 'Надеть'));

  const equipIcon = computed(() =>
    isEquipped.value ? 'tabler:shield-check' : 'tabler:shield',
  );

  const equipButtonClass = computed(() =>
    isEquipped.value
      ? 'border-warning/60 bg-warning/15 text-warning'
      : 'border-default/50 bg-default/40 text-muted hover:border-warning/60',
  );

  const rowClass = computed(() =>
    isEquipped.value ? 'bg-warning/5 ring-1 ring-warning/50 ring-inset' : '',
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

  /** Слагаемое подсказки с модификатором характеристики («Сила +3»). */
  function getAbilityPart(abilityKey: AbilityKey): string {
    return `${ABILITY_LABELS[abilityKey]} ${getFormattedModifier(
      character.value.abilities[abilityKey],
    )}`;
  }

  /** Бросок плитки с подписью кнопки для скринридера. */
  function getStatRoll(kind: InventoryStatRollKind): StatRoll {
    return {
      kind,
      ariaLabel: `${INVENTORY_ROLL_KIND_LABELS[kind]}: ${props.inventoryItem.name}`,
    };
  }

  /** Плитка бонуса атаки оружием: бонус мастерства плюс модификатор стата. */
  function getWeaponAttackStat(weapon: InventoryWeapon): ItemStat {
    const attack = getWeaponAttackBonus(character.value, weapon);

    const masteryPart = `мастерство ${getFormattedBonus(
      getProficiencyBonus(character.value.level),
    )}`;

    return {
      label: INVENTORY_STAT_LABELS.attack,
      value: getFormattedBonus(attack.value),
      tooltip: `Бонус атаки = ${masteryPart} + ${getAbilityPart(attack.ability)}`,
      accent: true,
      roll: getStatRoll('attack'),
    };
  }

  /**
   * Плитка урона оружием: кости справочника, собственный бонус оружия и
   * модификатор той же характеристики, что и в атаке. null — урона в справочнике
   * нет (например, у предмета, добавленного до появления урона в листе).
   */
  function getWeaponDamageStat(weapon: InventoryWeapon): ItemStat | null {
    const damage = getWeaponDamage(character.value, weapon);

    if (!damage) {
      return null;
    }

    const tooltipParts = [damage.diceNotation];

    if (damage.weaponBonus !== 0) {
      tooltipParts.push(`оружие ${getFormattedBonus(damage.weaponBonus)}`);
    }

    tooltipParts.push(getAbilityPart(damage.ability));

    const typePart = damage.typeLabel ? ` · ${damage.typeLabel}` : '';

    return {
      label: INVENTORY_STAT_LABELS.damage,
      value: damage.formula,
      tooltip: `${INVENTORY_STAT_LABELS.damage} = ${tooltipParts.join(' + ')}${typePart}`,
      accent: true,
      roll: getStatRoll('damage'),
    };
  }

  /** Плитки оружия: бонус атаки и урон — обе бросаются по нажатию. */
  function getWeaponStats(weapon: InventoryWeapon): ItemStat[] {
    const damageStat = getWeaponDamageStat(weapon);
    const attackStat = getWeaponAttackStat(weapon);

    return damageStat ? [attackStat, damageStat] : [attackStat];
  }

  /**
   * Плитки параметров предмета: боевой параметр (КД доспеха или атака и урон
   * оружия) по категории, стоимость и вес, если известны. У оружия с уроном
   * плитка урона занимает место цены — в бою она нужнее, а ряд не растёт.
   */
  const displayStats = computed<DecoratedStat[]>(() => {
    const stats: ItemStat[] = [];

    const { category, armor, weapon, cost, weight } = props.inventoryItem;

    if (category === 'ARMOR' && armor) {
      stats.push(getArmorStat(armor));
    } else if (category === 'WEAPON' && weapon) {
      stats.push(...getWeaponStats(weapon));
    }

    const hasDamageStat = stats.some((stat) => stat.roll?.kind === 'damage');

    if (cost && !hasDamageStat) {
      stats.push({ label: INVENTORY_STAT_LABELS.cost, value: cost });
    }

    if (weight > 0) {
      stats.push({ label: WEIGHT_UNIT_LABEL, value: String(weight) });
    }

    return stats.map(decorateStat);
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

  function handleStatRoll(rollKind: InventoryStatRollKind) {
    if (rollKind === 'attack') {
      emit('roll-attack');

      return;
    }

    emit('roll-damage');
  }
</script>

<template>
  <!-- Свой @container: строка перестраивается по ширине самой карточки, а не
    окна — лист бывает узким и на широком экране (дровер, правая панель) -->
  <div
    class="group/item @container flex flex-col rounded-lg border border-default/50 bg-elevated/20 transition-colors hover:border-warning/60"
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
            class="relative z-10 flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border transition-colors"
            :class="equipButtonClass"
            :aria-pressed="isEquipped"
            :aria-label="`${equipTooltip}: ${inventoryItem.name}`"
            @click.left.exact.prevent="emit('toggle-equip')"
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
              class="text-sm font-medium wrap-break-word text-highlighted @xl:truncate"
            >
              {{ inventoryItem.name }}
            </span>

            <UBadge
              v-if="isEquipped"
              color="warning"
              variant="subtle"
              size="sm"
              class="shrink-0"
            >
              Надет
            </UBadge>

            <UTooltip
              v-if="isCustom"
              text="Предмет добавлен вручную"
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
          <!-- Плитки атаки и урона оружия — кнопки: нажатие катит их формулу. -->
          <button
            v-if="stat.roll"
            type="button"
            class="transition-colors"
            :class="[STAT_LAYOUT_CLASSES, stat.containerClass]"
            :aria-label="stat.roll.ariaLabel"
            @click.left.exact.prevent="handleStatRoll(stat.roll.kind)"
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
        карточки — отделяет их от плиток параметров. Стрелка вне слоя z-10:
        нажатие на неё должно попадать в подложку названия и разворачивать
        карточку -->
      <div class="ml-auto flex shrink-0 items-center gap-1">
        <div class="relative z-10 flex items-center gap-1">
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

          <span class="w-6 text-center text-sm font-medium text-default">
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

          <UButton
            v-if="isCustom"
            icon="tabler:pencil"
            color="neutral"
            variant="ghost"
            size="xs"
            square
            :class="[ROW_ACTION_CLASSES, editControlClass]"
            :aria-label="`Редактировать предмет: ${inventoryItem.name}`"
            @click.left.exact.prevent="emit('edit')"
          />

          <UButton
            icon="tabler:trash"
            color="error"
            variant="ghost"
            size="xs"
            square
            :class="[ROW_ACTION_CLASSES, editControlClass]"
            :aria-label="`Убрать предмет: ${inventoryItem.name}`"
            @click.left.exact.prevent="emit('remove')"
          />
        </div>

        <UIcon
          v-if="isCustom"
          name="tabler:chevron-down"
          class="size-4 shrink-0 text-muted transition-transform"
          :class="chevronClass"
        />
      </div>
    </div>

    <div
      v-if="isExpanded"
      class="flex flex-col gap-2 border-t border-default/50 px-3 py-2"
    >
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
