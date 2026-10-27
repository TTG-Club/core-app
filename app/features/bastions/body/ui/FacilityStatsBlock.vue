<script setup lang="ts">
  import type { BastionFacilityDetailResponse } from '../../model';

  import {
    BASTION_BODY_LABELS,
    getFacilitySubtitle,
    getSpaceText,
  } from '../../model';

  const { facility } = defineProps<{
    facility: BastionFacilityDetailResponse;
  }>();

  interface StatRow {
    label: string;
    value: string;
  }

  /** Подзаголовок как в книге; уровень в нём, поэтому отдельной строки уровня нет. */
  const subtitle = computed(() => getFacilitySubtitle(facility));

  /** Строки блока свойств; пустые значения не показываются. */
  const rows = computed<Array<StatRow>>(() =>
    [
      {
        label: BASTION_BODY_LABELS.prerequisite,
        value:
          facility.category?.value === 'SPECIAL'
            ? (facility.prerequisite?.name
              ?? BASTION_BODY_LABELS.noPrerequisite)
            : '',
      },
      { label: BASTION_BODY_LABELS.space, value: getSpaceText(facility) },
      {
        label: BASTION_BODY_LABELS.hirelings,
        value: facility.hirelings?.toString() ?? '',
      },
      {
        label: BASTION_BODY_LABELS.orders,
        value: (facility.orders ?? []).map((order) => order.name).join(', '),
      },
      {
        label: BASTION_BODY_LABELS.repeatable,
        value: facility.repeatable ? BASTION_BODY_LABELS.yes : '',
      },
    ].filter((row) => row.value),
  );
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-wrap gap-1 rounded-md bg-elevated p-3 italic">
      <span>{{ subtitle }}</span>
    </div>

    <dl
      v-if="rows.length"
      class="flex flex-col gap-2 rounded-lg border border-default bg-muted px-4 py-3"
    >
      <div
        v-for="row in rows"
        :key="row.label"
        class="flex flex-col"
      >
        <dt class="font-semibold text-highlighted">
          {{ row.label }}
        </dt>

        <dd>{{ row.value }}</dd>
      </div>
    </dl>
  </div>
</template>
