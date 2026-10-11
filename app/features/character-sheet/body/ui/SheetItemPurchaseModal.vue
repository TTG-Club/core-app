<script setup lang="ts">
  import type { ItemCatalogItem, ItemPurchaseResult } from '../../model';

  import { ACTION_LABELS } from '~/shared/consts';

  import { useCharacterSheet } from '../../composables';
  import {
    getCopperAmountLabel,
    getCurrencyInCopper,
    getPurchaseCostInCopper,
    parseItemCostInCopper,
    SHEET_ITEM_PURCHASE_LABELS,
  } from '../../model';

  const { items } = defineProps<{
    items: ItemCatalogItem[];
  }>();

  const emit = defineEmits<{
    close: [result: ItemPurchaseResult];
  }>();

  const { character } = useCharacterSheet();

  /** Черновик списка покупки: из него можно убрать предметы до оплаты. */
  const draftItems = ref<ItemCatalogItem[]>([...items]);

  interface PurchaseRow extends ItemCatalogItem {
    costLabel: string;
  }

  const purchaseRows = computed<PurchaseRow[]>(() =>
    draftItems.value.map((catalogItem) => ({
      ...catalogItem,
      costLabel:
        parseItemCostInCopper(catalogItem.cost) === null
          ? SHEET_ITEM_PURCHASE_LABELS.free
          : catalogItem.cost,
    })),
  );

  const walletInCopper = computed(() =>
    getCurrencyInCopper(character.value.currency),
  );

  const costInCopper = computed(() =>
    getPurchaseCostInCopper(
      draftItems.value.map((catalogItem) => catalogItem.cost),
    ),
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
      (catalogItem) => catalogItem.url !== itemUrl,
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

              <span class="shrink-0 text-xs text-muted">
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
