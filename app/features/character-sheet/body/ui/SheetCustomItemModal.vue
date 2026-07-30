<script setup lang="ts">
  import type {
    CustomArmorType,
    CustomInventoryItemDraft,
    CustomInventoryKind,
    WeaponCategory,
  } from '../../model';

  import { MarkupEditor } from '~ui/markup-editor';

  import { useCharacterSheet } from '../../composables';
  import {
    ARMOR_CLASS_BASE_MAX,
    ARMOR_CLASS_BASE_MIN,
    CUSTOM_ARMOR_TYPE_META,
    CUSTOM_ARMOR_TYPE_OPTIONS,
    CUSTOM_INVENTORY_KIND_OPTIONS,
    CUSTOM_ITEM_WEIGHT_MAX,
    CUSTOM_ITEM_WEIGHT_MIN,
    CUSTOM_ITEM_WEIGHT_STEP,
    CUSTOM_MAGIC_ITEM_HINT,
    CUSTOM_MAGIC_ITEM_LABEL,
    DAMAGE_BONUS_MAX,
    DAMAGE_BONUS_MIN,
    DAMAGE_DICE_COUNT_MAX,
    DAMAGE_DICE_COUNT_MIN,
    DAMAGE_DIE_OPTIONS,
    DAMAGE_TYPE_OPTIONS,
    getCustomInventoryItemDraft,
    INVENTORY_QUANTITY_MAX,
    INVENTORY_QUANTITY_MIN,
    NEW_CUSTOM_INVENTORY_ITEM,
    parseStoredMarkupNodes,
    WEAPON_ATTACK_FINESSE_HINT,
    WEAPON_CATEGORY_OPTIONS,
    WEIGHT_UNIT_LABEL,
  } from '../../model';

  // Идентификатор редактируемого предмета; null — форма создаёт новый. Сам
  // предмет модалка достаёт из состояния листа (как `SheetCustomSpellModal`).
  const { inventoryItemId = null } = defineProps<{
    inventoryItemId?: string | null;
  }>();

  const emit = defineEmits<{
    close: [];
  }>();

  const { character, addCustomInventoryItem, updateCustomInventoryItem } =
    useCharacterSheet();

  // Снимок редактируемого предмета на момент открытия: модалка размонтируется
  // при закрытии, поэтому setup выполняется заново на каждое открытие — снимок
  // всегда свежий, а реактивность здесь не нужна (правки применяются по кнопке).
  const editedItem = inventoryItemId
    ? (character.value.inventory.find(
        (inventoryItem) => inventoryItem.id === inventoryItemId,
      ) ?? null)
    : null;

  const initialDraft: CustomInventoryItemDraft = editedItem
    ? getCustomInventoryItemDraft(editedItem)
    : { ...NEW_CUSTOM_INVENTORY_ITEM };

  const draftKind = ref<CustomInventoryKind>(initialDraft.kind);

  const draftName = ref(initialDraft.name);

  const draftMagic = ref(initialDraft.magic);

  const draftCost = ref(initialDraft.cost);

  const draftWeight = ref(initialDraft.weight);

  const draftQuantity = ref(initialDraft.quantity);

  const draftArmorType = ref<CustomArmorType>(initialDraft.armorType);

  const draftArmorClass = ref(initialDraft.baseArmorClass);

  const draftWeaponCategory = ref<WeaponCategory>(initialDraft.weaponCategory);

  const draftRanged = ref(initialDraft.ranged);

  const draftFinesse = ref(initialDraft.finesse);

  const draftDamageDiceCount = ref(initialDraft.damageDiceCount);

  const draftDamageDiceFaces = ref(initialDraft.damageDiceFaces);

  const draftDamageBonus = ref(initialDraft.damageBonus);

  // undefined вместо '' — пустая строка в качестве значения селекта запрещена,
  // а незаполненный тип урона должен показывать подсказку поля.
  const draftDamageType = ref<string | undefined>(
    initialDraft.damageType || undefined,
  );

  // Описание сидируем хранимой формой (JSON-массив узлов) — редактор развернёт
  // её в исходник через `toMarkupSource`. Пустое описание — пустой редактор.
  const draftDescription = ref(
    initialDraft.description.length
      ? JSON.stringify(initialDraft.description)
      : '',
  );

  // Режим модалки задаётся при открытии и больше не меняется — реактивность
  // заголовку и подписи кнопки не нужна.
  const isEditing = Boolean(editedItem);

  const modalTitle = isEditing ? 'Редактирование предмета' : 'Свой предмет';

  const applyLabel = isEditing ? 'Сохранить' : 'Добавить';

  const isApplyDisabled = computed(() => !draftName.value.trim());

  const isWeapon = computed(() => draftKind.value === 'weapon');

  const isArmor = computed(() => draftKind.value === 'armor');

  const armorHint = computed(
    () => CUSTOM_ARMOR_TYPE_META[draftArmorType.value].hint,
  );

  // Щит не заменяет броню, а складывается с ней — подпись поля это проговаривает,
  // иначе «КД 2» у щита читается как полноценный класс доспеха.
  const armorClassLabel = computed(
    () => CUSTOM_ARMOR_TYPE_META[draftArmorType.value].armorClassLabel,
  );

  // Единица измерения веса общая для всего листа — подпись поля её повторяет.
  const weightLabel = `Вес, ${WEIGHT_UNIT_LABEL}`;

  /**
   * Значения формы для экшена листа: обрезкой строк, приведением чисел к
   * допустимым диапазонам и сборкой параметров предмета занимается модель —
   * форма отдаёт введённое как есть.
   *
   * @returns черновик своего предмета.
   */
  function getDraft(): CustomInventoryItemDraft {
    return {
      kind: draftKind.value,
      name: draftName.value,
      magic: draftMagic.value,
      cost: draftCost.value,
      weight: draftWeight.value,
      quantity: draftQuantity.value,
      armorType: draftArmorType.value,
      baseArmorClass: draftArmorClass.value,
      weaponCategory: draftWeaponCategory.value,
      ranged: draftRanged.value,
      finesse: draftFinesse.value,
      damageDiceCount: draftDamageDiceCount.value,
      damageDiceFaces: draftDamageDiceFaces.value,
      damageBonus: draftDamageBonus.value,
      damageType: draftDamageType.value ?? '',
      description: parseStoredMarkupNodes(draftDescription.value),
    };
  }

  function handleApply() {
    if (isApplyDisabled.value) {
      return;
    }

    if (editedItem) {
      updateCustomInventoryItem(editedItem.id, getDraft());
    } else {
      addCustomInventoryItem(getDraft());
    }

    emit('close');
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal
    :title="modalTitle"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <span class="text-[10px] font-bold text-muted uppercase">
            Что за предмет
          </span>

          <!-- Вид предмета решает, какие параметры вообще нужны: оружию — урон
            и категория, доспеху — КД, безделушке — ничего сверх общего. В узкой
            форме ряд видов переносится, а не выжимает подписи -->
          <URadioGroup
            v-model="draftKind"
            :items="CUSTOM_INVENTORY_KIND_OPTIONS"
            orientation="horizontal"
            variant="list"
            color="primary"
            :ui="{ fieldset: 'flex-wrap gap-y-2' }"
          />

          <!-- Магическим бывает предмет любого вида, поэтому пометка стоит
            отдельно от него: она меняет только группу в снаряжении, а урон и
            класс доспеха остаются при предмете -->
          <UCheckbox
            v-model="draftMagic"
            :label="CUSTOM_MAGIC_ITEM_LABEL"
            class="pt-1"
          />

          <span class="text-xs text-dimmed">{{ CUSTOM_MAGIC_ITEM_HINT }}</span>
        </div>

        <!-- Количество уезжает на вторую строку, пока форма узкая: рядом с ним
          названию предмета остаётся слишком мало места -->
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_9rem]">
          <div class="flex min-w-0 flex-col gap-1">
            <span class="text-[10px] font-bold text-muted uppercase">
              Название
            </span>

            <UInput
              v-model="draftName"
              placeholder="Название предмета"
            />
          </div>

          <div class="flex min-w-0 flex-col gap-1">
            <span class="text-[10px] font-bold text-muted uppercase">
              Количество
            </span>

            <UInputNumber
              v-model="draftQuantity"
              :min="INVENTORY_QUANTITY_MIN"
              :max="INVENTORY_QUANTITY_MAX"
            />
          </div>
        </div>

        <template v-if="isWeapon">
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div class="flex min-w-0 flex-col gap-1">
              <span class="text-[10px] font-bold text-muted uppercase">
                Категория
              </span>

              <USelect
                v-model="draftWeaponCategory"
                :items="WEAPON_CATEGORY_OPTIONS"
              />
            </div>

            <div class="flex min-w-0 flex-col gap-1">
              <span class="text-[10px] font-bold text-muted uppercase">
                Тип урона
              </span>

              <USelect
                v-model="draftDamageType"
                :items="DAMAGE_TYPE_OPTIONS"
                placeholder="Не указан"
              />
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <span class="text-[10px] font-bold text-muted uppercase">
              Урон
            </span>

            <!-- Кости и собственный бонус — две группы: в узкой форме они
              переносятся целиком, а не рвут формулу посреди «+» -->
            <div class="flex flex-wrap items-center gap-x-2 gap-y-2">
              <div class="flex items-center gap-2">
                <UInputNumber
                  v-model="draftDamageDiceCount"
                  :min="DAMAGE_DICE_COUNT_MIN"
                  :max="DAMAGE_DICE_COUNT_MAX"
                  class="w-26"
                />

                <USelect
                  v-model="draftDamageDiceFaces"
                  :items="DAMAGE_DIE_OPTIONS"
                  class="w-22"
                />
              </div>

              <div class="flex items-center gap-2">
                <span class="text-sm text-muted">+</span>

                <UInputNumber
                  v-model="draftDamageBonus"
                  :min="DAMAGE_BONUS_MIN"
                  :max="DAMAGE_BONUS_MAX"
                  class="w-26"
                />
              </div>
            </div>

            <span class="text-xs text-dimmed">
              Модификатор характеристики лист добавит сам; ноль костей — оружие
              без броска урона.
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-4">
            <UCheckbox
              v-model="draftRanged"
              label="Дальнобойное"
            />

            <UCheckbox
              v-model="draftFinesse"
              label="Фехтовальное"
            />
          </div>

          <span class="text-xs text-dimmed">
            {{ WEAPON_ATTACK_FINESSE_HINT }}
          </span>
        </template>

        <template v-if="isArmor">
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div class="flex min-w-0 flex-col gap-1">
              <span class="text-[10px] font-bold text-muted uppercase">
                Тип доспеха
              </span>

              <USelect
                v-model="draftArmorType"
                :items="CUSTOM_ARMOR_TYPE_OPTIONS"
              />
            </div>

            <div class="flex min-w-0 flex-col gap-1">
              <span class="text-[10px] font-bold text-muted uppercase">
                {{ armorClassLabel }}
              </span>

              <UInputNumber
                v-model="draftArmorClass"
                :min="ARMOR_CLASS_BASE_MIN"
                :max="ARMOR_CLASS_BASE_MAX"
              />
            </div>
          </div>

          <span class="text-xs text-dimmed">
            {{ armorHint }}. Надеть доспех можно кнопкой в строке снаряжения —
            класс доспеха пересчитается сам.
          </span>
        </template>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div class="flex min-w-0 flex-col gap-1">
            <span class="text-[10px] font-bold text-muted uppercase">
              Стоимость
            </span>

            <UInput
              v-model="draftCost"
              placeholder="Например: 75 зм"
            />
          </div>

          <div class="flex min-w-0 flex-col gap-1">
            <span class="text-[10px] font-bold text-muted uppercase">
              {{ weightLabel }}
            </span>

            <UInputNumber
              v-model="draftWeight"
              :min="CUSTOM_ITEM_WEIGHT_MIN"
              :max="CUSTOM_ITEM_WEIGHT_MAX"
              :step="CUSTOM_ITEM_WEIGHT_STEP"
            />
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <span class="text-[10px] font-bold text-muted uppercase">
            Описание
          </span>

          <MarkupEditor
            v-model="draftDescription"
            placeholder="Опиши предмет"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          label="Отмена"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleCancel"
        />

        <UButton
          :label="applyLabel"
          color="primary"
          :disabled="isApplyDisabled"
          @click.left.exact.prevent="handleApply"
        />
      </div>
    </template>
  </UModal>
</template>
