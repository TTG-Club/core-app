<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type {
    ActiveEffect,
    EffectAbility,
    EffectAreaTrigger,
    EffectAuraTarget,
    EffectConditionTemplate,
    EffectDamagePart,
    EffectSaveOutcome,
    EffectSaveTiming,
  } from '../../model';

  import {
    DEFAULT_EFFECT_AURA,
    DEFAULT_EFFECT_SAVE,
    EFFECT_ABILITY_OPTIONS,
    EFFECT_AREA_TRIGGER_OPTIONS,
    EFFECT_AURA_TARGET_OPTIONS,
    EFFECT_CONDITION_TEMPLATES,
    EFFECT_DURATION_OPTIONS,
    EFFECT_DURATION_WITH_VALUE,
    EFFECT_SAVE_OUTCOME_OPTIONS,
    EFFECT_SAVE_TIMING_OPTIONS,
    EFFECT_TARGET_OPTIONS,
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
      EFFECT_CONDITION_TEMPLATES.map((template) => ({
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
    EFFECT_DURATION_WITH_VALUE.includes(model.value.duration.type),
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
        return 'Разовая нагрузка (урон/статус) в момент входа в область/ауру. Срабатывает на каждый вход.';
      case 'exit':
        return 'Разовая нагрузка (урон/статус) в момент выхода из области/ауры.';
      default:
        return 'Эффект висит на цели, пока она внутри области/ауры, и снимается при выходе.';
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

  const applyOnSuccess = computed({
    get: () => model.value.applyOnSuccess === true,
    set: (value) => {
      model.value.applyOnSuccess = value ? true : undefined;
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
          class="col-span-full md:col-span-14"
        >
          <UInput
            v-model="model.icon"
            placeholder="Напр.: tabler:sparkles"
          />
        </UFormField>

        <UFormField
          label="Цель эффекта"
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
            :items="EFFECT_DURATION_OPTIONS"
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
              :items="EFFECT_AURA_TARGET_OPTIONS"
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
          Срабатывает при наложении эффекта на цель (напр. при попадании
          атакой). Для само-баффов можно оставить пустым.
        </p>

        <!-- Триггер ауры -->
        <div
          v-if="isAura"
          class="rounded-lg border border-muted bg-elevated/30 p-3"
        >
          <UFormField label="Триггер ауры">
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
        <div class="rounded-lg border border-muted bg-elevated/30 p-3">
          <UCheckbox
            v-model="hasApplySave"
            label="Спасбросок при наложении"
            :ui="{ label: 'font-medium' }"
          />

          <p class="mt-1.5 text-xs text-muted">
            При попадании цель совершает спасбросок — от результата зависят
            статус и урон ниже.
          </p>

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
                :items="EFFECT_ABILITY_OPTIONS"
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
                :items="EFFECT_SAVE_OUTCOME_OPTIONS"
                class="w-full"
              />
            </UFormField>
          </div>

          <div class="mt-3 border-t border-default/40 pt-3">
            <UCheckbox
              v-model="applyOnSuccess"
              label="Накладывать эффект даже при успешном спасе"
            />

            <p class="mt-1.5 text-xs text-muted">
              Состояние повиснет на цели, даже если она прошла спасбросок (свой
              выше или спасбросок области у действия). Урон при успехе — по
              правилу «При успехе».
            </p>
          </div>
        </div>

        <!-- Урон при наложении -->
        <div
          class="space-y-2 rounded-lg border border-muted bg-elevated/30 p-3"
        >
          <div class="flex items-center gap-2">
            <UIcon
              name="tabler:flame"
              class="size-4 text-warning"
            />

            <span class="text-sm font-medium">Урон при наложении</span>
          </div>

          <p class="text-xs text-muted">
            Наносится цели при наложении. Если включён спасбросок выше — урон
            гейтится им (на успехе: нет урона либо половина).
          </p>

          <EffectDamageParts v-model="damageParts" />
        </div>

        <!-- Периодический спасбросок -->
        <div class="rounded-lg border border-muted bg-elevated/30 p-3">
          <UCheckbox
            v-model="hasRecurringSave"
            label="Периодический спасбросок снимает эффект"
            :ui="{ label: 'font-medium' }"
          />

          <p class="mt-1.5 text-xs text-muted">
            Пока эффект активен, цель повторяет спасбросок и при успехе
            сбрасывает его досрочно.
          </p>

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
                :items="EFFECT_ABILITY_OPTIONS"
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
                :items="EFFECT_SAVE_TIMING_OPTIONS"
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

          <p class="mt-1.5 text-xs text-muted">
            Пока эффект висит на цели, наносит урон каждый ход (напр.
            «Горение»). Тикает в бою при смене хода.
          </p>

          <div
            v-if="hasRecurringDamage"
            class="mt-3 flex flex-col gap-3 border-t border-default/40 pt-3"
          >
            <UFormField label="Когда наносится">
              <USelect
                v-model="recurringDamageTiming"
                :items="EFFECT_SAVE_TIMING_OPTIONS"
                class="w-full md:w-1/3"
              />
            </UFormField>

            <EffectDamageParts v-model="recurringDamageParts" />
          </div>
        </div>
      </div>
    </template>
  </UTabs>
</template>
