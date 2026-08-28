<script setup lang="ts">
  import type { EquipmentItemCreate, EquipmentOptionCreate } from './types';

  import { SelectItem } from '~ui/select';

  import EditorArrayControls from '../EditorArrayControls.vue';
  import {
    DEFAULT_EQUIPMENT_OPTIONS_COUNT,
    EQUIPMENT_OPTION_LABELS,
    MIN_EQUIPMENT_COINS,
    MIN_EQUIPMENT_ITEM_QUANTITY,
    STARTING_EQUIPMENT_EDITOR,
  } from './constants';

  const state = defineModel<Array<EquipmentOptionCreate>>({
    required: true,
  });

  // Сущность без снаряжения открывается с двумя пустыми вариантами — «А» и «Б».
  // Предметы в варианте не заводятся сами: пустой вариант показывает только
  // кнопку «Добавить предмет». Guard разрывает цикл — после подстановки
  // вариантов условие перестаёт выполняться, повторного присвоения нет.
  watch(
    state,
    (options) => {
      if (options.length) {
        return;
      }

      state.value = Array.from(
        { length: DEFAULT_EQUIPMENT_OPTIONS_COUNT },
        getEmptyEquipmentOption,
      );
    },
    { immediate: true, deep: false },
  );

  /** Пустой вариант снаряжения: без предметов и без монет. */
  function getEmptyEquipmentOption(): EquipmentOptionCreate {
    return { items: [], coins: undefined };
  }

  /**
   * Пустая строка предмета внутри варианта снаряжения: количество сразу
   * минимально допустимое, иначе автор сохранял бы предмет без количества.
   */
  function getEmptyEquipmentItem(): EquipmentItemCreate {
    return {
      url: undefined,
      quantity: MIN_EQUIPMENT_ITEM_QUANTITY,
      description: undefined,
    };
  }

  /** Добавляет новый пустой вариант снаряжения в конец списка. */
  function addEmptyEquipmentOption(): void {
    state.value.push(getEmptyEquipmentOption());
  }

  /** Удаляет вариант снаряжения вместе со всеми его предметами. */
  function removeEquipmentOption(optionIndex: number): void {
    state.value.splice(optionIndex, 1);
  }

  /** Добавляет пустую строку предмета в указанный вариант снаряжения. */
  function addEmptyEquipmentItem(option: EquipmentOptionCreate): void {
    option.items.push(getEmptyEquipmentItem());
  }

  /** Метка варианта по его порядку: «А», «Б», … — так же, как её выводит API. */
  function getEquipmentOptionLabel(optionIndex: number): string {
    return EQUIPMENT_OPTION_LABELS[optionIndex] ?? String(optionIndex + 1);
  }
</script>

<template>
  <UCard variant="subtle">
    <template #header>
      <div class="flex items-center justify-between gap-4">
        <h2 class="truncate text-base text-highlighted">
          {{ STARTING_EQUIPMENT_EDITOR.title }}
        </h2>

        <UButton
          icon="tabler:plus"
          variant="subtle"
          :label="STARTING_EQUIPMENT_EDITOR.addOption"
          @click.left.exact.prevent="addEmptyEquipmentOption"
        />
      </div>
    </template>

    <div class="flex flex-col gap-4">
      <UCard
        v-for="(option, optionIndex) in state"
        :key="optionIndex"
        variant="subtle"
      >
        <template #header>
          <div class="flex items-center justify-between gap-4">
            <h3 class="truncate text-sm text-highlighted">
              {{ STARTING_EQUIPMENT_EDITOR.optionTitle }}
              {{ getEquipmentOptionLabel(optionIndex) }}
            </h3>

            <UButton
              icon="tabler:trash"
              variant="subtle"
              color="error"
              :label="STARTING_EQUIPMENT_EDITOR.removeOption"
              @click.left.exact.prevent="removeEquipmentOption(optionIndex)"
            />
          </div>
        </template>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
          <UForm
            v-for="(equipmentItem, itemIndex) in option.items"
            :key="itemIndex"
            class="col-span-full grid grid-cols-1 gap-4 md:grid-cols-24"
            attach
            :state="equipmentItem"
          >
            <UFormField
              class="col-span-full md:col-span-8"
              :label="STARTING_EQUIPMENT_EDITOR.item"
              name="url"
            >
              <SelectItem v-model="equipmentItem.url" />
            </UFormField>

            <UFormField
              class="col-span-full md:col-span-4"
              :label="STARTING_EQUIPMENT_EDITOR.quantity"
              name="quantity"
            >
              <UInputNumber
                v-model="equipmentItem.quantity"
                :placeholder="STARTING_EQUIPMENT_EDITOR.quantityPlaceholder"
                :min="MIN_EQUIPMENT_ITEM_QUANTITY"
              />
            </UFormField>

            <UFormField
              class="col-span-full md:col-span-8"
              :label="STARTING_EQUIPMENT_EDITOR.description"
              name="description"
            >
              <UInput
                v-model="equipmentItem.description"
                :placeholder="STARTING_EQUIPMENT_EDITOR.descriptionPlaceholder"
              />
            </UFormField>

            <EditorArrayControls
              v-model="option.items"
              :item="equipmentItem"
              :empty-object="getEmptyEquipmentItem()"
              :index="itemIndex"
              cols="4"
              only-remove
            />
          </UForm>

          <div
            v-if="!option.items.length"
            class="col-span-full flex justify-center"
          >
            <UButton
              :label="STARTING_EQUIPMENT_EDITOR.addItem"
              @click.left.exact.prevent="addEmptyEquipmentItem(option)"
            />
          </div>

          <USeparator class="col-span-full my-2" />

          <UFormField
            class="col-span-full md:col-span-8"
            :label="STARTING_EQUIPMENT_EDITOR.coins"
            :help="STARTING_EQUIPMENT_EDITOR.coinsHelp"
            name="coins"
          >
            <UInputNumber
              v-model="option.coins"
              :placeholder="STARTING_EQUIPMENT_EDITOR.quantityPlaceholder"
              :min="MIN_EQUIPMENT_COINS"
            />
          </UFormField>
        </div>
      </UCard>

      <div
        v-if="!state.length"
        class="grid place-items-center py-2"
      >
        <UButton
          :label="STARTING_EQUIPMENT_EDITOR.addOption"
          @click.left.exact.prevent="addEmptyEquipmentOption"
        />
      </div>
    </div>
  </UCard>
</template>
