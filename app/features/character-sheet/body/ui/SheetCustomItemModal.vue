<script setup lang="ts">
  import type { SelectMenuItem, TabsItem } from '@nuxt/ui';

  import type {
    CustomArmorType,
    CustomInventoryItemDraft,
    CustomInventoryKind,
    InventoryItemBonus,
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
    CUSTOM_ITEM_FIELD_LABELS,
    CUSTOM_ITEM_HEAVY_HINT,
    CUSTOM_ITEM_MAGIC_LABELS,
    CUSTOM_ITEM_MAIN_TAB,
    CUSTOM_ITEM_PREVIEW_NAME,
    CUSTOM_ITEM_PREVIEW_URL,
    CUSTOM_ITEM_SECTION_LABELS,
    CUSTOM_ITEM_TABS,
    CUSTOM_ITEM_VERSATILE_LABELS,
    CUSTOM_ITEM_WEIGHT_MAX,
    CUSTOM_ITEM_WEIGHT_MIN,
    CUSTOM_ITEM_WEIGHT_STEP,
    CUSTOM_WEAPON_PROPERTY_LABELS,
    DAMAGE_BONUS_MAX,
    DAMAGE_BONUS_MIN,
    DAMAGE_DICE_COUNT_MAX,
    DAMAGE_DICE_COUNT_MIN,
    DAMAGE_DIE_OPTIONS,
    DAMAGE_TYPE_OPTIONS,
    getCustomInventoryItemDraft,
    getInventoryBonusMax,
    getInventoryBonusMin,
    getInventoryBonusTargetGroups,
    getInventoryItemBonusLabels,
    INVENTORY_BONUS_ROW_LABELS,
    INVENTORY_CHARGES_MAX,
    INVENTORY_CHARGES_MIN,
    INVENTORY_QUANTITY_MAX,
    INVENTORY_QUANTITY_MIN,
    ITEM_BONUS_MAX,
    ITEM_BONUS_MIN,
    NEW_CUSTOM_INVENTORY_ITEM,
    NEW_INVENTORY_BONUS,
    parseDamageTypeValue,
    parseInventoryBonusTarget,
    parseStoredMarkupNodes,
    toCustomInventoryItem,
    toDamageTypeValue,
    toInventoryBonusTargetValue,
    WEAPON_ATTACK_FINESSE_HINT,
    WEAPON_CATEGORY_OPTIONS,
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

  const draftHeavy = ref(initialDraft.heavy);

  const draftDamageDiceCount = ref(initialDraft.damageDiceCount);

  const draftDamageDiceFaces = ref(initialDraft.damageDiceFaces);

  const draftDamageBonus = ref(initialDraft.damageBonus);

  // Тип урона живёт в форме значением селектора: пустая строка ему запрещена, а
  // «не указан» — такой же вариант списка, которым выбранный тип и сбрасывается.
  const draftDamageType = ref(toDamageTypeValue(initialDraft.damageType));

  const draftVersatile = ref(initialDraft.versatile);

  const draftVersatileDiceCount = ref(initialDraft.versatileDiceCount);

  const draftVersatileDiceFaces = ref(initialDraft.versatileDiceFaces);

  const draftAttackBonus = ref(initialDraft.attackBonus);

  const draftExtraDamageDiceCount = ref(initialDraft.extraDamageDiceCount);

  const draftExtraDamageDiceFaces = ref(initialDraft.extraDamageDiceFaces);

  const draftExtraDamageType = ref(
    toDamageTypeValue(initialDraft.extraDamageType),
  );

  // Бонусы заводятся построчно: у предмета их бывает и ноль, и полдесятка, а
  // цель у каждой своя — от характеристики до конкретной скорости.
  const draftBonuses = ref<InventoryItemBonus[]>(
    initialDraft.bonuses.map((bonus) => ({ ...bonus })),
  );

  const draftRequiresAttunement = ref(initialDraft.requiresAttunement);

  const draftMaxCharges = ref(initialDraft.maxCharges);

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

  const modalTitle = isEditing
    ? CUSTOM_ITEM_FIELD_LABELS.editTitle
    : CUSTOM_ITEM_FIELD_LABELS.createTitle;

  const applyLabel = isEditing
    ? CUSTOM_ITEM_FIELD_LABELS.editAction
    : CUSTOM_ITEM_FIELD_LABELS.createAction;

  const isApplyDisabled = computed(() => !draftName.value.trim());

  const isWeapon = computed(() => draftKind.value === 'weapon');

  const isArmor = computed(() => draftKind.value === 'armor');

  // Подсказка типа доспеха и то, что с ним делать на листе, читаются одной
  // фразой — собирать её в шаблоне значило бы держать текст в разметке.
  const armorHint = computed(
    () =>
      `${CUSTOM_ARMOR_TYPE_META[draftArmorType.value].hint}. ${
        CUSTOM_ITEM_FIELD_LABELS.armorHint
      }`,
  );

  // Щит не заменяет броню, а складывается с ней — подпись поля это проговаривает,
  // иначе «КД 2» у щита читается как полноценный класс доспеха.
  const armorClassLabel = computed(
    () => CUSTOM_ARMOR_TYPE_META[draftArmorType.value].armorClassLabel,
  );

  // Цели сгруппированы по смыслу, а плоский список с заголовками — та форма,
  // в которой их принимает селект.
  const bonusTargetItems = computed<SelectMenuItem[]>(() =>
    getInventoryBonusTargetGroups(character.value).flatMap<SelectMenuItem>(
      (group) => [{ type: 'label', label: group.label }, ...group.items],
    ),
  );

  /**
   * Составное значение цели строки — им селект и обменивается с формой.
   *
   * @param bonus строка бонуса.
   * @returns значение варианта селектора.
   */
  function getBonusTarget(bonus: InventoryItemBonus): string {
    return toInventoryBonusTargetValue(bonus.kind, bonus.key);
  }

  /** Добавление строки бонуса: цель и величина правятся в самой строке. */
  function handleBonusAdd() {
    draftBonuses.value = [
      ...draftBonuses.value,
      { ...NEW_INVENTORY_BONUS, id: crypto.randomUUID() },
    ];
  }

  /**
   * Удаление строки бонуса.
   *
   * @param bonusId идентификатор строки.
   */
  function handleBonusRemove(bonusId: string) {
    draftBonuses.value = draftBonuses.value.filter(
      (bonus) => bonus.id !== bonusId,
    );
  }

  /**
   * Смена цели строки: селект отдаёт значение нетипизированным, поэтому цель
   * разбирается моделью, а неразобранное значение строку не трогает.
   *
   * @param bonusId идентификатор строки.
   * @param target значение варианта селектора.
   */
  function handleBonusTarget(bonusId: string, target: unknown) {
    const parsedTarget =
      typeof target === 'string' ? parseInventoryBonusTarget(target) : null;

    if (!parsedTarget) {
      return;
    }

    draftBonuses.value = draftBonuses.value.map((bonus) =>
      bonus.id === bonusId ? { ...bonus, ...parsedTarget } : bonus,
    );
  }

  /** Поля вкладки «Магические свойства» — они же идут в предпросмотр сводки. */
  type MagicDraftFields = Pick<
    CustomInventoryItemDraft,
    | 'bonuses'
    | 'extraDamageDiceCount'
    | 'extraDamageDiceFaces'
    | 'extraDamageType'
    | 'magic'
    | 'maxCharges'
    | 'requiresAttunement'
  >;

  /**
   * Значения вкладки магии отдельной функцией: сводка «что даёт предмет»
   * пересобирается на каждое их изменение, а разбор описания в ней не нужен —
   * иначе разметка перечитывалась бы на каждое нажатие в редакторе.
   *
   * @returns магические поля черновика.
   */
  function getMagicFields(): MagicDraftFields {
    return {
      magic: draftMagic.value,
      extraDamageDiceCount: draftExtraDamageDiceCount.value,
      extraDamageDiceFaces: draftExtraDamageDiceFaces.value,
      extraDamageType: parseDamageTypeValue(draftExtraDamageType.value),
      bonuses: draftBonuses.value.map((bonus) => ({ ...bonus })),
      requiresAttunement: draftRequiresAttunement.value,
      maxCharges: draftMaxCharges.value,
    };
  }

  /**
   * Значения формы для экшена листа: обрезкой строк, приведением чисел к
   * допустимым диапазонам и сборкой параметров предмета занимается модель —
   * форма отдаёт введённое как есть.
   *
   * @returns черновик своего предмета.
   */
  function getDraft(): CustomInventoryItemDraft {
    return {
      ...getMagicFields(),
      kind: draftKind.value,
      name: draftName.value,
      cost: draftCost.value,
      weight: draftWeight.value,
      quantity: draftQuantity.value,
      armorType: draftArmorType.value,
      baseArmorClass: draftArmorClass.value,
      weaponCategory: draftWeaponCategory.value,
      ranged: draftRanged.value,
      finesse: draftFinesse.value,
      heavy: draftHeavy.value,
      damageDiceCount: draftDamageDiceCount.value,
      damageDiceFaces: draftDamageDiceFaces.value,
      damageBonus: draftDamageBonus.value,
      damageType: parseDamageTypeValue(draftDamageType.value),
      attackBonus: draftAttackBonus.value,
      versatile: draftVersatile.value,
      versatileDiceCount: draftVersatileDiceCount.value,
      versatileDiceFaces: draftVersatileDiceFaces.value,
      description: parseStoredMarkupNodes(draftDescription.value),
    };
  }

  // Сводка собирается той же сборкой записи, что и сохранение: так в ней видно
  // ровно то, что попадёт на лист, — с клампами и отброшенными нулями. Бонус к
  // попаданию задаётся на вкладке основного, но даёт его предмет — и в сводке
  // «что даёт предмет» он нужен наравне с магическими надбавками.
  const bonusLabels = computed(() => {
    const previewItem = toCustomInventoryItem(CUSTOM_ITEM_PREVIEW_URL, {
      ...NEW_CUSTOM_INVENTORY_ITEM,
      ...getMagicFields(),
      kind: draftKind.value,
      name: CUSTOM_ITEM_PREVIEW_NAME,
      attackBonus: draftAttackBonus.value,
    });

    return previewItem ? getInventoryItemBonusLabels(previewItem) : [];
  });

  // Число бонусов стоит значком на вкладке: с закрытой вкладки видно, что
  // магия у предмета заполнена.
  const tabItems = computed<TabsItem[]>(() =>
    CUSTOM_ITEM_TABS.map((tab) => ({
      ...tab,
      badge:
        tab.value === CUSTOM_ITEM_MAIN_TAB || !bonusLabels.value.length
          ? undefined
          : bonusLabels.value.length,
    })),
  );

  // Выключенные поля читаются бледнее — так вкладка сразу говорит, что магия у
  // предмета не включена, а не просто пуста.
  const magicLabelClass = computed(() =>
    draftMagic.value ? 'text-muted' : 'text-dimmed',
  );

  /** Применение формы: новый предмет добавляется, правленый — обновляется. */
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

  /** Закрытие формы без сохранения. */
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
      <!-- Две вкладки вместо одной длинной формы: у большинства предметов магии
        нет, и их параметры не должны тонуть среди её полей -->
      <UTabs
        :items="tabItems"
        :default-value="CUSTOM_ITEM_MAIN_TAB"
        :ui="{ root: 'flex flex-col gap-4' }"
      >
        <template #main>
          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-1">
              <span class="text-[10px] font-bold text-muted uppercase">
                {{ CUSTOM_ITEM_FIELD_LABELS.kind }}
              </span>

              <!-- Вид предмета решает, какие параметры вообще нужны: оружию —
                урон и категория, доспеху — КД, безделушке — ничего сверх
                общего. В узкой форме ряд видов переносится, а не выжимает
                подписи -->
              <URadioGroup
                v-model="draftKind"
                :items="CUSTOM_INVENTORY_KIND_OPTIONS"
                orientation="horizontal"
                variant="list"
                color="primary"
                :ui="{ fieldset: 'flex-wrap gap-y-2' }"
              />
            </div>

            <!-- Количество уезжает на вторую строку, пока форма узкая: рядом с
              ним названию предмета остаётся слишком мало места -->
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_9rem]">
              <div class="flex min-w-0 flex-col gap-1">
                <span class="text-[10px] font-bold text-muted uppercase">
                  {{ CUSTOM_ITEM_FIELD_LABELS.name }}
                </span>

                <UInput
                  v-model="draftName"
                  :placeholder="CUSTOM_ITEM_FIELD_LABELS.namePlaceholder"
                />
              </div>

              <div class="flex min-w-0 flex-col gap-1">
                <span class="text-[10px] font-bold text-muted uppercase">
                  {{ CUSTOM_ITEM_FIELD_LABELS.quantity }}
                </span>

                <UInputNumber
                  v-model="draftQuantity"
                  :min="INVENTORY_QUANTITY_MIN"
                  :max="INVENTORY_QUANTITY_MAX"
                />
              </div>
            </div>

            <!-- Параметры вида собраны в карточку с заголовком: так видно, где
              кончается общее и начинается «оружейное» -->
            <div
              v-if="isWeapon"
              class="flex flex-col gap-3 rounded-lg border border-default/60 p-3"
            >
              <span class="text-[10px] font-bold text-muted uppercase">
                {{ CUSTOM_ITEM_SECTION_LABELS.weapon }}
              </span>

              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div class="flex min-w-0 flex-col gap-1">
                  <span class="text-[10px] font-bold text-muted uppercase">
                    {{ CUSTOM_ITEM_FIELD_LABELS.weaponCategory }}
                  </span>

                  <USelect
                    v-model="draftWeaponCategory"
                    :items="WEAPON_CATEGORY_OPTIONS"
                  />
                </div>

                <div class="flex min-w-0 flex-col gap-1">
                  <span class="text-[10px] font-bold text-muted uppercase">
                    {{ CUSTOM_ITEM_FIELD_LABELS.damageType }}
                  </span>

                  <USelect
                    v-model="draftDamageType"
                    :items="DAMAGE_TYPE_OPTIONS"
                  />
                </div>
              </div>

              <div class="flex flex-col gap-1">
                <span class="text-[10px] font-bold text-muted uppercase">
                  {{ CUSTOM_ITEM_FIELD_LABELS.damage }}
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
                  {{ CUSTOM_ITEM_FIELD_LABELS.damageHint }}
                </span>
              </div>

              <!-- Собственный бонус к попаданию стоит рядом с уроном, а не в
                магии: чаще его даёт магическое оружие, но задать его игроку
                бывает нужно и обычному — например, мастерски выкованному -->
              <div class="flex flex-col gap-1">
                <span class="text-[10px] font-bold text-muted uppercase">
                  {{ CUSTOM_ITEM_FIELD_LABELS.attackBonus }}
                </span>

                <UInputNumber
                  v-model="draftAttackBonus"
                  :min="ITEM_BONUS_MIN"
                  :max="ITEM_BONUS_MAX"
                  class="w-26"
                />

                <span class="text-xs text-dimmed">
                  {{ CUSTOM_ITEM_FIELD_LABELS.attackBonusHint }}
                </span>
              </div>

              <div class="flex flex-col gap-1">
                <span class="text-[10px] font-bold text-muted uppercase">
                  {{ CUSTOM_ITEM_SECTION_LABELS.properties }}
                </span>

                <div class="flex flex-wrap items-center gap-4">
                  <UCheckbox
                    v-model="draftRanged"
                    :label="CUSTOM_WEAPON_PROPERTY_LABELS.ranged"
                  />

                  <UCheckbox
                    v-model="draftFinesse"
                    :label="CUSTOM_WEAPON_PROPERTY_LABELS.finesse"
                  />

                  <!-- «Тяжёлое» бонус атаки не меняет: оно добавляет помеху,
                    пока характеристики не хватает, — поэтому стоит рядом с
                    остальными свойствами, а не в полях урона -->
                  <UCheckbox
                    v-model="draftHeavy"
                    :label="CUSTOM_WEAPON_PROPERTY_LABELS.heavy"
                  />

                  <!-- Хват двумя руками даёт именно «Универсальное»: у
                    остального оружия вторая рука урон не меняет -->
                  <UCheckbox
                    v-model="draftVersatile"
                    :label="CUSTOM_ITEM_VERSATILE_LABELS.label"
                  />
                </div>

                <span class="text-xs text-dimmed">
                  {{ WEAPON_ATTACK_FINESSE_HINT }}
                </span>

                <span
                  v-if="draftHeavy"
                  class="text-xs text-dimmed"
                >
                  {{ CUSTOM_ITEM_HEAVY_HINT }}
                </span>
              </div>

              <div
                v-if="draftVersatile"
                class="flex flex-col gap-1"
              >
                <span class="text-[10px] font-bold text-muted uppercase">
                  {{ CUSTOM_ITEM_VERSATILE_LABELS.damage }}
                </span>

                <div class="flex items-center gap-2">
                  <UInputNumber
                    v-model="draftVersatileDiceCount"
                    :min="DAMAGE_DICE_COUNT_MIN"
                    :max="DAMAGE_DICE_COUNT_MAX"
                    class="w-26"
                  />

                  <USelect
                    v-model="draftVersatileDiceFaces"
                    :items="DAMAGE_DIE_OPTIONS"
                    class="w-22"
                  />
                </div>

                <span class="text-xs text-dimmed">
                  {{ CUSTOM_ITEM_VERSATILE_LABELS.hint }}
                </span>
              </div>
            </div>

            <div
              v-if="isArmor"
              class="flex flex-col gap-3 rounded-lg border border-default/60 p-3"
            >
              <span class="text-[10px] font-bold text-muted uppercase">
                {{ CUSTOM_ITEM_SECTION_LABELS.armor }}
              </span>

              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div class="flex min-w-0 flex-col gap-1">
                  <span class="text-[10px] font-bold text-muted uppercase">
                    {{ CUSTOM_ITEM_FIELD_LABELS.armorType }}
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

              <span class="text-xs text-dimmed">{{ armorHint }}</span>
            </div>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div class="flex min-w-0 flex-col gap-1">
                <span class="text-[10px] font-bold text-muted uppercase">
                  {{ CUSTOM_ITEM_FIELD_LABELS.cost }}
                </span>

                <UInput
                  v-model="draftCost"
                  :placeholder="CUSTOM_ITEM_FIELD_LABELS.costPlaceholder"
                />
              </div>

              <div class="flex min-w-0 flex-col gap-1">
                <span class="text-[10px] font-bold text-muted uppercase">
                  {{ CUSTOM_ITEM_FIELD_LABELS.weight }}
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
                {{ CUSTOM_ITEM_FIELD_LABELS.description }}
              </span>

              <MarkupEditor
                v-model="draftDescription"
                :placeholder="CUSTOM_ITEM_FIELD_LABELS.descriptionPlaceholder"
              />
            </div>
          </div>
        </template>

        <template #magic>
          <div class="flex flex-col gap-4">
            <!-- Переключатель открывает поля вкладки: они остаются на виду и
              выключенными, чтобы было понятно, что предмету можно задать, — а
              не появлялись из ниоткуда вместе с галкой -->
            <div class="rounded-lg bg-elevated/40 p-3">
              <USwitch
                v-model="draftMagic"
                :label="CUSTOM_ITEM_MAGIC_LABELS.enable"
                :description="CUSTOM_ITEM_MAGIC_LABELS.enableHint"
              />
            </div>

            <!-- Дальше вкладка идёт одинаковыми карточками: настройка, бонусы
              оружия и бонусы листа — так поля не сливаются в один столбец -->
            <div
              class="flex flex-col gap-3 rounded-lg border border-default/60 p-3"
            >
              <span
                class="text-[10px] font-bold uppercase"
                :class="magicLabelClass"
              >
                {{ CUSTOM_ITEM_MAGIC_LABELS.attunementSection }}
              </span>

              <UCheckbox
                v-model="draftRequiresAttunement"
                :label="CUSTOM_ITEM_MAGIC_LABELS.attunement"
                :disabled="!draftMagic"
              />

              <div class="flex min-w-0 flex-col gap-1">
                <span
                  class="text-[10px] font-bold uppercase"
                  :class="magicLabelClass"
                >
                  {{ CUSTOM_ITEM_MAGIC_LABELS.charges }}
                </span>

                <UInputNumber
                  v-model="draftMaxCharges"
                  :min="INVENTORY_CHARGES_MIN"
                  :max="INVENTORY_CHARGES_MAX"
                  :disabled="!draftMagic"
                  class="w-40"
                />

                <span class="text-xs text-dimmed">
                  {{ CUSTOM_ITEM_MAGIC_LABELS.chargesHint }}
                </span>
              </div>
            </div>

            <!-- Дополнительный урон нужен только оружию: у плаща и кольца
              своего броска урона нет, и пустые поля сбивали бы с толку сильнее,
              чем их отсутствие -->
            <div
              v-if="isWeapon"
              class="flex flex-col gap-3 rounded-lg border border-default/60 p-3"
            >
              <span
                class="text-[10px] font-bold uppercase"
                :class="magicLabelClass"
              >
                {{ CUSTOM_ITEM_MAGIC_LABELS.weaponSection }}
              </span>

              <div class="flex flex-col gap-1">
                <span class="text-[10px] text-dimmed uppercase">
                  {{ CUSTOM_ITEM_MAGIC_LABELS.extraDamage }}
                </span>

                <div class="flex flex-wrap items-center gap-2">
                  <UInputNumber
                    v-model="draftExtraDamageDiceCount"
                    :min="DAMAGE_DICE_COUNT_MIN"
                    :max="DAMAGE_DICE_COUNT_MAX"
                    :disabled="!draftMagic"
                    class="w-26"
                  />

                  <USelect
                    v-model="draftExtraDamageDiceFaces"
                    :items="DAMAGE_DIE_OPTIONS"
                    :disabled="!draftMagic"
                    class="w-22"
                  />

                  <USelect
                    v-model="draftExtraDamageType"
                    :items="DAMAGE_TYPE_OPTIONS"
                    :disabled="!draftMagic"
                    class="min-w-0 grow basis-40"
                  />
                </div>

                <span class="text-xs text-dimmed">
                  {{ CUSTOM_ITEM_MAGIC_LABELS.extraDamageHint }}
                </span>
              </div>
            </div>

            <!-- Бонусы заводятся по одному: цель выбирается из общего списка
              (характеристика, проверка, навык, спасбросок, скорость, защита),
              поэтому форма не растёт под каждую новую цель -->
            <div
              class="flex flex-col gap-3 rounded-lg border border-default/60 p-3"
            >
              <span
                class="text-[10px] font-bold uppercase"
                :class="magicLabelClass"
              >
                {{ CUSTOM_ITEM_MAGIC_LABELS.sheetSection }}
              </span>

              <div
                v-for="bonus in draftBonuses"
                :key="bonus.id"
                class="flex flex-wrap items-center gap-2"
              >
                <USelectMenu
                  :model-value="getBonusTarget(bonus)"
                  :items="bonusTargetItems"
                  value-key="value"
                  :placeholder="INVENTORY_BONUS_ROW_LABELS.targetPlaceholder"
                  :search-input="{
                    placeholder: INVENTORY_BONUS_ROW_LABELS.searchPlaceholder,
                  }"
                  :disabled="!draftMagic"
                  class="min-w-0 grow basis-48"
                  @update:model-value="handleBonusTarget(bonus.id, $event)"
                />

                <UInputNumber
                  v-model="bonus.value"
                  :min="getInventoryBonusMin(bonus)"
                  :max="getInventoryBonusMax(bonus)"
                  :disabled="!draftMagic"
                  class="w-32 shrink-0"
                />

                <!-- Корзина красная, как во всех остальных списках листа -->
                <UTooltip :text="INVENTORY_BONUS_ROW_LABELS.remove">
                  <UButton
                    icon="tabler:trash"
                    color="error"
                    variant="ghost"
                    size="xs"
                    square
                    :disabled="!draftMagic"
                    class="shrink-0"
                    :aria-label="INVENTORY_BONUS_ROW_LABELS.remove"
                    @click.left.exact.prevent="handleBonusRemove(bonus.id)"
                  />
                </UTooltip>
              </div>

              <!-- Кнопка во всю ширину с пунктиром: она же место будущей
                строки, поэтому пустому списку отдельной подписи не нужно -->
              <UButton
                :label="INVENTORY_BONUS_ROW_LABELS.add"
                icon="tabler:plus"
                color="neutral"
                variant="ghost"
                size="sm"
                block
                :disabled="!draftMagic"
                class="border border-dashed border-default hover:border-primary hover:text-primary"
                @click.left.exact.prevent="handleBonusAdd"
              />

              <span class="text-xs text-dimmed">
                {{ CUSTOM_ITEM_MAGIC_LABELS.bonusesHint }}
              </span>
            </div>

            <!-- Сводка внизу вкладки: числа в полях разрозненны, а здесь видно
              ровно то, что предмет добавит листу -->
            <div class="flex flex-col gap-2 rounded-lg bg-elevated/40 p-3">
              <span
                class="text-[10px] font-bold uppercase"
                :class="magicLabelClass"
              >
                {{ CUSTOM_ITEM_MAGIC_LABELS.summary }}
              </span>

              <div
                v-if="bonusLabels.length"
                class="flex flex-wrap items-center gap-1.5"
              >
                <UBadge
                  v-for="bonusLabel in bonusLabels"
                  :key="bonusLabel"
                  size="sm"
                  color="primary"
                  variant="subtle"
                >
                  {{ bonusLabel }}
                </UBadge>
              </div>

              <span
                v-else
                class="text-xs text-dimmed"
              >
                {{ CUSTOM_ITEM_MAGIC_LABELS.summaryEmpty }}
              </span>

              <span class="text-xs text-dimmed">
                {{ CUSTOM_ITEM_MAGIC_LABELS.hint }}
              </span>
            </div>
          </div>
        </template>
      </UTabs>
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
