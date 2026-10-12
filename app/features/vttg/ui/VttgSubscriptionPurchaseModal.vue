<script setup lang="ts">
  import { PRIVACY_POLICY_ROUTE } from '~infrastructure/privacy-policy/model';
  import { PUBLIC_OFFER_ROUTE } from '~infrastructure/public-offer/model';

  import {
    useSubscriptionPayment,
    useSubscriptionPaymentTerms,
  } from '../composables';
  import {
    formatSubscriptionMonths,
    getSubscriptionPaymentTotal,
    SUBSCRIPTION_EMAIL_VERIFICATION_ROUTE,
    SUBSCRIPTION_PAYMENT_MONTHS,
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

  /** Сумма с валютой, пока цена не загружена — пусто. */
  function formatPrice(amount: number): string {
    return `${amount} ${VTTG_SUBSCRIPTION_PRICE.currency}`;
  }

  const total = computed(() =>
    terms.value
      ? formatPrice(
          getSubscriptionPaymentTotal(terms.value.monthPrice, months.value),
        )
      : '',
  );

  const totalCaption = computed(() =>
    terms.value
      ? `${total.value} за ${formatSubscriptionMonths(months.value)}`
      : '—',
  );

  const payLabel = computed(() =>
    terms.value
      ? `${VTTG_SUBSCRIPTION_PURCHASE_TEXT.payLabel} ${total.value}`
      : VTTG_SUBSCRIPTION_PURCHASE_TEXT.payLabel,
  );

  const monthPrice = computed(() =>
    terms.value
      ? `${formatPrice(terms.value.monthPrice)} ${VTTG_SUBSCRIPTION_PRICE.cycle}`
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
          :actions="[
            {
              label: VTTG_SUBSCRIPTION_PURCHASE_TEXT.unverifiedLink,
              to: SUBSCRIPTION_EMAIL_VERIFICATION_ROUTE,
              color: 'warning',
              variant: 'outline',
            },
          ]"
          icon="tabler:mail-exclamation"
          color="warning"
          variant="subtle"
        />

        <UFormField
          :label="VTTG_SUBSCRIPTION_PURCHASE_TEXT.monthsLabel"
          :help="VTTG_SUBSCRIPTION_PURCHASE_TEXT.monthsHint"
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
            icon="tabler:mail"
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

          <span
            v-else
            class="text-lg font-bold text-highlighted"
          >
            {{ totalCaption }}
          </span>
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
          :loading="isPending || isTermsLoading"
          :disabled="isPayDisabled"
          icon="tabler:credit-card"
          color="primary"
          @click.left.exact.prevent="handlePayClick"
        />
      </div>
    </template>
  </UModal>
</template>
