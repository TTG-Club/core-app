<script setup lang="ts">
  import type { CharacterInventoryItem } from '../../model';

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
    SHEET_ITEM_SELL_LABELS,
  } from '../../model';

  const { inventoryItem } = defineProps<{
    inventoryItem: CharacterInventoryItem;
  }>();

  const emit = defineEmits<{
    /** Выручка в медных монетах; null — продажа отменена. */
    close: [salePrice: number | null];
  }>();

  const fullPrice = getInventoryItemSalePriceInCopper(inventoryItem) ?? 0;

  /** Цена продажи в золотых: по умолчанию полцены справочника. */
  const draftPriceInGold = ref<number | null>(
    getDefaultSalePriceInCopper(fullPrice) / CURRENCY_COPPER_RATES.gold,
  );

  const description = getInventorySellDescription(inventoryItem);

  const fullPriceLabel = `${SHEET_ITEM_SELL_LABELS.fullPricePrefix}: ${getCopperAmountLabel(fullPrice)}. ${SHEET_ITEM_SELL_LABELS.halfPriceHint}`;

  const priceFormatOptions: Intl.NumberFormatOptions = {
    maximumFractionDigits: INVENTORY_SALE_PRICE_FRACTION_DIGITS,
  };

  /** Цена из поля в медных; очищенное поле — продажа даром. */
  const salePriceInCopper = computed(() =>
    Math.round((draftPriceInGold.value ?? 0) * CURRENCY_COPPER_RATES.gold),
  );

  /** Продаёт предмет за указанную цену. */
  function handleConfirm() {
    emit('close', salePriceInCopper.value);
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
