<script setup lang="ts">
  import type {
    CodeContentFormState,
    RewardPerk,
    RewardTier,
    SubscriptionType,
  } from '../model';

  import {
    CODE_ACHIEVEMENTS_HELP,
    CODE_PERKS_HELP,
    CODE_SUBSCRIPTION_OVERRIDE_SWITCH_LABEL,
    CODE_SUBSCRIPTION_SWITCH_DESCRIPTION,
    CODE_SUBSCRIPTION_SWITCH_LABEL,
    CODE_TIER_HELP,
    codeSubscriptionOverrideDescription,
    REWARD_PERK_LABELS,
    REWARD_PERK_OPTIONS,
    REWARD_TIER_OPTIONS,
    SUBSCRIPTION_MONTHS_MAX,
    SUBSCRIPTION_MONTHS_MIN,
    SUBSCRIPTION_TYPE_OPTIONS,
    TIER_SUBSCRIPTION_MONTHS,
    tierCumulativePerks,
  } from '../model';

  const props = defineProps<{
    /** Путь к полям в состоянии родительской формы — для подсветки ошибок. */
    namePrefix?: string;
    /** Подсказка под селектором тира. */
    tierHelp?: string;
  }>();

  const model = defineModel<CodeContentFormState>({ required: true });

  const tierHelpText = computed(() => props.tierHelp ?? CODE_TIER_HELP);

  /**
   * Имя поля для UFormField с учётом пути в состоянии родительской формы.
   *
   * @param field поле содержимого кода
   */
  function fieldName(field: keyof CodeContentFormState): string {
    return props.namePrefix ? `${props.namePrefix}.${field}` : field;
  }

  /**
   * Отдаёт родителю новое содержимое кода — без мутации переданного объекта.
   *
   * @param patch изменённые поля
   */
  function update(patch: Partial<CodeContentFormState>): void {
    model.value = { ...model.value, ...patch };
  }

  /**
   * Меняет тир кода.
   *
   * @param rewardTier выбранный тир (`null` — без тира)
   */
  function onTierChange(rewardTier: RewardTier | null): void {
    update({ rewardTier });
  }

  /**
   * Меняет тип подписки.
   *
   * @param subscriptionType выбранный тип
   */
  function onSubscriptionTypeChange(subscriptionType: SubscriptionType): void {
    update({ subscriptionType });
  }

  /**
   * Меняет срок подписки; очищенное поле возвращается к наименьшему сроку.
   *
   * @param months введённый срок
   */
  function onSubscriptionMonthsChange(months: number | null): void {
    update({ subscriptionMonths: months ?? SUBSCRIPTION_MONTHS_MIN });
  }

  /**
   * Меняет набор дополнительных перков.
   *
   * @param perks выбранные перки
   */
  function onPerksChange(perks: RewardPerk[]): void {
    update({ perks });
  }

  // Кумулятивные перки выбранного тира — подсказка под селектором.
  const tierPerksPreview = computed(() =>
    model.value.rewardTier
      ? tierCumulativePerks(model.value.rewardTier).map(
          (perk) => REWARD_PERK_LABELS[perk],
        )
      : [],
  );

  // Срок подписки, зашитый в выбранный тир (0 — тир без подписки или тир не выбран).
  // Бэкенд подставит её автоматически (подарочную), если не задать подписку вручную.
  const tierSubscriptionMonths = computed(() =>
    model.value.rewardTier
      ? TIER_SUBSCRIPTION_MONTHS[model.value.rewardTier]
      : 0,
  );

  // Тумблер подписки меняет смысл, когда тир уже несёт пресет: это уже «переопределение».
  const subscriptionSwitchLabel = computed(() =>
    tierSubscriptionMonths.value
      ? CODE_SUBSCRIPTION_OVERRIDE_SWITCH_LABEL
      : CODE_SUBSCRIPTION_SWITCH_LABEL,
  );

  const subscriptionSwitchDescription = computed(() =>
    tierSubscriptionMonths.value
      ? codeSubscriptionOverrideDescription(tierSubscriptionMonths.value)
      : CODE_SUBSCRIPTION_SWITCH_DESCRIPTION,
  );

  /**
   * Включает или выключает свою подписку. При включении для тира стартуем с его
   * пресета, а не с 1 месяца.
   *
   * @param value включён ли тумблер
   */
  function onToggleSubscription(value: boolean): void {
    update({
      includeSubscription: value,
      ...(value && tierSubscriptionMonths.value > 0
        ? { subscriptionMonths: tierSubscriptionMonths.value }
        : {}),
    });
  }

  // Свободный ввод кодов достижений тегами.
  const achievementDraft = ref('');

  /** Добавляет достижение из поля ввода, пропуская пустое и повтор. */
  function addAchievement(): void {
    const value = achievementDraft.value.trim();

    if (value && !model.value.achievements.includes(value)) {
      update({ achievements: [...model.value.achievements, value] });
    }

    achievementDraft.value = '';
  }

  /**
   * Убирает достижение из кода.
   *
   * @param code код достижения
   */
  function removeAchievement(code: string): void {
    update({
      achievements: model.value.achievements.filter(
        (achievement) => achievement !== code,
      ),
    });
  }

  /** Очищает недописанное достижение — вызывается родителем при сбросе формы. */
  function resetDraft(): void {
    achievementDraft.value = '';
  }

  defineExpose({ resetDraft });
</script>

<template>
  <div class="space-y-5">
    <!-- Тир -->
    <div class="space-y-2">
      <UFormField
        label="Тир награды"
        :name="fieldName('rewardTier')"
        :help="tierHelpText"
      >
        <USelectMenu
          :model-value="model.rewardTier"
          :items="REWARD_TIER_OPTIONS"
          value-key="value"
          label-key="label"
          placeholder="Без тира"
          class="w-full"
          @update:model-value="onTierChange"
        />
      </UFormField>

      <div
        v-if="model.rewardTier"
        class="space-y-2 rounded-lg border border-default bg-elevated/50 px-3 py-2.5"
      >
        <div
          v-if="tierSubscriptionMonths"
          class="flex flex-wrap items-center gap-1.5"
        >
          <span class="text-xs text-muted">Даёт подписку:</span>

          <UBadge
            color="primary"
            variant="subtle"
            size="sm"
          >
            {{ tierSubscriptionMonths }} мес. · подарочная
          </UBadge>
        </div>

        <div
          v-if="tierPerksPreview.length"
          class="flex flex-wrap items-center gap-1.5"
        >
          <span class="text-xs text-muted">Даёт перки:</span>

          <UBadge
            v-for="perk in tierPerksPreview"
            :key="perk"
            color="neutral"
            variant="subtle"
            size="sm"
          >
            {{ perk }}
          </UBadge>
        </div>
      </div>
    </div>

    <!-- Подписка -->
    <div class="space-y-3">
      <USwitch
        :model-value="model.includeSubscription"
        :label="subscriptionSwitchLabel"
        :description="subscriptionSwitchDescription"
        @update:model-value="onToggleSubscription"
      />

      <!-- Тир уже несёт подписку, а ручной режим выключен — она уйдёт в код автоматически. -->
      <p
        v-if="tierSubscriptionMonths && !model.includeSubscription"
        class="flex items-start gap-1.5 rounded-lg border border-default bg-elevated/50 px-3 py-2 text-xs text-muted"
      >
        <UIcon
          name="tabler:info-circle"
          class="mt-0.5 size-3.5 shrink-0"
        />

        <span>
          Тир уже даёт подарочную подписку на {{ tierSubscriptionMonths }} мес.
          — она попадёт в код автоматически. Включите тумблер, чтобы задать свой
          срок и тип.
        </span>
      </p>

      <div
        v-if="model.includeSubscription"
        class="grid gap-4 sm:grid-cols-2"
      >
        <UFormField
          label="Тип подписки"
          :name="fieldName('subscriptionType')"
        >
          <USelectMenu
            :model-value="model.subscriptionType"
            :items="SUBSCRIPTION_TYPE_OPTIONS"
            value-key="value"
            label-key="label"
            class="w-full"
            @update:model-value="onSubscriptionTypeChange"
          />
        </UFormField>

        <UFormField
          label="Срок, месяцев"
          :name="fieldName('subscriptionMonths')"
        >
          <UInputNumber
            :model-value="model.subscriptionMonths"
            :min="SUBSCRIPTION_MONTHS_MIN"
            :max="SUBSCRIPTION_MONTHS_MAX"
            class="w-full"
            @update:model-value="onSubscriptionMonthsChange"
          />
        </UFormField>
      </div>
    </div>

    <!-- Доп. перки помимо тира -->
    <UFormField
      label="Дополнительные перки"
      :name="fieldName('perks')"
      :help="CODE_PERKS_HELP"
    >
      <USelectMenu
        :model-value="model.perks"
        :items="REWARD_PERK_OPTIONS"
        value-key="value"
        label-key="label"
        multiple
        placeholder="Не выбрано"
        class="w-full"
        @update:model-value="onPerksChange"
      />
    </UFormField>

    <!-- Достижения -->
    <UFormField
      label="Достижения"
      :name="fieldName('achievements')"
      :help="CODE_ACHIEVEMENTS_HELP"
    >
      <div class="space-y-2">
        <UInput
          v-model="achievementDraft"
          placeholder="Код достижения и Enter"
          class="w-full"
          @keydown.enter.prevent="addAchievement"
        >
          <template #trailing>
            <UButton
              icon="tabler:plus"
              color="neutral"
              variant="link"
              size="xs"
              :disabled="!achievementDraft.trim()"
              @click.left.exact.prevent="addAchievement"
            />
          </template>
        </UInput>

        <div
          v-if="model.achievements.length"
          class="flex flex-wrap gap-1.5"
        >
          <UBadge
            v-for="code in model.achievements"
            :key="code"
            color="primary"
            variant="subtle"
            size="sm"
            class="gap-1"
          >
            {{ code }}

            <UIcon
              name="tabler:x"
              class="size-3 cursor-pointer"
              @click.left.exact.prevent="removeAchievement(code)"
            />
          </UBadge>
        </div>
      </div>
    </UFormField>
  </div>
</template>
