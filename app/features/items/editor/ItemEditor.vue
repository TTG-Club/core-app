<script setup lang="ts">
  import type { ArmorCreate, ItemCreate, WeaponCreate } from '~items/model';

  import { isPlainObject } from 'es-toolkit';

  import { ItemPreview } from '~items/preview';
  import { EditorBaseInfo, EditorFormControls } from '~ui/editor';
  import { UploadImage } from '~ui/upload';
  import { useWorkshopForm } from '~workshop/composable';

  import {
    ArmorForm,
    CoinsType,
    ItemCategory,
    ItemType,
    WeaponForm,
  } from './ui';

  function getInitialWeapon(): WeaponCreate {
    return {
      category: undefined,
      damage: {
        roll: { diceCount: undefined, dice: undefined, bonus: undefined },
        type: undefined,
      },
      properties: [],
      mastery: undefined,
      range: { normal: undefined, max: undefined },
      versatile: { diceCount: undefined, dice: undefined, bonus: undefined },
      ammo: undefined,
      additional: undefined,
    };
  }

  function getInitialArmor(): ArmorCreate {
    return {
      category: undefined,
      armorClass: undefined,
      mod: undefined,
      strength: undefined,
      stealth: false,
    };
  }

  function getInitialState(): ItemCreate {
    return {
      url: '',
      name: {
        rus: '',
        eng: '',
        alt: [],
      },
      source: {
        url: undefined,
        page: undefined,
      },
      srdVersion: undefined,
      description: '',
      category: 'ITEM',
      types: [],
      cost: undefined,
      coin: undefined,
      weight: undefined,
      image: undefined,
      tags: [],
      weapon: getInitialWeapon(),
      armor: getInitialArmor(),
    };
  }

  /**
   * Бэкенд может вернуть weapon/armor как null (или с пропущенными вложенными
   * объектами). Убираем такие значения, чтобы при слиянии применились дефолты
   * из getInitialState и форма не падала при переключении категории.
   */
  function normalizeLoaded(
    raw: Record<string, unknown>,
  ): Record<string, unknown> {
    const normalized = { ...raw };

    if (!isPlainObject(normalized.weapon)) {
      delete normalized.weapon;
    }

    if (!isPlainObject(normalized.armor)) {
      delete normalized.armor;
    }

    return normalized;
  }

  /**
   * Отправляем только подходящую категории подформу: для оружия — weapon,
   * для доспеха — armor, иначе пустые объекты, чтобы не сохранять чужие данные.
   */
  function transformBeforeSubmit(state: ItemCreate): ItemCreate {
    return {
      ...state,
      weapon: state.category === 'WEAPON' ? state.weapon : getInitialWeapon(),
      armor: state.category === 'ARMOR' ? state.armor : getInitialArmor(),
    };
  }

  const { state, onError, onSubmit } = useWorkshopForm<ItemCreate>({
    actionUrl: '/api/v2/item',
    getInitialState,
    normalizeLoaded,
    transformBeforeSubmit,
  });
</script>

<template>
  <UForm
    ref="formRef"
    :state
    class="grid gap-8 pb-24"
    @error="onError"
    @submit="onSubmit"
  >
    <EditorBaseInfo
      v-model="state"
      section="items"
    />

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">Подробности</h2>
      </template>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
        <UFormField
          class="md:col-span-24"
          label="Категория предмета"
          tooltip="Выберите категорию предмета"
          name="category"
        >
          <ItemCategory v-model="state.category" />
        </UFormField>

        <UFormField
          class="md:col-span-24"
          label="Типы предмета"
          tooltip="Введите типы"
          name="types"
        >
          <ItemType
            v-model="state.types"
            multiple
          />
        </UFormField>

        <UFormField
          class="md:col-span-8"
          label="Количество монет"
          tooltip="Введите количество монет"
          name="cost"
        >
          <UInput
            v-model="state.cost"
            :precision="0"
            placeholder="Введи количество монет"
            min="0"
          />
        </UFormField>

        <UFormField
          class="md:col-span-8"
          label="Номинал монет"
          tooltip="Выберите номинал"
          name="coin"
        >
          <CoinsType v-model="state.coin" />
        </UFormField>

        <UFormField
          class="md:col-span-8"
          label="Вес"
          name="weight"
        >
          <UInput
            v-model="state.weight"
            placeholder="Введи вес"
          />
        </UFormField>
      </div>
    </UCard>

    <WeaponForm
      v-if="state.category === 'WEAPON'"
      v-model="state.weapon"
    />

    <ArmorForm
      v-if="state.category === 'ARMOR'"
      v-model="state.armor"
    />

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">Описание</h2>
      </template>

      <UFormField
        label="Описание"
        name="description"
      >
        <UTextarea
          v-model="state.description"
          :rows="8"
          placeholder="Введи описание"
          allow-clear
        />
      </UFormField>
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">Изображения</h2>
      </template>

      <UFormField
        label="Основное"
        tooltip="Эта картинка отображается при просмотре страницы предмета"
        name="image"
      >
        <UploadImage
          v-model="state.image"
          section="item"
          max-size="480"
        />
      </UFormField>
    </UCard>

    <EditorFormControls>
      <template #preview="{ opened, changeVisibility }">
        <ItemPreview
          :open="opened"
          :state="state"
          @update:open="changeVisibility"
        />
      </template>
    </EditorFormControls>
  </UForm>
</template>
