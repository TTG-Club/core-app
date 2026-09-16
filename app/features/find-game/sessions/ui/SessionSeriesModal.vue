<script setup lang="ts">
  import type {
    CreateGameSessionSeriesRequest,
    GameCostType,
    SessionWeekday,
  } from '../../model';

  import { UiModalActions } from '~ui/modal-actions';

  import {
    useSessionPaymentFields,
    useSessionTimeRange,
  } from '../../composables';
  import {
    CANCEL_LABEL,
    getDefaultSessionDate,
    SESSION_CURRENCY_LABEL,
    SESSION_CURRENCY_PLACEHOLDER,
    SESSION_FREE_HINT,
    SESSION_FREE_SESSION_HINT,
    SESSION_FREE_SESSION_LABEL,
    SESSION_PAID_HINT,
    SESSION_PAYMENT_TYPE_LABEL,
    SESSION_PRICE_FORMAT,
    SESSION_PRICE_LABEL,
    SESSION_PRICE_MIN,
    SESSION_PRICE_STEP,
    SESSION_SERIES_CREATE_LABEL,
    SESSION_SERIES_DEFAULT_HORIZON,
    SESSION_SERIES_DEFAULT_HORIZON_UNIT,
    SESSION_SERIES_DEFAULT_WEEKDAYS,
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

  const weekdays = ref<Array<SessionWeekday>>([
    ...SESSION_SERIES_DEFAULT_WEEKDAYS,
  ]);

  const horizonAmount = ref<number>(SESSION_SERIES_DEFAULT_HORIZON);

  const horizonUnit = ref<(typeof SESSION_SERIES_HORIZON_UNITS)[number]>(
    SESSION_SERIES_DEFAULT_HORIZON_UNIT,
  );

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

  const weekdayOptions = SESSION_WEEKDAYS.map((value) => ({
    value,
    label: SESSION_WEEKDAY_LABELS[value],
  }));

  const horizonUnitOptions = SESSION_SERIES_HORIZON_UNITS.map((value) => ({
    value,
    label: SESSION_SERIES_HORIZON_UNIT_LABELS[value],
  }));

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

  /** Подсказка окна: у платной серии речь о деньгах, у бесплатной — нет. */
  const paymentHint = computed(() =>
    isPaid.value ? SESSION_PAID_HINT : SESSION_FREE_HINT,
  );

  // Ноль встреч — это несостоявшееся расписание, а не просто число: цвет
  // предупреждения объясняет, почему кнопка создания не сработает.
  const plannedCountColor = computed(() =>
    plannedCount.value > 0 ? 'neutral' : 'warning',
  );

  const isValid = computed(
    () =>
      !!title.value.trim()
      && !!startsOn.value
      && weekdays.value.length > 0
      && plannedCount.value > 0
      && plannedCount.value <= SESSION_SERIES_MAX
      && isPaymentValid.value,
  );

  // Форма живёт вместе со страницей: чистим её на каждом открытии, иначе
  // прошлое расписание подставится в следующее.
  watch(isOpen, (opened) => {
    if (!opened) {
      return;
    }

    title.value = '';
    startsOn.value = getDefaultSessionDate();
    weekdays.value = [...SESSION_SERIES_DEFAULT_WEEKDAYS];
    horizonAmount.value = SESSION_SERIES_DEFAULT_HORIZON;
    horizonUnit.value = SESSION_SERIES_DEFAULT_HORIZON_UNIT;
    resetTimeRange();
    resetPaymentFields();
  });

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

  /**
   * Вид кнопки дня недели: отмеченный день залит. Функции, а не `computed`:
   * кнопка своя у каждого дня.
   *
   * @param weekday День недели серии.
   */
  function weekdayButtonColor(weekday: SessionWeekday) {
    return isWeekdayPicked(weekday) ? 'primary' : 'neutral';
  }

  /**
   * Заливка кнопки дня недели.
   * @param weekday День недели серии.
   */
  function weekdayButtonVariant(weekday: SessionWeekday) {
    return isWeekdayPicked(weekday) ? 'solid' : 'subtle';
  }

  /** Закрывает окно без создания серии. */
  function cancel(): void {
    isOpen.value = false;
  }

  /** Собирает тело запроса. */
  function submit(): void {
    if (!isValid.value) {
      return;
    }

    const request: CreateGameSessionSeriesRequest = {
      title: title.value.trim(),
      startsOn: startsOn.value,
      until: until.value,
      daysOfWeek: [...weekdays.value],
      timeOfDay: startTimeText.value,
      // Пояс берётся у браузера: расписание задаётся в том времени, в котором
      // мастер его и называет.
      zoneId: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    if (durationMinutes.value) {
      request.estimatedDurationMinutes = durationMinutes.value;
    }

    applyPaymentFields(request);

    emit('submit', request);
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="SESSION_SERIES_TITLE"
    :description="paymentHint"
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
              :color="weekdayButtonColor(option.value)"
              :variant="weekdayButtonVariant(option.value)"
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
          :color="plannedCountColor"
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
              value-key="value"
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
        :submit-label="SESSION_SERIES_CREATE_LABEL"
        submit-icon="tabler:calendar-repeat"
        :loading="loading"
        :disabled="!isValid"
        @cancel="cancel"
        @submit="submit"
      />
    </template>
  </UModal>
</template>
