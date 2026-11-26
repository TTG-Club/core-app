<script setup lang="ts">
  import type {
    BastionStable,
    MenagerieSizeCode,
    StableTrade,
    StableTradeMode,
  } from '../../model';

  import { fillTemplate } from '~bastions/model';

  import {
    CUSTOM_CREATURE_VALUE,
    formatStableSpace,
    getStableSalePrice,
    getStableSpace,
    MENAGERIE_SIZE_ITEMS,
    STABLE_DEFAULT_SIZE,
    STABLE_LABELS,
    STABLE_TRADE_MODE_ITEMS,
  } from '../../model';

  /**
   * Поля приказа «Торговать» конюшне: продать животное из конюшни или купить
   * новое. Покупка — из таблицы «Верховые и прочие животные», у мастера —
   * любое другое по указанной цене. Наружу отдаётся готовая сделка или
   * undefined, пока она не заполнена.
   */
  const trade = defineModel<StableTrade | undefined>({ required: true });

  const { stable, canManage = false } = defineProps<{
    stable: BastionStable;
    /** Мастер: может купить животное не из таблицы. */
    canManage?: boolean;
  }>();

  const mode = ref<StableTradeMode>('BUY');
  const kind = ref<string>();
  const sellId = ref<string>();
  const customName = ref('');
  const customSize = ref<MenagerieSizeCode>(STABLE_DEFAULT_SIZE);
  const customCost = ref<number>();

  const free = computed(() => stable.capacity - stable.occupied);

  const kindItems = computed(() => {
    const kinds = stable.kinds.map((stableKind) => ({
      label: fillTemplate(STABLE_LABELS.kindTerms, {
        name: stableKind.name,
        size: stableKind.size?.name.toLowerCase() ?? '',
        cost: stableKind.cost,
      }),
      value: stableKind.value,
      disabled: stableKind.space > free.value,
    }));

    // Животное не из таблицы покупается с согласия Мастера: приказ отдаёт он
    return canManage
      ? [
          ...kinds,
          {
            label: STABLE_LABELS.custom,
            value: CUSTOM_CREATURE_VALUE,
            disabled: false,
          },
        ]
      : kinds;
  });

  const sellItems = computed(() =>
    stable.animals.map((animal) => ({
      label: fillTemplate(STABLE_LABELS.sellItem, {
        name: animal.name,
        cost: animal.cost,
      }),
      value: animal.id,
    })),
  );

  const isCustom = computed(() => kind.value === CUSTOM_CREATURE_VALUE);

  const isCustomNoRoom = computed(
    () => isCustom.value && getStableSpace(customSize.value) > free.value,
  );

  const soldAnimal = computed(() =>
    stable.animals.find((animal) => animal.id === sellId.value),
  );

  const hintText = computed(() => {
    if (mode.value === 'SELL') {
      const animal = soldAnimal.value;

      if (!stable.animals.length) {
        return STABLE_LABELS.nothingToSell;
      }

      return animal
        ? fillTemplate(STABLE_LABELS.sellTerms, {
            price: getStableSalePrice(animal.cost, stable.saleBonusPercent),
            cost: animal.cost,
            bonus: stable.saleBonusPercent,
          })
        : '';
    }

    return isCustomNoRoom.value
      ? STABLE_LABELS.noRoom
      : fillTemplate(STABLE_LABELS.buyTerms, {
          free: formatStableSpace(Math.max(0, free.value)),
          capacity: formatStableSpace(stable.capacity),
        });
  });

  const hintClass = computed(() =>
    isCustomNoRoom.value || (mode.value === 'SELL' && !stable.animals.length)
      ? 'text-warning'
      : 'text-muted',
  );

  /** Сделка из полей; undefined — ещё не выбрана или не заполнена. */
  const request = computed<StableTrade | undefined>(() => {
    if (mode.value === 'SELL') {
      return sellId.value ? { sellAnimalId: sellId.value } : undefined;
    }

    if (!kind.value) {
      return undefined;
    }

    if (!isCustom.value) {
      return { kind: kind.value };
    }

    const name = customName.value.trim();

    return name && customCost.value != null && !isCustomNoRoom.value
      ? { name, size: customSize.value, cost: customCost.value }
      : undefined;
  });

  watch(
    request,
    (value) => {
      trade.value = value;
    },
    { immediate: true },
  );
</script>

<template>
  <div class="flex flex-col gap-4">
    <UFormField :label="STABLE_LABELS.mode">
      <URadioGroup
        v-model="mode"
        :items="STABLE_TRADE_MODE_ITEMS"
        orientation="horizontal"
      />
    </UFormField>

    <template v-if="mode === 'BUY'">
      <UFormField :label="STABLE_LABELS.kind">
        <USelectMenu
          id="bastion-order-stable-kind"
          v-model="kind"
          :items="kindItems"
          value-key="value"
          :placeholder="STABLE_LABELS.kindPlaceholder"
          class="w-full"
        />
      </UFormField>

      <div
        v-if="isCustom"
        class="grid gap-3 sm:grid-cols-3"
      >
        <UFormField :label="STABLE_LABELS.customName">
          <UInput
            id="bastion-order-stable-name"
            v-model="customName"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="STABLE_LABELS.customSize">
          <USelect
            v-model="customSize"
            :items="MENAGERIE_SIZE_ITEMS"
            value-key="value"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="STABLE_LABELS.customCost">
          <UInputNumber
            id="bastion-order-stable-cost"
            v-model="customCost"
            :min="0"
            class="w-full"
          />
        </UFormField>
      </div>
    </template>

    <UFormField
      v-else-if="stable.animals.length"
      :label="STABLE_LABELS.sellAnimal"
    >
      <USelect
        id="bastion-order-stable-sell"
        v-model="sellId"
        :items="sellItems"
        value-key="value"
        :placeholder="STABLE_LABELS.sellPlaceholder"
        class="w-full"
      />
    </UFormField>

    <p
      v-if="hintText"
      class="text-sm"
      :class="hintClass"
    >
      {{ hintText }}
    </p>
  </div>
</template>
