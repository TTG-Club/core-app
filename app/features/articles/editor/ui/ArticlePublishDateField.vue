<script setup lang="ts">
  import { DatePicker } from '~ui/date-picker';

  /** Время по умолчанию, если задана только дата. */
  const DEFAULT_TIME = '00:00';

  /**
   * Собирает абсолютный момент публикации (ISO-строка в UTC) из локальных даты и
   * времени администратора.
   *
   * Бэкенд хранит поле как `Instant`, поэтому строку без зоны он трактует как UTC
   * и сместил бы время на часовой пояс автора. Отдаём момент со смещением через
   * `toISOString()` — это зеркально к чтению, где значение раскладывается через
   * `dayjs().local()`. Пустая дата означает отсутствие даты публикации (запись
   * становится черновиком).
   */
  function composePublishDateTime(
    date: string | undefined,
    time: string,
  ): string | null {
    if (!date) {
      return null;
    }

    return new Date(`${date}T${time || DEFAULT_TIME}:00`).toISOString();
  }

  const model = defineModel<string | null>({ default: null });

  const { $dayjs } = useDayjs();

  const dateValue = ref<string | undefined>();
  const timeValue = ref<string>('');

  // Внешняя смена модели (загрузка/сброс формы) → раскладываем на дату и время.
  // Свою же запись (совпадает с текущей сборкой) пропускаем, чтобы не зациклиться.
  watch(
    model,
    (value) => {
      if (value === composePublishDateTime(dateValue.value, timeValue.value)) {
        return;
      }

      if (!value) {
        dateValue.value = undefined;
        timeValue.value = '';

        return;
      }

      const parsed = $dayjs(value);

      if (!parsed.isValid()) {
        dateValue.value = undefined;
        timeValue.value = '';

        return;
      }

      dateValue.value = parsed.local().format('YYYY-MM-DD');
      timeValue.value = parsed.local().format('HH:mm');
    },
    { immediate: true },
  );

  // Правка даты/времени → пересобираем модель. Назад не пишем, если строка
  // совпала (эхо) ИЛИ описывает тот же момент, что уже в модели — иначе загрузка
  // ISO иного формата (с мс/зоной) ложно пометила бы форму изменённой.
  watch([dateValue, timeValue], () => {
    const composed = composePublishDateTime(dateValue.value, timeValue.value);

    if (composed === model.value) {
      return;
    }

    if (
      composed
      && model.value
      && $dayjs(composed).isSame($dayjs(model.value))
    ) {
      return;
    }

    model.value = composed;
  });
</script>

<template>
  <div class="flex flex-col gap-2 sm:flex-row">
    <DatePicker
      v-model="dateValue"
      class="sm:w-48"
    />

    <UInput
      v-model="timeValue"
      type="time"
      class="sm:w-32"
    />
  </div>
</template>
