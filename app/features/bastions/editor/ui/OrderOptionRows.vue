<script setup lang="ts">
  import type { BastionOrderCode, FacilityOrderOptionForm } from '../../model';

  import { cloneDeep } from 'es-toolkit';

  import { BASTION_EDITOR_LABELS, EMPTY_ORDER_OPTION } from '../../model';
  import EditorRowsCard from './EditorRowsCard.vue';

  /**
   * Варианты приказов сооружения. Приказ варианта выбирается только из тех,
   * что сооружение принимает: вариант чужого приказа мини-игре не отдать.
   */
  const { orderItems } = defineProps<{
    orderItems: Array<{ label: string; value: BastionOrderCode }>;
  }>();

  const model = defineModel<Array<FacilityOrderOptionForm>>({ required: true });

  /** Добавляет вариант; если приказ у сооружения один — сразу с ним. */
  function addOption(): void {
    const onlyOrder =
      orderItems.length === 1 ? orderItems[0]?.value : undefined;

    model.value = [
      ...model.value,
      { ...cloneDeep(EMPTY_ORDER_OPTION), order: onlyOrder },
    ];
  }

  /**
   * Удаляет вариант.
   *
   * @param index - Номер строки
   */
  function removeOption(index: number): void {
    model.value = model.value.filter((_, position) => position !== index);
  }
</script>

<template>
  <EditorRowsCard
    :title="BASTION_EDITOR_LABELS.ordersTitle"
    :hint="BASTION_EDITOR_LABELS.orderOptionsHint"
    :empty="BASTION_EDITOR_LABELS.orderOptionsEmpty"
    :add-label="BASTION_EDITOR_LABELS.addOrderOption"
    :count="model.length"
    @add="addOption"
  >
    <div
      v-for="(option, index) in model"
      :key="index"
      class="grid grid-cols-1 items-end gap-3 rounded-lg bg-elevated/40 p-2 md:grid-cols-24"
    >
      <UFormField
        class="md:col-span-5"
        :label="BASTION_EDITOR_LABELS.order"
      >
        <USelect
          v-model="option.order"
          :items="orderItems"
          value-key="value"
          class="w-full"
        />
      </UFormField>

      <UFormField
        class="md:col-span-7"
        :label="BASTION_EDITOR_LABELS.optionName"
      >
        <UInput
          v-model="option.name"
          :placeholder="BASTION_EDITOR_LABELS.optionNamePlaceholder"
          class="w-full"
        />
      </UFormField>

      <UFormField
        class="md:col-span-3"
        :label="BASTION_EDITOR_LABELS.days"
      >
        <UInputNumber
          v-model="option.days"
          :min="0"
          class="w-full"
        />
      </UFormField>

      <UFormField
        class="md:col-span-3"
        :label="BASTION_EDITOR_LABELS.cost"
      >
        <UInputNumber
          v-model="option.cost"
          :min="0"
          class="w-full"
        />
      </UFormField>

      <UFormField
        class="md:col-span-3"
        :label="BASTION_EDITOR_LABELS.minLevel"
      >
        <UInputNumber
          v-model="option.minLevel"
          :min="1"
          :max="20"
          class="w-full"
        />
      </UFormField>

      <div class="flex justify-end md:col-span-3">
        <UButton
          icon="tabler:trash"
          color="error"
          variant="ghost"
          size="xs"
          :aria-label="BASTION_EDITOR_LABELS.remove"
          @click.left.exact.prevent="removeOption(index)"
        />
      </div>

      <UFormField
        class="md:col-span-24"
        :label="BASTION_EDITOR_LABELS.costNote"
      >
        <UInput
          v-model="option.costNote"
          :placeholder="BASTION_EDITOR_LABELS.costNotePlaceholder"
          class="w-full"
        />
      </UFormField>

      <UFormField
        class="md:col-span-24"
        :label="BASTION_EDITOR_LABELS.optionDescription"
      >
        <UTextarea
          v-model="option.description"
          :rows="2"
          autoresize
          class="w-full"
        />
      </UFormField>
    </div>
  </EditorRowsCard>
</template>
