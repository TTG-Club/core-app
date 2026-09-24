<script setup lang="ts">
  import type { BastionFacilityDetailResponse } from '../../model';

  import { MarkupRender } from '~ui/markup';

  import { BASTION_BODY_LABELS, getOrderOptionTerms } from '../../model';

  const { facility } = defineProps<{
    facility: BastionFacilityDetailResponse;
  }>();

  /** Подписи приказов по коду: у варианта хранится только код. */
  const orderNames = computed(
    () =>
      new Map(
        (facility.orders ?? []).map((order) => [order.value, order.name]),
      ),
  );

  const options = computed(() =>
    (facility.orderOptions ?? []).map((option, index) => ({
      key: `${option.order}-${index}`,
      title: [
        option.order ? orderNames.value.get(option.order) : undefined,
        option.name,
      ]
        .filter(Boolean)
        .join(': '),
      terms: getOrderOptionTerms(option),
      description: option.description,
    })),
  );
</script>

<template>
  <section
    v-if="options.length"
    class="flex flex-col gap-2"
  >
    <h3 class="text-lg font-semibold text-highlighted">
      {{ BASTION_BODY_LABELS.orderOptionsTitle }}
    </h3>

    <div
      v-for="option in options"
      :key="option.key"
      class="flex flex-col gap-1 rounded-lg bg-elevated/50 p-3"
    >
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <span class="font-semibold text-highlighted">{{ option.title }}</span>

        <UBadge
          v-if="option.terms"
          color="neutral"
          variant="subtle"
        >
          {{ option.terms }}
        </UBadge>
      </div>

      <MarkupRender
        v-if="option.description"
        :render-node="option.description"
      />
    </div>
  </section>
</template>
