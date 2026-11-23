<script setup lang="ts">
  import type {
    ActiveEffect,
    EffectFormLayout,
    InertEffectField,
    InertNoticeRow,
  } from '../../model';

  import { InfoTooltip } from '~ui/tooltip';

  import { EFFECT_INERT_NOTICE_LABELS, listInertNoticeRows } from '../../model';

  /**
   * Плашка «Не работает в этом месте». Поля не стираются молча: запись могла
   * прийти из старого редактора, и решает автор. Каждая настройка — своей
   * строкой: что именно задано, почему не работает (и что включить вместо) и
   * своя кнопка «Убрать», — иначе непонятно, что сотрёт кнопка.
   */
  const { fields, effect, layout } = defineProps<{
    /** Неработающие поля эффекта. */
    fields: readonly InertEffectField[];
    /** Эффект в форме: по нему называются неработающие срабатывания. */
    effect: ActiveEffect;
    /** Раскладка формы. */
    layout: EffectFormLayout;
  }>();

  const emit = defineEmits<{
    /** Убрать неработающие поля. */
    'clear': [fields: InertEffectField[]];
    /** Убрать одно неработающее срабатывание. */
    'remove-trigger': [triggerId: string];
  }>();

  const rows = computed(() => listInertNoticeRows(fields, effect, layout));

  /** «Убрать всё» нужно, только когда строк больше одной. */
  const hasSeveralRows = computed(() => rows.value.length > 1);

  /**
   * Убирает настройку одной строки.
   *
   * @param row строка плашки.
   */
  function clearRow(row: InertNoticeRow): void {
    if (row.triggerId !== null) {
      emit('remove-trigger', row.triggerId);
    } else if (row.field !== null) {
      emit('clear', [row.field]);
    }
  }

  /** Убирает все неработающие настройки разом. */
  function clearAll(): void {
    emit('clear', [...fields]);
  }
</script>

<template>
  <div
    class="flex flex-col gap-2 rounded-lg border border-warning/40 bg-warning/5 px-3 py-2 text-sm"
  >
    <div class="flex items-center justify-between gap-2">
      <InfoTooltip
        :text="EFFECT_INERT_NOTICE_LABELS.titleHint"
        icon="tabler:info-circle-filled"
      >
        <span class="flex items-center gap-1.5 font-medium text-warning">
          <UIcon
            name="tabler:alert-triangle"
            class="size-4 shrink-0"
          />

          {{ EFFECT_INERT_NOTICE_LABELS.title }}
        </span>
      </InfoTooltip>

      <UButton
        v-if="hasSeveralRows"
        color="warning"
        variant="ghost"
        size="xs"
        icon="tabler:eraser"
        :label="EFFECT_INERT_NOTICE_LABELS.clearAll"
        @click.left.exact.prevent="clearAll"
      />
    </div>

    <ul class="flex flex-col gap-2">
      <li
        v-for="row in rows"
        :key="row.key"
        class="flex items-start justify-between gap-2"
      >
        <div class="min-w-0">
          <p class="text-default">
            <span class="font-medium">{{ row.name }}</span>

            <template v-if="row.detail">{{ row.detail }}</template>
          </p>

          <p class="text-xs text-muted">
            {{ row.reason }}
          </p>
        </div>

        <UButton
          color="warning"
          variant="soft"
          size="xs"
          icon="tabler:eraser"
          :label="EFFECT_INERT_NOTICE_LABELS.clear"
          class="shrink-0"
          @click.left.exact.prevent="clearRow(row)"
        />
      </li>
    </ul>
  </div>
</template>
