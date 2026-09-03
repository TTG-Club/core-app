<script setup lang="ts">
  import type {
    CreateGameSessionRequest,
    GameCostType,
    SessionFormState,
    SessionPaymentType,
  } from '../../model';

  import { Time } from '@internationalized/date';

  import {
    CANCEL_LABEL,
    durationBetween,
    fromLocalDateTimeInput,
    getDefaultSessionDate,
    SESSION_CREATE_LABEL,
    SESSION_CREATE_TITLE,
    SESSION_CURRENCIES,
    SESSION_CURRENCY_LABEL,
    SESSION_CURRENCY_PATTERN,
    SESSION_CURRENCY_PLACEHOLDER,
    SESSION_DATE_LABEL,
    SESSION_DEFAULT_CURRENCY,
    SESSION_FREE_HINT,
    SESSION_FREE_SESSION_HINT,
    SESSION_FREE_SESSION_LABEL,
    SESSION_OPEN_DATE_HINT,
    SESSION_OPEN_DATE_LABEL,
    SESSION_PAID_HINT,
    SESSION_PAYMENT_TYPE_LABEL,
    SESSION_PAYMENT_TYPE_LABELS,
    SESSION_PAYMENT_TYPES,
    SESSION_PRICE_LABEL,
    SESSION_PRICE_MIN,
    SESSION_TIME_RANGE_HINT,
    SESSION_TIME_RANGE_LABEL,
    SESSION_TIMEZONE_HINT_PREFIX,
    SESSION_TITLE_LABEL,
    SESSION_TITLE_MAX_LENGTH,
    SESSION_TITLE_PLACEHOLDER,
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

  /** Пустая форма новой сессии: дата — сегодняшняя, ближайший целый час. */
  function createEmptyForm(): SessionFormState {
    return {
      title: '',
      startsAt: getDefaultSessionDate(),
      hasOpenDate: false,
      isFree: false,
      estimatedDurationMinutes: null,
      priceAmount: null,
      priceCurrency: SESSION_DEFAULT_CURRENCY,
      paymentType: null,
    };
  }

  const form = ref<SessionFormState>(createEmptyForm());

  // Платная игра не обязана быть платной целиком, поэтому платёжные поля
  // показываются, только пока мастер не объявил сессию бесплатной.
  const isPaid = computed(() => costType === 'PAID' && !form.value.isFree);

  /**
   * Границы встречи. Мастер называет их временем — «с семи до одиннадцати», —
   * а сервису уходит начало и длительность.
   */
  const timeRange = shallowRef<{ start: Time; end: Time }>({
    start: new Time(19, 0),
    end: new Time(23, 0),
  });

  const paymentTypeOptions = SESSION_PAYMENT_TYPES.map((value) => ({
    value,
    label: SESSION_PAYMENT_TYPE_LABELS[value],
  }));

  // В списке видно и код, и название: по коду мастер узнаёт валюту, по
  // названию — находит её поиском.
  const currencyOptions: Array<{ value: string; label: string }> =
    SESSION_CURRENCIES.map((currency) => ({
      value: currency.code,
      label: `${currency.code} — ${currency.name}`,
    }));

  // USelect не принимает `null` как «ничего не выбрано», а в состоянии формы
  // именно `null`: платёжные поля появляются только у платной игры.
  const paymentTypeChoice = computed({
    get: () => form.value.paymentType ?? undefined,
    set: (value: SessionPaymentType | undefined) => {
      form.value.paymentType = value ?? null;
    },
  });

  // Дата и время живут порознь: время задаётся диапазоном, и склеивать их
  // обратно в одно поле пришлось бы только ради формата `datetime-local`.
  const startsAtIso = computed(() => {
    const { start } = timeRange.value;
    const time = `${pad(start.hour)}:${pad(start.minute)}`;

    return form.value.startsAt
      ? fromLocalDateTimeInput(`${form.value.startsAt}T${time}`)
      : null;
  });

  const durationMinutes = computed(() =>
    durationBetween(
      timeRange.value.start.hour * 60 + timeRange.value.start.minute,
      timeRange.value.end.hour * 60 + timeRange.value.end.minute,
    ),
  );

  /**
   * Двузначное число для склейки времени.
   * @param value Часы или минуты.
   */
  function pad(value: number): string {
    return `${value}`.padStart(2, '0');
  }

  // Поле datetime-local принимает время в поясе мастера, а игрокам оно
  // покажется в их собственном — смещение снимает разночтения.
  const { $dayjs } = useDayjs();

  const timezoneHint = computed(
    () => `${SESSION_TIMEZONE_HINT_PREFIX} (UTC${$dayjs().format('Z')})`,
  );

  const isCurrencyValid = computed(
    () =>
      !isPaid.value || SESSION_CURRENCY_PATTERN.test(form.value.priceCurrency),
  );

  const isPriceValid = computed(
    () =>
      !isPaid.value
      || (form.value.priceAmount !== null
        && form.value.priceAmount >= SESSION_PRICE_MIN),
  );

  const isValid = computed(
    () =>
      !!form.value.title.trim()
      && (form.value.hasOpenDate || !!startsAtIso.value)
      && isPriceValid.value
      && isCurrencyValid.value
      && (!isPaid.value || !!form.value.paymentType),
  );

  /** Закрывает окно без создания сессии. */
  function cancel(): void {
    isOpen.value = false;
  }

  /**
   * Собирает тело запроса. У бесплатной игры платёжные поля не отправляются
   * вовсе — сервис отвергает запрос, в котором они заданы. Дата не уходит у
   * набора с открытой датой.
   */
  function submit(): void {
    if (!isValid.value) {
      return;
    }

    const request: CreateGameSessionRequest = {
      title: form.value.title.trim(),
    };

    // У набора с открытой датой поле не уходит вовсе: сервис понимает его
    // отсутствие как «время назначу позже».
    if (!form.value.hasOpenDate && startsAtIso.value) {
      request.startsAt = startsAtIso.value;
    }

    if (durationMinutes.value) {
      request.estimatedDurationMinutes = durationMinutes.value;
    }

    const { priceAmount, paymentType } = form.value;

    if (isPaid.value && priceAmount !== null && paymentType) {
      request.priceAmount = priceAmount;
      request.priceCurrency = form.value.priceCurrency.toUpperCase();
      request.paymentType = paymentType;
    }

    emit('submit', request);
  }

  // Форма живёт вместе со страницей: чистим её на каждом открытии, иначе
  // прошлая сессия подставится в следующую.
  watch(isOpen, (opened) => {
    if (opened) {
      form.value = createEmptyForm();
      timeRange.value = { start: new Time(19, 0), end: new Time(23, 0) };
    }
  });
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="SESSION_CREATE_TITLE"
    :description="isPaid ? SESSION_PAID_HINT : SESSION_FREE_HINT"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <UFormField
          :label="SESSION_TITLE_LABEL"
          required
        >
          <UInput
            v-model="form.title"
            :maxlength="SESSION_TITLE_MAX_LENGTH"
            :placeholder="SESSION_TITLE_PLACEHOLDER"
            class="w-full"
          />
        </UFormField>

        <div class="grid gap-3 sm:grid-cols-2">
          <UFormField
            :label="SESSION_DATE_LABEL"
            :required="!form.hasOpenDate"
          >
            <UInput
              v-model="form.startsAt"
              type="date"
              :disabled="form.hasOpenDate"
              class="w-full"
            />
          </UFormField>

          <UFormField
            :label="SESSION_TIME_RANGE_LABEL"
            :hint="timezoneHint"
            :description="SESSION_TIME_RANGE_HINT"
          >
            <UInputTime
              v-model="timeRange"
              range
              :hour-cycle="24"
              :disabled="form.hasOpenDate"
              class="w-full"
            />
          </UFormField>
        </div>

        <UCheckbox
          v-if="costType === 'PAID'"
          v-model="form.isFree"
          :label="SESSION_FREE_SESSION_LABEL"
          :description="SESSION_FREE_SESSION_HINT"
        />

        <UCheckbox
          v-model="form.hasOpenDate"
          :label="SESSION_OPEN_DATE_LABEL"
          :description="SESSION_OPEN_DATE_HINT"
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
              v-model="form.priceAmount"
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
              v-model="form.priceCurrency"
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
      <div class="flex w-full justify-end gap-2">
        <UButton
          variant="ghost"
          color="neutral"
          :disabled="loading"
          :label="CANCEL_LABEL"
          @click.left.exact.prevent="cancel"
        />

        <UButton
          icon="tabler:plus"
          :loading="loading"
          :disabled="!isValid"
          :label="SESSION_CREATE_LABEL"
          @click.left.exact.prevent="submit"
        />
      </div>
    </template>
  </UModal>
</template>
