<script setup lang="ts">
  import type {
    CreateGameSessionSeriesRequest,
    GameCostType,
    SessionPaymentType,
    SessionWeekday,
  } from '../../model';

  import { Time } from '@internationalized/date';

  import {
    CANCEL_LABEL,
    durationBetween,
    getDefaultSessionDate,
    SESSION_CURRENCIES,
    SESSION_CURRENCY_LABEL,
    SESSION_CURRENCY_PATTERN,
    SESSION_CURRENCY_PLACEHOLDER,
    SESSION_DEFAULT_CURRENCY,
    SESSION_FREE_HINT,
    SESSION_FREE_SESSION_HINT,
    SESSION_FREE_SESSION_LABEL,
    SESSION_PAID_HINT,
    SESSION_PAYMENT_TYPE_LABEL,
    SESSION_PAYMENT_TYPE_LABELS,
    SESSION_PAYMENT_TYPES,
    SESSION_PRICE_LABEL,
    SESSION_PRICE_MIN,
    SESSION_SERIES_CREATE_LABEL,
    SESSION_SERIES_DESCRIPTION,
    SESSION_SERIES_EMPTY_HINT,
    SESSION_SERIES_HORIZON_LABEL,
    SESSION_SERIES_HORIZON_MAX,
    SESSION_SERIES_HORIZON_UNIT_LABELS,
    SESSION_SERIES_HORIZON_UNITS,
    SESSION_SERIES_MAX,
    SESSION_SERIES_PREVIEW_PREFIX,
    SESSION_SERIES_START_LABEL,
    SESSION_SERIES_TITLE,
    SESSION_SERIES_WEEKDAYS_LABEL,
    SESSION_TIME_END_LABEL,
    SESSION_TIME_RANGE_HINT,
    SESSION_TIME_START_LABEL,
    SESSION_TIMEZONE_HINT_PREFIX,
    SESSION_TITLE_LABEL,
    SESSION_TITLE_MAX_LENGTH,
    SESSION_TITLE_PLACEHOLDER,
    SESSION_WEEKDAY_LABELS,
    SESSION_WEEKDAYS,
  } from '../../model';

  /**
   * Серия встреч по расписанию.
   *
   * Кампания идёт неделями, и заводить каждую встречу вручную мастеру
   * незачем: он называет дни, время и срок — «по средам и пятницам два
   * месяца», — а сервис раскладывает это на обычные сессии.
   */
  const isOpen = defineModel<boolean>('open', { required: true });

  const { costType, loading = false } = defineProps<{
    /** Платность игры решает, нужны ли встречам платёжные поля. */
    costType: GameCostType;
    loading?: boolean;
  }>();

  const emit = defineEmits<{
    submit: [request: CreateGameSessionSeriesRequest];
  }>();

  const { $dayjs } = useDayjs();

  const title = ref('');
  const startsOn = ref(getDefaultSessionDate());
  const weekdays = ref<Array<SessionWeekday>>(['WEDNESDAY']);
  const horizonAmount = ref(2);

  const horizonUnit =
    ref<(typeof SESSION_SERIES_HORIZON_UNITS)[number]>('MONTHS');

  const isFree = ref(false);
  const priceAmount = ref<number | null>(null);
  const priceCurrency = ref(SESSION_DEFAULT_CURRENCY);
  const paymentType = ref<SessionPaymentType | null>(null);

  // Два поля вместо диапазона: диапазон не принимает конец раньше начала, а
  // ночная сессия ровно такая — «с 19:00 до 01:00».
  // shallowRef: у `Time` приватные поля, и разворачивание ref их теряет.
  const startTime = shallowRef(new Time(19, 0));
  const endTime = shallowRef(new Time(23, 0));

  const weekdayOptions = SESSION_WEEKDAYS.map((value) => ({
    value,
    label: SESSION_WEEKDAY_LABELS[value],
  }));

  const horizonUnitOptions = SESSION_SERIES_HORIZON_UNITS.map((value) => ({
    value,
    label: SESSION_SERIES_HORIZON_UNIT_LABELS[value],
  }));

  const paymentTypeOptions = SESSION_PAYMENT_TYPES.map((value) => ({
    value,
    label: SESSION_PAYMENT_TYPE_LABELS[value],
  }));

  const currencyOptions: Array<{ value: string; label: string }> =
    SESSION_CURRENCIES.map((currency) => ({
      value: currency.code,
      label: `${currency.code} — ${currency.name}`,
    }));

  const isPaid = computed(() => costType === 'PAID' && !isFree.value);

  const paymentTypeChoice = computed({
    get: () => paymentType.value ?? undefined,
    set: (value: SessionPaymentType | undefined) => {
      paymentType.value = value ?? null;
    },
  });

  const timezoneHint = computed(
    () => `${SESSION_TIMEZONE_HINT_PREFIX} (UTC${$dayjs().format('Z')})`,
  );

  // Срок мастер называет неделями или месяцами, а сервису уходит последний
  // день: считать календарь удобнее там, где мастер его и задаёт.
  const until = computed(() =>
    $dayjs(startsOn.value)
      .add(
        horizonAmount.value,
        horizonUnit.value === 'WEEKS' ? 'week' : 'month',
      )
      .subtract(1, 'day')
      .format('YYYY-MM-DD'),
  );

  /**
   * Сколько встреч выйдет по расписанию. Мастер видит число до отправки:
   * «по средам два месяца» — это девять встреч, и лучше узнать об этом
   * заранее.
   */
  const plannedCount = computed(() => {
    if (!startsOn.value || !weekdays.value.length) {
      return 0;
    }

    const from = $dayjs(startsOn.value);
    const to = $dayjs(until.value);
    const chosen = new Set(weekdays.value);

    let count = 0;

    for (
      let day = from;
      !day.isAfter(to) && count <= SESSION_SERIES_MAX;
      day = day.add(1, 'day')
    ) {
      // `day()` считает с воскресенья, а список дней идёт с понедельника.
      const weekday = SESSION_WEEKDAYS[(day.day() + 6) % 7];

      if (weekday && chosen.has(weekday)) {
        count += 1;
      }
    }

    return count;
  });

  const durationMinutes = computed(() =>
    durationBetween(
      startTime.value.hour * 60 + startTime.value.minute,
      endTime.value.hour * 60 + endTime.value.minute,
    ),
  );

  const isCurrencyValid = computed(
    () => !isPaid.value || SESSION_CURRENCY_PATTERN.test(priceCurrency.value),
  );

  const isPriceValid = computed(
    () =>
      !isPaid.value
      || (priceAmount.value !== null && priceAmount.value >= SESSION_PRICE_MIN),
  );

  const isValid = computed(
    () =>
      !!title.value.trim()
      && !!startsOn.value
      && weekdays.value.length > 0
      && plannedCount.value > 0
      && plannedCount.value <= SESSION_SERIES_MAX
      && isPriceValid.value
      && isCurrencyValid.value
      && (!isPaid.value || !!paymentType.value),
  );

  // Форма живёт вместе со страницей: чистим её на каждом открытии, иначе
  // прошлое расписание подставится в следующее.
  watch(isOpen, (opened) => {
    if (!opened) {
      return;
    }

    title.value = '';
    startsOn.value = getDefaultSessionDate();
    weekdays.value = ['WEDNESDAY'];
    horizonAmount.value = 2;
    horizonUnit.value = 'MONTHS';
    isFree.value = false;
    priceAmount.value = null;
    priceCurrency.value = SESSION_DEFAULT_CURRENCY;
    paymentType.value = null;
    startTime.value = new Time(19, 0);
    endTime.value = new Time(23, 0);
  });

  /** Закрывает окно без создания серии. */
  /**
   * Отмечает или снимает день недели.
   * @param weekday День недели серии.
   */
  function toggleWeekday(weekday: SessionWeekday): void {
    weekdays.value = weekdays.value.includes(weekday)
      ? weekdays.value.filter((picked) => picked !== weekday)
      : [...weekdays.value, weekday];
  }

  /**
   * Отмечен ли день недели: по этому же признаку кнопка меняет вид.
   * @param weekday День недели серии.
   */
  function isWeekdayPicked(weekday: SessionWeekday): boolean {
    return weekdays.value.includes(weekday);
  }

  function cancel(): void {
    isOpen.value = false;
  }

  /**
   * Двузначное число для склейки времени.
   * @param value Часы или минуты.
   */
  function pad(value: number): string {
    return `${value}`.padStart(2, '0');
  }

  /** Собирает тело запроса. */
  function submit(): void {
    if (!isValid.value) {
      return;
    }

    const start = startTime.value;

    const request: CreateGameSessionSeriesRequest = {
      title: title.value.trim(),
      startsOn: startsOn.value,
      until: until.value,
      daysOfWeek: [...weekdays.value],
      timeOfDay: `${pad(start.hour)}:${pad(start.minute)}`,
      // Пояс берётся у браузера: расписание задаётся в том времени, в котором
      // мастер его и называет.
      zoneId: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    if (durationMinutes.value) {
      request.estimatedDurationMinutes = durationMinutes.value;
    }

    if (isPaid.value && priceAmount.value !== null && paymentType.value) {
      request.priceAmount = priceAmount.value;
      request.priceCurrency = priceCurrency.value.toUpperCase();
      request.paymentType = paymentType.value;
    }

    emit('submit', request);
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="SESSION_SERIES_TITLE"
    :description="isPaid ? SESSION_PAID_HINT : SESSION_FREE_HINT"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <p class="text-sm text-muted">{{ SESSION_SERIES_DESCRIPTION }}</p>

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

        <UFormField
          :label="SESSION_SERIES_WEEKDAYS_LABEL"
          required
        >
          <div class="flex flex-wrap gap-1.5">
            <UButton
              v-for="option in weekdayOptions"
              :key="option.value"
              size="sm"
              :color="isWeekdayPicked(option.value) ? 'primary' : 'neutral'"
              :variant="isWeekdayPicked(option.value) ? 'solid' : 'subtle'"
              :label="option.label"
              @click.left.exact.prevent="toggleWeekday(option.value)"
            />
          </div>
        </UFormField>

        <div class="grid gap-3 sm:grid-cols-2">
          <UFormField
            :label="SESSION_SERIES_START_LABEL"
            required
          >
            <UInput
              v-model="startsOn"
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

        <UFormField :label="SESSION_SERIES_HORIZON_LABEL">
          <div class="flex gap-2">
            <UInputNumber
              v-model="horizonAmount"
              :min="1"
              :max="SESSION_SERIES_HORIZON_MAX"
              class="w-32"
            />

            <USelect
              v-model="horizonUnit"
              value-key="value"
              :items="horizonUnitOptions"
              class="w-40"
            />
          </div>
        </UFormField>

        <UAlert
          :color="plannedCount > 0 ? 'neutral' : 'warning'"
          variant="subtle"
          icon="tabler:calendar-repeat"
          :title="
            plannedCount > 0
              ? `${SESSION_SERIES_PREVIEW_PREFIX}: ${plannedCount}`
              : SESSION_SERIES_EMPTY_HINT
          "
        />

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
              value-key="value"
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
          icon="tabler:calendar-repeat"
          :loading="loading"
          :disabled="!isValid"
          :label="SESSION_SERIES_CREATE_LABEL"
          @click.left.exact.prevent="submit"
        />
      </div>
    </template>
  </UModal>
</template>
