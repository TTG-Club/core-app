<script setup lang="ts">
  import type { BastionFacilityDetailResponse } from '../../model';

  import { MarkupRender } from '~ui/markup';

  import {
    BASTION_BODY_LABELS,
    fillTemplate,
    getChoiceCountText,
  } from '../../model';

  /**
   * Свойства, выборы и расширение сооружения — всё, что не приказ.
   */
  const { facility } = defineProps<{
    facility: BastionFacilityDetailResponse;
  }>();

  const features = computed(() => facility.features ?? []);
  const choices = computed(() => facility.choices ?? []);

  /** Условия расширения одной строкой: пространство, цена, срок, наёмники. */
  const enlargementTerms = computed(() => {
    const enlargement = facility.enlargement;

    if (!enlargement?.space) {
      return '';
    }

    return [
      enlargement.cost ? `${enlargement.cost} ${BASTION_BODY_LABELS.gold}` : '',
      enlargement.days ? `${enlargement.days} ${BASTION_BODY_LABELS.days}` : '',
      enlargement.additionalHirelings
        ? fillTemplate(BASTION_BODY_LABELS.additionalHirelings, {
            count: enlargement.additionalHirelings,
          })
        : '',
    ]
      .filter(Boolean)
      .join(' · ');
  });
</script>

<template>
  <section
    v-if="features.length"
    class="flex flex-col gap-2"
  >
    <h3 class="text-lg font-semibold text-highlighted">
      {{ BASTION_BODY_LABELS.featuresTitle }}
    </h3>

    <div
      v-for="(feature, index) in features"
      :key="index"
      class="flex flex-col gap-1"
    >
      <span class="font-semibold text-highlighted">{{ feature.name }}</span>

      <MarkupRender
        v-if="feature.description"
        :render-node="feature.description"
      />
    </div>
  </section>

  <section
    v-if="choices.length"
    class="flex flex-col gap-2"
  >
    <h3 class="text-lg font-semibold text-highlighted">
      {{ BASTION_BODY_LABELS.choicesTitle }}
    </h3>

    <div
      v-for="(choice, index) in choices"
      :key="index"
      class="flex flex-col gap-2 rounded-lg bg-elevated/50 p-3"
    >
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <span class="font-semibold text-highlighted">{{ choice.name }}</span>

        <span class="text-sm text-muted">{{ getChoiceCountText(choice) }}</span>
      </div>

      <MarkupRender
        v-if="choice.description"
        :render-node="choice.description"
      />

      <ul class="flex flex-col gap-1">
        <li
          v-for="(option, optionIndex) in choice.options"
          :key="optionIndex"
        >
          <span class="font-semibold">{{ option.name }}.</span>
          {{ option.description }}
        </li>
      </ul>
    </div>
  </section>

  <section
    v-if="enlargementTerms"
    class="flex flex-col gap-1"
  >
    <h3 class="text-lg font-semibold text-highlighted">
      {{ BASTION_BODY_LABELS.enlargementTitle }}
    </h3>

    <span class="text-sm text-muted">{{ enlargementTerms }}</span>

    <MarkupRender
      v-if="facility.enlargement?.description"
      :render-node="facility.enlargement.description"
    />
  </section>
</template>
