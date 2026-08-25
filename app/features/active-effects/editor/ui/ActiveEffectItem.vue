<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type {
    ActiveEffect,
    EffectAbility,
    EffectAreaTrigger,
    EffectAttackTrigger,
    EffectAuraTarget,
    EffectConditionKey,
    EffectConditionTemplate,
    EffectDamagePart,
    EffectSaveOutcome,
    EffectSaveTiming,
    EffectTurnAnchor,
    EffectTurnTiming,
  } from '../../model';

  import {
    ACTIVE_EFFECT_LABELS,
    DEFAULT_EFFECT_AURA,
    DEFAULT_EFFECT_SAVE,
    describeActiveEffect,
    EFFECT_ABILITY_OPTIONS,
    EFFECT_AREA_TRIGGER_OPTIONS,
    EFFECT_AURA_TARGET_OPTIONS,
    EFFECT_CONDITION_OPTIONS,
    EFFECT_CONDITION_TEMPLATES,
    EFFECT_CONSUME_ON_NONE,
    EFFECT_CONSUME_ON_OPTIONS,
    EFFECT_DURATION_OPTIONS,
    EFFECT_DURATION_WITH_VALUE,
    EFFECT_ORIGIN,
    EFFECT_SAVE_OUTCOME_OPTIONS,
    EFFECT_SAVE_TIMING_OPTIONS,
    EFFECT_TARGET_OPTIONS,
    EFFECT_TURN_ANCHOR_OPTIONS,
    EFFECT_TURN_TIMING_OPTIONS,
  } from '../../model';
  import EffectChanges from './EffectChanges.vue';
  import EffectDamageParts from './EffectDamageParts.vue';
  import EffectFlags from './EffectFlags.vue';

  const model = defineModel<ActiveEffect>({ required: true });

  // Заполняет форму данными стандартного состояния D&D 5e, сохраняя id и
  // текущую цель эффекта (как в редакторе эффектов VTTG).
  function applyConditionTemplate(template: EffectConditionTemplate) {
    model.value = {
      ...model.value,
      name: template.name,
      icon: template.icon,
      description: template.description,
      origin: EFFECT_ORIGIN.condition,
      disabled: false,
      conditionKey: template.key,
      changes: template.changes.map((change) => ({ ...change })),
      flags: [...template.flags],
      conditionImmunities: template.conditionImmunities
        ? [...template.conditionImmunities]
        : undefined,
      duration: { type: 'special' },
      aura: undefined,
    };
  }

  const conditionTemplateItems = computed<Array<Array<DropdownMenuItem>>>(
    () => [
      EFFECT_CONDITION_TEMPLATES.map((template) => ({
        label: template.name,
        icon: template.icon,
        onSelect: () => applyConditionTemplate(template),
      })),
    ],
  );

  /**
   * Описание, собранное из текущих настроек эффекта. Пустое — описывать нечего,
   * и кнопка «Сгенерировать» гасится.
   */
  const generatedDescription = computed(() =>
    describeActiveEffect(model.value),
  );

  function applyGeneratedDescription() {
    model.value = { ...model.value, description: generatedDescription.value };
  }

  const tabItems = [
    { label: ACTIVE_EFFECT_LABELS.tabGeneral, slot: 'general' as const },
    { label: ACTIVE_EFFECT_LABELS.tabCombat, slot: 'combat' as const },
  ];

  const hasDurationValue = computed(() =>
    EFFECT_DURATION_WITH_VALUE.includes(model.value.duration.type),
  );

  /** Точная «ходовая» длительность: до начала/конца хода носителя либо кастера. */
  const isTurnDuration = computed(() => model.value.duration.type === 'turn');

  const turnAnchor = computed<EffectTurnAnchor>({
    get: () => model.value.duration.turnAnchor ?? 'carrier',
    set: (value) => {
      model.value.duration.turnAnchor = value;
    },
  });

  const turnTiming = computed<EffectTurnTiming>({
    get: () => model.value.duration.turnTiming ?? 'end',
    set: (value) => {
      model.value.duration.turnTiming = value;
    },
  });

  /** Одноразовость на броске атаки: «нет» хранится как пустое поле. */
  const consumeOn = computed<
    EffectAttackTrigger | typeof EFFECT_CONSUME_ON_NONE
  >({
    get: () => model.value.consumeOn ?? EFFECT_CONSUME_ON_NONE,
    set: (value) => {
      model.value.consumeOn =
        value === 'carrierAttack' || value === 'attackOnCarrier'
          ? value
          : undefined;
    },
  });

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
        model.value.aura = { ...DEFAULT_EFFECT_AURA };
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

  const auraTarget = computed<EffectAuraTarget>({
    get: () => model.value.aura?.target ?? DEFAULT_EFFECT_AURA.target,
    set: (value) => {
      if (model.value.aura) {
        model.value.aura.target = value;
      }
    },
  });

  const areaTrigger = computed<EffectAreaTrigger>({
    get: () => model.value.areaTrigger ?? 'stay',
    set: (value) => {
      model.value.areaTrigger = value === 'stay' ? undefined : value;
    },
  });

  // Подсказка под выбором триггера ауры (как в редакторе эффектов VTTG).
  const areaTriggerDescription = computed(() => {
    switch (areaTrigger.value) {
      case 'enter':
        return ACTIVE_EFFECT_LABELS.areaTriggerEnterHint;
      case 'exit':
        return ACTIVE_EFFECT_LABELS.areaTriggerExitHint;
      default:
        return ACTIVE_EFFECT_LABELS.areaTriggerStayHint;
    }
  });

  // --- Спасбросок при наложении ---
  const hasApplySave = computed({
    get: () => model.value.applySave !== undefined,
    set: (enabled) => {
      model.value.applySave = enabled ? { ...DEFAULT_EFFECT_SAVE } : undefined;
    },
  });

  const applySaveAbility = computed<EffectAbility>({
    get: () => model.value.applySave?.ability ?? DEFAULT_EFFECT_SAVE.ability,
    set: (value) => {
      if (model.value.applySave) {
        model.value.applySave.ability = value;
      }
    },
  });

  const applySaveDc = computed<number>({
    get: () => model.value.applySave?.dc ?? DEFAULT_EFFECT_SAVE.dc,
    set: (value) => {
      if (model.value.applySave) {
        model.value.applySave.dc = value;
      }
    },
  });

  const applySaveOnSuccess = computed<EffectSaveOutcome>({
    get: () =>
      model.value.applySave?.onSuccess ?? DEFAULT_EFFECT_SAVE.onSuccess,
    set: (value) => {
      if (model.value.applySave) {
        model.value.applySave.onSuccess = value;
      }
    },
  });

  // «Даже при успехе» и «только при успехе» — взаимоисключающие: вместе они не
  // читаются, и движок всё равно выбрал бы одно.
  const applyOnSuccess = computed({
    get: () => model.value.applyOnSuccess === true,
    set: (value) => {
      model.value.applyOnSuccess = value ? true : undefined;

      if (value) {
        model.value.applyOnSuccessOnly = undefined;
      }
    },
  });

  const applyOnSuccessOnly = computed({
    get: () => model.value.applyOnSuccessOnly === true,
    set: (value) => {
      model.value.applyOnSuccessOnly = value ? true : undefined;

      if (value) {
        model.value.applyOnSuccess = undefined;
      }
    },
  });

  // --- Иммунитет к состояниям ---
  const conditionImmunities = computed<Array<EffectConditionKey>>({
    get: () => model.value.conditionImmunities ?? [],
    set: (keys) => {
      model.value.conditionImmunities = keys.length > 0 ? keys : undefined;
    },
  });

  // --- Урон при наложении ---
  const damageParts = computed<Array<EffectDamagePart>>({
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
              model.value.applySave?.ability ?? DEFAULT_EFFECT_SAVE.ability,
            dc: model.value.applySave?.dc ?? DEFAULT_EFFECT_SAVE.dc,
            timing: 'endOfTurn',
          }
        : undefined;
    },
  });

  const recurringAbility = computed<EffectAbility>({
    get: () =>
      model.value.recurringSave?.ability ?? DEFAULT_EFFECT_SAVE.ability,
    set: (value) => {
      if (model.value.recurringSave) {
        model.value.recurringSave.ability = value;
      }
    },
  });

  const recurringDc = computed<number>({
    get: () => model.value.recurringSave?.dc ?? DEFAULT_EFFECT_SAVE.dc,
    set: (value) => {
      if (model.value.recurringSave) {
        model.value.recurringSave.dc = value;
      }
    },
  });

  const recurringTiming = computed<EffectSaveTiming>({
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

  const recurringDamageParts = computed<Array<EffectDamagePart>>({
    get: () => model.value.recurringDamage?.damageParts ?? [],
    set: (parts) => {
      if (model.value.recurringDamage) {
        model.value.recurringDamage.damageParts = parts;
      }
    },
  });

  const recurringDamageTiming = computed<EffectSaveTiming>({
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
              :label="ACTIVE_EFFECT_LABELS.conditionTemplate"
              color="neutral"
              variant="outline"
              size="xs"
            />
          </UDropdownMenu>

          <span class="text-xs text-dimmed italic">
            {{ ACTIVE_EFFECT_LABELS.conditionTemplateHint }}
          </span>
        </div>

        <UFormField
          :label="ACTIVE_EFFECT_LABELS.name"
          class="col-span-full md:col-span-10"
        >
          <UInput
            v-model="model.name"
            :placeholder="ACTIVE_EFFECT_LABELS.namePlaceholder"
          />
        </UFormField>

        <UFormField
          :label="ACTIVE_EFFECT_LABELS.icon"
          class="col-span-full md:col-span-14"
        >
          <UInput
            v-model="model.icon"
            :placeholder="ACTIVE_EFFECT_LABELS.iconPlaceholder"
          />
        </UFormField>

        <UFormField
          class="col-span-full"
          name="description"
        >
          <template #label>
            <div class="flex w-full items-center justify-between gap-2">
              <span>{{ ACTIVE_EFFECT_LABELS.description }}</span>

              <UButton
                icon="tabler:wand"
                size="xs"
                variant="outline"
                color="neutral"
                :disabled="!generatedDescription"
                :title="ACTIVE_EFFECT_LABELS.generateHint"
                @click.left.exact.prevent="applyGeneratedDescription"
              >
                {{ ACTIVE_EFFECT_LABELS.generate }}
              </UButton>
            </div>
          </template>

          <UTextarea
            v-model="model.description"
            :rows="2"
            autoresize
            :placeholder="ACTIVE_EFFECT_LABELS.descriptionPlaceholder"
          />
        </UFormField>

        <UFormField
          :label="ACTIVE_EFFECT_LABELS.effectTarget"
          class="col-span-12 md:col-span-5"
        >
          <USelect
            :model-value="model.effectTarget ?? 'self'"
            :items="EFFECT_TARGET_OPTIONS"
            :disabled="isAura"
            class="w-full"
            @update:model-value="handleEffectTargetChange"
          />
        </UFormField>

        <UFormField
          :label="ACTIVE_EFFECT_LABELS.aura"
          class="col-span-6 flex items-center md:col-span-3"
        >
          <USwitch v-model="isAura" />
        </UFormField>

        <UFormField
          :label="ACTIVE_EFFECT_LABELS.active"
          class="col-span-6 flex items-center md:col-span-3"
        >
          <USwitch v-model="isActive" />
        </UFormField>

        <UFormField
          :label="ACTIVE_EFFECT_LABELS.transfer"
          class="col-span-full flex items-center md:col-span-5"
        >
          <USwitch v-model="model.transfer" />
        </UFormField>

        <!-- Длительность -->
        <UFormField
          :label="ACTIVE_EFFECT_LABELS.duration"
          class="col-span-full md:col-span-8"
        >
          <USelect
            v-model="model.duration.type"
            :items="EFFECT_DURATION_OPTIONS"
            class="w-full"
          />
        </UFormField>

        <UFormField
          v-if="hasDurationValue"
          :label="ACTIVE_EFFECT_LABELS.durationValue"
          class="col-span-full md:col-span-4"
        >
          <UInputNumber
            v-model="model.duration.value"
            :min="0"
          />
        </UFormField>

        <!-- Точная «ходовая» длительность: момент и чей ход -->
        <template v-if="isTurnDuration">
          <UFormField
            :label="ACTIVE_EFFECT_LABELS.durationTurn"
            :help="ACTIVE_EFFECT_LABELS.durationTurnHint"
            class="col-span-full md:col-span-8"
          >
            <div class="flex w-full items-center gap-2">
              <USelect
                v-model="turnTiming"
                :items="EFFECT_TURN_TIMING_OPTIONS"
                class="flex-1"
              />

              <USelect
                v-model="turnAnchor"
                :items="EFFECT_TURN_ANCHOR_OPTIONS"
                class="flex-1"
              />
            </div>
          </UFormField>
        </template>

        <!-- Одноразовость на броске атаки -->
        <UFormField
          :label="ACTIVE_EFFECT_LABELS.consumeOn"
          :help="ACTIVE_EFFECT_LABELS.consumeOnHint"
          class="col-span-full md:col-span-12"
        >
          <USelect
            v-model="consumeOn"
            :items="EFFECT_CONSUME_ON_OPTIONS"
            class="w-full"
          />
        </UFormField>

        <!-- Аура -->
        <template v-if="isAura && model.aura">
          <UFormField
            :label="ACTIVE_EFFECT_LABELS.auraRadius"
            class="col-span-full md:col-span-5"
          >
            <UInputNumber
              v-model="model.aura.radius"
              :min="0"
              :step="5"
            />
          </UFormField>

          <UFormField
            :label="ACTIVE_EFFECT_LABELS.auraTarget"
            class="col-span-full md:col-span-7"
          >
            <USelect
              v-model="auraTarget"
              :items="EFFECT_AURA_TARGET_OPTIONS"
              class="w-full"
            />
          </UFormField>

          <UFormField class="col-span-full flex items-end md:col-span-6">
            <UCheckbox
              v-model="model.aura.applyToSelf"
              :label="ACTIVE_EFFECT_LABELS.auraApplyToSelf"
            />
          </UFormField>

          <UFormField class="col-span-full flex items-end md:col-span-6">
            <UCheckbox
              v-model="model.aura.visible"
              :label="ACTIVE_EFFECT_LABELS.auraVisible"
            />
          </UFormField>
        </template>

        <div class="col-span-full">
          <EffectFlags v-model="model.flags" />
        </div>

        <div class="col-span-full">
          <EffectChanges v-model="model.changes" />
        </div>
      </div>
    </template>

    <!-- Вкладка «Боевая механика» -->
    <template #combat>
      <div class="flex flex-col gap-3 pt-2">
        <p class="text-xs text-dimmed italic">
          {{ ACTIVE_EFFECT_LABELS.combatHint }}
        </p>

        <!-- Триггер ауры -->
        <div
          v-if="isAura"
          class="rounded-lg border border-default bg-elevated/30 p-3"
        >
          <UFormField :label="ACTIVE_EFFECT_LABELS.areaTrigger">
            <USelect
              v-model="areaTrigger"
              :items="EFFECT_AREA_TRIGGER_OPTIONS"
              class="w-full"
            />
          </UFormField>

          <p class="mt-1.5 text-xs text-muted">
            {{ areaTriggerDescription }}
          </p>
        </div>

        <!-- Спасбросок при наложении -->
        <div class="rounded-lg border border-default bg-elevated/30 p-3">
          <UCheckbox
            v-model="hasApplySave"
            :label="ACTIVE_EFFECT_LABELS.applySave"
            :ui="{ label: 'font-medium' }"
          />

          <p class="mt-1.5 text-xs text-muted">
            {{ ACTIVE_EFFECT_LABELS.applySaveHint }}
          </p>

          <div
            v-if="hasApplySave"
            class="mt-3 grid grid-cols-24 gap-3 border-t border-default/40 pt-3"
          >
            <UFormField
              :label="ACTIVE_EFFECT_LABELS.ability"
              class="col-span-full md:col-span-8"
            >
              <USelect
                v-model="applySaveAbility"
                :items="EFFECT_ABILITY_OPTIONS"
                class="w-full"
              />
            </UFormField>

            <UFormField
              :label="ACTIVE_EFFECT_LABELS.saveDc"
              class="col-span-full md:col-span-8"
            >
              <UInputNumber
                v-model="applySaveDc"
                :min="1"
              />
            </UFormField>

            <UFormField
              :label="ACTIVE_EFFECT_LABELS.saveEffect"
              class="col-span-full md:col-span-8"
            >
              <USelect
                v-model="applySaveOnSuccess"
                :items="EFFECT_SAVE_OUTCOME_OPTIONS"
                class="w-full"
              />
            </UFormField>
          </div>

          <div class="mt-3 border-t border-default/40 pt-3">
            <UCheckbox
              v-model="applyOnSuccess"
              :label="ACTIVE_EFFECT_LABELS.applyOnSuccess"
            />

            <p class="mt-1.5 text-xs text-muted">
              {{ ACTIVE_EFFECT_LABELS.applyOnSuccessHint }}
            </p>

            <UCheckbox
              v-model="applyOnSuccessOnly"
              class="mt-3"
              :label="ACTIVE_EFFECT_LABELS.applyOnSuccessOnly"
            />

            <p class="mt-1.5 text-xs text-muted">
              {{ ACTIVE_EFFECT_LABELS.applyOnSuccessOnlyHint }}
            </p>
          </div>
        </div>

        <!-- Урон при наложении -->
        <div
          class="space-y-2 rounded-lg border border-default bg-elevated/30 p-3"
        >
          <div class="flex items-center gap-2">
            <UIcon
              name="tabler:flame"
              class="size-4 text-warning"
            />

            <span class="text-sm font-medium">
              {{ ACTIVE_EFFECT_LABELS.damageTitle }}
            </span>
          </div>

          <p class="text-xs text-muted">
            {{ ACTIVE_EFFECT_LABELS.damageHint }}
          </p>

          <EffectDamageParts v-model="damageParts" />
        </div>

        <!-- Периодический спасбросок -->
        <div class="rounded-lg border border-default bg-elevated/30 p-3">
          <UCheckbox
            v-model="hasRecurringSave"
            :label="ACTIVE_EFFECT_LABELS.recurringSave"
            :ui="{ label: 'font-medium' }"
          />

          <p class="mt-1.5 text-xs text-muted">
            {{ ACTIVE_EFFECT_LABELS.recurringSaveHint }}
          </p>

          <div
            v-if="hasRecurringSave"
            class="mt-3 grid grid-cols-24 gap-3 border-t border-default/40 pt-3"
          >
            <UFormField
              :label="ACTIVE_EFFECT_LABELS.ability"
              class="col-span-full md:col-span-8"
            >
              <USelect
                v-model="recurringAbility"
                :items="EFFECT_ABILITY_OPTIONS"
                class="w-full"
              />
            </UFormField>

            <UFormField
              :label="ACTIVE_EFFECT_LABELS.saveDc"
              class="col-span-full md:col-span-8"
            >
              <UInputNumber
                v-model="recurringDc"
                :min="1"
              />
            </UFormField>

            <UFormField
              :label="ACTIVE_EFFECT_LABELS.recurringWhen"
              class="col-span-full md:col-span-8"
            >
              <USelect
                v-model="recurringTiming"
                :items="EFFECT_SAVE_TIMING_OPTIONS"
                class="w-full"
              />
            </UFormField>
          </div>
        </div>

        <!-- Периодический урон (DoT) -->
        <div class="rounded-lg border border-default bg-elevated/30 p-3">
          <UCheckbox
            v-model="hasRecurringDamage"
            :label="ACTIVE_EFFECT_LABELS.recurringDamage"
            :ui="{ label: 'font-medium' }"
          />

          <p class="mt-1.5 text-xs text-muted">
            {{ ACTIVE_EFFECT_LABELS.recurringDamageHint }}
          </p>

          <div
            v-if="hasRecurringDamage"
            class="mt-3 flex flex-col gap-3 border-t border-default/40 pt-3"
          >
            <UFormField :label="ACTIVE_EFFECT_LABELS.recurringDamageWhen">
              <USelect
                v-model="recurringDamageTiming"
                :items="EFFECT_SAVE_TIMING_OPTIONS"
                class="w-full md:w-1/3"
              />
            </UFormField>

            <EffectDamageParts v-model="recurringDamageParts" />
          </div>
        </div>

        <!-- Иммунитет к состояниям -->
        <div class="rounded-lg border border-default bg-elevated/30 p-3">
          <div class="flex items-center gap-2">
            <UIcon
              name="tabler:shield-check"
              class="size-4 text-success"
            />

            <span class="text-sm font-medium">
              {{ ACTIVE_EFFECT_LABELS.conditionImmunities }}
            </span>
          </div>

          <p class="mt-1.5 text-xs text-muted">
            {{ ACTIVE_EFFECT_LABELS.conditionImmunitiesHint }}
          </p>

          <USelectMenu
            v-model="conditionImmunities"
            :items="EFFECT_CONDITION_OPTIONS"
            label-key="label"
            value-key="value"
            multiple
            class="mt-3 w-full"
            :placeholder="ACTIVE_EFFECT_LABELS.conditionImmunitiesPlaceholder"
          />
        </div>
      </div>
    </template>
  </UTabs>
</template>
