<script setup lang="ts">
  import type { ItemPurchaseLine, ItemPurchaseResult } from '../../model';

  import { clamp } from 'es-toolkit';

  import { ACTION_LABELS } from '~/shared/consts';

  import { useCharacterSheet } from '../../composables';
  import {
    getCopperAmountLabel,
    getCurrencyInCopper,
    getPurchaseCostInCopper,
    INVENTORY_QUANTITY_MAX,
    parseItemCostInCopper,
    PURCHASE_QUANTITY_MIN,
    SHEET_ITEM_PURCHASE_LABELS,
  } from '../../model';

  const { items } = defineProps<{
    items: ItemPurchaseLine[];
  }>();

  const emit = defineEmits<{
    close: [result: ItemPurchaseResult];
  }>();

  const { character } = useCharacterSheet();

  /**
   * Черновик списка покупки: в нём меняют количество и убирают предметы до
   * оплаты.
   */
  const draftItems = ref<ItemPurchaseLine[]>([...items]);

  interface PurchaseRow extends ItemPurchaseLine {
    costLabel: string;
  }

  /**
   * Подпись стоимости позиции: цена штуки на количество; без цены —
   * «Бесплатно».
   *
   * @param purchaseLine позиция покупки.
   * @returns подпись стоимости.
   */
  function getPurchaseLineCostLabel(purchaseLine: ItemPurchaseLine): string {
    const unitPrice = parseItemCostInCopper(purchaseLine.cost);

    return unitPrice === null
      ? SHEET_ITEM_PURCHASE_LABELS.free
      : getCopperAmountLabel(unitPrice * purchaseLine.quantity);
  }

  const purchaseRows = computed<PurchaseRow[]>(() =>
    draftItems.value.map((purchaseLine) => ({
      ...purchaseLine,
      costLabel: getPurchaseLineCostLabel(purchaseLine),
    })),
  );

  const walletInCopper = computed(() =>
    getCurrencyInCopper(character.value.currency),
  );

  const costInCopper = computed(() =>
    getPurchaseCostInCopper(draftItems.value),
  );

  /** Остаток после оплаты; отрицательный — денег не хватает. */
  const balanceInCopper = computed(
    () => walletInCopper.value - costInCopper.value,
  );

  const isShortage = computed(() => balanceInCopper.value < 0);

  const shortageLabel = computed(() =>
    getCopperAmountLabel(Math.abs(balanceInCopper.value)),
  );

  const shortageTitle = computed(
    () => `${SHEET_ITEM_PURCHASE_LABELS.shortageTitle}: ${shortageLabel.value}`,
  );

  interface SummaryTile {
    key: 'wallet' | 'cost' | 'balance';
    label: string;
    value: string;
    valueClass: string;
  }

  /** Плитки сводки: сколько есть, сколько уйдёт и что останется (или нехватка). */
  const summaryTiles = computed<SummaryTile[]>(() => [
    {
      key: 'wallet',
      label: SHEET_ITEM_PURCHASE_LABELS.wallet,
      value: getCopperAmountLabel(walletInCopper.value),
      valueClass: 'text-highlighted',
    },
    {
      key: 'cost',
      label: SHEET_ITEM_PURCHASE_LABELS.cost,
      value: getCopperAmountLabel(costInCopper.value),
      valueClass: 'text-highlighted',
    },
    isShortage.value
      ? {
          key: 'balance',
          label: SHEET_ITEM_PURCHASE_LABELS.shortage,
          value: shortageLabel.value,
          valueClass: 'text-error',
        }
      : {
          key: 'balance',
          label: SHEET_ITEM_PURCHASE_LABELS.remaining,
          value: getCopperAmountLabel(balanceInCopper.value),
          valueClass: 'text-success',
        },
  ]);

  const isConfirmDisabled = computed(
    () => !draftItems.value.length || isShortage.value,
  );

  /**
   * Убирает предмет из списка покупки.
   *
   * @param itemUrl url убираемого предмета.
   */
  function handleRemove(itemUrl: string) {
    draftItems.value = draftItems.value.filter(
      (purchaseLine) => purchaseLine.url !== itemUrl,
    );
  }

  /**
   * Меняет количество позиции в допустимом диапазоне. Очищенное поле оставляет
   * одну штуку: убирают предмет крестиком, а не нулём.
   *
   * @param itemUrl url предмета позиции.
   * @param quantity новое количество из поля.
   */
  function handleQuantityChange(itemUrl: string, quantity: number | null) {
    const nextQuantity = clamp(
      Math.trunc(quantity ?? PURCHASE_QUANTITY_MIN),
      PURCHASE_QUANTITY_MIN,
      INVENTORY_QUANTITY_MAX,
    );

    draftItems.value = draftItems.value.map((purchaseLine) =>
      purchaseLine.url === itemUrl
        ? { ...purchaseLine, quantity: nextQuantity }
        : purchaseLine,
    );
  }

  /** Подтверждает покупку оставшихся в списке предметов. */
  function handleConfirm() {
    if (isConfirmDisabled.value) {
      return;
    }

    emit('close', { confirmed: true, items: draftItems.value });
  }

  /** Закрывает окно без покупки, сохраняя правки списка. */
  function handleCancel() {
    emit('close', { confirmed: false, items: draftItems.value });
  }
</script>

<template>
  <UModal
    :title="SHEET_ITEM_PURCHASE_LABELS.title"
    :ui="{ content: 'sm:max-w-md' }"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <div class="grid grid-cols-3 gap-2">
          <div
            v-for="summaryTile in summaryTiles"
            :key="summaryTile.key"
            class="flex min-w-0 flex-col gap-1 rounded-lg border border-default/50 bg-elevated/20 p-3"
          >
            <span
              class="truncate text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              {{ summaryTile.label }}
            </span>

            <span
              class="truncate text-sm font-semibold tabular-nums"
              :class="summaryTile.valueClass"
            >
              {{ summaryTile.value }}
            </span>
          </div>
        </div>

        <UAlert
          v-if="isShortage"
          icon="tabler:alert-triangle"
          color="error"
          variant="subtle"
          :title="shortageTitle"
          :description="SHEET_ITEM_PURCHASE_LABELS.shortageHint"
        />

        <div class="flex flex-col gap-1">
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ SHEET_ITEM_PURCHASE_LABELS.purchases }}
          </span>

          <div
            class="flex max-h-72 flex-col divide-y divide-default/50 overflow-y-auto"
          >
            <div
              v-for="purchaseRow in purchaseRows"
              :key="purchaseRow.url"
              class="flex items-center gap-2 py-2"
            >
              <span
                class="min-w-0 grow truncate text-sm font-medium text-highlighted"
              >
                {{ purchaseRow.name }}
              </span>

              <UInputNumber
                :model-value="purchaseRow.quantity"
                :min="PURCHASE_QUANTITY_MIN"
                :max="INVENTORY_QUANTITY_MAX"
                size="xs"
                class="w-24 shrink-0"
                :aria-label="`${SHEET_ITEM_PURCHASE_LABELS.quantityAria}: ${purchaseRow.name}`"
                @update:model-value="
                  handleQuantityChange(purchaseRow.url, $event)
                "
              />

              <span class="min-w-14 shrink-0 text-right text-xs text-muted">
                {{ purchaseRow.costLabel }}
              </span>

              <UTooltip :text="SHEET_ITEM_PURCHASE_LABELS.remove">
                <UButton
                  icon="tabler:x"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  square
                  :aria-label="`${SHEET_ITEM_PURCHASE_LABELS.remove}: ${purchaseRow.name}`"
                  @click.left.exact.prevent="handleRemove(purchaseRow.url)"
                />
              </UTooltip>
            </div>

            <span
              v-if="!purchaseRows.length"
              class="py-6 text-center text-sm text-dimmed"
            >
              {{ SHEET_ITEM_PURCHASE_LABELS.empty }}
            </span>
          </div>
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
          :label="SHEET_ITEM_PURCHASE_LABELS.confirm"
          icon="tabler:coins"
          color="primary"
          :disabled="isConfirmDisabled"
          @click.left.exact.prevent="handleConfirm"
        />
      </div>
    </template>
  </UModal>
</template>
