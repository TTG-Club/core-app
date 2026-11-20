<script setup lang="ts">
  import type {
    AbilityKey,
    Character,
    CharacterArmorClass,
    CharacterCustomBonus,
  } from '../../model';

  import { ACTION_LABELS } from '~/shared/consts';

  import { useCharacterSheet } from '../../composables';
  import {
    ABILITY_OPTIONS,
    ARMOR_CLASS_BASE_MAX,
    ARMOR_CLASS_BASE_MIN,
    ARMOR_CLASS_LABELS,
    ARMOR_DEX_LIMIT_OPTIONS,
    ARMOR_DEX_LIMIT_RULE_VALUE,
    DEFAULT_ARMOR_CLASS_ABILITY,
    getArmorClassBreakdown,
    getArmorClassBreakdownRows,
    getArmorDexCappedLabel,
    getUnarmoredArmorClassLabel,
    toSelectedAbilityKeys,
  } from '../../model';
  import SheetCustomBonusRows from './SheetCustomBonusRows.vue';

  const { sheetKey } = defineProps<{
    /** Ключ открытого листа: с каким листом работает компонент. */
    sheetKey: string;
  }>();

  const emit = defineEmits<{
    close: [];
  }>();

  const { character, setArmorClass } = useCharacterSheet(sheetKey);

  const draftBase = ref(character.value.armorClass.base);

  const draftAbilities = ref<AbilityKey[]>([
    ...character.value.armorClass.abilities,
  ]);

  const draftNatural = ref(character.value.armorClass.natural);

  const draftCustom = ref(character.value.armorClass.custom);

  const draftDexLimit = ref<number | null>(character.value.armorClass.dexLimit);

  // Черновик правится до «Применить»: копируются и сами записи бонусов — иначе
  // правки уходили бы в лист мимо кнопки.
  const draftBonuses = ref<CharacterCustomBonus[]>(
    character.value.armorClass.bonuses.map((bonus) => ({ ...bonus })),
  );

  const draftArmorClass = computed<CharacterArmorClass>(() => ({
    base: draftBase.value,
    abilities: draftAbilities.value,
    natural: draftNatural.value,
    dexLimit: draftDexLimit.value,
    custom: draftCustom.value,
    bonuses: draftBonuses.value,
  }));

  // Персонаж черновика: и ручной, и автоматический предпросмотр считаются той же
  // утилитой, что и лист, — расхождению правил взяться негде.
  const draftCharacter = computed<Character>(() => ({
    ...character.value,
    armorClass: draftArmorClass.value,
  }));

  const breakdown = computed(() =>
    getArmorClassBreakdown(draftCharacter.value),
  );

  // Строки разбора с названием источника: щит, предметы, черты, эффекты, свои
  // бонусы и характеристики сверх доспеха.
  const breakdownRows = computed(() =>
    getArmorClassBreakdownRows(breakdown.value),
  );

  const abilitiesHint = computed(() => {
    if (draftCustom.value) {
      return draftAbilities.value.length
        ? ARMOR_CLASS_LABELS.abilitiesCustomHint
        : ARMOR_CLASS_LABELS.abilitiesCustomEmptyHint;
    }

    return draftAbilities.value.length
      ? ARMOR_CLASS_LABELS.abilitiesArmorHint
      : ARMOR_CLASS_LABELS.abilitiesArmorEmptyHint;
  });

  const bodyArmorLabel = computed(
    () =>
      breakdown.value.bodyArmorName
      ?? getUnarmoredArmorClassLabel(draftAbilities.value),
  );

  const dexCappedHint = computed(() => getArmorDexCappedLabel(breakdown.value));

  // Предел режет только бонус Ловкости от доспеха: без Ловкости в характеристиках
  // и в ручном режиме настройке нечего ограничивать.
  const showDexLimit = computed(
    () =>
      !draftCustom.value
      && draftAbilities.value.includes(DEFAULT_ARMOR_CLASS_ABILITY),
  );

  const dexLimitValue = computed(() =>
    draftDexLimit.value === null
      ? ARMOR_DEX_LIMIT_RULE_VALUE
      : String(draftDexLimit.value),
  );

  // В ручном режиме без выбранных характеристик между настройками и итогом
  // показывать нечего: разделитель там только сдвоил бы линию.
  const hasBreakdownRows = computed(
    () => !draftCustom.value || breakdownRows.value.length > 0,
  );

  function handleAbilities(value: unknown): void {
    draftAbilities.value = toSelectedAbilityKeys(value);
  }

  // Числом в списке заданы только свои пределы, поэтому нечисловое значение —
  // это вариант «по правилу доспеха» (`null` в записи листа).
  function handleDexLimit(value: unknown): void {
    const limit = Number(value);

    draftDexLimit.value = Number.isInteger(limit) ? limit : null;
  }

  function handleApply() {
    setArmorClass(draftArmorClass.value);

    emit('close');
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal :title="ARMOR_CLASS_LABELS.title">
    <template #body>
      <div class="flex flex-col gap-3">
        <UCheckbox
          v-model="draftCustom"
          :label="ARMOR_CLASS_LABELS.customToggle"
          :description="ARMOR_CLASS_LABELS.customToggleHint"
        />

        <USeparator class="my-1" />

        <div
          v-if="draftCustom"
          class="flex items-center justify-between gap-4"
        >
          <span class="text-sm text-toned">
            {{ ARMOR_CLASS_LABELS.valueTitle }}
          </span>

          <UInputNumber
            v-model="draftBase"
            :min="ARMOR_CLASS_BASE_MIN"
            :max="ARMOR_CLASS_BASE_MAX"
            class="w-40"
          />
        </div>

        <div class="flex items-center justify-between gap-4">
          <span class="text-sm text-toned">
            {{ ARMOR_CLASS_LABELS.abilitiesTitle }}
          </span>

          <USelectMenu
            :model-value="draftAbilities"
            :items="ABILITY_OPTIONS"
            :placeholder="ARMOR_CLASS_LABELS.abilitiesPlaceholder"
            label-key="label"
            value-key="value"
            multiple
            class="w-56"
            @update:model-value="handleAbilities"
          />
        </div>

        <div
          v-if="showDexLimit"
          class="flex items-center justify-between gap-4"
        >
          <span class="text-sm text-toned">
            {{ ARMOR_CLASS_LABELS.dexLimitTitle }}
          </span>

          <USelect
            :model-value="dexLimitValue"
            :items="ARMOR_DEX_LIMIT_OPTIONS"
            class="w-56"
            @update:model-value="handleDexLimit"
          />
        </div>

        <p class="text-xs text-dimmed">{{ abilitiesHint }}</p>

        <div
          v-if="draftCustom"
          class="flex items-center justify-between gap-4"
        >
          <span class="text-sm text-toned">
            {{ ARMOR_CLASS_LABELS.armorTypeTitle }}
          </span>

          <UCheckbox
            v-model="draftNatural"
            :label="ARMOR_CLASS_LABELS.naturalArmor"
          />
        </div>

        <USeparator class="my-1" />

        <!-- Свои бонусы разделом, как в окнах характеристики и спасбросков:
             пометка нужна, чтобы в разборе было видно, откуда прибавка -->
        <div class="flex flex-col gap-2">
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ ARMOR_CLASS_LABELS.bonusesTitle }}
          </span>

          <SheetCustomBonusRows
            v-model="draftBonuses"
            :character="draftCharacter"
            toggleable
          />

          <p class="text-xs text-dimmed">
            {{ ARMOR_CLASS_LABELS.bonusesHint }}
          </p>
        </div>

        <USeparator
          v-if="hasBreakdownRows"
          class="my-1"
        />

        <template v-if="!draftCustom">
          <div class="flex items-center justify-between gap-4 text-sm">
            <span class="text-toned">{{ ARMOR_CLASS_LABELS.armorTitle }}</span>

            <span class="text-toned">
              {{ bodyArmorLabel }}

              <span class="text-muted">· {{ breakdown.bodyArmorValue }}</span>
            </span>
          </div>

          <div
            v-if="breakdown.dexCapped"
            class="text-xs text-dimmed"
          >
            {{ dexCappedHint }}
          </div>
        </template>

        <!-- Каждая прибавка своей строкой и с названием источника: игрок видит,
             что +2 дал «Щит», а +1 — «Плащ защиты», а не общую сумму. Черты,
             эффекты и свои бонусы идут и в ручном режиме. -->
        <div
          v-for="row in breakdownRows"
          :key="row.id"
          class="flex items-center justify-between gap-4 text-sm"
        >
          <span class="min-w-0 text-toned">
            {{ row.label }}

            <span
              v-if="row.name"
              class="text-muted"
            >
              · {{ row.name }}
            </span>
          </span>

          <span class="shrink-0 text-toned">
            {{ row.formattedValue }}
          </span>
        </div>

        <USeparator class="my-1" />

        <div class="flex items-center justify-between text-sm">
          <span class="text-muted">{{ ARMOR_CLASS_LABELS.totalTitle }}</span>

          <span class="text-xl font-bold text-highlighted">
            {{ breakdown.value }}
          </span>
        </div>

        <p
          v-if="!draftCustom"
          class="text-xs text-dimmed"
        >
          {{ ARMOR_CLASS_LABELS.equipmentHint }}
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="ACTION_LABELS.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleCancel"
        />

        <UButton
          :label="ACTION_LABELS.apply"
          color="primary"
          @click.left.exact.prevent="handleApply"
        />
      </div>
    </template>
  </UModal>
</template>
