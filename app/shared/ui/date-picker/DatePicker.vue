<script setup lang="ts">
  import { parseDate } from '@internationalized/date';

  const model = defineModel<string | undefined>();
  const inputDate = useTemplateRef('inputDate');

  const date = computed({
    get: () => (model.value ? parseDate(model.value) : undefined),
    set: (value) => {
      model.value = value?.toString();
    },
  });
</script>

<template>
  <UInputDate
    ref="inputDate"
    v-model="date"
  >
    <template #trailing>
      <UPopover
        :reference="inputDate?.inputsRef[3]?.$el"
        :ui="{ content: 'p-2' }"
      >
        <UButton
          color="neutral"
          variant="link"
          size="sm"
          icon="i-fluent-calendar-24-regular"
          aria-label="Выбери дату"
          class="px-0"
        />

        <template #content>
          <UCalendar v-model="date" />
        </template>
      </UPopover>
    </template>
  </UInputDate>
</template>
