<script setup lang="ts">
  import type { CreatureInventoryItem } from '../../model';

  import { EditorArrayControls } from '~ui/editor';
  import { SelectItem, SelectMagicItem } from '~ui/select';

  import { getEmptyCreatureInventoryItem } from '../../model';
  import {
    CREATURE_INVENTORY_EDITOR,
    CREATURE_INVENTORY_SECTION_OPTIONS,
    MIN_CREATURE_INVENTORY_QUANTITY,
  } from '../constants';

  /**
   * Инвентарь существа: позиции карточками сайта и своя свободная строка.
   *
   * Позиции заводят руками — по ним виртуальный стол кладёт предмет в сумку
   * существа со своим весом, стоимостью и боевыми полями. Строка идёт рядом, а
   * не вместо них: в ней количества словами и то, чему карточки нет.
   */
  const model = defineModel<Array<CreatureInventoryItem>>({ required: true });

  /** Свободная строка инвентаря */
  const text = defineModel<string | undefined>('text');

  /** Снаряжение строкой из старого импорта — запасной вид показа */
  const legacyEquipments = defineModel<string | undefined>('legacyEquipments');

  /**
   * Снимок названия карточки. Название могло измениться после сохранения, но
   * запасным видом оно нужно: карточку могли и удалить.
   *
   * @param inventoryItem - позиция инвентаря
   * @param refs - выбранные карточки с их названиями
   */
  function setInventoryItemName(
    inventoryItem: CreatureInventoryItem,
    refs: Array<{ url: string; name: string }>,
  ): void {
    inventoryItem.name = refs[0]?.name;
  }

  /**
   * Смена справочника обнуляет выбор: слаг обычного предмета в магических не
   * ищется, и молча оставленная ссылка вела бы в никуда.
   *
   * @param inventoryItem - позиция инвентаря
   */
  function resetInventoryItemSelection(
    inventoryItem: CreatureInventoryItem,
  ): void {
    inventoryItem.url = undefined;
    inventoryItem.name = undefined;
  }

  /** Заводит первую позицию: у пустого списка строк с управлением ещё нет. */
  function addFirstItem(): void {
    model.value.push(getEmptyCreatureInventoryItem());
  }
</script>

<template>
  <UCard
    variant="subtle"
    class="col-span-full"
  >
    <template #header>
      <h2 class="truncate text-base text-highlighted">
        {{ CREATURE_INVENTORY_EDITOR.title }}
      </h2>
    </template>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
      <UForm
        v-for="(inventoryItem, index) in model"
        :key="index"
        class="col-span-full grid grid-cols-1 gap-4 md:grid-cols-24"
        attach
        :state="inventoryItem"
      >
        <UFormField
          class="col-span-full md:col-span-5"
          :label="CREATURE_INVENTORY_EDITOR.section"
          name="section"
        >
          <USelect
            v-model="inventoryItem.section"
            :items="CREATURE_INVENTORY_SECTION_OPTIONS"
            value-key="value"
            class="w-full"
            @update:model-value="resetInventoryItemSelection(inventoryItem)"
          />
        </UFormField>

        <UFormField
          class="col-span-full md:col-span-7"
          :label="CREATURE_INVENTORY_EDITOR.item"
          name="url"
        >
          <SelectMagicItem
            v-if="inventoryItem.section === 'magic-items'"
            v-model="inventoryItem.url"
            @select="setInventoryItemName(inventoryItem, $event)"
          />

          <SelectItem
            v-else
            v-model="inventoryItem.url"
            @select="setInventoryItemName(inventoryItem, $event)"
          />
        </UFormField>

        <UFormField
          class="col-span-full md:col-span-3"
          :label="CREATURE_INVENTORY_EDITOR.quantity"
          name="quantity"
        >
          <UInputNumber
            v-model="inventoryItem.quantity"
            :placeholder="CREATURE_INVENTORY_EDITOR.quantityPlaceholder"
            :min="MIN_CREATURE_INVENTORY_QUANTITY"
          />
        </UFormField>

        <UFormField
          class="col-span-full md:col-span-5"
          :label="CREATURE_INVENTORY_EDITOR.description"
          name="description"
          :help="CREATURE_INVENTORY_EDITOR.descriptionHelp"
        >
          <UInput
            v-model="inventoryItem.description"
            :placeholder="CREATURE_INVENTORY_EDITOR.descriptionPlaceholder"
          />
        </UFormField>

        <EditorArrayControls
          v-model="model"
          :item="inventoryItem"
          :empty-object="getEmptyCreatureInventoryItem()"
          :index="index"
          cols="4"
        />
      </UForm>

      <div
        v-if="!model.length"
        class="col-span-full flex justify-center"
      >
        <UButton
          :label="CREATURE_INVENTORY_EDITOR.addItem"
          @click.left.exact.prevent="addFirstItem"
        />
      </div>

      <UFormField
        class="col-span-full"
        :label="CREATURE_INVENTORY_EDITOR.text"
        name="inventoryText"
        :help="CREATURE_INVENTORY_EDITOR.textHelp"
      >
        <UInput
          v-model="text"
          :placeholder="CREATURE_INVENTORY_EDITOR.textPlaceholder"
        />
      </UFormField>

      <UFormField
        class="col-span-full"
        :label="CREATURE_INVENTORY_EDITOR.legacy"
        name="equipments"
        :help="CREATURE_INVENTORY_EDITOR.legacyHelp"
      >
        <UInput
          v-model="legacyEquipments"
          :placeholder="CREATURE_INVENTORY_EDITOR.legacyPlaceholder"
        />
      </UFormField>
    </div>
  </UCard>
</template>
