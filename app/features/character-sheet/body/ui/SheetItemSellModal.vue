<script setup lang="ts">
  import type { CharacterInventoryItem, InventoryItemSale } from '../../model';

  import { clamp } from 'es-toolkit';

  import { ACTION_LABELS } from '~/shared/consts';

  import {
    CURRENCY_AMOUNT_MIN,
    CURRENCY_COPPER_RATES,
    getCopperAmountLabel,
    getDefaultSalePriceInCopper,
    getInventoryItemSalePriceInCopper,
    getInventorySellDescription,
    INVENTORY_SALE_PRICE_FRACTION_DIGITS,
    INVENTORY_SALE_PRICE_STEP,
    INVENTORY_SALE_QUANTITY_MIN,
    isInventoryItemStack,
    SHEET_ITEM_SELL_LABELS,
  } from '../../model';

  const { inventoryItem } = defineProps<{
    inventoryItem: CharacterInventoryItem;
  }>();

  const emit = defineEmits<{
    /** Сколько продано и за сколько; null — продажа отменена. */
    close: [sale: InventoryItemSale | null];
  }>();

  const isStack = isInventoryItemStack(inventoryItem);

  /** Сколько штук продаётся; по умолчанию одна — продать лишнее легко случайно. */
  const draftQuantity = ref<number | null>(INVENTORY_SALE_QUANTITY_MIN);

  /** Количество из поля в пределах стопки; очищенное поле — одна штука. */
  const saleQuantity = computed(() =>
    clamp(
      Math.round(draftQuantity.value ?? INVENTORY_SALE_QUANTITY_MIN),
      INVENTORY_SALE_QUANTITY_MIN,
      inventoryItem.quantity,
    ),
  );

  /** Цена справочника за продаваемые штуки, в медных. */
  const fullPrice = computed(
    () =>
      getInventoryItemSalePriceInCopper(inventoryItem, saleQuantity.value) ?? 0,
  );

  /** Полцены справочника за продаваемые штуки, в золотых. */
  function getDefaultPriceInGold(): number {
    return (
      getDefaultSalePriceInCopper(fullPrice.value) / CURRENCY_COPPER_RATES.gold
    );
  }

  /** Цена продажи в золотых: по умолчанию полцены справочника. */
  const draftPriceInGold = ref<number | null>(getDefaultPriceInGold());

  // Другое количество — другая цена справочника: подставляем её полцены
  // заново, иначе за две штуки осталась бы цена одной.
  watch(saleQuantity, () => {
    draftPriceInGold.value = getDefaultPriceInGold();
  });

  const description = computed(() =>
    getInventorySellDescription(inventoryItem, saleQuantity.value),
  );

  const fullPriceLabel = computed(
    () =>
      `${SHEET_ITEM_SELL_LABELS.fullPricePrefix}: ${getCopperAmountLabel(fullPrice.value)}. ${SHEET_ITEM_SELL_LABELS.halfPriceHint}`,
  );

  const priceFormatOptions: Intl.NumberFormatOptions = {
    maximumFractionDigits: INVENTORY_SALE_PRICE_FRACTION_DIGITS,
  };

  /** Цена из поля в медных; очищенное поле — продажа даром. */
  const salePriceInCopper = computed(() =>
    Math.round((draftPriceInGold.value ?? 0) * CURRENCY_COPPER_RATES.gold),
  );

  /** Продаёт выбранное количество за указанную цену. */
  function handleConfirm() {
    emit('close', {
      quantity: saleQuantity.value,
      salePrice: salePriceInCopper.value,
    });
  }

  /** Закрывает окно без продажи. */
  function handleCancel() {
    emit('close', null);
  }
</script>

<template>
  <UModal
    :title="SHEET_ITEM_SELL_LABELS.title"
    :description="description"
    :ui="{ content: 'sm:max-w-md' }"
  >
    <template #body>
      <div class="flex flex-col gap-3">
        <div
          v-if="isStack"
          class="flex items-center justify-between gap-4"
        >
          <span class="text-sm text-toned">
            {{ SHEET_ITEM_SELL_LABELS.quantity }}
          </span>

          <UInputNumber
            v-model="draftQuantity"
            :min="INVENTORY_SALE_QUANTITY_MIN"
            :max="inventoryItem.quantity"
            class="w-40"
          />
        </div>

        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between gap-4">
            <span class="text-sm text-toned">
              {{ SHEET_ITEM_SELL_LABELS.price }}
            </span>

            <UInputNumber
              v-model="draftPriceInGold"
              :min="CURRENCY_AMOUNT_MIN"
              :step="INVENTORY_SALE_PRICE_STEP"
              :format-options="priceFormatOptions"
              class="w-40"
            />
          </div>

          <span class="text-xs text-muted">{{ fullPriceLabel }}</span>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="ACTION_LABELS.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleCancel"
        />

        <UButton
          :label="SHEET_ITEM_SELL_LABELS.confirm"
          icon="tabler:coins"
          color="primary"
          @click.left.exact.prevent="handleConfirm"
        />
      </div>
    </template>
  </UModal>
</template>
