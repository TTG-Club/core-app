<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

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
    CUSTOM_INVENTORY_BADGE_HINT,
    getCharacterProficiencyBonus,
    getFormattedBonus,
    getInventoryItemMenuItems,
    getWeaponAttackBonus,
    getWeaponDamage,
    INVENTORY_CATEGORY_ICONS,
    INVENTORY_EQUIP_ACTION_LABELS,
    INVENTORY_MISSING_BADGE_HINT,
    INVENTORY_MISSING_BADGE_LABEL,
    INVENTORY_QUANTITY_MIN,
    INVENTORY_ROLL_KIND_LABELS,
    INVENTORY_STAT_LABELS,
    INVENTORY_TWO_HANDED_BADGE_HINT,
    INVENTORY_TWO_HANDED_BADGE_LABEL,
    isCustomInventoryItem,
    isMissingInventoryItem,
    isVersatileInventoryItem,
    SHEET_ROLL_HINT_LABEL,
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
   * Дополняет плитку классами оформления по признаку акцента и броска (логика
   * вынесена из шаблона).
   *
   * @param stat исходная плитка параметра.
   * @param rollable броски разрешены; false — плитка остаётся справочной
   *   (предмета не осталось, катить им нечего).
   * @returns плитка с разрешёнными классами.
   */
  function decorateStat(stat: ItemStat, rollable: boolean): DecoratedStat {
    const classes = stat.accent ? ACCENT_STAT_CLASSES : PLAIN_STAT_CLASSES;
    const tooltip = stat.tooltip ?? '';
    const roll = rollable ? (stat.roll ?? null) : null;

    return {
      label: stat.label,
      value: stat.value,
      tooltip: roll ? `${tooltip} · ${SHEET_ROLL_HINT_LABEL}` : tooltip,
      roll,
      containerClass: roll
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
      onEdit: isCustom.value ? () => emit('edit') : undefined,
      onCopy: isCustom.value ? undefined : () => emit('copy'),
      onRemove: () => emit('remove'),
    }),
  );

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

  // Экипировать можно только доспехи (оружие — нет). Иконку доспеха с данными
  // о КД можно нажать, чтобы надеть/снять. Смотрим на параметры, а не на группу:
  // свой магический доспех лежит среди магических предметов.
  const isEquippable = computed(() => props.inventoryItem.armor !== null);

  const isEquipped = computed(
    () => isEquippable.value && props.inventoryItem.equipped,
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

  const equipIcon = computed(() =>
    isEquipped.value ? 'tabler:shield-check' : 'tabler:shield',
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
      getCharacterProficiencyBonus(character.value),
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
    const damage = getWeaponDamage(character.value, weapon, isTwoHanded.value);

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
   * оружия) по самим параметрам, стоимость и вес, если известны. У оружия
   * плитка урона занимает место цены — в бою она нужнее, а ряд не растёт.
   */
  const displayStats = computed<DecoratedStat[]>(() => {
    const stats: ItemStat[] = [];

    const { armor, weapon, cost, weight } = props.inventoryItem;

    if (armor) {
      stats.push(getArmorStat(armor));
    } else if (weapon) {
      stats.push(...getWeaponStats(weapon));
    }

    const hasDamageStat = stats.some((stat) => stat.roll?.kind === 'damage');

    if (cost && !hasDamageStat) {
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
