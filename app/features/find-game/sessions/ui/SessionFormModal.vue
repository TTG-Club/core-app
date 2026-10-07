<script setup lang="ts">
  import type {
    CreateGameSessionRequest,
    GameCostType,
    GameSession,
    UpdateGameSessionRequest,
  } from '../../model';

  import { Time } from '@internationalized/date';

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
    SESSION_CREATE_SUBMIT_ICON,
    SESSION_CREATE_TITLE,
    SESSION_CURRENCY_LABEL,
    SESSION_CURRENCY_PLACEHOLDER,
    SESSION_DATE_LABEL,
    SESSION_EDIT_DESCRIPTION,
    SESSION_EDIT_SUBMIT_ICON,
    SESSION_EDIT_SUBMIT_LABEL,
    SESSION_EDIT_TITLE,
    SESSION_FREE_HINT,
    SESSION_FREE_SESSION_HINT,
    SESSION_FREE_SESSION_LABEL,
    SESSION_PAID_HINT,
    SESSION_PAYMENT_TYPE_LABEL,
    SESSION_PRICE_FORMAT,
    SESSION_PRICE_LABEL,
    SESSION_PRICE_MIN,
    SESSION_PRICE_STEP,
    SESSION_START_IN_PAST_ERROR,
    SESSION_TIME_END_LABEL,
    SESSION_TIME_RANGE_HINT,
    SESSION_TIME_START_LABEL,
    SESSION_TITLE_LABEL,
    SESSION_TITLE_MAX_LENGTH,
    SESSION_TITLE_PLACEHOLDER,
    SESSION_VALIDATION_CLOCK_INTERVAL,
    toLocalDateInput,
  } from '../../model';

  const isOpen = defineModel<boolean>('open', { required: true });

  const {
    costType,
    session = null,
    loading = false,
  } = defineProps<{
    /** Платность игры решает, нужны ли сессии платёжные поля. */
    costType: GameCostType;
    /**
     * Встреча, которую правят; без неё окно создаёт новую. Оплату у
     * назначенной встречи не меняют — по ней уже могут быть расчёты.
     */
    session?: GameSession | null;
    loading?: boolean;
  }>();

  const emit = defineEmits<{
    submit: [request: CreateGameSessionRequest];
    update: [sessionId: string, request: UpdateGameSessionRequest];
  }>();

  /**
   * Встреча, с которой окно открыли. Снимок, а не сам проп: при закрытии
   * страница сразу сбрасывает проп, и без снимка окно на время анимации
   * превращалось бы в создание новой встречи.
   */
  const editedSession = shallowRef<GameSession | null>(null);

  const isEditing = computed(() => !!editedSession.value);

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
    applyRange,
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

  // Платёжные поля у правки скрыты и не участвуют в проверке.
  const isValid = computed(
    () =>
      !!title.value.trim()
      && isStartValid.value
      && (isEditing.value || isPaymentValid.value),
  );

  /** Подсказка окна: у платной встречи речь о деньгах, у бесплатной — нет. */
  const paymentHint = computed(() =>
    isPaid.value ? SESSION_PAID_HINT : SESSION_FREE_HINT,
  );

  const modalTitle = computed(() =>
    isEditing.value ? SESSION_EDIT_TITLE : SESSION_CREATE_TITLE,
  );

  const modalDescription = computed(() =>
    isEditing.value ? SESSION_EDIT_DESCRIPTION : paymentHint.value,
  );

  const submitLabel = computed(() =>
    isEditing.value ? SESSION_EDIT_SUBMIT_LABEL : SESSION_CREATE_LABEL,
  );

  const submitIcon = computed(() =>
    isEditing.value ? SESSION_EDIT_SUBMIT_ICON : SESSION_CREATE_SUBMIT_ICON,
  );

  const showPaymentFields = computed(() => !isEditing.value);

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

    const timing: UpdateGameSessionRequest = {
      title: title.value.trim(),
      startsAt: startsAtValue,
    };

    if (durationMinutes.value) {
      timing.estimatedDurationMinutes = durationMinutes.value;
    }

    if (editedSession.value) {
      emit('update', editedSession.value.id, timing);

      return;
    }

    const request: CreateGameSessionRequest = { ...timing };

    applyPaymentFields(request);

    emit('submit', request);
  }

  /**
   * Заполняет форму назначенной встречей: дата и время — в поясе мастера,
   * как он их и вводит.
   * @param scheduledSession Встреча, которую правят.
   */
  function fillFrom(scheduledSession: GameSession): void {
    title.value = scheduledSession.title;

    if (!scheduledSession.startsAt) {
      startsAt.value = getDefaultSessionDate();
      resetTimeRange();

      return;
    }

    const start = new Date(scheduledSession.startsAt);

    startsAt.value = toLocalDateInput(scheduledSession.startsAt);

    applyRange(
      new Time(start.getHours(), start.getMinutes()),
      scheduledSession.estimatedDurationMinutes,
    );
  }

  // Форма живёт вместе со страницей: заполняем её на каждом открытии, иначе
  // прошлая сессия подставится в следующую.
  watch(isOpen, (opened) => {
    if (!opened) {
      return;
    }

    editedSession.value = session;
    resetPaymentFields();

    if (session) {
      fillFrom(session);

      return;
    }

    title.value = '';
    startsAt.value = getDefaultSessionDate();
    resetTimeRange();
  });
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="modalTitle"
    :description="modalDescription"
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
          v-if="showPaymentFields && costType === 'PAID'"
          v-model="isFree"
          :label="SESSION_FREE_SESSION_LABEL"
          :description="SESSION_FREE_SESSION_HINT"
        />

        <div
          v-if="showPaymentFields && isPaid"
          class="grid gap-3 sm:grid-cols-3"
        >
          <UFormField
            :label="SESSION_PRICE_LABEL"
            required
          >
            <UInputNumber
              v-model="priceAmount"
              :min="SESSION_PRICE_MIN"
              :step="SESSION_PRICE_STEP"
              :format-options="SESSION_PRICE_FORMAT"
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
        :submit-label="submitLabel"
        :submit-icon="submitIcon"
        :loading="loading"
        :disabled="!isValid"
        @cancel="cancel"
        @submit="submit"
      />
    </template>
  </UModal>
</template>
