<script setup lang="ts">
  import { PRIVACY_POLICY_ROUTE } from '~infrastructure/privacy-policy/model';
  import { PUBLIC_OFFER_ROUTE } from '~infrastructure/public-offer/model';

  import {
    useSubscriptionPayment,
    useSubscriptionPaymentTerms,
  } from '../composables';
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

  const emit = defineEmits<{
    close: [];
  }>();

  const { isPending, startPayment } = useSubscriptionPayment();

  const { data: terms, status: termsStatus } = useSubscriptionPaymentTerms();

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

  const isTermsLoading = computed(() => termsStatus.value === 'pending');

  const isTermsFailed = computed(() => termsStatus.value === 'error');

  const maxMonths = computed(() => terms.value?.maxMonths ?? undefined);

  const isPayDisabled = computed(
    () =>
      !terms.value
      || isPending.value
      || !isEmailVerified.value
      || !isEmailValid.value
      || !isConsentsGiven.value,
  );

  /** Итоговая сумма за выбранный срок со скидкой; пока цена не загружена — нет. */
  const total = computed(() =>
    terms.value
      ? getSubscriptionPaymentTotal(
          terms.value.monthPrice,
          months.value,
          terms.value.discounts,
        )
      : undefined,
  );

  const discountPercent = computed(() =>
    terms.value
      ? getSubscriptionDiscountPercent(terms.value.discounts, months.value)
      : 0,
  );

  /** Цена без скидки и экономия — показываются, только если скидка есть. */
  const discountCaption = computed(() => {
    if (!terms.value || !discountPercent.value) {
      return undefined;
    }

    const full = getSubscriptionFullPrice(terms.value.monthPrice, months.value);

    const saving = getSubscriptionSaving(
      terms.value.monthPrice,
      months.value,
      terms.value.discounts,
    );

    return {
      full: formatSubscriptionPrice(full),
      saving: `${VTTG_SUBSCRIPTION_PURCHASE_TEXT.savingLabel} ${formatSubscriptionPrice(saving)} (−${discountPercent.value}%)`,
    };
  });

  /** Варианты срока с ценой и экономией. */
  const presetOptions = computed(() =>
    SUBSCRIPTION_PAYMENT_MONTHS.presets.map((preset) => {
      const discounts = terms.value?.discounts ?? [];
      const percent = getSubscriptionDiscountPercent(discounts, preset);

      return {
        months: preset,
        label: formatSubscriptionPreset(preset),
        price: terms.value
          ? formatSubscriptionPrice(
              getSubscriptionPaymentTotal(
                terms.value.monthPrice,
                preset,
                discounts,
              ),
            )
          : undefined,
        saving:
          terms.value && percent
            ? `−${percent}% · ${VTTG_SUBSCRIPTION_PURCHASE_TEXT.savingLabel.toLowerCase()} ${formatSubscriptionPrice(getSubscriptionSaving(terms.value.monthPrice, preset, discounts))}`
            : undefined,
      };
    }),
  );

  const monthsHint = computed(() =>
    terms.value?.discounts.length
      ? `${VTTG_SUBSCRIPTION_PURCHASE_TEXT.monthsHint} ${formatSubscriptionDiscountHint(terms.value.discounts)}`
      : VTTG_SUBSCRIPTION_PURCHASE_TEXT.monthsHint,
  );

  const totalCaption = computed(() =>
    total.value === undefined
      ? VTTG_SUBSCRIPTION_PURCHASE_TEXT.totalPlaceholder
      : formatSubscriptionTotal(total.value, months.value),
  );

  const payLabel = computed(() =>
    total.value === undefined
      ? VTTG_SUBSCRIPTION_PURCHASE_TEXT.payLabel
      : `${VTTG_SUBSCRIPTION_PURCHASE_TEXT.payLabel} ${formatSubscriptionPrice(total.value)}`,
  );

  const isPayLoading = computed(() => isPending.value || isTermsLoading.value);

  const monthPrice = computed(() =>
    terms.value
      ? `${formatSubscriptionPrice(terms.value.monthPrice)} ${VTTG_SUBSCRIPTION_PRICE.cycle}`
      : undefined,
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
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <UButton
                v-for="option in presetOptions"
                :key="option.months"
                :variant="getPresetVariant(option.months)"
                :disabled="isPending"
                color="primary"
                class="flex-col items-start gap-0.5 text-left"
                @click.left.exact.prevent="handlePresetClick(option.months)"
              >
                <span class="font-semibold">{{ option.label }}</span>

                <span
                  v-if="option.price"
                  class="text-xs"
                >
                  {{ option.price }}
                </span>

                <span
                  v-if="option.saving"
                  class="text-xs opacity-80"
                >
                  {{ option.saving }}
                </span>
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

          <USkeleton
            v-if="isTermsLoading"
            class="h-6 w-32"
          />

          <div
            v-else
            class="flex flex-col items-end"
          >
            <span class="text-lg font-bold text-highlighted">
              {{ totalCaption }}
            </span>

            <span
              v-if="discountCaption"
              class="text-xs text-muted"
            >
              <s>{{ discountCaption.full }}</s>

              <span class="text-success">{{ discountCaption.saving }}</span>
            </span>
          </div>
        </div>

        <p
          v-if="isTermsFailed"
          class="text-sm text-error"
        >
          {{ VTTG_SUBSCRIPTION_PURCHASE_TEXT.termsError }}
        </p>

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
          :loading="isPayLoading"
          :disabled="isPayDisabled"
          :icon="SUBSCRIPTION_PURCHASE_ICONS.pay"
          color="primary"
          @click.left.exact.prevent="handlePayClick"
        />
      </div>
    </template>
  </UModal>
</template>
