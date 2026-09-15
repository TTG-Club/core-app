<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type {
    EffectAbility,
    EffectConditionKey,
    EffectDamagePart,
    EffectFormLayout,
    EffectTrigger,
    EffectTriggerAction,
    EffectTriggerActionGate,
    EffectTriggerActionType,
    EffectTriggerAttackRole,
    EffectTriggerDamageGateChoice,
    EffectTriggerEvent,
    EffectTriggerLimitPeriod,
    EffectTriggerRecipient,
    EffectTriggerSave,
    EffectTriggerTurnOwner,
  } from '../../model';

  import {
    buildTriggerRecipientOptions,
    createDefaultEffectSave,
    DEFAULT_EFFECT_SAVE_ABILITY,
    DEFAULT_EFFECT_TAG,
    DEFAULT_SET_HP_VALUE,
    DEFAULT_TRIGGER_ATTACK_ROLE,
    DEFAULT_TRIGGER_CONDITION,
    DEFAULT_TRIGGER_LIMIT_PERIOD,
    DEFAULT_TRIGGER_RECIPIENT,
    DEFAULT_TRIGGER_TURN_OWNER,
    EFFECT_ABILITY_OPTIONS,
    EFFECT_CONDITION_OPTIONS,
    EFFECT_SOURCE_DC_LABELS,
    EFFECT_TRIGGER_ACTION_ICONS,
    EFFECT_TRIGGER_ACTION_LABELS,
    EFFECT_TRIGGER_DAMAGE_GATE_OPTIONS,
    EFFECT_TRIGGER_DAMAGE_HALF_GATE,
    EFFECT_TRIGGER_EVENT_LABELS,
    EFFECT_TRIGGER_GATE_OPTIONS,
    EFFECT_TRIGGER_PERIOD_OPTIONS,
    EFFECT_TRIGGER_ROLE_OPTIONS,
    EFFECT_TRIGGER_ROW_LABELS,
    EFFECT_TRIGGER_TURN_OWNER_LABELS,
    isEffectTag,
    isTurnTriggerEvent,
    layoutAcceptsSourceSaveDc,
    listTriggerActionTypes,
    MIN_TRIGGER_LIMIT_MAX,
    resolveTriggerActionGate,
    triggerEventAcceptsDcFormula,
    triggerEventHasOtherParty,
    triggerEventHasRole,
    validateFormula,
  } from '../../model';
  import EffectDamageParts from './EffectDamageParts.vue';
  import EffectSaveDcField from './EffectSaveDcField.vue';
  import EffectTriggerConditionPicker from './EffectTriggerConditionPicker.vue';

  /**
   * Строка списка «Срабатывания»: когда → условие → спасбросок → что сделать →
   * сколько раз. Что доступно, решает модель по месту формы: события —
   * `layout.triggerEvents`, действия — `listTriggerActionTypes`, Сл формулой —
   * `triggerEventAcceptsDcFormula`.
   */
  const {
    layout,
    sourceSaveDc = undefined,
    knownTags,
  } = defineProps<{
    /** Раскладка формы. */
    layout: EffectFormLayout;
    /** Сл источника для «Авто», если форма её знает. */
    sourceSaveDc?: number;
    /** Отметки, которые ставят срабатывания эффекта. */
    knownTags: readonly string[];
  }>();

  const emit = defineEmits<{
    remove: [];
  }>();

  /** Строка списка: форма заменяет её целиком при каждой правке. */
  const trigger = defineModel<EffectTrigger>('trigger', { required: true });

  /** Строка действия с вычисленными подписями и видимостью полей. */
  interface ActionRow {
    /** Ключ строки в списке. */
    key: string;
    action: EffectTriggerAction;
    label: string;
    icon: string;
    /** Исход урона для выбора: «успех — половина» — отдельный вариант. */
    damageGate: EffectTriggerDamageGateChoice;
    /** Исход остальных действий. */
    gate: EffectTriggerActionGate;
    /** Срок состояния или отметки в раундах. */
    rounds: number | null;
    /** Состояние действия, если оно из списка выбора. */
    conditionKey: EffectConditionKey | undefined;
    /** Ошибка ключа отметки. */
    tagError: string | undefined;
  }

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

  const acceptsDcFormula = computed(() =>
    triggerEventAcceptsDcFormula(trigger.value.event),
  );

  const hasOtherParty = computed(() =>
    triggerEventHasOtherParty(trigger.value.event),
  );

  const showsRole = computed(() => triggerEventHasRole(trigger.value.event));

  const recipientItems = computed(() =>
    buildTriggerRecipientOptions(trigger.value),
  );

  const acceptsSourceSaveDc = computed(() => layoutAcceptsSourceSaveDc(layout));

  const sourceDcLabel = computed(() => EFFECT_SOURCE_DC_LABELS[layout.context]);

  const allowedActions = computed(() =>
    listTriggerActionTypes(layout, trigger.value.event),
  );

  const hasActions = computed(() => trigger.value.actions.length > 0);

  /**
   * Заменяет строку целиком.
   *
   * @param patch изменённые поля.
   */
  function update(patch: Partial<EffectTrigger>): void {
    trigger.value = { ...trigger.value, ...patch };
  }

  /**
   * Действие без гейта и «половины»: без спасброска исход не выбирается.
   *
   * @param action действие.
   * @returns действие без привязки к спасброску.
   */
  function withoutGate(action: EffectTriggerAction): EffectTriggerAction {
    if (action.type === 'damage') {
      return { type: 'damage', parts: action.parts };
    }

    return { ...action, on: undefined };
  }

  /**
   * Спасбросок без формулы Сл, если новое событие её не знает.
   *
   * @param save спасбросок строки.
   * @param nextEvent новое событие.
   * @returns спасбросок для события.
   */
  function withEventDcFormula(
    save: EffectTriggerSave,
    nextEvent: EffectTriggerEvent,
  ): EffectTriggerSave {
    return triggerEventAcceptsDcFormula(nextEvent)
      ? save
      : { ability: save.ability, dc: save.dc };
  }

  const event = computed({
    get: () => trigger.value.event,
    set: (next: EffectTriggerEvent) => {
      const actions = listTriggerActionTypes(layout, next);
      const { save } = trigger.value;

      // Смена события отбрасывает то, чего у нового события нет: действия,
      // роль, получателя, чей ход и формулу Сл
      update({
        event: next,
        role: triggerEventHasRole(next)
          ? (trigger.value.role ?? DEFAULT_TRIGGER_ATTACK_ROLE)
          : undefined,
        turnOf: isTurnTriggerEvent(next) ? trigger.value.turnOf : undefined,
        recipient: triggerEventHasOtherParty(next)
          ? trigger.value.recipient
          : undefined,
        save: save ? withEventDcFormula(save, next) : undefined,
        actions: trigger.value.actions.filter((action) =>
          actions.includes(action.type),
        ),
      });
    },
  });

  // Получатель по умолчанию в данных не пишется
  const recipient = computed({
    get: () => trigger.value.recipient ?? DEFAULT_TRIGGER_RECIPIENT,
    set: (next: EffectTriggerRecipient) =>
      update({
        recipient: next === DEFAULT_TRIGGER_RECIPIENT ? undefined : next,
      }),
  });

  const dcFormula = computed({
    get: () => trigger.value.save?.dcFormula ?? '',
    set: (next: string) => {
      const { save } = trigger.value;

      if (!save) {
        return;
      }

      const formula = next.trim();

      update({
        save: formula
          ? { ...save, dcFormula: formula }
          : { ability: save.ability, dc: save.dc },
      });
    },
  });

  const dcFormulaError = computed(() => {
    const formula = trigger.value.save?.dcFormula;

    return formula ? validateFormula(formula).error : undefined;
  });

  const condition = computed({
    get: () => trigger.value.condition,
    set: (next: string | undefined) => update({ condition: next }),
  });

  const role = computed({
    get: () => trigger.value.role ?? DEFAULT_TRIGGER_ATTACK_ROLE,
    set: (next: EffectTriggerAttackRole) => update({ role: next }),
  });

  // Ход носителя — значение по умолчанию: в данных он не пишется
  const turnOf = computed({
    get: () => trigger.value.turnOf ?? DEFAULT_TRIGGER_TURN_OWNER,
    set: (next: EffectTriggerTurnOwner) =>
      update({
        turnOf: next === DEFAULT_TRIGGER_TURN_OWNER ? undefined : next,
      }),
  });

  const hasSave = computed({
    get: () => trigger.value.save !== undefined,
    set: (enabled: boolean) => {
      update(
        enabled
          ? { save: createDefaultEffectSave(layout) }
          : {
              save: undefined,
              // Без спасброска «при успехе» не наступило бы никогда
              actions: trigger.value.actions.map(withoutGate),
            },
      );
    },
  });

  const saveAbility = computed({
    get: () => trigger.value.save?.ability ?? DEFAULT_EFFECT_SAVE_ABILITY,
    set: (ability: EffectAbility) => {
      if (trigger.value.save) {
        update({ save: { ...trigger.value.save, ability } });
      }
    },
  });

  const saveDc = computed({
    get: () => trigger.value.save?.dc ?? layout.minSaveDc,
    set: (dc: number) => {
      if (trigger.value.save) {
        update({ save: { ...trigger.value.save, dc } });
      }
    },
  });

  /**
   * Срок состояния или отметки в раундах.
   *
   * @param action действие.
   * @returns раундов либо `null`.
   */
  function getActionRounds(action: EffectTriggerAction): number | null {
    return (action.type === 'applyCondition' || action.type === 'applyTag')
      && action.duration?.type === 'rounds'
      ? (action.duration.value ?? null)
      : null;
  }

  const actionRows = computed<ActionRow[]>(() =>
    trigger.value.actions.map((action, index) => {
      const gate = resolveTriggerActionGate(trigger.value, action);

      return {
        key: `${index}-${action.type}`,
        action,
        label: EFFECT_TRIGGER_ACTION_LABELS[action.type],
        icon: EFFECT_TRIGGER_ACTION_ICONS[action.type],
        damageGate:
          action.type === 'damage' && action.halfOnSave
            ? EFFECT_TRIGGER_DAMAGE_HALF_GATE
            : gate,
        gate,
        rounds: getActionRounds(action),
        conditionKey:
          action.type === 'applyCondition'
            ? EFFECT_CONDITION_OPTIONS.find(
                (conditionOption) =>
                  conditionOption.value === action.conditionKey,
              )?.value
            : undefined,
        tagError:
          action.type === 'applyTag' && !isEffectTag(action.tag)
            ? EFFECT_TRIGGER_ROW_LABELS.tagInvalid
            : undefined,
      };
    }),
  );

  /**
   * Заменяет действие.
   *
   * @param index номер действия.
   * @param action новое действие.
   */
  function updateAction(index: number, action: EffectTriggerAction): void {
    update({
      actions: trigger.value.actions.map((existingAction, actionIndex) =>
        actionIndex === index ? action : existingAction,
      ),
    });
  }

  /**
   * Убирает действие.
   *
   * @param index номер действия.
   */
  function removeAction(index: number): void {
    update({
      actions: trigger.value.actions.filter(
        (_, entryIndex) => entryIndex !== index,
      ),
    });
  }

  /**
   * Новое действие вида.
   *
   * @param type вид действия.
   * @returns действие.
   */
  function createAction(type: EffectTriggerActionType): EffectTriggerAction {
    switch (type) {
      case 'damage':
        return { type, parts: [] };
      case 'applyCondition':
        return { type, conditionKey: DEFAULT_TRIGGER_CONDITION };
      case 'applyTag':
        return { type, tag: DEFAULT_EFFECT_TAG };
      case 'setHp':
        return { type, value: DEFAULT_SET_HP_VALUE };
      default:
        return { type };
    }
  }

  /**
   * Добавляет действие в конец списка.
   *
   * @param type вид действия.
   */
  function addAction(type: EffectTriggerActionType): void {
    update({ actions: [...trigger.value.actions, createAction(type)] });
  }

  const addActionItems = computed<DropdownMenuItem[]>(() =>
    allowedActions.value.map((type) => ({
      label: EFFECT_TRIGGER_ACTION_LABELS[type],
      icon: EFFECT_TRIGGER_ACTION_ICONS[type],
      onSelect: () => addAction(type),
    })),
  );

  /**
   * Меняет исход действия по выбору в списке.
   *
   * @param index номер действия.
   * @param value значение из списка исходов.
   */
  function selectGate(index: number, value: unknown): void {
    const choice = EFFECT_TRIGGER_DAMAGE_GATE_OPTIONS.find(
      (gateOption) => gateOption.value === value,
    )?.value;

    const currentAction = trigger.value.actions[index];

    if (!choice || !currentAction) {
      return;
    }

    const action = withoutGate(currentAction);

    if (choice === EFFECT_TRIGGER_DAMAGE_HALF_GATE) {
      if (action.type === 'damage') {
        updateAction(index, { ...action, on: 'always', halfOnSave: true });
      }

      return;
    }

    updateAction(index, { ...action, on: choice });
  }

  /**
   * Меняет части урона.
   *
   * @param index номер действия.
   * @param parts части урона.
   */
  function updateDamageParts(index: number, parts: EffectDamagePart[]): void {
    const action = trigger.value.actions[index];

    if (action?.type === 'damage') {
      updateAction(index, { ...action, parts });
    }
  }

  /**
   * Меняет состояние действия.
   *
   * @param index номер действия.
   * @param conditionKey ключ состояния.
   */
  function updateCondition(
    index: number,
    conditionKey: EffectConditionKey,
  ): void {
    const action = trigger.value.actions[index];

    if (action?.type === 'applyCondition') {
      updateAction(index, { ...action, conditionKey });
    }
  }

  /**
   * Меняет срок состояния или отметки в раундах; пусто — срок по умолчанию
   * (состояние — пока не снимут, отметка — до начала следующего хода).
   *
   * @param index номер действия.
   * @param rounds раундов.
   */
  function updateActionRounds(index: number, rounds: number | null): void {
    const action = trigger.value.actions[index];

    if (action?.type !== 'applyCondition' && action?.type !== 'applyTag') {
      return;
    }

    updateAction(index, {
      ...action,
      duration:
        rounds === null || rounds <= 0
          ? undefined
          : { type: 'rounds', value: rounds },
    });
  }

  /**
   * Меняет число хитов действия «Хиты становятся».
   *
   * @param index номер действия.
   * @param value хитов.
   */
  function updateSetHp(index: number, value: number | null): void {
    const action = trigger.value.actions[index];

    if (action?.type === 'setHp') {
      updateAction(index, { ...action, value: Math.max(0, value ?? 0) });
    }
  }

  /**
   * Меняет ключ отметки.
   *
   * @param index номер действия.
   * @param tag новый ключ.
   */
  function updateTagKey(index: number, tag: string): void {
    const action = trigger.value.actions[index];

    if (action?.type === 'applyTag') {
      updateAction(index, { ...action, tag: tag.trim() });
    }
  }

  /**
   * Меняет имя отметки в списке; пустое имя — как ключ.
   *
   * @param index номер действия.
   * @param label новое имя.
   */
  function updateTagLabel(index: number, label: string): void {
    const action = trigger.value.actions[index];

    if (action?.type === 'applyTag') {
      updateAction(index, { ...action, label: label.trim() || undefined });
    }
  }

  const hasLimit = computed({
    get: () => trigger.value.limit !== undefined,
    set: (enabled: boolean) =>
      update({
        limit: enabled
          ? { max: MIN_TRIGGER_LIMIT_MAX, per: DEFAULT_TRIGGER_LIMIT_PERIOD }
          : undefined,
      }),
  });

  const limitMax = computed({
    get: () => trigger.value.limit?.max ?? MIN_TRIGGER_LIMIT_MAX,
    set: (max: number | null) => {
      if (trigger.value.limit) {
        update({
          limit: { ...trigger.value.limit, max: max ?? MIN_TRIGGER_LIMIT_MAX },
        });
      }
    },
  });

  const limitPer = computed({
    get: () => trigger.value.limit?.per ?? DEFAULT_TRIGGER_LIMIT_PERIOD,
    set: (per: EffectTriggerLimitPeriod) => {
      if (trigger.value.limit) {
        update({ limit: { ...trigger.value.limit, per } });
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
        icon="tabler:trash"
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
      <UFormField
        :label="EFFECT_TRIGGER_ROW_LABELS.saveAbility"
        class="w-48"
      >
        <USelect
          v-model="saveAbility"
          :items="EFFECT_ABILITY_OPTIONS"
          value-key="value"
          size="sm"
          class="w-full"
        />
      </UFormField>

      <EffectSaveDcField
        v-model="saveDc"
        :label="EFFECT_TRIGGER_ROW_LABELS.saveDc"
        :auto-allowed="acceptsSourceSaveDc"
        :auto-label="sourceDcLabel"
        :auto-value="sourceSaveDc"
      />

      <UFormField
        v-if="acceptsDcFormula"
        :label="EFFECT_TRIGGER_ROW_LABELS.dcFormula"
        :help="EFFECT_TRIGGER_ROW_LABELS.dcFormulaHint"
        :error="dcFormulaError"
        class="w-full sm:w-72"
      >
        <UInput
          v-model="dcFormula"
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

      <div
        v-for="(row, index) in actionRows"
        :key="row.key"
        class="flex flex-col gap-2 border-l-2 border-default pl-3"
      >
        <div class="flex flex-wrap items-center gap-2">
          <UIcon
            :name="row.icon"
            class="size-4 text-muted"
          />

          <span class="text-xs text-default">
            {{ row.label }}
          </span>

          <template v-if="trigger.save">
            <USelect
              v-if="row.action.type === 'damage'"
              :model-value="row.damageGate"
              :items="EFFECT_TRIGGER_DAMAGE_GATE_OPTIONS"
              value-key="value"
              size="xs"
              class="w-64 max-w-full"
              :aria-label="EFFECT_TRIGGER_ROW_LABELS.gate"
              @update:model-value="selectGate(index, $event)"
            />

            <USelect
              v-else
              :model-value="row.gate"
              :items="EFFECT_TRIGGER_GATE_OPTIONS"
              value-key="value"
              size="xs"
              class="w-40"
              :aria-label="EFFECT_TRIGGER_ROW_LABELS.gate"
              @update:model-value="selectGate(index, $event)"
            />
          </template>

          <UButton
            color="neutral"
            variant="ghost"
            size="xs"
            icon="tabler:x"
            class="ml-auto"
            :aria-label="EFFECT_TRIGGER_ROW_LABELS.removeAction"
            @click.left.exact.prevent="removeAction(index)"
          />
        </div>

        <EffectDamageParts
          v-if="row.action.type === 'damage'"
          :model-value="row.action.parts"
          allow-healing
          @update:model-value="updateDamageParts(index, $event)"
        />

        <div
          v-else-if="row.action.type === 'applyCondition'"
          class="flex flex-wrap items-end gap-2"
        >
          <UFormField
            :label="EFFECT_TRIGGER_ROW_LABELS.condition"
            class="w-56"
          >
            <USelect
              :model-value="row.conditionKey"
              :items="EFFECT_CONDITION_OPTIONS"
              value-key="value"
              size="sm"
              class="w-full"
              @update:model-value="updateCondition(index, $event)"
            />
          </UFormField>

          <UFormField
            :label="EFFECT_TRIGGER_ROW_LABELS.conditionRounds"
            class="w-40"
          >
            <UInputNumber
              :model-value="row.rounds"
              :min="0"
              :placeholder="
                EFFECT_TRIGGER_ROW_LABELS.conditionRoundsPlaceholder
              "
              size="sm"
              class="w-full"
              @update:model-value="updateActionRounds(index, $event)"
            />
          </UFormField>
        </div>

        <UFormField
          v-else-if="row.action.type === 'setHp'"
          :label="EFFECT_TRIGGER_ROW_LABELS.setHpValue"
          class="w-32"
        >
          <UInputNumber
            :model-value="row.action.value"
            :min="0"
            size="sm"
            class="w-full"
            @update:model-value="updateSetHp(index, $event)"
          />
        </UFormField>

        <div
          v-else-if="row.action.type === 'applyTag'"
          class="flex flex-wrap items-start gap-2"
        >
          <UFormField
            :label="EFFECT_TRIGGER_ROW_LABELS.tag"
            :error="row.tagError"
            class="w-56"
          >
            <UInput
              :model-value="row.action.tag"
              size="sm"
              class="w-full"
              @update:model-value="updateTagKey(index, $event)"
            />
          </UFormField>

          <UFormField
            :label="EFFECT_TRIGGER_ROW_LABELS.tagLabel"
            class="w-48"
          >
            <UInput
              :model-value="row.action.label"
              :placeholder="EFFECT_TRIGGER_ROW_LABELS.tagLabelPlaceholder"
              size="sm"
              class="w-full"
              @update:model-value="updateTagLabel(index, $event)"
            />
          </UFormField>

          <UFormField
            :label="EFFECT_TRIGGER_ROW_LABELS.conditionRounds"
            class="w-52"
          >
            <UInputNumber
              :model-value="row.rounds"
              :min="0"
              :placeholder="EFFECT_TRIGGER_ROW_LABELS.tagRoundsPlaceholder"
              size="sm"
              class="w-full"
              @update:model-value="updateActionRounds(index, $event)"
            />
          </UFormField>
        </div>
      </div>

      <UDropdownMenu
        v-if="addActionItems.length > 0"
        :items="addActionItems"
        :content="{ align: 'start' }"
      >
        <UButton
          color="primary"
          variant="soft"
          size="xs"
          icon="tabler:plus"
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
