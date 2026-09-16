<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type {
    EffectFormLayout,
    EffectTrigger,
    EffectTriggerAction,
    EffectTriggerActionType,
    EffectTriggerAttackRole,
    EffectTriggerEvent,
    EffectTriggerLimitPeriod,
    EffectTriggerRecipient,
    EffectTriggerSave,
    EffectTriggerTurnOwner,
  } from '../../model';

  import {
    buildTriggerRecipientOptions,
    clearTriggerActionGate,
    createDefaultEffectSave,
    createEffectTriggerAction,
    DEFAULT_TRIGGER_ATTACK_ROLE,
    DEFAULT_TRIGGER_LIMIT_PERIOD,
    DEFAULT_TRIGGER_RECIPIENT,
    DEFAULT_TRIGGER_TURN_OWNER,
    EFFECT_TRIGGER_ACTION_ICONS,
    EFFECT_TRIGGER_ACTION_LABELS,
    EFFECT_TRIGGER_EVENT_LABELS,
    EFFECT_TRIGGER_PERIOD_OPTIONS,
    EFFECT_TRIGGER_ROLE_OPTIONS,
    EFFECT_TRIGGER_ROW_ICONS,
    EFFECT_TRIGGER_ROW_LABELS,
    EFFECT_TRIGGER_TURN_OWNER_LABELS,
    isTurnTriggerEvent,
    listTriggerActionTypes,
    MIN_TRIGGER_LIMIT_MAX,
    omitTriggerSaveDcFormula,
    triggerEventAcceptsDcFormula,
    triggerEventHasOtherParty,
    triggerEventHasRole,
    validateFormula,
    writeTriggerEvent,
  } from '../../model';
  import EffectSaveFields from './EffectSaveFields.vue';
  import EffectTriggerActionRow from './EffectTriggerActionRow.vue';
  import EffectTriggerConditionPicker from './EffectTriggerConditionPicker.vue';

  /**
   * Строка списка «Срабатывания»: когда → условие → спасбросок → что сделать →
   * сколько раз. Что доступно, решает модель по месту формы: события —
   * `layout.triggerEvents`, действия — `listTriggerActionTypes`, Сл формулой —
   * `triggerEventAcceptsDcFormula`.
   */
  const {
    layout,
    applierSaveDc = undefined,
    knownTags,
  } = defineProps<{
    /** Раскладка формы. */
    layout: EffectFormLayout;
    /** Сл источника для «Авто», если форма её знает. */
    applierSaveDc?: number;
    /** Отметки, которые ставят срабатывания эффекта. */
    knownTags: readonly string[];
  }>();

  const emit = defineEmits<{
    remove: [];
  }>();

  /** Строка списка: форма заменяет её целиком при каждой правке. */
  const trigger = defineModel<EffectTrigger>('trigger', { required: true });

  /**
   * События в выборе: доступные здесь и то, что уже стоит (неработающее
   * покажет плашка формы).
   */
  const eventItems = computed(() =>
    [...new Set([...layout.triggerEvents, trigger.value.event])].map(
      (triggerEvent) => ({
        value: triggerEvent,
        label: EFFECT_TRIGGER_EVENT_LABELS[triggerEvent] ?? triggerEvent,
      }),
    ),
  );

  /** Чей ход в выборе: доступные здесь и то, что уже стоит в данных. */
  const turnOwnerItems = computed(() =>
    [
      ...new Set([
        ...layout.triggerTurnOwners,
        trigger.value.turnOf ?? DEFAULT_TRIGGER_TURN_OWNER,
      ]),
    ].map((owner) => ({
      value: owner,
      label: EFFECT_TRIGGER_TURN_OWNER_LABELS[owner],
    })),
  );

  const showsTurnOwner = computed(
    () =>
      isTurnTriggerEvent(trigger.value.event)
      && turnOwnerItems.value.length > 1,
  );

  const acceptsSaveDcFormula = computed(() =>
    triggerEventAcceptsDcFormula(trigger.value.event),
  );

  const hasOtherParty = computed(() =>
    triggerEventHasOtherParty(trigger.value.event),
  );

  const showsRole = computed(() => triggerEventHasRole(trigger.value.event));

  const recipientItems = computed(() =>
    buildTriggerRecipientOptions(trigger.value),
  );

  const allowedActionTypes = computed(() =>
    listTriggerActionTypes(layout, trigger.value.event),
  );

  const hasActions = computed(() => trigger.value.actions.length > 0);

  /**
   * Заменяет строку целиком.
   *
   * @param patch изменённые поля.
   */
  function updateTrigger(patch: Partial<EffectTrigger>): void {
    trigger.value = { ...trigger.value, ...patch };
  }

  // Смена события отбрасывает то, чего у нового события нет
  const event = computed({
    get: () => trigger.value.event,
    set: (nextEvent: EffectTriggerEvent) => {
      trigger.value = writeTriggerEvent(trigger.value, nextEvent, layout);
    },
  });

  // Получатель по умолчанию в данных не пишется
  const recipient = computed({
    get: () => trigger.value.recipient ?? DEFAULT_TRIGGER_RECIPIENT,
    set: (nextRecipient: EffectTriggerRecipient) =>
      updateTrigger({
        recipient:
          nextRecipient === DEFAULT_TRIGGER_RECIPIENT
            ? undefined
            : nextRecipient,
      }),
  });

  const saveDcFormula = computed({
    get: () => trigger.value.save?.dcFormula ?? '',
    set: (nextFormula: string) => {
      const { save } = trigger.value;

      if (!save) {
        return;
      }

      const formula = nextFormula.trim();

      updateTrigger({
        save: formula
          ? { ...save, dcFormula: formula }
          : omitTriggerSaveDcFormula(save),
      });
    },
  });

  const saveDcFormulaError = computed(() => {
    const formula = trigger.value.save?.dcFormula;

    return formula ? validateFormula(formula).error : undefined;
  });

  const condition = computed({
    get: () => trigger.value.condition,
    set: (nextCondition: string | undefined) =>
      updateTrigger({ condition: nextCondition }),
  });

  const role = computed({
    get: () => trigger.value.role ?? DEFAULT_TRIGGER_ATTACK_ROLE,
    set: (nextRole: EffectTriggerAttackRole) =>
      updateTrigger({ role: nextRole }),
  });

  // Ход носителя — значение по умолчанию: в данных он не пишется
  const turnOf = computed({
    get: () => trigger.value.turnOf ?? DEFAULT_TRIGGER_TURN_OWNER,
    set: (nextTurnOwner: EffectTriggerTurnOwner) =>
      updateTrigger({
        turnOf:
          nextTurnOwner === DEFAULT_TRIGGER_TURN_OWNER
            ? undefined
            : nextTurnOwner,
      }),
  });

  const hasSave = computed({
    get: () => trigger.value.save !== undefined,
    set: (enabled: boolean) => {
      updateTrigger(
        enabled
          ? { save: createDefaultEffectSave(layout) }
          : {
              save: undefined,
              // Без спасброска «при успехе» не наступило бы никогда
              actions: trigger.value.actions.map(clearTriggerActionGate),
            },
      );
    },
  });

  /**
   * Заменяет спасбросок строки.
   *
   * @param nextSave спасбросок с изменёнными характеристикой или Сл.
   */
  function updateSave(nextSave: EffectTriggerSave): void {
    updateTrigger({ save: nextSave });
  }

  /** Действия строки с ключом для списка. */
  const actionRows = computed(() =>
    trigger.value.actions.map((action, index) => ({
      key: `${index}-${action.type}`,
      action,
    })),
  );

  /**
   * Заменяет действие.
   *
   * @param index номер действия.
   * @param nextAction новое действие.
   */
  function updateAction(index: number, nextAction: EffectTriggerAction): void {
    updateTrigger({
      actions: trigger.value.actions.map((existingAction, actionIndex) =>
        actionIndex === index ? nextAction : existingAction,
      ),
    });
  }

  /**
   * Убирает действие.
   *
   * @param index номер действия.
   */
  function removeAction(index: number): void {
    updateTrigger({
      actions: trigger.value.actions.filter(
        (_, actionIndex) => actionIndex !== index,
      ),
    });
  }

  /**
   * Добавляет действие в конец списка.
   *
   * @param type вид действия.
   */
  function addAction(type: EffectTriggerActionType): void {
    updateTrigger({
      actions: [...trigger.value.actions, createEffectTriggerAction(type)],
    });
  }

  const addActionItems = computed<DropdownMenuItem[]>(() =>
    allowedActionTypes.value.map((type) => ({
      label: EFFECT_TRIGGER_ACTION_LABELS[type],
      icon: EFFECT_TRIGGER_ACTION_ICONS[type],
      onSelect: () => addAction(type),
    })),
  );

  const hasLimit = computed({
    get: () => trigger.value.limit !== undefined,
    set: (enabled: boolean) =>
      updateTrigger({
        limit: enabled
          ? { max: MIN_TRIGGER_LIMIT_MAX, per: DEFAULT_TRIGGER_LIMIT_PERIOD }
          : undefined,
      }),
  });

  const limitMax = computed({
    get: () => trigger.value.limit?.max ?? MIN_TRIGGER_LIMIT_MAX,
    set: (max: number | null) => {
      if (trigger.value.limit) {
        updateTrigger({
          limit: { ...trigger.value.limit, max: max ?? MIN_TRIGGER_LIMIT_MAX },
        });
      }
    },
  });

  const limitPer = computed({
    get: () => trigger.value.limit?.per ?? DEFAULT_TRIGGER_LIMIT_PERIOD,
    set: (per: EffectTriggerLimitPeriod) => {
      if (trigger.value.limit) {
        updateTrigger({ limit: { ...trigger.value.limit, per } });
      }
    },
  });
</script>

<template>
  <div class="flex flex-col gap-3 rounded-md border border-default p-3">
    <div class="flex flex-wrap items-end gap-2">
      <UFormField
        :label="EFFECT_TRIGGER_ROW_LABELS.event"
        class="w-full sm:w-60"
      >
        <USelect
          v-model="event"
          :items="eventItems"
          value-key="value"
          size="sm"
          class="w-full"
        />
      </UFormField>

      <UFormField
        v-if="showsRole"
        :label="EFFECT_TRIGGER_ROW_LABELS.role"
        class="w-full sm:w-48"
      >
        <USelect
          v-model="role"
          :items="EFFECT_TRIGGER_ROLE_OPTIONS"
          value-key="value"
          size="sm"
          class="w-full"
        />
      </UFormField>

      <UFormField
        v-if="hasOtherParty"
        :label="EFFECT_TRIGGER_ROW_LABELS.recipient"
        class="w-full sm:w-56"
      >
        <USelect
          v-model="recipient"
          :items="recipientItems"
          value-key="value"
          size="sm"
          class="w-full"
        />
      </UFormField>

      <UFormField
        v-if="showsTurnOwner"
        :label="EFFECT_TRIGGER_ROW_LABELS.turnOf"
        class="w-full sm:w-48"
      >
        <USelect
          v-model="turnOf"
          :items="turnOwnerItems"
          value-key="value"
          size="sm"
          class="w-full"
        />
      </UFormField>

      <UButton
        color="error"
        variant="ghost"
        size="xs"
        :icon="EFFECT_TRIGGER_ROW_ICONS.remove"
        class="ml-auto"
        :aria-label="EFFECT_TRIGGER_ROW_LABELS.remove"
        :title="EFFECT_TRIGGER_ROW_LABELS.remove"
        @click.left.exact.prevent="emit('remove')"
      />
    </div>

    <EffectTriggerConditionPicker
      v-model:condition="condition"
      :event="trigger.event"
      :known-tags="knownTags"
    />

    <USwitch
      v-model="hasSave"
      :label="EFFECT_TRIGGER_ROW_LABELS.saveToggle"
    />

    <div
      v-if="trigger.save"
      class="flex flex-wrap items-start gap-3"
    >
      <EffectSaveFields
        :save="trigger.save"
        :layout="layout"
        :applier-save-dc="applierSaveDc"
        :ability-label="EFFECT_TRIGGER_ROW_LABELS.saveAbility"
        :save-dc-label="EFFECT_TRIGGER_ROW_LABELS.saveDc"
        @update:save="updateSave"
      />

      <UFormField
        v-if="acceptsSaveDcFormula"
        :label="EFFECT_TRIGGER_ROW_LABELS.dcFormula"
        :help="EFFECT_TRIGGER_ROW_LABELS.dcFormulaHint"
        :error="saveDcFormulaError"
        class="w-full sm:w-72"
      >
        <UInput
          v-model="saveDcFormula"
          :placeholder="EFFECT_TRIGGER_ROW_LABELS.dcFormulaPlaceholder"
          size="sm"
          class="w-full font-mono"
        />
      </UFormField>
    </div>

    <div class="flex flex-col gap-2">
      <span class="text-xs font-medium text-default">
        {{ EFFECT_TRIGGER_ROW_LABELS.actionsTitle }}
      </span>

      <p
        v-if="!hasActions"
        class="text-xs text-warning"
      >
        {{ EFFECT_TRIGGER_ROW_LABELS.actionsEmpty }}
      </p>

      <EffectTriggerActionRow
        v-for="(actionRow, index) in actionRows"
        :key="actionRow.key"
        :action="actionRow.action"
        :trigger-save="trigger.save"
        @update:action="updateAction(index, $event)"
        @remove="removeAction(index)"
      />

      <UDropdownMenu
        v-if="addActionItems.length > 0"
        :items="addActionItems"
        :content="{ align: 'start' }"
      >
        <UButton
          color="primary"
          variant="soft"
          size="xs"
          :icon="EFFECT_TRIGGER_ROW_ICONS.addAction"
          class="w-fit"
          :label="EFFECT_TRIGGER_ROW_LABELS.addAction"
        />
      </UDropdownMenu>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <USwitch
        v-model="hasLimit"
        :label="EFFECT_TRIGGER_ROW_LABELS.limitToggle"
      />

      <template v-if="trigger.limit">
        <UInputNumber
          v-model="limitMax"
          :min="MIN_TRIGGER_LIMIT_MAX"
          size="sm"
          class="w-24"
        />

        <span class="text-xs text-muted">
          {{ EFFECT_TRIGGER_ROW_LABELS.limitTimes }}
        </span>

        <USelect
          v-model="limitPer"
          :items="EFFECT_TRIGGER_PERIOD_OPTIONS"
          value-key="value"
          size="sm"
          class="w-44"
        />
      </template>
    </div>
  </div>
</template>
