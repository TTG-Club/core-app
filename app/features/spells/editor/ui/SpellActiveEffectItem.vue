<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type {
    SpellActiveEffect,
    SpellEffectAbility,
    SpellEffectAreaTrigger,
    SpellEffectAuraTarget,
    SpellEffectConditionTemplate,
    SpellEffectDamagePart,
    SpellEffectSaveOutcome,
    SpellEffectSaveTiming,
  } from '../../model';

  import {
    DEFAULT_SPELL_EFFECT_AURA,
    DEFAULT_SPELL_EFFECT_SAVE,
    SPELL_EFFECT_ABILITY_OPTIONS,
    SPELL_EFFECT_AREA_TRIGGER_OPTIONS,
    SPELL_EFFECT_AURA_TARGET_OPTIONS,
    SPELL_EFFECT_CONDITION_OPTIONS,
    SPELL_EFFECT_CONDITION_TEMPLATES,
    SPELL_EFFECT_DURATION_OPTIONS,
    SPELL_EFFECT_DURATION_WITH_VALUE,
    SPELL_EFFECT_ORIGIN_OPTIONS,
    SPELL_EFFECT_SAVE_OUTCOME_OPTIONS,
    SPELL_EFFECT_SAVE_TIMING_OPTIONS,
    SPELL_EFFECT_TARGET_OPTIONS,
  } from '../../model';
  import SpellEffectChanges from './SpellEffectChanges.vue';
  import SpellEffectDamageParts from './SpellEffectDamageParts.vue';
  import SpellEffectFlags from './SpellEffectFlags.vue';

  const model = defineModel<SpellActiveEffect>({ required: true });

  // Заполняет форму данными стандартного состояния D&D 5e, сохраняя id и
  // текущую цель эффекта (как в редакторе эффектов VTTG).
  function applyConditionTemplate(template: SpellEffectConditionTemplate) {
    model.value = {
      ...model.value,
      name: template.name,
      icon: template.icon,
      description: template.description,
      origin: 'condition',
      disabled: false,
      conditionKey: template.key,
      changes: template.changes.map((change) => ({ ...change })),
      flags: [...template.flags],
      duration: { type: 'special' },
      aura: undefined,
    };
  }

  const conditionTemplateItems = computed<Array<Array<DropdownMenuItem>>>(
    () => [
      SPELL_EFFECT_CONDITION_TEMPLATES.map((template) => ({
        label: template.name,
        icon: template.icon,
        onSelect: () => applyConditionTemplate(template),
      })),
    ],
  );

  const tabItems = [
    { label: 'Основное', slot: 'general' as const },
    { label: 'Боевая механика', slot: 'combat' as const },
  ];

  const hasDurationValue = computed(() =>
    SPELL_EFFECT_DURATION_WITH_VALUE.includes(model.value.duration.type),
  );

  // Инвертированный флаг для переключателя «Активен» (хранится как disabled).
  const isActive = computed({
    get: () => !model.value.disabled,
    set: (active) => {
      model.value.disabled = !active;
    },
  });

  // Аура и эффект на цель — взаимоисключающие режимы.
  const isAura = computed({
    get: () => !!model.value.aura,
    set: (enabled) => {
      if (enabled) {
        model.value.aura = { ...DEFAULT_SPELL_EFFECT_AURA };
        model.value.effectTarget = 'self';
      } else {
        model.value.aura = undefined;
      }
    },
  });

  function handleEffectTargetChange(value: 'self' | 'target') {
    model.value.effectTarget = value;

    if (value === 'target') {
      model.value.aura = undefined;
    }
  }

  const auraTarget = computed<SpellEffectAuraTarget>({
    get: () => model.value.aura?.target ?? DEFAULT_SPELL_EFFECT_AURA.target,
    set: (value) => {
      if (model.value.aura) {
        model.value.aura.target = value;
      }
    },
  });

  const areaTrigger = computed<SpellEffectAreaTrigger>({
    get: () => model.value.areaTrigger ?? 'stay',
    set: (value) => {
      model.value.areaTrigger = value === 'stay' ? undefined : value;
    },
  });

  // --- Спасбросок при наложении ---
  const hasApplySave = computed({
    get: () => model.value.applySave !== undefined,
    set: (enabled) => {
      model.value.applySave = enabled
        ? { ...DEFAULT_SPELL_EFFECT_SAVE }
        : undefined;
    },
  });

  const applySaveAbility = computed<SpellEffectAbility>({
    get: () =>
      model.value.applySave?.ability ?? DEFAULT_SPELL_EFFECT_SAVE.ability,
    set: (value) => {
      if (model.value.applySave) {
        model.value.applySave.ability = value;
      }
    },
  });

  const applySaveDc = computed<number>({
    get: () => model.value.applySave?.dc ?? DEFAULT_SPELL_EFFECT_SAVE.dc,
    set: (value) => {
      if (model.value.applySave) {
        model.value.applySave.dc = value;
      }
    },
  });

  const applySaveOnSuccess = computed<SpellEffectSaveOutcome>({
    get: () =>
      model.value.applySave?.onSuccess ?? DEFAULT_SPELL_EFFECT_SAVE.onSuccess,
    set: (value) => {
      if (model.value.applySave) {
        model.value.applySave.onSuccess = value;
      }
    },
  });

  const applyOnSuccess = computed({
    get: () => model.value.applyOnSuccess === true,
    set: (value) => {
      model.value.applyOnSuccess = value ? true : undefined;
    },
  });

  // --- Урон при наложении ---
  const damageParts = computed<Array<SpellEffectDamagePart>>({
    get: () => model.value.damageParts ?? [],
    set: (parts) => {
      model.value.damageParts = parts.length > 0 ? parts : undefined;
    },
  });

  // --- Периодический спасбросок ---
  const hasRecurringSave = computed({
    get: () => model.value.recurringSave !== undefined,
    set: (enabled) => {
      model.value.recurringSave = enabled
        ? {
            ability:
              model.value.applySave?.ability
              ?? DEFAULT_SPELL_EFFECT_SAVE.ability,
            dc: model.value.applySave?.dc ?? DEFAULT_SPELL_EFFECT_SAVE.dc,
            timing: 'endOfTurn',
          }
        : undefined;
    },
  });

  const recurringAbility = computed<SpellEffectAbility>({
    get: () =>
      model.value.recurringSave?.ability ?? DEFAULT_SPELL_EFFECT_SAVE.ability,
    set: (value) => {
      if (model.value.recurringSave) {
        model.value.recurringSave.ability = value;
      }
    },
  });

  const recurringDc = computed<number>({
    get: () => model.value.recurringSave?.dc ?? DEFAULT_SPELL_EFFECT_SAVE.dc,
    set: (value) => {
      if (model.value.recurringSave) {
        model.value.recurringSave.dc = value;
      }
    },
  });

  const recurringTiming = computed<SpellEffectSaveTiming>({
    get: () => model.value.recurringSave?.timing ?? 'endOfTurn',
    set: (value) => {
      if (model.value.recurringSave) {
        model.value.recurringSave.timing = value;
      }
    },
  });

  // --- Периодический урон (DoT) ---
  const hasRecurringDamage = computed({
    get: () => model.value.recurringDamage !== undefined,
    set: (enabled) => {
      model.value.recurringDamage = enabled
        ? { damageParts: [], timing: 'startOfTurn' }
        : undefined;
    },
  });

  const recurringDamageParts = computed<Array<SpellEffectDamagePart>>({
    get: () => model.value.recurringDamage?.damageParts ?? [],
    set: (parts) => {
      if (model.value.recurringDamage) {
        model.value.recurringDamage.damageParts = parts;
      }
    },
  });

  const recurringDamageTiming = computed<SpellEffectSaveTiming>({
    get: () => model.value.recurringDamage?.timing ?? 'startOfTurn',
    set: (value) => {
      if (model.value.recurringDamage) {
        model.value.recurringDamage.timing = value;
      }
    },
  });
</script>

<template>
  <UTabs
    :items="tabItems"
    variant="pill"
  >
    <!-- Вкладка «Основное» -->
    <template #general>
      <div class="grid grid-cols-24 gap-4 pt-2">
        <!-- Быстрое заполнение из стандартного состояния D&D 5e -->
        <div class="col-span-full flex items-center gap-2">
          <UDropdownMenu
            :items="conditionTemplateItems"
            :ui="{ content: 'max-h-72 overflow-y-auto' }"
          >
            <UButton
              icon="tabler:template"
              label="Шаблон состояния"
              color="neutral"
              variant="outline"
              size="xs"
            />
          </UDropdownMenu>

          <span class="text-xs text-dimmed italic">
            Заполнит форму данными стандартного состояния D&D 5e
          </span>
        </div>

        <UFormField
          label="Название"
          class="col-span-full md:col-span-10"
        >
          <UInput
            v-model="model.name"
            placeholder="Название эффекта"
          />
        </UFormField>

        <UFormField
          label="Иконка"
          class="col-span-full md:col-span-8"
        >
          <UInput
            v-model="model.icon"
            placeholder="Напр.: tabler:sparkles"
          />
        </UFormField>

        <UFormField
          label="Источник"
          class="col-span-full md:col-span-6"
        >
          <USelect
            v-model="model.origin"
            :items="SPELL_EFFECT_ORIGIN_OPTIONS"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Описание"
          class="col-span-full"
        >
          <UTextarea
            v-model="model.description"
            :rows="2"
            placeholder="Описание эффекта"
          />
        </UFormField>

        <UFormField
          label="Состояние D&D"
          class="col-span-full md:col-span-8"
        >
          <USelect
            v-model="model.conditionKey"
            :items="SPELL_EFFECT_CONDITION_OPTIONS"
            placeholder="Нет (обычный бафф)"
            clearable
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Цель эффекта"
          class="col-span-12 md:col-span-5"
        >
          <USelect
            :model-value="model.effectTarget ?? 'self'"
            :items="SPELL_EFFECT_TARGET_OPTIONS"
            :disabled="isAura"
            class="w-full"
            @update:model-value="handleEffectTargetChange"
          />
        </UFormField>

        <UFormField
          label="Аура"
          class="col-span-6 flex items-center md:col-span-3"
        >
          <USwitch v-model="isAura" />
        </UFormField>

        <UFormField
          label="Активен"
          class="col-span-6 flex items-center md:col-span-3"
        >
          <USwitch v-model="isActive" />
        </UFormField>

        <UFormField
          label="Перенос при экипировке"
          class="col-span-full flex items-center md:col-span-5"
        >
          <USwitch v-model="model.transfer" />
        </UFormField>

        <!-- Длительность -->
        <UFormField
          label="Длительность"
          class="col-span-full md:col-span-8"
        >
          <USelect
            v-model="model.duration.type"
            :items="SPELL_EFFECT_DURATION_OPTIONS"
            class="w-full"
          />
        </UFormField>

        <UFormField
          v-if="hasDurationValue"
          label="Количество"
          class="col-span-full md:col-span-4"
        >
          <UInputNumber
            v-model="model.duration.value"
            :min="0"
          />
        </UFormField>

        <!-- Аура -->
        <template v-if="isAura && model.aura">
          <UFormField
            label="Радиус ауры (фт)"
            class="col-span-full md:col-span-5"
          >
            <UInputNumber
              v-model="model.aura.radius"
              :min="0"
              :step="5"
            />
          </UFormField>

          <UFormField
            label="Цель ауры"
            class="col-span-full md:col-span-7"
          >
            <USelect
              v-model="auraTarget"
              :items="SPELL_EFFECT_AURA_TARGET_OPTIONS"
              class="w-full"
            />
          </UFormField>

          <UFormField class="col-span-full flex items-end md:col-span-6">
            <UCheckbox
              v-model="model.aura.applyToSelf"
              label="К источнику"
            />
          </UFormField>

          <UFormField class="col-span-full flex items-end md:col-span-6">
            <UCheckbox
              v-model="model.aura.visible"
              label="Круг на сцене"
            />
          </UFormField>
        </template>

        <div class="col-span-full">
          <SpellEffectFlags v-model="model.flags" />
        </div>

        <div class="col-span-full">
          <SpellEffectChanges v-model="model.changes" />
        </div>
      </div>
    </template>

    <!-- Вкладка «Боевая механика» -->
    <template #combat>
      <div class="flex flex-col gap-3 pt-2">
        <p class="text-xs text-dimmed italic">
          Срабатывает при наложении эффекта на цель (напр. при попадании). Для
          само-баффов можно оставить пустым.
        </p>

        <!-- Триггер ауры -->
        <div
          v-if="isAura"
          class="rounded-lg border border-muted bg-elevated/30 p-3"
        >
          <UFormField label="Триггер ауры">
            <USelect
              v-model="areaTrigger"
              :items="SPELL_EFFECT_AREA_TRIGGER_OPTIONS"
              class="w-full"
            />
          </UFormField>
        </div>

        <!-- Спасбросок при наложении -->
        <div class="rounded-lg border border-muted bg-elevated/30 p-3">
          <UCheckbox
            v-model="hasApplySave"
            label="Спасбросок при наложении"
            :ui="{ label: 'font-medium' }"
          />

          <div
            v-if="hasApplySave"
            class="mt-3 grid grid-cols-24 gap-3 border-t border-default/40 pt-3"
          >
            <UFormField
              label="Характеристика"
              class="col-span-full md:col-span-8"
            >
              <USelect
                v-model="applySaveAbility"
                :items="SPELL_EFFECT_ABILITY_OPTIONS"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Сложность (DC)"
              class="col-span-full md:col-span-8"
            >
              <UInputNumber
                v-model="applySaveDc"
                :min="1"
              />
            </UFormField>

            <UFormField
              label="При успехе"
              class="col-span-full md:col-span-8"
            >
              <USelect
                v-model="applySaveOnSuccess"
                :items="SPELL_EFFECT_SAVE_OUTCOME_OPTIONS"
                class="w-full"
              />
            </UFormField>
          </div>

          <div class="mt-3 border-t border-default/40 pt-3">
            <UCheckbox
              v-model="applyOnSuccess"
              label="Накладывать эффект даже при успешном спасе"
            />
          </div>
        </div>

        <!-- Урон при наложении -->
        <div class="rounded-lg border border-muted bg-elevated/30 p-3">
          <div class="mb-2 flex items-center gap-2">
            <UIcon
              name="tabler:flame"
              class="size-4 text-warning"
            />

            <span class="text-sm font-medium">Урон при наложении</span>
          </div>

          <SpellEffectDamageParts v-model="damageParts" />
        </div>

        <!-- Периодический спасбросок -->
        <div class="rounded-lg border border-muted bg-elevated/30 p-3">
          <UCheckbox
            v-model="hasRecurringSave"
            label="Периодический спасбросок снимает эффект"
            :ui="{ label: 'font-medium' }"
          />

          <div
            v-if="hasRecurringSave"
            class="mt-3 grid grid-cols-24 gap-3 border-t border-default/40 pt-3"
          >
            <UFormField
              label="Характеристика"
              class="col-span-full md:col-span-8"
            >
              <USelect
                v-model="recurringAbility"
                :items="SPELL_EFFECT_ABILITY_OPTIONS"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Сложность (DC)"
              class="col-span-full md:col-span-8"
            >
              <UInputNumber
                v-model="recurringDc"
                :min="1"
              />
            </UFormField>

            <UFormField
              label="Когда"
              class="col-span-full md:col-span-8"
            >
              <USelect
                v-model="recurringTiming"
                :items="SPELL_EFFECT_SAVE_TIMING_OPTIONS"
                class="w-full"
              />
            </UFormField>
          </div>
        </div>

        <!-- Периодический урон (DoT) -->
        <div class="rounded-lg border border-muted bg-elevated/30 p-3">
          <UCheckbox
            v-model="hasRecurringDamage"
            label="Периодический урон (каждый ход)"
            :ui="{ label: 'font-medium' }"
          />

          <div
            v-if="hasRecurringDamage"
            class="mt-3 flex flex-col gap-3 border-t border-default/40 pt-3"
          >
            <UFormField label="Когда наносится">
              <USelect
                v-model="recurringDamageTiming"
                :items="SPELL_EFFECT_SAVE_TIMING_OPTIONS"
                class="w-full md:w-1/3"
              />
            </UFormField>

            <SpellEffectDamageParts v-model="recurringDamageParts" />
          </div>
        </div>
      </div>
    </template>
  </UTabs>
</template>
