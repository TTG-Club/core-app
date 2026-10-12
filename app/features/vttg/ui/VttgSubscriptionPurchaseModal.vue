<script setup lang="ts">
  import { PUBLIC_OFFER_ROUTE } from '~infrastructure/public-offer/model';

  import { useSubscriptionPayment } from '../composables';
  import {
    formatSubscriptionMonths,
    getSubscriptionPaymentTotal,
    SUBSCRIPTION_PAYMENT_MONTHS,
    VTTG_SUBSCRIPTION_PRICE,
    VTTG_SUBSCRIPTION_PURCHASE_PERKS,
    VTTG_SUBSCRIPTION_PURCHASE_TEXT,
  } from '../model';

  const emit = defineEmits<{
    close: [];
  }>();

  const { isPending, startPayment } = useSubscriptionPayment();

  const months = ref<number>(SUBSCRIPTION_PAYMENT_MONTHS.default);

  const total = computed(
    () =>
      `${getSubscriptionPaymentTotal(months.value)} ${VTTG_SUBSCRIPTION_PRICE.currency}`,
  );

  const totalCaption = computed(
    () => `${total.value} за ${formatSubscriptionMonths(months.value)}`,
  );

  const payLabel = computed(
    () => `${VTTG_SUBSCRIPTION_PURCHASE_TEXT.payLabel} ${total.value}`,
  );

  const monthPrice = `${VTTG_SUBSCRIPTION_PRICE.amount} ${VTTG_SUBSCRIPTION_PRICE.currency} ${VTTG_SUBSCRIPTION_PRICE.cycle}`;

  /** Возвращает цвет быстрой кнопки срока: выбранная подсвечена. */
  function getPresetVariant(preset: number) {
    return preset === months.value ? 'solid' : 'outline';
  }

  /** Выбирает срок быстрой кнопкой. */
  function handlePresetClick(preset: number) {
    months.value = preset;
  }

  /** Закрывает окно без оплаты. */
  function handleCancel() {
    emit('close');
  }

  /** Создаёт платёж за выбранный срок и уводит на форму оплаты. */
  function handlePayClick() {
    startPayment(months.value);
  }
</script>

<template>
  <UModal
    :title="VTTG_SUBSCRIPTION_PURCHASE_TEXT.title"
    :description="monthPrice"
    :dismissible="!isPending"
  >
    <template #body>
      <div class="flex flex-col gap-5">
        <p class="text-sm leading-relaxed text-toned">
          {{ VTTG_SUBSCRIPTION_PURCHASE_TEXT.description }}
        </p>

        <div class="flex flex-col gap-2">
          <p class="text-sm font-semibold text-highlighted">
            {{ VTTG_SUBSCRIPTION_PURCHASE_TEXT.perksTitle }}
          </p>

          <ul class="flex flex-col gap-2">
            <li
              v-for="perk in VTTG_SUBSCRIPTION_PURCHASE_PERKS"
              :key="perk.text"
              class="flex items-center gap-2.5 text-sm text-toned"
            >
              <UIcon
                :name="perk.icon"
                class="size-5 shrink-0 text-primary"
                aria-hidden="true"
              />

              {{ perk.text }}
            </li>
          </ul>
        </div>

        <USeparator />

        <UFormField
          :label="VTTG_SUBSCRIPTION_PURCHASE_TEXT.monthsLabel"
          :hint="VTTG_SUBSCRIPTION_PURCHASE_TEXT.monthsHint"
        >
          <div class="flex flex-col gap-3">
            <div class="flex flex-wrap gap-2">
              <UButton
                v-for="preset in SUBSCRIPTION_PAYMENT_MONTHS.presets"
                :key="preset"
                :label="formatSubscriptionMonths(preset)"
                :variant="getPresetVariant(preset)"
                :disabled="isPending"
                color="primary"
                size="sm"
                @click.left.exact.prevent="handlePresetClick(preset)"
              />
            </div>

            <UInputNumber
              v-model="months"
              :min="SUBSCRIPTION_PAYMENT_MONTHS.min"
              :disabled="isPending"
              class="w-40"
            />
          </div>
        </UFormField>

        <div
          class="flex items-baseline justify-between gap-3 rounded-lg border border-default bg-elevated/40 p-3"
        >
          <span class="text-sm text-muted">
            {{ VTTG_SUBSCRIPTION_PURCHASE_TEXT.totalLabel }}
          </span>

          <span class="text-lg font-bold text-highlighted">
            {{ totalCaption }}
          </span>
        </div>

        <div class="flex flex-col gap-1.5 text-xs leading-relaxed text-muted">
          <p>{{ VTTG_SUBSCRIPTION_PURCHASE_TEXT.extendHint }}</p>

          <p>{{ VTTG_SUBSCRIPTION_PURCHASE_TEXT.noRenewal }}</p>

          <p>
            {{ VTTG_SUBSCRIPTION_PURCHASE_TEXT.offerNote }}

            <ULink
              :to="PUBLIC_OFFER_ROUTE"
              target="_blank"
              class="text-primary"
            >
              {{ VTTG_SUBSCRIPTION_PURCHASE_TEXT.offerLink }}</ULink
            >. {{ VTTG_SUBSCRIPTION_PURCHASE_TEXT.refundNote }}
          </p>

          <p class="text-warning">
            {{ VTTG_SUBSCRIPTION_PURCHASE_TEXT.adminOnly }}
          </p>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full flex-wrap justify-end gap-2">
        <UButton
          :label="VTTG_SUBSCRIPTION_PURCHASE_TEXT.cancelLabel"
          :disabled="isPending"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleCancel"
        />

        <UButton
          :label="payLabel"
          :loading="isPending"
          icon="tabler:credit-card"
          color="primary"
          @click.left.exact.prevent="handlePayClick"
        />
      </div>
    </template>
  </UModal>
</template>
