<script setup lang="ts">
  import type { EquipmentItemCreate, EquipmentOptionCreate } from './types';

  import { SelectItem } from '~ui/select';

  import EditorArrayControls from '../EditorArrayControls.vue';
  import {
    DEFAULT_EQUIPMENT_OPTIONS_COUNT,
    EQUIPMENT_OPTION_LABELS,
  } from './constants';

  const state = defineModel<Array<EquipmentOptionCreate>>({
    required: true,
  });

  // Сущность без снаряжения открывается с двумя пустыми вариантами — «А» и «Б»,
  // а вариант, пришедший из API без предметов, получает одну пустую строку.
  // Guard разрывает цикл: после нормализации оба условия перестают выполняться,
  // поэтому повторное присвоение state.value не происходит.
  watch(
    state,
    (options) => {
      if (!options.length) {
        state.value = Array.from(
          { length: DEFAULT_EQUIPMENT_OPTIONS_COUNT },
          getEmptyEquipmentOption,
        );

        return;
      }

      if (options.every((option) => option.items.length)) {
        return;
      }

      state.value = options.map((option) =>
        option.items.length
          ? option
          : { ...option, items: [getEmptyEquipmentItem()] },
      );
    },
    { immediate: true, deep: false },
  );

  /** Пустой вариант снаряжения: одна пустая строка предмета и без монет. */
  function getEmptyEquipmentOption(): EquipmentOptionCreate {
    return { items: [getEmptyEquipmentItem()], coins: undefined };
  }

  /** Пустая строка предмета внутри варианта снаряжения. */
  function getEmptyEquipmentItem(): EquipmentItemCreate {
    return { url: undefined, quantity: undefined, description: undefined };
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
          Варианты стартового снаряжения
        </h2>

        <UButton
          icon="tabler:plus"
          variant="subtle"
          @click.left.exact.prevent="addEmptyEquipmentOption"
        >
          Добавить вариант
        </UButton>
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
              Вариант {{ getEquipmentOptionLabel(optionIndex) }}
            </h3>

            <UButton
              icon="tabler:trash"
              variant="subtle"
              color="error"
              @click.left.exact.prevent="removeEquipmentOption(optionIndex)"
            >
              Удалить вариант
            </UButton>
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
              label="Предмет"
              name="url"
            >
              <SelectItem v-model="equipmentItem.url" />
            </UFormField>

            <UFormField
              class="col-span-full md:col-span-4"
              label="Количество"
              name="quantity"
            >
              <UInputNumber
                v-model="equipmentItem.quantity"
                placeholder="Введи количество"
                :min="1"
              />
            </UFormField>

            <UFormField
              class="col-span-full md:col-span-8"
              label="Уточнение"
              name="description"
            >
              <UInput
                v-model="equipmentItem.description"
                placeholder="Например: по вашему выбору"
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
            <UButton @click.left.exact.prevent="addEmptyEquipmentItem(option)">
              Добавить предмет
            </UButton>
          </div>

          <USeparator class="col-span-full my-2" />

          <UFormField
            class="col-span-full md:col-span-8"
            label="Монеты"
            help="Количество золотых монет варианта"
            name="coins"
          >
            <UInputNumber
              v-model="option.coins"
              placeholder="Введи количество"
              :min="0"
            />
          </UFormField>
        </div>
      </UCard>

      <div
        v-if="!state.length"
        class="grid place-items-center py-2"
      >
        <UButton @click.left.exact.prevent="addEmptyEquipmentOption">
          Добавить вариант
        </UButton>
      </div>
    </div>
  </UCard>
</template>
