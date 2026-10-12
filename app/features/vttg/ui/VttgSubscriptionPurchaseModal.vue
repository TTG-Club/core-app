<script setup lang="ts">
  import type { SubscriptionPaymentTerms } from '../model';

  import { PRIVACY_POLICY_ROUTE } from '~infrastructure/privacy-policy/model';
  import { PUBLIC_OFFER_ROUTE } from '~infrastructure/public-offer/model';

  import { useSubscriptionPayment } from '../composables';
  import {
    formatSubscriptionDiscountHint,
    formatSubscriptionPreset,
    formatSubscriptionPrice,
    formatSubscriptionTotal,
    getSubscriptionDiscountPercent,
    getSubscriptionFullPrice,
    getSubscriptionPaymentTotal,
    getSubscriptionSaving,
    SUBSCRIPTION_EMAIL_VERIFICATION_ACTIONS,
    SUBSCRIPTION_PAYMENT_MONTHS,
    SUBSCRIPTION_PURCHASE_ICONS,
    subscriptionReceiptEmailSchema,
    VTTG_SUBSCRIPTION_PRICE,
    VTTG_SUBSCRIPTION_PURCHASE_TEXT,
  } from '../model';

  const { terms } = defineProps<{
    /** Условия оплаты: кнопка загружает их до открытия окна, чтобы цена не мигала. */
    terms: SubscriptionPaymentTerms;
  }>();

  const emit = defineEmits<{
    close: [];
  }>();

  const { isPending, startPayment } = useSubscriptionPayment();

  const { user } = useUser();

  const months = ref<number>(SUBSCRIPTION_PAYMENT_MONTHS.default);

  const email = ref<string>(user.value?.email ?? '');

  const offerAccepted = ref(false);

  const personalDataConsent = ref(false);

  const isEmailVerified = computed(() => user.value?.emailVerified !== false);

  /** Согласий у аккаунта нет — их просят отметить прямо в окне оплаты. */
  const needsConsents = computed(() => user.value?.consentsAccepted === false);

  const isConsentsGiven = computed(
    () =>
      !needsConsents.value
      || (offerAccepted.value && personalDataConsent.value),
  );

  const isEmailValid = computed(
    () => subscriptionReceiptEmailSchema.safeParse(email.value.trim()).success,
  );

  const emailError = computed(() =>
    email.value && !isEmailValid.value
      ? VTTG_SUBSCRIPTION_PURCHASE_TEXT.emailInvalid
      : undefined,
  );

  const maxMonths = computed(() => terms.maxMonths ?? undefined);

  const isPayDisabled = computed(
    () =>
      isPending.value
      || !isEmailVerified.value
      || !isEmailValid.value
      || !isConsentsGiven.value,
  );

  /** Итоговая сумма за выбранный срок со скидкой. */
  const total = computed(() =>
    getSubscriptionPaymentTotal(terms.monthPrice, months.value, terms),
  );

  const discountPercent = computed(() =>
    getSubscriptionDiscountPercent(terms, months.value),
  );

  /**
   * Цена без скидки и экономия. Строка под суммой есть всегда («Без скидки»,
   * если скидки нет), чтобы блок не менял высоту при смене срока.
   */
  const discountCaption = computed(() => {
    if (!discountPercent.value) {
      return undefined;
    }

    const full = getSubscriptionFullPrice(terms.monthPrice, months.value);

    const saving = getSubscriptionSaving(terms.monthPrice, months.value, terms);

    return {
      full: formatSubscriptionPrice(full),
      saving: `${VTTG_SUBSCRIPTION_PURCHASE_TEXT.savingLabel} ${formatSubscriptionPrice(saving)} (−${discountPercent.value}%)`,
    };
  });

  /**
   * Варианты срока: подпись, цена, скидка и выгода. У всех карточек одинаковый
   * набор строк, чтобы сетка не прыгала.
   */
  const presetOptions = computed(() =>
    SUBSCRIPTION_PAYMENT_MONTHS.presets.map((preset) => {
      const percent = getSubscriptionDiscountPercent(terms, preset);

      return {
        months: preset,
        label: formatSubscriptionPreset(preset),
        price: formatSubscriptionPrice(
          getSubscriptionPaymentTotal(terms.monthPrice, preset, terms),
        ),
        percent: percent ? `−${percent}%` : undefined,
        saving: percent
          ? `${VTTG_SUBSCRIPTION_PURCHASE_TEXT.savingShort} ${formatSubscriptionPrice(getSubscriptionSaving(terms.monthPrice, preset, terms))}`
          : VTTG_SUBSCRIPTION_PURCHASE_TEXT.noDiscount,
      };
    }),
  );

  const monthsHint = computed(() =>
    terms.discounts.length
      ? `${VTTG_SUBSCRIPTION_PURCHASE_TEXT.monthsHint} ${formatSubscriptionDiscountHint(terms.discounts)}`
      : VTTG_SUBSCRIPTION_PURCHASE_TEXT.monthsHint,
  );

  const totalCaption = computed(() =>
    formatSubscriptionTotal(total.value, months.value),
  );

  const payLabel = computed(
    () =>
      `${VTTG_SUBSCRIPTION_PURCHASE_TEXT.payLabel} ${formatSubscriptionPrice(total.value)}`,
  );

  const monthPrice = computed(
    () =>
      `${formatSubscriptionPrice(terms.monthPrice)} ${VTTG_SUBSCRIPTION_PRICE.cycle}`,
  );

  watch(maxMonths, (limit) => {
    if (limit && months.value > limit) {
      months.value = limit;
    }
  });

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
    if (isPayDisabled.value) {
      return;
    }

    startPayment({
      months: months.value,
      email: email.value.trim(),
      acceptConsents: needsConsents.value,
    });
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

        <USeparator />

        <UAlert
          v-if="!isEmailVerified"
          :title="VTTG_SUBSCRIPTION_PURCHASE_TEXT.unverifiedTitle"
          :description="VTTG_SUBSCRIPTION_PURCHASE_TEXT.unverifiedDescription"
          :actions="SUBSCRIPTION_EMAIL_VERIFICATION_ACTIONS"
          :icon="SUBSCRIPTION_PURCHASE_ICONS.unverified"
          color="warning"
          variant="subtle"
        />

        <UFormField
          :label="VTTG_SUBSCRIPTION_PURCHASE_TEXT.monthsLabel"
          :help="monthsHint"
        >
          <div class="flex flex-col gap-3">
            <div class="grid grid-cols-2 gap-x-2 gap-y-3 pt-2 sm:grid-cols-4">
              <UButton
                v-for="option in presetOptions"
                :key="option.months"
                :variant="getPresetVariant(option.months)"
                :disabled="isPending"
                color="primary"
                class="relative flex-col items-stretch gap-1 p-3 text-left"
                @click.left.exact.prevent="handlePresetClick(option.months)"
              >
                <span class="truncate font-semibold">{{ option.label }}</span>

                <span
                  class="text-base font-bold whitespace-nowrap tabular-nums"
                >
                  {{ option.price }}
                </span>

                <span
                  class="truncate text-xs whitespace-nowrap tabular-nums opacity-80"
                >
                  {{ option.saving }}
                </span>

                <UBadge
                  v-if="option.percent"
                  :label="option.percent"
                  color="success"
                  variant="outline"
                  size="sm"
                  class="absolute -top-2.5 right-2 bg-default font-bold"
                />
              </UButton>
            </div>

            <UInputNumber
              v-model="months"
              :min="SUBSCRIPTION_PAYMENT_MONTHS.min"
              :max="maxMonths"
              :disabled="isPending"
              class="w-40"
            />
          </div>
        </UFormField>

        <UFormField
          :label="VTTG_SUBSCRIPTION_PURCHASE_TEXT.emailLabel"
          :hint="VTTG_SUBSCRIPTION_PURCHASE_TEXT.emailHint"
          :error="emailError"
        >
          <UInput
            v-model="email"
            :disabled="isPending"
            type="email"
            :icon="SUBSCRIPTION_PURCHASE_ICONS.email"
            autocomplete="email"
            autocapitalize="off"
            autocorrect="off"
            class="w-full"
          />
        </UFormField>

        <div
          class="flex items-center justify-between gap-3 rounded-lg border border-default bg-elevated/40 p-3"
        >
          <span class="text-sm text-muted">
            {{ VTTG_SUBSCRIPTION_PURCHASE_TEXT.totalLabel }}
          </span>

          <div class="flex flex-col items-end gap-0.5 text-right tabular-nums">
            <span class="text-lg/7 font-bold text-highlighted">
              {{ totalCaption }}
            </span>

            <span
              v-if="discountCaption"
              class="flex items-center gap-1.5 text-xs/5 text-muted"
            >
              <s>{{ discountCaption.full }}</s>

              <span class="text-success">{{ discountCaption.saving }}</span>
            </span>

            <span
              v-else
              class="text-xs/5 text-muted"
            >
              {{ VTTG_SUBSCRIPTION_PURCHASE_TEXT.noDiscount }}
            </span>
          </div>
        </div>

        <div
          v-if="needsConsents"
          class="flex flex-col gap-2"
        >
          <p class="text-sm font-medium text-highlighted">
            {{ VTTG_SUBSCRIPTION_PURCHASE_TEXT.consentsTitle }}
          </p>

          <UCheckbox
            v-model="offerAccepted"
            :disabled="isPending"
          >
            <template #label>
              {{ VTTG_SUBSCRIPTION_PURCHASE_TEXT.offerConsent }}

              <ULink
                :to="PUBLIC_OFFER_ROUTE"
                target="_blank"
                class="text-primary"
              >
                {{ VTTG_SUBSCRIPTION_PURCHASE_TEXT.offerLink }}
              </ULink>
            </template>
          </UCheckbox>

          <UCheckbox
            v-model="personalDataConsent"
            :disabled="isPending"
          >
            <template #label>
              {{ VTTG_SUBSCRIPTION_PURCHASE_TEXT.personalDataConsent }}

              <ULink
                :to="PRIVACY_POLICY_ROUTE"
                target="_blank"
                class="text-primary"
              >
                {{ VTTG_SUBSCRIPTION_PURCHASE_TEXT.privacyPolicyLink }}
              </ULink>
            </template>
          </UCheckbox>
        </div>

        <div class="flex flex-col gap-1.5 text-xs leading-relaxed text-muted">
          <p>{{ VTTG_SUBSCRIPTION_PURCHASE_TEXT.extendHint }}</p>

          <p>{{ VTTG_SUBSCRIPTION_PURCHASE_TEXT.noRenewal }}</p>

          <p>
            {{ VTTG_SUBSCRIPTION_PURCHASE_TEXT.refundNote }}
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
          :disabled="isPayDisabled"
          :icon="SUBSCRIPTION_PURCHASE_ICONS.pay"
          color="primary"
          @click.left.exact.prevent="handlePayClick"
        />
      </div>
    </template>
  </UModal>
</template>
