<script setup lang="ts">
  import type { CreateGameSessionRequest, GameCostType } from '../../model';

  import { UiModalActions } from '~ui/modal-actions';

  import {
    useSessionPaymentFields,
    useSessionTimeRange,
  } from '../../composables';
  import {
    CANCEL_LABEL,
    fromLocalDateTimeInput,
    getDefaultSessionDate,
    isFutureSessionStart,
    SESSION_CREATE_LABEL,
    SESSION_CREATE_TITLE,
    SESSION_CURRENCY_LABEL,
    SESSION_CURRENCY_PLACEHOLDER,
    SESSION_DATE_LABEL,
    SESSION_FREE_HINT,
    SESSION_FREE_SESSION_HINT,
    SESSION_FREE_SESSION_LABEL,
    SESSION_PAID_HINT,
    SESSION_PAYMENT_TYPE_LABEL,
    SESSION_PRICE_LABEL,
    SESSION_PRICE_MIN,
    SESSION_START_IN_PAST_ERROR,
    SESSION_TIME_END_LABEL,
    SESSION_TIME_RANGE_HINT,
    SESSION_TIME_START_LABEL,
    SESSION_TITLE_LABEL,
    SESSION_TITLE_MAX_LENGTH,
    SESSION_TITLE_PLACEHOLDER,
    SESSION_VALIDATION_CLOCK_INTERVAL,
  } from '../../model';

  const isOpen = defineModel<boolean>('open', { required: true });

  const { costType, loading = false } = defineProps<{
    /** Платность игры решает, нужны ли сессии платёжные поля. */
    costType: GameCostType;
    loading?: boolean;
  }>();

  const emit = defineEmits<{
    submit: [request: CreateGameSessionRequest];
  }>();

  const title = ref('');

  /** Дата встречи: по умолчанию сегодняшняя. */
  const startsAt = ref(getDefaultSessionDate());

  const currentTime = useNow({ interval: SESSION_VALIDATION_CLOCK_INTERVAL });

  const {
    startTime,
    endTime,
    startTimeText,
    durationMinutes,
    timezoneHint,
    reset: resetTimeRange,
  } = useSessionTimeRange();

  const {
    isFree,
    priceAmount,
    priceCurrency,
    paymentTypeChoice,
    isPaid,
    isValid: isPaymentValid,
    currencyOptions,
    paymentTypeOptions,
    applyTo: applyPaymentFields,
    reset: resetPaymentFields,
  } = useSessionPaymentFields(() => costType);

  // Дата и время живут порознь: время задаётся двумя полями, и склеивать их
  // обратно в одно поле пришлось бы только ради формата `datetime-local`.
  const startsAtIso = computed(() =>
    startsAt.value
      ? fromLocalDateTimeInput(`${startsAt.value}T${startTimeText.value}`)
      : null,
  );

  /** Встречу назначают на будущее: прошедшую дату сервис всё равно отвергнет. */
  const isStartValid = computed(() =>
    isFutureSessionStart(startsAtIso.value, currentTime.value.getTime()),
  );

  const startError = computed(() =>
    startsAtIso.value && !isStartValid.value
      ? SESSION_START_IN_PAST_ERROR
      : undefined,
  );

  const isValid = computed(
    () => !!title.value.trim() && isStartValid.value && isPaymentValid.value,
  );

  /** Подсказка окна: у платной встречи речь о деньгах, у бесплатной — нет. */
  const paymentHint = computed(() =>
    isPaid.value ? SESSION_PAID_HINT : SESSION_FREE_HINT,
  );

  /** Закрывает окно без создания сессии. */
  function cancel(): void {
    isOpen.value = false;
  }

  /** Собирает тело запроса и отдаёт его странице игры. */
  function submit(): void {
    // Повторная проверка закрывает промежуток между тиками часов и отправкой.
    currentTime.value = new Date();

    if (!isValid.value) {
      return;
    }

    const startsAtValue = startsAtIso.value;

    // Проверка формы это уже гарантирует; здесь она нужна типу поля.
    if (!startsAtValue) {
      return;
    }

    const request: CreateGameSessionRequest = {
      title: title.value.trim(),
      startsAt: startsAtValue,
    };

    if (durationMinutes.value) {
      request.estimatedDurationMinutes = durationMinutes.value;
    }

    applyPaymentFields(request);

    emit('submit', request);
  }

  // Форма живёт вместе со страницей: чистим её на каждом открытии, иначе
  // прошлая сессия подставится в следующую.
  watch(isOpen, (opened) => {
    if (!opened) {
      return;
    }

    title.value = '';
    startsAt.value = getDefaultSessionDate();
    resetTimeRange();
    resetPaymentFields();
  });
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="SESSION_CREATE_TITLE"
    :description="paymentHint"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <UFormField
          :label="SESSION_TITLE_LABEL"
          required
        >
          <UInput
            v-model="title"
            :maxlength="SESSION_TITLE_MAX_LENGTH"
            :placeholder="SESSION_TITLE_PLACEHOLDER"
            class="w-full"
          />
        </UFormField>

        <div class="grid gap-3 sm:grid-cols-2">
          <UFormField
            :label="SESSION_DATE_LABEL"
            :error="startError"
            required
          >
            <UInput
              v-model="startsAt"
              type="date"
              class="w-full"
            />
          </UFormField>

          <UFormField
            :label="SESSION_TIME_START_LABEL"
            :hint="timezoneHint"
          >
            <UInputTime
              v-model="startTime"
              :hour-cycle="24"
              class="w-full"
            />
          </UFormField>

          <UFormField
            :label="SESSION_TIME_END_LABEL"
            :description="SESSION_TIME_RANGE_HINT"
          >
            <UInputTime
              v-model="endTime"
              :hour-cycle="24"
              class="w-full"
            />
          </UFormField>
        </div>

        <UCheckbox
          v-if="costType === 'PAID'"
          v-model="isFree"
          :label="SESSION_FREE_SESSION_LABEL"
          :description="SESSION_FREE_SESSION_HINT"
        />

        <div
          v-if="isPaid"
          class="grid gap-3 sm:grid-cols-3"
        >
          <UFormField
            :label="SESSION_PRICE_LABEL"
            required
          >
            <UInputNumber
              v-model="priceAmount"
              :min="SESSION_PRICE_MIN"
              :step="SESSION_PRICE_MIN"
              class="w-full"
            />
          </UFormField>

          <UFormField
            :label="SESSION_CURRENCY_LABEL"
            required
          >
            <USelectMenu
              v-model="priceCurrency"
              value-key="value"
              :items="currencyOptions"
              :placeholder="SESSION_CURRENCY_PLACEHOLDER"
              class="w-full"
            />
          </UFormField>

          <UFormField
            :label="SESSION_PAYMENT_TYPE_LABEL"
            required
          >
            <USelect
              v-model="paymentTypeChoice"
              :items="paymentTypeOptions"
              class="w-full"
            />
          </UFormField>
        </div>
      </div>
    </template>

    <template #footer>
      <UiModalActions
        :cancel-label="CANCEL_LABEL"
        :submit-label="SESSION_CREATE_LABEL"
        submit-icon="tabler:plus"
        :loading="loading"
        :disabled="!isValid"
        @cancel="cancel"
        @submit="submit"
      />
    </template>
  </UModal>
</template>
