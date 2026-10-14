<script setup lang="ts">
  import type {
    EffectActionCostSettings,
    EffectDamagePart,
    EffectEscape,
    EffectEscapeActor,
    EffectEscapeCheck,
    EffectEscapeOutcome,
    EffectEscapeSkillOption,
    EscapeRollModeChoice,
    EscapeSkillRoleChoice,
  } from '../../model';

  import { InfoTooltip } from '~ui/tooltip';

  import {
    APPLIER_SAVE_DC,
    createDefaultEscapeCheck,
    DEFAULT_ESCAPE_ACTOR,
    DEFAULT_ESCAPE_LABEL,
    DEFAULT_ESCAPE_OUTCOME,
    EFFECT_DAMAGE_TYPE_OPTIONS,
    EFFECT_ESCAPE_ACTOR_OPTIONS,
    EFFECT_ESCAPE_FIELD_LABELS,
    EFFECT_ESCAPE_OUTCOME_OPTIONS,
    EFFECT_ESCAPE_ROW_ICONS,
    EFFECT_ESCAPE_SECTION_LABELS,
    EFFECT_SKILL_OPTIONS,
    ESCAPE_AFTERMATH_ITEMS,
    ESCAPE_ROLL_MODE_NORMAL,
    ESCAPE_ROLL_MODE_OPTIONS,
    ESCAPE_SKILL_ROLE_ANY,
    ESCAPE_SKILL_ROLE_OPTIONS,
    isEffectDamageType,
    MAX_EFFECT_STAGE_LABEL_LENGTH,
    MAX_ESCAPE_SKILLS,
    MIN_ESCAPE_SKILL_DC,
    NEW_ESCAPE_CHECK_SKILL,
    NEW_ESCAPE_FAIL_DAMAGE_FORMULA,
    NO_ESCAPE_AFTERMATH,
  } from '../../model';
  import EffectActionCostFields from './EffectActionCostFields.vue';
  import EffectSaveDcField from './EffectSaveDcField.vue';

  /**
   * Поля действия «вырваться»: кто действует, чем платит, проверка (навыки на
   * выбор, Сл, режим броска) и что бывает после — состояние при успехе, урон
   * при провале. Один блок на сам эффект и на состояние, которое кладёт
   * срабатывание.
   */
  const {
    autoDcAllowed,
    autoLabel = undefined,
    applierSaveDc = undefined,
  } = defineProps<{
    /** «Авто» доступно там, где Сл источника вообще бывает. */
    autoDcAllowed: boolean;
    /** Чья Сл подставляется в «Авто» в этом месте формы. */
    autoLabel?: string;
    /** Сл источника для «Авто», если форма её знает. */
    applierSaveDc?: number;
  }>();

  /** Блок действия «вырваться»: поля заменяют его целиком при каждой правке. */
  const escape = defineModel<EffectEscape>({ required: true });

  /**
   * Меняет поля блока.
   *
   * @param patch новые поля блока.
   */
  function updateEscape(patch: Partial<EffectEscape>): void {
    escape.value = { ...escape.value, ...patch };
  }

  /**
   * Меняет поля проверки; без проверки менять нечего.
   *
   * @param patch новые поля проверки.
   */
  function updateCheck(patch: Partial<EffectEscapeCheck>): void {
    const { check } = escape.value;

    if (check) {
      updateEscape({ check: { ...check, ...patch } });
    }
  }

  // Носитель — значение по умолчанию: в данных он не пишется
  const escapeActor = computed({
    get: () => escape.value.by ?? DEFAULT_ESCAPE_ACTOR,
    set: (nextActor: EffectEscapeActor) =>
      updateEscape({
        by: nextActor === DEFAULT_ESCAPE_ACTOR ? undefined : nextActor,
      }),
  });

  const escapeActionCost = computed({
    get: () => ({
      cost: escape.value.cost,
      moveCostFeet: escape.value.moveCostFeet,
    }),
    set: (nextCost: EffectActionCostSettings) => updateEscape(nextCost),
  });

  // «Снять эффект» — значение по умолчанию: в данных оно не пишется
  const escapeOutcome = computed({
    get: () => escape.value.onSuccess ?? DEFAULT_ESCAPE_OUTCOME,
    set: (nextOutcome: EffectEscapeOutcome) =>
      updateEscape({
        onSuccess:
          nextOutcome === DEFAULT_ESCAPE_OUTCOME ? undefined : nextOutcome,
      }),
  });

  // Пустая подпись — кнопка «Вырваться»: в данных поля нет
  const escapeLabel = computed({
    get: () => escape.value.label ?? '',
    set: (nextLabel: string) =>
      updateEscape({ label: nextLabel.trim() ? nextLabel : undefined }),
  });

  const hasCheck = computed({
    get: () => escape.value.check !== undefined,
    set: (enabled: boolean) =>
      updateEscape({
        check: enabled ? createDefaultEscapeCheck(autoDcAllowed) : undefined,
      }),
  });

  const escapeDc = computed({
    get: () => escape.value.check?.dc ?? APPLIER_SAVE_DC,
    set: (nextDc: number) => updateCheck({ dc: nextDc }),
  });

  const escapeDcFormula = computed({
    get: () => escape.value.check?.dcFormula,
    set: (nextFormula: string | undefined) =>
      updateCheck({ dcFormula: nextFormula }),
  });

  // Обычный бросок — значение по умолчанию: в данных режим не пишется
  const escapeRollMode = computed<EscapeRollModeChoice>({
    get: () => escape.value.check?.mode ?? ESCAPE_ROLL_MODE_NORMAL,
    set: (nextMode) =>
      updateCheck({
        mode: nextMode === ESCAPE_ROLL_MODE_NORMAL ? undefined : nextMode,
      }),
  });

  /** Навыки проверки: список либо единственный навык проверки. */
  const skillOptions = computed<EffectEscapeSkillOption[]>(() => {
    const { check } = escape.value;

    if (!check) {
      return [];
    }

    return check.skills ?? [{ skill: check.skill }];
  });

  const canAddSkill = computed(
    () => skillOptions.value.length < MAX_ESCAPE_SKILLS,
  );

  /** Последний навык не убирается: проверки без навыка не бывает. */
  const canRemoveSkill = computed(() => skillOptions.value.length > 1);

  /** Строки навыков с готовыми значениями полей. */
  const skillRows = computed(() =>
    skillOptions.value.map((skillOption, index) => {
      const role: EscapeSkillRoleChoice =
        skillOption.by ?? ESCAPE_SKILL_ROLE_ANY;

      return {
        key: `${index}-${skillOption.skill}`,
        skill: skillOption.skill,
        ownDc: skillOption.dc,
        role,
        label: skillOption.label ?? '',
      };
    }),
  );

  /**
   * Записывает список навыков: первый навык — он же навык проверки, по нему
   * её читают версии VTTG без списка.
   *
   * @param nextSkills навыки по порядку.
   */
  function writeSkills(nextSkills: EffectEscapeSkillOption[]): void {
    const [firstSkill] = nextSkills;

    if (firstSkill) {
      updateCheck({ skill: firstSkill.skill, skills: nextSkills });
    }
  }

  /**
   * Меняет один навык списка.
   *
   * @param index номер навыка.
   * @param patch новые поля навыка.
   */
  function updateSkill(
    index: number,
    patch: Partial<EffectEscapeSkillOption>,
  ): void {
    writeSkills(
      skillOptions.value.map((skillOption, skillIndex) =>
        skillIndex === index ? { ...skillOption, ...patch } : skillOption,
      ),
    );
  }

  /** Добавляет навык: первый, которого в списке ещё нет. */
  function addSkill(): void {
    const usedSkills = new Set(
      skillOptions.value.map((skillOption) => skillOption.skill),
    );

    const freeSkill = EFFECT_SKILL_OPTIONS.find(
      (skill) => !usedSkills.has(skill.value),
    );

    writeSkills([
      ...skillOptions.value,
      { skill: freeSkill?.value ?? NEW_ESCAPE_CHECK_SKILL },
    ]);
  }

  /**
   * Убирает навык; последний остаётся.
   *
   * @param index номер навыка.
   */
  function removeSkill(index: number): void {
    if (canRemoveSkill.value) {
      writeSkills(
        skillOptions.value.filter((_, skillIndex) => skillIndex !== index),
      );
    }
  }

  /**
   * Меняет навык строки.
   *
   * @param index номер навыка.
   * @param skillKey ключ выбранного навыка.
   */
  function selectSkill(index: number, skillKey: string): void {
    updateSkill(index, { skill: skillKey });
  }

  /**
   * Меняет свою Сл навыка; пусто — Сл проверки.
   *
   * @param index номер навыка.
   * @param enteredDc введённая Сл; очищенное поле числа отдаёт `undefined`.
   */
  function updateSkillDc(
    index: number,
    enteredDc: number | null | undefined,
  ): void {
    updateSkill(index, { dc: enteredDc ?? undefined });
  }

  /**
   * Меняет, кому доступен навык: «всем» в данных не пишется.
   *
   * @param index номер навыка.
   * @param role роль либо «всем, кто действует».
   */
  function selectSkillRole(index: number, role: EscapeSkillRoleChoice): void {
    updateSkill(index, {
      by: role === ESCAPE_SKILL_ROLE_ANY ? undefined : role,
    });
  }

  /**
   * Меняет пометку навыка; пустая не пишется.
   *
   * @param index номер навыка.
   * @param enteredLabel введённая пометка.
   */
  function updateSkillLabel(index: number, enteredLabel: string): void {
    updateSkill(index, {
      label: enteredLabel.trim() ? enteredLabel : undefined,
    });
  }

  // «Ничего» — в данных состояния после освобождения нет
  const aftermath = computed({
    get: () => escape.value.onSuccessApply ?? NO_ESCAPE_AFTERMATH,
    set: (conditionKey: string) =>
      updateEscape({
        onSuccessApply:
          conditionKey === NO_ESCAPE_AFTERMATH ? undefined : conditionKey,
      }),
  });

  const failDamageParts = computed(() => escape.value.onFailDamage ?? []);

  /** Строки урона при провале с ключом для списка. */
  const failDamageRows = computed(() =>
    failDamageParts.value.map((damagePart, index) => ({
      key: String(index),
      formula: damagePart.formula,
      // Тип не из словаря в выборе не показать: поле остаётся пустым
      damageType:
        damagePart.type && isEffectDamageType(damagePart.type)
          ? damagePart.type
          : undefined,
    })),
  );

  /**
   * Записывает урон при провале; пустой список — отсутствием поля.
   *
   * @param damageParts части урона.
   */
  function writeFailDamage(damageParts: EffectDamagePart[]): void {
    updateEscape({
      onFailDamage: damageParts.length > 0 ? damageParts : undefined,
    });
  }

  /** Добавляет часть урона при провале. */
  function addFailDamage(): void {
    writeFailDamage([
      ...failDamageParts.value,
      { formula: NEW_ESCAPE_FAIL_DAMAGE_FORMULA },
    ]);
  }

  /**
   * Убирает часть урона при провале.
   *
   * @param index номер части.
   */
  function removeFailDamage(index: number): void {
    writeFailDamage(
      failDamageParts.value.filter((_, partIndex) => partIndex !== index),
    );
  }

  /**
   * Меняет часть урона при провале.
   *
   * @param index номер части.
   * @param patch новые поля части.
   */
  function updateFailDamage(
    index: number,
    patch: Partial<EffectDamagePart>,
  ): void {
    writeFailDamage(
      failDamageParts.value.map((damagePart, partIndex) =>
        partIndex === index ? { ...damagePart, ...patch } : damagePart,
      ),
    );
  }

  /**
   * Меняет формулу части урона при провале.
   *
   * @param index номер части.
   * @param enteredFormula введённая формула.
   */
  function updateFailFormula(index: number, enteredFormula: string): void {
    updateFailDamage(index, { formula: enteredFormula });
  }

  /**
   * Меняет тип части урона при провале.
   *
   * @param index номер части.
   * @param damageType выбранный тип урона.
   */
  function selectFailType(index: number, damageType: string): void {
    updateFailDamage(index, { type: damageType });
  }
</script>

<template>
  <div class="flex flex-col gap-2 rounded-md border border-default p-2">
    <div class="flex flex-wrap items-end gap-2">
      <UFormField
        :label="EFFECT_ESCAPE_SECTION_LABELS.actor"
        class="w-full sm:w-60"
      >
        <USelect
          v-model="escapeActor"
          :items="EFFECT_ESCAPE_ACTOR_OPTIONS"
          value-key="value"
          size="sm"
          class="w-full"
        />
      </UFormField>

      <EffectActionCostFields v-model="escapeActionCost" />

      <UFormField
        :label="EFFECT_ESCAPE_SECTION_LABELS.outcome"
        class="w-full sm:w-44"
      >
        <USelect
          v-model="escapeOutcome"
          :items="EFFECT_ESCAPE_OUTCOME_OPTIONS"
          value-key="value"
          size="sm"
          class="w-full"
        />
      </UFormField>

      <UFormField
        :label="EFFECT_ESCAPE_SECTION_LABELS.label"
        class="w-full sm:w-48"
      >
        <UInput
          v-model="escapeLabel"
          :placeholder="DEFAULT_ESCAPE_LABEL"
          :maxlength="MAX_EFFECT_STAGE_LABEL_LENGTH"
          size="sm"
          class="w-full"
        />
      </UFormField>

      <USwitch
        v-model="hasCheck"
        class="mb-2"
        :label="EFFECT_ESCAPE_SECTION_LABELS.checkToggle"
      />
    </div>

    <template v-if="escape.check">
      <InfoTooltip
        :text="EFFECT_ESCAPE_FIELD_LABELS.skillsHint"
        icon="tabler:info-circle-filled"
      >
        <span class="text-xs font-medium text-default">
          {{ EFFECT_ESCAPE_FIELD_LABELS.skills }}
        </span>
      </InfoTooltip>

      <div
        v-for="(skillRow, index) in skillRows"
        :key="skillRow.key"
        class="flex flex-wrap items-end gap-2"
      >
        <UFormField
          :label="EFFECT_ESCAPE_SECTION_LABELS.skill"
          class="w-full sm:w-48"
        >
          <USelect
            :model-value="skillRow.skill"
            :items="EFFECT_SKILL_OPTIONS"
            value-key="value"
            size="sm"
            class="w-full"
            @update:model-value="selectSkill(index, $event)"
          />
        </UFormField>

        <UFormField
          :label="EFFECT_ESCAPE_FIELD_LABELS.skillDc"
          class="w-full sm:w-40"
        >
          <UInputNumber
            :model-value="skillRow.ownDc"
            :min="MIN_ESCAPE_SKILL_DC"
            :placeholder="EFFECT_ESCAPE_FIELD_LABELS.skillDcPlaceholder"
            size="sm"
            class="w-full"
            @update:model-value="updateSkillDc(index, $event)"
          />
        </UFormField>

        <UFormField
          :label="EFFECT_ESCAPE_FIELD_LABELS.skillRole"
          class="w-full sm:w-56"
        >
          <USelect
            :model-value="skillRow.role"
            :items="ESCAPE_SKILL_ROLE_OPTIONS"
            value-key="value"
            size="sm"
            class="w-full"
            @update:model-value="selectSkillRole(index, $event)"
          />
        </UFormField>

        <UFormField
          :label="EFFECT_ESCAPE_FIELD_LABELS.skillLabel"
          class="w-full sm:w-56"
        >
          <UInput
            :model-value="skillRow.label"
            :placeholder="EFFECT_ESCAPE_FIELD_LABELS.skillLabelPlaceholder"
            :maxlength="MAX_EFFECT_STAGE_LABEL_LENGTH"
            size="sm"
            class="w-full"
            @update:model-value="updateSkillLabel(index, $event)"
          />
        </UFormField>

        <UButton
          v-if="canRemoveSkill"
          :icon="EFFECT_ESCAPE_ROW_ICONS.remove"
          :aria-label="EFFECT_ESCAPE_FIELD_LABELS.removeSkill"
          :title="EFFECT_ESCAPE_FIELD_LABELS.removeSkill"
          color="error"
          variant="ghost"
          size="xs"
          class="mb-1"
          @click.left.exact.prevent="removeSkill(index)"
        />
      </div>

      <UButton
        v-if="canAddSkill"
        :icon="EFFECT_ESCAPE_ROW_ICONS.add"
        :label="EFFECT_ESCAPE_FIELD_LABELS.addSkill"
        color="primary"
        variant="soft"
        size="xs"
        class="w-fit"
        @click.left.exact.prevent="addSkill"
      />

      <div class="flex flex-wrap items-end gap-2">
        <EffectSaveDcField
          v-model="escapeDc"
          v-model:formula="escapeDcFormula"
          formula-allowed
          :label="EFFECT_ESCAPE_SECTION_LABELS.dc"
          :auto-allowed="autoDcAllowed"
          :auto-label="autoLabel"
          :auto-value="applierSaveDc"
        />

        <UFormField class="w-full sm:w-48">
          <template #label>
            <InfoTooltip
              :text="EFFECT_ESCAPE_FIELD_LABELS.modeHint"
              icon="tabler:info-circle-filled"
            >
              <span>{{ EFFECT_ESCAPE_FIELD_LABELS.mode }}</span>
            </InfoTooltip>
          </template>

          <USelect
            v-model="escapeRollMode"
            :items="ESCAPE_ROLL_MODE_OPTIONS"
            value-key="value"
            size="sm"
            class="w-full"
          />
        </UFormField>
      </div>
    </template>

    <UFormField class="w-full sm:w-64">
      <template #label>
        <InfoTooltip
          :text="EFFECT_ESCAPE_FIELD_LABELS.onSuccessApplyHint"
          icon="tabler:info-circle-filled"
        >
          <span>{{ EFFECT_ESCAPE_FIELD_LABELS.onSuccessApply }}</span>
        </InfoTooltip>
      </template>

      <USelect
        v-model="aftermath"
        :items="ESCAPE_AFTERMATH_ITEMS"
        value-key="value"
        size="sm"
        class="w-full"
      />
    </UFormField>

    <template v-if="escape.check">
      <InfoTooltip
        :text="EFFECT_ESCAPE_FIELD_LABELS.onFailDamageHint"
        icon="tabler:info-circle-filled"
      >
        <span class="text-xs font-medium text-default">
          {{ EFFECT_ESCAPE_FIELD_LABELS.onFailDamage }}
        </span>
      </InfoTooltip>

      <div
        v-for="(failDamageRow, index) in failDamageRows"
        :key="failDamageRow.key"
        class="flex flex-wrap items-end gap-2"
      >
        <UFormField
          :label="EFFECT_ESCAPE_FIELD_LABELS.onFailDamageFormula"
          class="w-full sm:w-40"
        >
          <UInput
            :model-value="failDamageRow.formula"
            size="sm"
            class="w-full font-mono"
            @update:model-value="updateFailFormula(index, $event)"
          />
        </UFormField>

        <UFormField
          :label="EFFECT_ESCAPE_FIELD_LABELS.onFailDamageType"
          class="w-full sm:w-48"
        >
          <USelect
            :model-value="failDamageRow.damageType"
            :items="EFFECT_DAMAGE_TYPE_OPTIONS"
            value-key="value"
            :placeholder="
              EFFECT_ESCAPE_FIELD_LABELS.onFailDamageTypePlaceholder
            "
            size="sm"
            class="w-full"
            @update:model-value="selectFailType(index, $event)"
          />
        </UFormField>

        <UButton
          :icon="EFFECT_ESCAPE_ROW_ICONS.remove"
          :aria-label="EFFECT_ESCAPE_FIELD_LABELS.removeFailDamage"
          :title="EFFECT_ESCAPE_FIELD_LABELS.removeFailDamage"
          color="error"
          variant="ghost"
          size="xs"
          class="mb-1"
          @click.left.exact.prevent="removeFailDamage(index)"
        />
      </div>

      <UButton
        :icon="EFFECT_ESCAPE_ROW_ICONS.add"
        :label="EFFECT_ESCAPE_FIELD_LABELS.addFailDamage"
        color="primary"
        variant="soft"
        size="xs"
        class="w-fit"
        @click.left.exact.prevent="addFailDamage"
      />
    </template>
  </div>
</template>
