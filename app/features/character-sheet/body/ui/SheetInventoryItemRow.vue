<script setup lang="ts">
  import type {
    CharacterInventoryItem,
    InventoryArmor,
    InventoryWeapon,
  } from '../../model';

  import { useCharacterSheet } from '../../composables';
  import {
    ABILITY_LABELS,
    ARMOR_DEXTERITY_HINT_LABELS,
    getFormattedBonus,
    getProficiencyBonus,
    getWeaponAttackBonus,
    INVENTORY_CATEGORY_ICONS,
    WEIGHT_UNIT_LABEL,
  } from '../../model';

  /** Плитка параметра предмета: короткая подпись, значение и опции показа. */
  interface ItemStat {
    label: string;
    value: string;

    /** Полная расшифровка по наведению (например, правило КД доспеха). */
    tooltip?: string;

    /** Акцентная (тёплая) заливка — для боевого параметра (КД/атака). */
    accent?: boolean;
  }

  /** Плитка параметра с разрешёнными классами оформления. */
  interface DecoratedStat {
    label: string;
    value: string;
    tooltip: string;
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

  /**
   * Дополняет плитку классами оформления по признаку акцента (логика вынесена
   * из шаблона).
   *
   * @param stat исходная плитка параметра.
   * @returns плитка с разрешёнными классами.
   */
  function decorateStat(stat: ItemStat): DecoratedStat {
    const classes = stat.accent ? ACCENT_STAT_CLASSES : PLAIN_STAT_CLASSES;

    return {
      label: stat.label,
      value: stat.value,
      tooltip: stat.tooltip ?? '',
      containerClass: classes.container,
      valueClass: classes.value,
      labelClass: classes.label,
    };
  }

  const props = defineProps<{
    inventoryItem: CharacterInventoryItem;
  }>();

  const emit = defineEmits<{
    'preview': [];
    'remove': [];
    'adjust': [delta: number];
    'toggle-equip': [];
  }>();

  // Бонус атаки зависит от характеристик/уровня персонажа — читаем общее
  // состояние листа через composable (как модалки).
  const { character } = useCharacterSheet();

  const categoryIcon = computed(
    () => INVENTORY_CATEGORY_ICONS[props.inventoryItem.category],
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
        label: 'КД',
        value: `+${armor.baseArmorClass}`,
        tooltip: `Щит: +${armor.baseArmorClass} к классу доспеха`,
        accent: true,
      };
    }

    return {
      label: 'КД',
      value: String(armor.baseArmorClass),
      tooltip: `Класс доспеха ${armor.baseArmorClass}${ARMOR_DEXTERITY_HINT_LABELS[armor.dexterityMod]}`,
      accent: true,
    };
  }

  /** Плитка бонуса атаки оружием: бонус мастерства плюс модификатор стата. */
  function getWeaponStat(weapon: InventoryWeapon): ItemStat {
    const attack = getWeaponAttackBonus(character.value, weapon);

    const masteryPart = `мастерство ${getFormattedBonus(
      getProficiencyBonus(character.value.level),
    )}`;

    const abilityPart = `${ABILITY_LABELS[attack.ability]} ${getFormattedModifier(
      character.value.abilities[attack.ability],
    )}`;

    return {
      label: 'Атака',
      value: getFormattedBonus(attack.value),
      tooltip: `Бонус атаки = ${masteryPart} + ${abilityPart}`,
      accent: true,
    };
  }

  /**
   * Плитки параметров предмета: боевой параметр (КД доспеха или бонус атаки
   * оружия) по категории, стоимость и вес, если известны.
   */
  const displayStats = computed<DecoratedStat[]>(() => {
    const stats: ItemStat[] = [];

    const { category, armor, weapon, cost, weight } = props.inventoryItem;

    if (category === 'ARMOR' && armor) {
      stats.push(getArmorStat(armor));
    } else if (category === 'WEAPON' && weapon) {
      stats.push(getWeaponStat(weapon));
    }

    if (cost) {
      stats.push({ label: 'Цена', value: cost });
    }

    if (weight > 0) {
      stats.push({ label: WEIGHT_UNIT_LABEL, value: String(weight) });
    }

    return stats.map(decorateStat);
  });

  const isDecreaseDisabled = computed(() => props.inventoryItem.quantity <= 1);

  function handleDecrease() {
    emit('adjust', -1);
  }

  function handleIncrease() {
    emit('adjust', 1);
  }
</script>

<template>
  <div
    class="group/item relative flex items-center gap-3 rounded-lg border border-default/50 bg-elevated/20 p-3 transition-colors hover:border-warning/60"
    :class="rowClass"
  >
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
      :aria-label="`Открыть предмет: ${inventoryItem.name}`"
      @click.left.exact.prevent="emit('preview')"
    >
      <span class="flex min-w-0 items-center gap-2">
        <span class="truncate text-sm font-medium text-highlighted">
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
      </span>

      <span
        v-if="inventoryItem.typesLabel"
        class="truncate text-xs text-dimmed"
      >
        {{ inventoryItem.typesLabel }}
      </span>
    </button>

    <div class="flex shrink-0 items-center gap-1.5">
      <UTooltip
        v-for="stat in displayStats"
        :key="stat.label"
        :text="stat.tooltip"
        :disabled="!stat.tooltip"
      >
        <div
          class="flex flex-col items-center rounded border px-2 py-0.5"
          :class="stat.containerClass"
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

    <div class="relative z-10 flex shrink-0 items-center gap-1">
      <UButton
        icon="tabler:minus"
        color="neutral"
        variant="ghost"
        size="xs"
        square
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
        :aria-label="`Увеличить количество: ${inventoryItem.name}`"
        @click.left.exact.prevent="handleIncrease"
      />
    </div>

    <UButton
      icon="tabler:trash"
      color="error"
      variant="ghost"
      size="xs"
      square
      class="relative z-10 shrink-0 opacity-0 transition-opacity group-hover/item:opacity-100 focus-visible:opacity-100"
      :aria-label="`Убрать предмет: ${inventoryItem.name}`"
      @click.left.exact.prevent="emit('remove')"
    />
  </div>
</template>
