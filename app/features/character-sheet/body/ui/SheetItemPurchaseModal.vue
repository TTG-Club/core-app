<script setup lang="ts">
  import type {
    CurrencyKey,
    ItemCatalogItem,
    ItemPurchaseResult,
  } from '../../model';

  import { ACTION_LABELS } from '~/shared/consts';

  import { useCharacterSheet } from '../../composables';
  import {
    CURRENCY_LABELS,
    CURRENCY_NAMES,
    CURRENCY_ORDER,
    getCopperAmountLabel,
    getCurrencyInCopper,
    getPurchaseCostInCopper,
    parseItemCostInCopper,
    SHEET_ITEM_PURCHASE_LABELS,
    spendCurrency,
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
    isFree: boolean;
    costLabel: string;
  }

  const purchaseRows = computed<PurchaseRow[]>(() =>
    draftItems.value.map((catalogItem) => {
      const isFree = parseItemCostInCopper(catalogItem.cost) === null;

      return {
        ...catalogItem,
        isFree,
        costLabel: isFree ? SHEET_ITEM_PURCHASE_LABELS.free : catalogItem.cost,
      };
    }),
  );

  const hasFreeItems = computed(() =>
    purchaseRows.value.some((purchaseRow) => purchaseRow.isFree),
  );

  const costInCopper = computed(() =>
    getPurchaseCostInCopper(
      draftItems.value.map((catalogItem) => catalogItem.cost),
    ),
  );

  const costLabel = computed(() => getCopperAmountLabel(costInCopper.value));

  /** Кошелёк после оплаты; null — денег не хватает. */
  const currencyAfter = computed(() =>
    spendCurrency(character.value.currency, costInCopper.value),
  );

  const shortageLabel = computed(() => {
    const shortage =
      costInCopper.value - getCurrencyInCopper(character.value.currency);

    return `${SHEET_ITEM_PURCHASE_LABELS.shortagePrefix} ${getCopperAmountLabel(shortage)}. ${SHEET_ITEM_PURCHASE_LABELS.shortageHint}`;
  });

  interface WalletRow {
    key: CurrencyKey;
    label: string;
    name: string;
    before: number;
    after: number;
    afterClass: string;
  }

  /**
   * Цвет количества монеты после оплаты: убыль, прибавка сдачей или без
   * изменений.
   *
   * @param before количество до покупки.
   * @param after количество после покупки.
   * @returns классы цвета текста.
   */
  function getWalletAfterClass(before: number, after: number): string {
    if (after < before) {
      return 'text-error';
    }

    if (after > before) {
      return 'text-success';
    }

    return 'text-highlighted';
  }

  const walletRows = computed<WalletRow[]>(() =>
    CURRENCY_ORDER.map((key) => {
      const before = character.value.currency[key];
      const after = currencyAfter.value?.[key] ?? before;

      return {
        key,
        label: CURRENCY_LABELS[key],
        name: CURRENCY_NAMES[key],
        before,
        after,
        afterClass: getWalletAfterClass(before, after),
      };
    }),
  );

  /** Оплата идёт с разменом: какой-то монеты после покупки стало больше. */
  const hasChange = computed(() =>
    walletRows.value.some((walletRow) => walletRow.after > walletRow.before),
  );

  const isConfirmDisabled = computed(
    () => !draftItems.value.length || !currencyAfter.value,
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
    :ui="{ content: 'sm:max-w-lg' }"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <div class="flex max-h-72 flex-col gap-1 overflow-y-auto pr-1">
          <div
            v-for="purchaseRow in purchaseRows"
            :key="purchaseRow.url"
            class="flex items-center gap-2 rounded-md px-3 py-1.5 hover:bg-elevated/60"
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
            class="px-3 py-6 text-center text-sm text-dimmed"
          >
            {{ SHEET_ITEM_PURCHASE_LABELS.empty }}
          </span>
        </div>

        <div
          class="flex items-center justify-between gap-3 rounded-lg border border-default/50 bg-elevated/20 p-3"
        >
          <span class="text-sm text-muted">
            {{ SHEET_ITEM_PURCHASE_LABELS.total }}
          </span>

          <span class="text-sm font-semibold text-highlighted">
            {{ costLabel }}
          </span>
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-sm text-muted">
            {{ SHEET_ITEM_PURCHASE_LABELS.wallet }}
          </span>

          <div
            class="grid grid-cols-[auto_repeat(5,minmax(0,1fr))] gap-x-3 gap-y-1 rounded-lg border border-default/50 bg-elevated/20 p-3 text-sm"
          >
            <span />

            <UTooltip
              v-for="walletRow in walletRows"
              :key="`label-${walletRow.key}`"
              :text="walletRow.name"
            >
              <span class="text-center text-xs font-medium text-muted">
                {{ walletRow.label }}
              </span>
            </UTooltip>

            <span class="text-muted">
              {{ SHEET_ITEM_PURCHASE_LABELS.walletBefore }}
            </span>

            <span
              v-for="walletRow in walletRows"
              :key="`before-${walletRow.key}`"
              class="text-center text-highlighted tabular-nums"
            >
              {{ walletRow.before }}
            </span>

            <template v-if="currencyAfter">
              <span class="text-muted">
                {{ SHEET_ITEM_PURCHASE_LABELS.walletAfter }}
              </span>

              <span
                v-for="walletRow in walletRows"
                :key="`after-${walletRow.key}`"
                class="text-center font-semibold tabular-nums"
                :class="walletRow.afterClass"
              >
                {{ walletRow.after }}
              </span>
            </template>
          </div>
        </div>

        <UAlert
          v-if="!currencyAfter"
          icon="tabler:coin-off"
          color="error"
          variant="subtle"
          :title="SHEET_ITEM_PURCHASE_LABELS.shortageTitle"
          :description="shortageLabel"
        />

        <p
          v-if="hasChange"
          class="text-xs text-muted"
        >
          {{ SHEET_ITEM_PURCHASE_LABELS.changeHint }}
        </p>

        <p
          v-if="hasFreeItems"
          class="text-xs text-muted"
        >
          {{ SHEET_ITEM_PURCHASE_LABELS.freeHint }}
        </p>
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
