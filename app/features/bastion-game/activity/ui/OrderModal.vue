<script setup lang="ts">
  import type {
    BastionOrderCode,
    FacilityOrderOptionDetail,
    PlayerBastion,
    PlayerBastionFacility,
  } from '../../model';

  import { UiModalActions } from '~ui/modal-actions';

  import { useBastionAction } from '../../composables';
  import {
    ACTIVITY_LABELS,
    fetchFacilityOrderOptions,
    getOptionTermsText,
    giveBastionOrder,
    isBastionOrderCode,
  } from '../../model';

  /**
   * Приказ сооружению: приказ из тех, что сооружение принимает, вариант из
   * справочника со сроком и ценой и пояснение. Цена варианта списывается из
   * казны сразу.
   */
  const isOpen = defineModel<boolean>('open', { required: true });

  const { bastion, facility, characterLevel } = defineProps<{
    bastion: PlayerBastion;
    facility: PlayerBastionFacility;
    characterLevel: number;
  }>();

  const emit = defineEmits<{
    updated: [bastion: PlayerBastion];
  }>();

  const { isRunning, run } = useBastionAction();

  const order = ref<BastionOrderCode>();
  const optionName = ref<string>();
  const note = ref('');
  const options = ref<Array<FacilityOrderOptionDetail>>([]);

  const orderItems = computed(() =>
    facility.orders.flatMap((item) =>
      isBastionOrderCode(item.value)
        ? [{ label: item.name, value: item.value }]
        : [],
    ),
  );

  const optionItems = computed(() =>
    options.value
      .filter(
        (option) =>
          option.order === order.value
          && !!option.name
          && (option.minLevel ?? 0) <= characterLevel,
      )
      .map((option) => ({
        label: `${option.name} — ${getOptionTermsText(option)}`,
        value: option.name ?? '',
      })),
  );

  const selectedOption = computed(() =>
    options.value.find(
      (option) =>
        option.order === order.value && option.name === optionName.value,
    ),
  );

  // Окно живёт вместе со страницей: при открытии — первый приказ сооружения
  // и свежие варианты из справочника.
  watch(isOpen, async (opened) => {
    if (!opened) {
      return;
    }

    order.value = orderItems.value[0]?.value;
    optionName.value = undefined;
    note.value = '';

    options.value = await fetchFacilityOrderOptions(facility.facilityUrl).catch(
      () => [],
    );
  });

  watch(order, () => {
    optionName.value = undefined;
  });

  /** Отдаёт приказ. */
  async function submit(): Promise<void> {
    const code = order.value;

    if (!code) {
      return;
    }

    const updated = await run(
      () =>
        giveBastionOrder(bastion.id, {
          facilityId: facility.id,
          order: code,
          optionName: optionName.value,
          note: note.value.trim() || undefined,
        }),
      ACTIVITY_LABELS.orderGiven,
    );

    if (updated) {
      emit('updated', updated);
      isOpen.value = false;
    }
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="ACTIVITY_LABELS.giveOrderTitle"
    :description="facility.name"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <UFormField :label="ACTIVITY_LABELS.order">
          <USelect
            id="bastion-order-code"
            v-model="order"
            :items="orderItems"
            value-key="value"
            class="w-full"
          />
        </UFormField>

        <UFormField
          v-if="optionItems.length"
          :label="ACTIVITY_LABELS.option"
        >
          <USelect
            id="bastion-order-option"
            v-model="optionName"
            :items="optionItems"
            value-key="value"
            :placeholder="ACTIVITY_LABELS.optionPlaceholder"
            class="w-full"
          />
        </UFormField>

        <p
          v-if="selectedOption?.description"
          class="text-sm text-muted"
        >
          {{ selectedOption.description }}
        </p>

        <UFormField :label="ACTIVITY_LABELS.note">
          <UTextarea
            id="bastion-order-note"
            v-model="note"
            :rows="2"
            autoresize
            :placeholder="ACTIVITY_LABELS.notePlaceholder"
            class="w-full"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <UiModalActions
        :cancel-label="ACTIVITY_LABELS.cancelAction"
        :submit-label="ACTIVITY_LABELS.submitOrder"
        submit-icon="tabler:check"
        :loading="isRunning"
        :disabled="!order"
        @cancel="isOpen = false"
        @submit="submit"
      />
    </template>
  </UModal>
</template>
